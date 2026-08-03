import { britDelete, britGet, britPost, britPut } from "./client";
import type { BritApiResponse, BritPaginatedResponse, Expense } from "./types";

export async function listExpenses(params?: {
  page?: number;
  page_size?: number;
  category?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<BritPaginatedResponse<Expense>> {
  return britGet("/bookkeeping/expenses", params);
}

export async function createExpense(data: { amount: number }): Promise<BritApiResponse<Expense>> {
  return britPost("/bookkeeping/expenses", data);
}

export async function updateExpense(id: string, data: { amount?: number }): Promise<BritApiResponse<Expense>> {
  return britPut(`/bookkeeping/expenses/${id}`, data);
}

export async function deleteExpense(id: string): Promise<BritApiResponse<void>> {
  return britDelete(`/bookkeeping/expenses/${id}`);
}

export async function listTransactions(params?: {
  page?: number;
  page_size?: number;
  type?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<BritPaginatedResponse<Record<string, unknown>>> {
  return britGet("/bookkeeping/transactions", params);
}

export async function listLedger(params?: {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
}): Promise<BritPaginatedResponse<Record<string, unknown>>> {
  return britGet("/bookkeeping/ledger", params);
}
