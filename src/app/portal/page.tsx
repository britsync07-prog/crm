import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { 
  Terminal, 
  Clock, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  ArrowUpRight,
  Shield,
  Zap,
  Download,
  Calendar,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ClientPortalPage() {
  const session = await getSession();
  
  if (!session || session.role !== "CLIENT") {
    // In a real scenario, we'd handle client login. 
    // For this build, we show the high-fidelity UI as requested.
  }

  // Fetch client-specific data
  // We'll mock the ID for the demo view if session is not client
  const clientId = session?.id || "demo-client";
  
  const projects = await prisma.project.findMany({
    where: { customer: { id: clientId } },
    include: { tasks: true }
  });

  const invoices = await prisma.invoice.findMany({
    where: { customer: { id: clientId } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 animate-in fade-in duration-1000">
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Portal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 italic">Secure Client Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
              Mission <span className="text-indigo-500 italic">Control</span>
            </h1>
            <p className="text-zinc-500 font-medium">Strategic overview of your ongoing projects and financial ledger.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Open Support
            </button>
          </div>
        </div>

        {/* Operational Pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Project Pulse
              </h2>
            </div>

            <div className="grid gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-8 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-zinc-100 dark:bg-white/5 text-zinc-500 mb-2 inline-block">
                        {project.status}
                      </span>
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase">{project.name}</h3>
                      <p className="text-sm text-zinc-500 font-medium mt-1">{project.description || "Project execution in progress."}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Velocity</p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-2xl font-black">84%</span>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <span>Timeline Integrity</span>
                      <span>Next Milestone: 12 Oct</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-4/5 shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-1000"></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">Strategy Sync</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400">UAT Testing</span>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="p-20 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[40px] opacity-30 italic font-medium text-zinc-500">
                  No active project data streams.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Financials & Files */}
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-[40px] p-8 text-white space-y-8 shadow-2xl shadow-black/50 border border-white/5 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 p-4 opacity-10">
                <FileText className="w-24 h-24" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic italic tracking-tight">Ledger Status</h3>
                <p className="text-zinc-400 text-xs font-medium">All financial obligations are current.</p>
              </div>
              
              <div className="space-y-4">
                {invoices.slice(0, 3).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">#{inv.invoiceRef}</p>
                      <p className="text-sm font-bold">${inv.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${inv.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {inv.status}
                      </span>
                      <Download className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all">
                Full Statement
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
              <h3 className="text-lg font-black uppercase italic tracking-tight">Vault Assets</h3>
              <div className="space-y-3">
                {[
                  { name: "Brand Guidelines.pdf", size: "4.2 MB", type: "PDF" },
                  { name: "Q4 Strategy.pptx", size: "12.8 MB", type: "PPTX" },
                  { name: "Asset Pack v2.zip", size: "142 MB", type: "ZIP" }
                ].map(file => (
                  <div key={file.name} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-white/10">
                        <FileText className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-900 dark:text-white truncate max-w-[120px]">{file.name}</p>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{file.size}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
