"use server";

import { revalidatePath } from "next/cache";
import { cancelInvoice, createInvoice, recordPayment, sendInvoice } from "@/lib/britledger/invoices";
import { createClient, listClients } from "@/lib/britledger/clients";
import { convertQuotationToInvoice, createQuotation, sendQuotation } from "@/lib/britledger/quotations";
import { createPaymentSession } from "@/lib/britledger/payments";
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
    const res = await createInvoice(data);
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
    const res = await recordPayment(id, data);
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
