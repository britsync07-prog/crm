import { britGet, britPost, britPut } from "./client";
import { logMissingResponseFields } from "./utils";
import type {
  BritApiResponse,
  BritPaginatedResponse,
  Quotation,
  QuotationCreate,
} from "./types";

const QUOTATION_REQUIRED_FIELDS = ["id", "client_id", "quotation_number", "status", "total_amount"] as const;

export async function listQuotations(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  client_id?: string;
}): Promise<BritPaginatedResponse<Quotation>> {
  const res = await britGet<BritPaginatedResponse<Quotation>>("/quotations", params);
  if (res.data) {
    res.data.forEach((q, i) =>
      logMissingResponseFields(q as any, QUOTATION_REQUIRED_FIELDS, `quotation[${i}]`)
    );
  }
  return res;
}

export async function getQuotation(id: string): Promise<BritApiResponse<Quotation>> {
  const res = await britGet<BritApiResponse<Quotation>>(`/quotations/${id}`);
  if (res.data) {
    logMissingResponseFields(res.data as any, QUOTATION_REQUIRED_FIELDS, "quotation");
  }
  return res;
}

export async function createQuotation(
  data: QuotationCreate
): Promise<BritApiResponse<Quotation>> {
  return britPost("/quotations", data);
}

export async function updateQuotation(
  id: string,
  data: Partial<QuotationCreate>
): Promise<BritApiResponse<Quotation>> {
  return britPut(`/quotations/${id}`, data);
}

export async function sendQuotation(id: string): Promise<BritApiResponse<Quotation>> {
  return britPost(`/quotations/${id}/send`);
}

export async function convertQuotationToInvoice(
  id: string
): Promise<BritApiResponse<{ invoice_id: string }>> {
  return britPost(`/quotations/${id}/convert`, {});
}
