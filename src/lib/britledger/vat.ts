import { britGet } from "./client";
import type { BritApiResponse, BritPaginatedResponse, VATRecord, VATSummary } from "./types";

export async function getVatSummary(
  period_start: string,
  period_end: string
): Promise<BritApiResponse<VATSummary>> {
  return britGet("/vat/summary", { period_start, period_end });
}

export async function listVatRecords(params?: {
  page?: number;
  page_size?: number;
  period_start?: string;
  period_end?: string;
  vat_type?: string;
}): Promise<BritPaginatedResponse<VATRecord>> {
  return britGet("/vat/records", params);
}

export async function getCurrentQuarterVat(): Promise<BritApiResponse<VATSummary>> {
  return britGet("/vat/report");
}
