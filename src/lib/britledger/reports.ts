import { britGet } from "./client";
import { logMissingResponseFields } from "./utils";
import type { BritApiResponse, RevenueReport, ProfitLossReport, ExpenseReport } from "./types";

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

export async function getExpenseSummary(
  date_from: string,
  date_to: string
): Promise<BritApiResponse<ExpenseReport>> {
  return britGet("/reports/expenses", { date_from, date_to });
}

export async function getYearlyReport(year: number, fiscal_year_start = 4): Promise<BritApiResponse<Record<string, unknown>>> {
  return britGet(`/reports/yearly/${year}`, { fiscal_year_start });
}
