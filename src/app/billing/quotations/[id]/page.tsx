import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getQuotation } from "@/lib/britledger/quotations";
import { getClient } from "@/lib/britledger/clients";
import QuotationDetailClient from "./QuotationDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuotationDetailPage(props: Props) {
  const { id } = await props.params;
  let quotation;
  let client = null;

  try {
    const quoRes = await getQuotation(id);
    quotation = quoRes.data;

    try {
      const clRes = await getClient(quotation.client_id);
      client = clRes.data;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[QuotationDetail] Failed to load client:", e);
      }
    }

  } catch (e: any) {
    const errorMsg = e?.response?.data?.message || e?.message || "Failed to load quotation";
    return (
      <div className="text-center py-32 space-y-4">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
        <p className="text-zinc-500 font-medium italic">{errorMsg}</p>
        <Link href="/billing/quotations" className="text-[10px] font-black uppercase text-[#012169] tracking-[0.2em]">← Back to Quotations</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <Link href="/billing/quotations" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#012169] transition-colors">
        <ArrowLeft className="w-3 h-3" /> Back to Quotations
      </Link>
      <QuotationDetailClient quotation={quotation} client={client} id={id} />
    </div>
  );
}
