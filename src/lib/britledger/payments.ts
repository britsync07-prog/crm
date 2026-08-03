import { britGet, britPost } from "./client";
import type { PaymentSessionCreate, PaymentSessionResponse, PaymentSettings } from "./types";

export async function getPaymentSettings(): Promise<PaymentSettings> {
  return britGet("/payments/settings");
}

export async function updatePaymentSettings(data: Partial<PaymentSettings>): Promise<PaymentSettings> {
  return britPost("/payments/settings", data);
}

export async function createPaymentSession(
  data: PaymentSessionCreate
): Promise<PaymentSessionResponse> {
  return britPost("/payments/create-session", data);
}

export async function getStripeAuthorizeUrl(): Promise<{ url: string }> {
  return britGet("/payments/stripe/authorize");
}
