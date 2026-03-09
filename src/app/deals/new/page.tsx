import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Save, TrendingUp, DollarSign } from "lucide-react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function NewDealPage() {
  const session = await getSession();
  const userId = session.id;

  const pipelines = await prisma.pipeline.findMany({
    where: { workspace: { ownerId: userId } },
    include: { stages: { orderBy: { order: "asc" } } }
  });

  const leads = await prisma.lead.findMany({ where: { userId } });
  const customers = await prisma.customer.findMany({ where: { userId } });

  async function createDealAction(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) return;

    const name = formData.get("name") as string;
    const value = parseFloat(formData.get("value") as string);
    const probability = parseInt(formData.get("probability") as string);
    const stageId = formData.get("stageId") as string;
    const leadId = formData.get("leadId") as string;
    const customerId = formData.get("customerId") as string;

    await prisma.deal.create({
      data: {
        name,
        value,
        probability,
        stageId,
        leadId: leadId || null,
        customerId: customerId || null,
        userId: session.id,
      }
    });

    revalidatePath("/deals");
    redirect("/deals");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-white/5 pb-8">
        <Link
          href="/deals"
          className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic">
            Revenue <span className="text-indigo-500 not-italic">Injection</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Architect a new deal in your pipeline.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[32px] p-8 shadow-xl">
        <form action={createDealAction} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Deal Name</label>
            <input
              name="name"
              required
              placeholder="e.g. Enterprise License - Q4"
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Contract Value
              </label>
              <input
                name="value"
                type="number"
                required
                placeholder="0.00"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Probability (%)
              </label>
              <input
                name="probability"
                type="number"
                min="0"
                max="100"
                defaultValue="50"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Initial Pipeline Stage</label>
            <select
              name="stageId"
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
            >
              {pipelines.map(p => (
                <optgroup key={p.id} label={p.name}>
                  {p.stages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Related Lead</label>
              <select
                name="leadId"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
              >
                <option value="">None</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Related Customer</label>
              <select
                name="customerId"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
              >
                <option value="">None</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 dark:border-white/5">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" /> Finalize Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
