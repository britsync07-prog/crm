import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createClient, getClientBalances, listClients } from "@/lib/britledger/clients";
import {
  createInvoice,
  getInvoice,
  listInvoices,
  sendInvoice,
  updateInvoice,
} from "@/lib/britledger/invoices";
import {
  convertQuotationToInvoice,
  createQuotation,
  listQuotations,
} from "@/lib/britledger/quotations";
import type {
  InvoiceCreate,
  InvoiceItem,
  InvoiceStatus,
  InvoiceUpdate,
  QuotationCreate,
  QuotationItem,
  QuotationStatus,
} from "@/lib/britledger/types";
import { generateInvoiceNumber, generateQuotationNumber } from "@/lib/britledger/utils";
import { getMcpContext } from "../context";

function jsonResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

async function runTool<T>(operation: () => Promise<T>) {
  try {
    const data = await operation();
    return jsonResult({ success: true, data, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResult({ success: false, data: null, error: message });
  }
}

const currencySchema = z.string().trim().min(3).max(3).default("GBP");
const invoiceStatusSchema = z
  .enum(["Draft", "Sent", "Paid", "Partial", "Overdue", "Cancelled", "DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"])
  .default("DRAFT");
const quotationStatusSchema = z.enum(["Draft", "Sent", "Accepted", "Expired", "Cancelled"]).default("Draft");

const lineItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().min(0).default(1),
  unitCost: z.number().min(0).optional(),
  rate: z.number().min(0).optional(),
  amount: z.number().min(0).optional(),
  vatRate: z.number().min(0).max(100).default(0),
});

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function normalizeLineItems(items: z.infer<typeof lineItemSchema>[]) {
  if (!items.length) throw new Error("At least one line item is required.");

  let subtotal = 0;
  let tax = 0;
  const normalized = items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const inputRate = Number(item.unitCost ?? item.rate ?? 0);
    const amount = roundMoney(item.amount ?? quantity * inputRate);
    const rate = quantity > 0 ? roundMoney(amount / quantity) : inputRate;
    const taxRate = Number(item.vatRate || 0);

    subtotal += amount;
    tax += amount * (taxRate / 100);

    return {
      description: item.description,
      quantity,
      rate,
      unit_price: rate,
      amount,
      total: amount,
      tax_rate: taxRate,
    };
  });

  return {
    items: normalized,
    subtotal: roundMoney(subtotal),
    tax: roundMoney(tax),
  };
}

function calculateBillingTotals(args: {
  items: z.infer<typeof lineItemSchema>[];
  discount?: number;
  advancePayment?: number;
  markPaid?: boolean;
}) {
  const normalized = normalizeLineItems(args.items);
  const discount = roundMoney(Math.max(Number(args.discount || 0), 0));
  const total = roundMoney(Math.max(0, normalized.subtotal + normalized.tax - discount));
  const advancePayment = args.markPaid
    ? total
    : roundMoney(Math.min(Math.max(Number(args.advancePayment || 0), 0), total));

  return {
    ...normalized,
    discount,
    total,
    advancePayment,
    balanceDue: roundMoney(Math.max(0, total - advancePayment)),
  };
}

function maybeAppendDiscountNote(notes: string | undefined, discount: number) {
  if (!discount) return notes || undefined;
  const discountNote = `Discount applied: ${discount.toFixed(2)}`;
  return notes ? `${notes}\n\n${discountNote}` : discountNote;
}

