import { britGet, britPost, britPut } from "./client";
import { logMissingResponseFields } from "./utils";
import type {
  BritApiResponse,
  BritPaginatedResponse,
  Invoice,
  InvoiceCreate,
  InvoiceUpdate,
  SendInvoiceRequest,
  PaymentCreate,
} from "./types";

const INVOICE_REQUIRED_FIELDS = ["id", "client_id", "invoice_number", "status", "total_amount"] as const;

export async function listInvoices(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  client_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<BritPaginatedResponse<Invoice>> {
  const res = await britGet<BritPaginatedResponse<Invoice>>("/invoices", params);
  if (res.data) {
    res.data.forEach((inv, i) =>
      logMissingResponseFields(inv as any, INVOICE_REQUIRED_FIELDS, `invoice[${i}]`)
    );
  }
  return res;
}

export async function getInvoice(id: string): Promise<BritApiResponse<Invoice>> {
  const res = await britGet<BritApiResponse<Invoice>>(`/invoices/${id}`);
  if (res.data) {
    logMissingResponseFields(res.data as any, INVOICE_REQUIRED_FIELDS, "invoice");
  }
  return res;
}

export async function createInvoice(data: InvoiceCreate): Promise<BritApiResponse<Invoice>> {
  return britPost("/invoices", data);
}

export async function updateInvoice(id: string, data: InvoiceUpdate): Promise<BritApiResponse<Invoice>> {
  return britPut(`/invoices/${id}`, data);
}

export async function sendInvoice(
  id: string,
  data: SendInvoiceRequest
): Promise<BritApiResponse<Invoice>> {
  return britPost(`/invoices/${id}/send`, data);
}

export async function cancelInvoice(id: string): Promise<BritApiResponse<Invoice>> {
  return britPost(`/invoices/${id}/cancel`);
}

export async function recordPayment(
  id: string,
  data: PaymentCreate
): Promise<BritApiResponse<Invoice>> {
  return britPost(`/invoices/${id}/payments`, data);
}

export function getInvoicePdfUrl(id: string): string {
  const base = process.env.BRITLEDGER_API_URL || "https://ledger.britsyncai.com/api/v1";
  return `${base}/invoices/${id}/pdf`;
}
