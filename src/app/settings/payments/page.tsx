import { AlertTriangle, WalletCards } from "lucide-react";
import PaymentSettingsForm from "@/components/billing/PaymentSettingsForm";
import { getPaymentSettings } from "@/lib/britledger/payments";
import type { PaymentSettings } from "@/lib/britledger/types";

const emptySettings: PaymentSettings = {
  stripe_public_key: "",
  stripe_account_id: "",
  stripe_enabled: false,
  paypal_client_id: "",
  paypal_enabled: false,
  bank_name: "",
  account_name: "",
  account_number: "",
  sort_code: "",
  iban: "",
  swift_bic: "",
  bank_transfer_enabled: false,
  company_logo_url: "",
  company_vat_number: "",
  company_address: "",
};

export default async function PaymentSettingsPage() {
  let settings = emptySettings;
  let loadError = false;

  try {
    settings = { ...emptySettings, ...(await getPaymentSettings()) };
  } catch (error) {
    loadError = true;
    if (process.env.NODE_ENV === "development") console.error("[PaymentSettings] Failed to load:", error);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#012169] shadow-lg shadow-blue-900/20">
          <WalletCards className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">Payment Settings</h1>
          <p className="text-sm font-medium text-zinc-500">Manage invoice payment rails, bank details, and business document identity.</p>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">BritLedger settings could not be loaded. You can still review the fields, but saving requires the BritLedger API to be reachable.</p>
        </div>
      )}

      <PaymentSettingsForm initialSettings={settings} />
    </div>
  );
}