export function registerBillingTools(server: McpServer) {
  server.registerTool(
    "billing.list_clients",
    {
      title: "List Billing Clients",
      description: "List BritLedger billing clients for the MCP user, optionally including balance summaries.",
      inputSchema: {
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
        includeBalances: z.boolean().default(false),
      },
    },
    async ({ search, page, pageSize, includeBalances }) =>
      runTool(async () => {
        const context = await getMcpContext();
        const response = await listClients({ search, page, page_size: pageSize });
        const balances = includeBalances
          ? await Promise.all(
              response.data.map(async (client) => {
                try {
                  const balance = await getClientBalances(client.id);
                  return { clientId: client.id, balance: balance.data };
                } catch (error) {
                  return { clientId: client.id, error: error instanceof Error ? error.message : String(error) };
                }
              })
            )
          : [];

        return { user: { id: context.userId, email: context.email }, ...response, balances };
      })
  );

  server.registerTool(
    "billing.create_client",
    {
      title: "Create Billing Client",
      description: "Create a BritLedger billing client for invoices and quotations.",
      inputSchema: {
        name: z.string().trim().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        companyName: z.string().optional(),
        vatNumber: z.string().optional(),
        isActive: z.boolean().default(true),
      },
    },
    async ({ name, email, phone, address, companyName, vatNumber, isActive }) =>
      runTool(async () => {
        await getMcpContext();
        const response = await createClient({
          name,
          email,
          phone,
          address,
          company_name: companyName,
          vat_number: vatNumber,
          is_active: isActive,
        });
        return response.data;
      })
  );

  server.registerTool(
    "billing.list_invoices",
    {
      title: "List Billing Invoices",
      description: "List BritLedger invoices and computed balance due values.",
      inputSchema: {
        clientId: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      },
    },
    async ({ clientId, status, search, page, pageSize }) =>
      runTool(async () => {
        await getMcpContext();
        const response = await listInvoices({ client_id: clientId, status, search, page, page_size: pageSize });
        return {
          ...response,
          data: response.data.map((invoice) => ({
            ...invoice,
            balance_due: roundMoney(Math.max(Number(invoice.total_amount || 0) - Number(invoice.advance_payment || 0), 0)),
          })),
        };
      })
  );

  server.registerTool(
    "billing.create_invoice",
    {
      title: "Create Billing Invoice",
      description: "Create a BritLedger invoice with server-side subtotal, VAT, discount, advance paid, and balance due calculation.",
      inputSchema: {
        clientId: z.string().min(1),
        invoiceNumber: z.string().optional(),
        issueDate: z.string().optional(),
        dueDate: z.string().optional(),
        currency: currencySchema,
        status: invoiceStatusSchema,
        lineItems: z.array(lineItemSchema).min(1),
        discount: z.number().min(0).default(0),
        advancePayment: z.number().min(0).default(0),
        markPaid: z.boolean().default(false),
        notes: z.string().optional(),
      },
    },
    async ({ clientId, invoiceNumber, issueDate, dueDate, currency, status, lineItems, discount, advancePayment, markPaid, notes }) =>
      runTool(async () => {
        await getMcpContext();
        const totals = calculateBillingTotals({ items: lineItems, discount, advancePayment, markPaid });
        const payload: InvoiceCreate = {
          client_id: clientId,
          invoice_number: invoiceNumber || generateInvoiceNumber(),
          issue_date: issueDate,
          due_date: dueDate,
          total_amount: totals.total,
          subtotal: totals.subtotal,
          tax: totals.tax,
          advance_payment: totals.advancePayment,
          currency,
          status: markPaid ? "PAID" : (status as InvoiceStatus),
          items: totals.items as InvoiceItem[],
          notes: maybeAppendDiscountNote(notes, totals.discount),
        };
        const response = await createInvoice(payload);
        return { invoice: response.data, calculations: totals };
      })
  );

  server.registerTool(
    "billing.update_invoice",
    {
      title: "Update Billing Invoice",
      description: "Update invoice fields and recalculate totals when line items or payment inputs are supplied.",
      inputSchema: {
        invoiceId: z.string().min(1),
        clientId: z.string().optional(),
        invoiceNumber: z.string().optional(),
        issueDate: z.string().optional(),
        dueDate: z.string().optional(),
        currency: currencySchema.optional(),
        status: invoiceStatusSchema.optional(),
        lineItems: z.array(lineItemSchema).min(1).optional(),
        discount: z.number().min(0).optional(),
        advancePayment: z.number().min(0).optional(),
        markPaid: z.boolean().default(false),
        notes: z.string().optional(),
      },
    },
    async (args) =>
      runTool(async () => {
        await getMcpContext();
        const existing = await getInvoice(args.invoiceId);
        const payload: InvoiceUpdate = {
          client_id: args.clientId,
          invoice_number: args.invoiceNumber,
          issue_date: args.issueDate,
          due_date: args.dueDate,
          currency: args.currency,
          status: args.status as InvoiceStatus | undefined,
          notes: args.notes,
        };

        let calculations = null;
        if (args.lineItems) {
          calculations = calculateBillingTotals({
            items: args.lineItems,
            discount: args.discount,
            advancePayment: args.advancePayment ?? existing.data.advance_payment,
            markPaid: args.markPaid,
          });
          payload.total_amount = calculations.total;
          payload.subtotal = calculations.subtotal;
          payload.tax = calculations.tax;
          payload.advance_payment = calculations.advancePayment;
          payload.items = calculations.items as InvoiceItem[];
          payload.notes = maybeAppendDiscountNote(args.notes, calculations.discount);
          if (args.markPaid) payload.status = "PAID";
        } else if (args.advancePayment !== undefined || args.markPaid) {
          const totalAmount = Number(existing.data.total_amount || 0);
          const nextAdvance = args.markPaid ? totalAmount : Math.min(Math.max(Number(args.advancePayment || 0), 0), totalAmount);
          payload.advance_payment = roundMoney(nextAdvance);
          payload.status = nextAdvance >= totalAmount ? "PAID" : nextAdvance > 0 ? "PARTIAL" : payload.status;
        }

        const response = await updateInvoice(args.invoiceId, payload);
        return {
          invoice: response.data,
          calculations,
          balanceDue: roundMoney(Math.max(Number(response.data.total_amount || 0) - Number(response.data.advance_payment || 0), 0)),
        };
      })
  );

  server.registerTool(
    "billing.record_payment",
    {
      title: "Record Billing Payment",
      description: "Record invoice payment by increasing advance paid and updating status/balance due.",
      inputSchema: {
        invoiceId: z.string().min(1),
        amount: z.number().positive(),
        currency: currencySchema.optional(),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
      },
    },
    async ({ invoiceId, amount }) =>
      runTool(async () => {
        await getMcpContext();
        const invoiceRes = await getInvoice(invoiceId);
        const invoice = invoiceRes.data;
        const totalAmount = Number(invoice.total_amount || 0);
        const currentAdvance = Math.min(Math.max(Number(invoice.advance_payment || 0), 0), totalAmount);
        const nextAdvance = roundMoney(Math.min(currentAdvance + Math.max(Number(amount || 0), 0), totalAmount));
        const nextStatus = nextAdvance >= totalAmount ? "PAID" : nextAdvance > 0 ? "PARTIAL" : invoice.status;
        const response = await updateInvoice(invoiceId, {
          advance_payment: nextAdvance,
          status: nextStatus,
        });
        return {
          invoice: response.data,
          paidBefore: currentAdvance,
          paidAfter: nextAdvance,
          balanceDue: roundMoney(Math.max(totalAmount - nextAdvance, 0)),
        };
      })
  );

  server.registerTool(
    "billing.create_quotation",
    {
      title: "Create Billing Quotation",
      description: "Create a BritLedger quotation with server-side line amount, VAT, discount, and total calculation.",
      inputSchema: {
        clientId: z.string().min(1),
        quotationNumber: z.string().optional(),
        issueDate: z.string().optional(),
        expiryDate: z.string().optional(),
        currency: currencySchema,
        status: quotationStatusSchema,
        lineItems: z.array(lineItemSchema).min(1),
        discount: z.number().min(0).default(0),
        notes: z.string().optional(),
      },
    },
    async ({ clientId, quotationNumber, issueDate, expiryDate, currency, status, lineItems, discount, notes }) =>
      runTool(async () => {
        await getMcpContext();
        const totals = calculateBillingTotals({ items: lineItems, discount });
        const payload: QuotationCreate & { status?: QuotationStatus } = {
          client_id: clientId,
          quotation_number: quotationNumber || generateQuotationNumber(),
          issue_date: issueDate,
          expiry_date: expiryDate,
          total_amount: totals.total,
          subtotal: totals.subtotal,
          tax: totals.tax,
          currency,
          status,
          items: totals.items as QuotationItem[],
          notes: maybeAppendDiscountNote(notes, totals.discount),
        };
        const response = await createQuotation(payload);
        return { quotation: response.data, calculations: totals };
      })
  );

  server.registerTool(
    "billing.list_quotations",
    {
      title: "List Billing Quotations",
      description: "List BritLedger quotations for the MCP user.",
      inputSchema: {
        clientId: z.string().optional(),
        status: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
      },
    },
    async ({ clientId, status, page, pageSize }) =>
      runTool(async () => {
        await getMcpContext();
        return listQuotations({ client_id: clientId, status, page, page_size: pageSize });
      })
  );

  server.registerTool(
    "billing.convert_quote_to_invoice",
    {
      title: "Convert Quotation To Invoice",
      description: "Convert a BritLedger quotation to an invoice after explicit confirmation.",
      inputSchema: {
        quotationId: z.string().min(1),
        confirm: z.boolean(),
      },
    },
    async ({ quotationId, confirm }) =>
      runTool(async () => {
        await getMcpContext();
        if (!confirm) throw new Error("confirm must be true before converting a quotation to an invoice.");
        const response = await convertQuotationToInvoice(quotationId);
        return response.data;
      })
  );

  server.registerTool(
    "billing.send_invoice",
    {
      title: "Send Billing Invoice",
      description: "Send an existing BritLedger invoice to a client by email.",
      inputSchema: {
        invoiceId: z.string().min(1),
        toEmail: z.string().email(),
        subject: z.string().optional(),
        personalMessage: z.string().optional(),
        includePaymentLink: z.boolean().default(true),
      },
    },
    async ({ invoiceId, toEmail, subject, personalMessage, includePaymentLink }) =>
      runTool(async () => {
        await getMcpContext();
        const response = await sendInvoice(invoiceId, {
          to_email: toEmail,
          subject,
          personal_message: personalMessage,
          include_payment_link: includePaymentLink,
        });
        return response.data;
      })
  );
}
