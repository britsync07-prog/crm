export function formatCurrency(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

export function generateQuotationNumber(): string {
  return `QUO-${Date.now().toString(36).toUpperCase()}`;
}

export function calculateSubtotal(items: { quantity: number; rate?: number; unit_price?: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * (item.rate ?? item.unit_price ?? 0), 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

export function normalizeStatus(status: string): string {
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function getItemRate(item: { rate?: number; unit_price?: number }): number {
  return item.rate ?? item.unit_price ?? 0;
}

export function getItemAmount(item: { amount?: number; quantity: number; unit_price?: number; rate?: number }): number {
  return item.amount ?? (item.unit_price != null ? item.quantity * item.unit_price : (item.rate ?? 0) * item.quantity);
}

export function logMissingResponseFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: readonly (keyof T)[],
  label: string
): T {
  if (process.env.NODE_ENV !== "development") return data;
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      console.warn(`[BritLedger] ${label}: API response missing required field "${String(field)}"`);
    }
  }
  return data;
}
