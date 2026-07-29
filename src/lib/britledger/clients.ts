import { britGet, britPost, britPut, britDelete } from "./client";
import { logMissingResponseFields } from "./utils";
import type {
  BritApiResponse,
  BritPaginatedResponse,
  Client,
  ClientCreate,
  ClientBalances,
} from "./types";

const CLIENT_REQUIRED_FIELDS = ["id", "name", "is_active", "user_id"] as const;

export async function listClients(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}): Promise<BritPaginatedResponse<Client>> {
  const res = await britGet<BritPaginatedResponse<Client>>("/clients", params);
  if (res.data) {
    res.data.forEach((c, i) =>
      logMissingResponseFields(c as any, CLIENT_REQUIRED_FIELDS, `client[${i}]`)
    );
  }
  return res;
}

export async function getClient(id: string): Promise<BritApiResponse<Client>> {
  const res = await britGet<BritApiResponse<Client>>(`/clients/${id}`);
  if (res.data) {
    logMissingResponseFields(res.data as any, CLIENT_REQUIRED_FIELDS, "client");
  }
  return res;
}

export async function createClient(data: ClientCreate): Promise<BritApiResponse<Client>> {
  return britPost("/clients", data);
}

export async function updateClient(
  id: string,
  data: Partial<ClientCreate>
): Promise<BritApiResponse<Client>> {
  return britPut(`/clients/${id}`, data);
}

export async function deleteClient(id: string): Promise<BritApiResponse<void>> {
  return britDelete(`/clients/${id}`);
}

export async function getClientBalances(
  id: string
): Promise<BritApiResponse<ClientBalances>> {
  return britGet(`/clients/${id}/balances`);
}

export async function getClientInvoices(
  id: string,
  params?: { page?: number; page_size?: number }
): Promise<BritPaginatedResponse<any>> {
  return britGet(`/clients/${id}/invoices`, params);
}
