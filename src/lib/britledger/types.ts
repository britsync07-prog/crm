export interface BritApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface BritPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate?: number;
  amount?: number;
  unit_price?: number;
  tax_rate?: number;
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date?: string;
  due_date?: string;
  total_amount: number;
  tax_amount: number;
  subtotal_amount: number;
  currency: string;
  items?: InvoiceItem[];
  notes?: string;
}

export interface InvoiceCreate {
  client_id: string;
  invoice_number: string;
  issue_date?: string;
  due_date?: string;
  total_amount: number;
  subtotal?: number;
  tax?: number;
  currency?: string;
  items?: InvoiceItem[];
  notes?: string;
}

export interface InvoiceUpdate {
  client_id?: string;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  total_amount?: number;
  subtotal?: number;
  tax?: number;
  currency?: string;
  items?: InvoiceItem[];
  notes?: string;
  status?: InvoiceStatus;
}

export interface SendInvoiceRequest {
  to_email: string;
  subject?: string;
  personal_message?: string;
}

export interface PaymentCreate {
  amount: number;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  vat_number?: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  vat_number?: string;
  is_active?: boolean;
}

export interface ClientBalances {
  client_id: string;
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
}

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Expired" | "Cancelled";

export interface QuotationItem {
  description: string;
  quantity: number;
  rate?: number;
  amount?: number;
  unit_price?: number;
  tax_rate?: number;
}

export interface Quotation {
  id: string;
  client_id: string;
  quotation_number: string;
  status: QuotationStatus;
  issue_date?: string;
  expiry_date?: string;
  total_amount: number;
  tax_amount: number;
  subtotal_amount: number;
  currency: string;
  items?: QuotationItem[];
  notes?: string;
}

export interface QuotationCreate {
  client_id: string;
  quotation_number: string;
  issue_date?: string;
  expiry_date?: string;
  total_amount: number;
  subtotal?: number;
  tax?: number;
  currency?: string;
  items?: QuotationItem[];
  notes?: string;
}

export interface RevenueReport {
  total_invoiced: number;
  total_collected?: number;
  total_outstanding?: number;
  total_overdue?: number;
}

export interface ProfitLossReport {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  invoice_id?: string;
  quotation_id?: string;
  client_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  status: PaymentStatus;
  payment_date: string;
  notes?: string;
}

export interface ExpenseReport {
  total_expenses: number;
  by_category?: Record<string, number>;
  by_month?: Record<string, number>;
}

export interface VATSummary {
  box1: number;
  box2: number;
  box3: number;
  box4: number;
  box5: number;
  box6: number;
  box7: number;
}

export interface PaymentSettings {
  user_id?: string;
  stripe_public_key?: string | null;
  stripe_account_id?: string | null;
  stripe_enabled?: boolean;
  paypal_client_id?: string | null;
  paypal_enabled?: boolean;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  sort_code?: string | null;
  iban?: string | null;
  swift_bic?: string | null;
  bank_transfer_enabled?: boolean;
  company_logo_url?: string | null;
  company_vat_number?: string | null;
  company_address?: string | null;
}

export interface PaymentSessionCreate {
  invoice_id: string;
  provider: "stripe" | "paypal";
  success_url: string;
  cancel_url: string;
}

export interface PaymentSessionResponse {
  checkout_url?: string | null;
}

export interface Expense {
  id: string;
  amount: number;
  [key: string]: unknown;
}

export interface VATRecord {
  id: string;
  [key: string]: unknown;
}


