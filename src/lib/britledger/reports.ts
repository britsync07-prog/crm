import { britGet } from "./client";
import { logMissingResponseFields } from "./utils";
import type { BritApiResponse, RevenueReport, ProfitLossReport } from "./types";

const REVENUE_REQUIRED_FIELDS = ["total_invoiced"] as const;

export async function getRevenueSummary(
  date_from: string,
  date_to: string
): Promise<BritApiResponse<RevenueReport>> {
  const res = await britGet<BritApiResponse<RevenueReport>>("/reports/revenue", { date_from, date_to });
  if (res.data) {
    logMissingResponseFields(res.data as any, REVENUE_REQUIRED_FIELDS, "revenue");
  }
  return res;
}

export async function getProfitLoss(
  date_from: string,
  date_to: string
): Promise<BritApiResponse<ProfitLossReport>> {
  return britGet("/reports/profit-loss", { date_from, date_to });
}
