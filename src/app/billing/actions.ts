"use server";

import { revalidatePath } from "next/cache";
import { cancelInvoice, createInvoice, getInvoice, sendInvoice, updateInvoice } from "@/lib/britledger/invoices";
import { createClient, listClients } from "@/lib/britledger/clients";
import { convertQuotationToInvoice, createQuotation, sendQuotation } from "@/lib/britledger/quotations";
import { createPaymentSession } from "@/lib/britledger/payments";
import { updatePaymentSettings } from "@/lib/britledger/payments";
import { invalidateCache } from "@/lib/britledger/client";
import type { InvoiceCreate, PaymentCreate, ClientCreate, QuotationCreate, SendInvoiceRequest, PaymentSessionCreate } from "@/lib/britledger/types";

export async function listClientsAction(params?: { page?: number; page_size?: number; search?: string }) {
  try {
    const res = await listClients(params);
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.message || "Failed to list clients" };
  }
}

export async function createInvoiceAction(data: InvoiceCreate) {
  try {
    const totalAmount = Number(data.total_amount || 0);
    const requestedStatus = data.status;
    const advancePayment = requestedStatus === "PAID" || requestedStatus === "Paid"
      ? totalAmount
      : Math.min(Math.max(Number(data.advance_payment || 0), 0), totalAmount);
    const res = await createInvoice({
      ...data,
      advance_payment: advancePayment,
    });
    if (res.data?.id) {
      const synced = await updateInvoice(res.data.id, {
        advance_payment: advancePayment,
        ...(requestedStatus ? { status: requestedStatus } : {}),
      });
      res.data = synced.data;
    }
    invalidateCache("/invoices");
    revalidatePath("/billing");
    revalidatePath("/billing/invoices");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.message || "Failed to create invoice" };
  }
}

export async function createClientAction(data: ClientCreate) {
  try {
    const res = await createClient(data);
    invalidateCache("/clients");
    revalidatePath("/billing/clients");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.message || "Failed to create client" };
  }
}

export async function sendQuotationAction(id: string) {
  try {
    const res = await sendQuotation(id);
    invalidateCache("/quotations");
    revalidatePath("/billing/quotations");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.message || "Failed to send quotation" };
  }
}

export async function sendInvoiceAction(id: string, data: SendInvoiceRequest) {
  try {
    const res = await sendInvoice(id, data);
    invalidateCache("/invoices");
    revalidatePath(`/billing/invoices/${id}`);
    revalidatePath("/billing/invoices");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Failed to send invoice" };
  }
}

export async function cancelInvoiceAction(id: string) {
  try {
    const res = await cancelInvoice(id);
    invalidateCache("/invoices");
    revalidatePath(`/billing/invoices/${id}`);
    revalidatePath("/billing/invoices");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Failed to cancel invoice" };
  }
}

export async function createQuotationAction(data: QuotationCreate) {
  try {
    const res = await createQuotation(data);
    invalidateCache("/quotations");
    revalidatePath("/billing/quotations");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.message || "Failed to create quotation" };
  }
}

export async function recordPaymentAction(id: string, data: PaymentCreate) {
  try {
    const invoiceRes = await getInvoice(id);
    const invoice = invoiceRes.data;
    const totalAmount = Number(invoice.total_amount || 0);
    const currentAdvance = Math.min(Math.max(Number(invoice.advance_payment || 0), 0), totalAmount);
    const paymentAmount = Math.max(Number(data.amount || 0), 0);
    const nextAdvance = Math.min(currentAdvance + paymentAmount, totalAmount);
    const nextStatus = nextAdvance >= totalAmount ? "PAID" : nextAdvance > 0 ? "PARTIAL" : invoice.status;
    const res = await updateInvoice(id, {
      advance_payment: nextAdvance,
      status: nextStatus,
    });
    invalidateCache("/invoices");
    revalidatePath(`/billing/invoices/${id}`);
    revalidatePath("/billing/invoices");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.message || "Failed to record payment" };
  }
}

export async function convertQuotationAction(id: string) {
  try {
    const res = await convertQuotationToInvoice(id);
    invalidateCache("/quotations");
    invalidateCache("/invoices");
    revalidatePath(`/billing/quotations/${id}`);
    revalidatePath("/billing/quotations");
    revalidatePath("/billing/invoices");
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Failed to convert quotation" };
  }
}

export async function createPaymentSessionAction(data: PaymentSessionCreate) {
  try {
    const res = await createPaymentSession(data);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Failed to create payment session" };
  }
}

export async function updatePaymentSettingsAction(data: Partial<import("@/lib/britledger/types").PaymentSettings>) {
  try {
    const res = await updatePaymentSettings(data);
    revalidatePath("/settings/payments");
    revalidatePath("/billing");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Failed to update payment settings" };
  }
}
