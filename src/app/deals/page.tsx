import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import PipelineBoard from "./PipelineBoard";
import { Briefcase, Plus, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function DealsPage() {
  const session = await getSession();
  const userId = session.id;

  // Fetch pipelines for this user/workspace
  // For now, we'll ensure at least one default pipeline exists
  let pipelines = await prisma.pipeline.findMany({
    where: { workspace: { ownerId: userId } },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          deals: {
            where: { userId },
            include: { lead: true, customer: true }
          }
        }
      }
    }
  });

  if (pipelines.length === 0) {
    // Create a default workspace if none exists
    let workspace = await prisma.workspace.findFirst({
      where: { ownerId: userId }
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Main Workspace",
          ownerId: userId,
        }
      });
    }

    // Create a default pipeline
    const defaultPipeline = await prisma.pipeline.create({
      data: {
        name: "Sales Pipeline",
        workspaceId: workspace.id,
        stages: {
          create: [
            { name: "New Lead", order: 1 },
            { name: "Contacted", order: 2 },
            { name: "Qualified", order: 3 },
            { name: "Proposal", order: 4 },
            { name: "Negotiation", order: 5 },
            { name: "Closed Won", order: 6 },
            { name: "Closed Lost", order: 7 },
          ]
        }
      },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: {
            deals: {
              where: { userId },
              include: { lead: true, customer: true }
            }
          }
        }
      }
    });
    pipelines = [defaultPipeline];
  }

  const activePipeline = pipelines[0];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 overflow-x-hidden h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-indigo-500" /> Revenue <span className="text-indigo-500 not-italic">Pipeline</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Multi-stage deal tracking and automated forecasting.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-4 mr-6">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Pipeline Value</p>
              <p className="text-xl font-black text-indigo-600">
                ${activePipeline.stages.reduce((acc, s) => acc + s.deals.reduce((sum, d) => sum + d.value, 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Weighted Forecast</p>
              <p className="text-xl font-black text-green-500">
                ${activePipeline.stages.reduce((acc, s) => acc + s.deals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
          <Link
            href="/deals/new"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Add Deal
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PipelineBoard pipeline={activePipeline} />
      </div>
    </div>
  );
}
