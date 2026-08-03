import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getInvoice } from "@/lib/britledger/invoices";
import { getClient } from "@/lib/britledger/clients";
import InvoiceDetailClient from "./InvoiceDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage(props: Props) {
  const { id } = await props.params;
  let invoice;
  let client = null;

  try {
    const invRes = await getInvoice(id);
    invoice = invRes.data;

    try {
      const clRes = await getClient(invoice.client_id);
      client = clRes.data;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[InvoiceDetail] Failed to load client:", e);
      }
    }

  } catch (e: any) {
    const errorMsg = e?.response?.data?.message || e?.message || "Failed to load invoice";
    return (
      <div className="text-center py-32 space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
        <p className="text-zinc-500 font-medium italic">{errorMsg}</p>
        <Link href="/billing/invoices" className="text-[10px] font-black uppercase text-[#012169] tracking-[0.2em]">← Back to Invoices</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <Link href="/billing/invoices" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
        <ArrowLeft className="w-3 h-3" /> Back to Invoices
      </Link>
      <InvoiceDetailClient invoice={invoice} client={client} id={id} />
    </div>
  );
}
