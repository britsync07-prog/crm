"use client";

import { useState, useTransition } from "react";
import { updateDealStage, deleteDeal } from "./actions";
import { Calendar, MoreVertical, Trash2, GripVertical, User, ArrowRight } from "lucide-react";
import Link from "next/link";

type Pipeline = any;

export default function PipelineBoard({ pipeline }: { pipeline: Pipeline }) {
  const [stages, setStages] = useState(pipeline.stages);
  const [isPending, startTransition] = useTransition();

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (!dealId) return;

    // Find the deal across all stages
    let movedDeal: any = null;
    const newStages = stages.map((stage: any) => {
      const deal = stage.deals.find((d: any) => d.id === dealId);
      if (deal) movedDeal = deal;
      return {
        ...stage,
        deals: stage.deals.filter((d: any) => d.id !== dealId)
      };
    });

    if (!movedDeal) return;

    // Add deal to target stage
    const finalStages = newStages.map((stage: any) => {
      if (stage.id === targetStageId) {
        return {
          ...stage,
          deals: [...stage.deals, { ...movedDeal, stageId: targetStageId }]
        };
      }
      return stage;
    });

    setStages(finalStages);

    startTransition(() => {
      updateDealStage(dealId, targetStageId);
    });
  };

  const handleDelete = (dealId: string) => {
    const newStages = stages.map((s: any) => ({
      ...s,
      deals: s.deals.filter((d: any) => d.id !== dealId)
    }));
    setStages(newStages);
    startTransition(() => {
      deleteDeal(dealId);
    });
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-250px)] snap-x snap-mandatory hide-scrollbar">
      {stages.map((stage: any) => {
        const stageValue = stage.deals.reduce((sum: number, d: any) => sum + d.value, 0);
        
        return (
          <div 
            key={stage.id} 
            className="min-w-[320px] w-[320px] flex-shrink-0 snap-center flex flex-col bg-zinc-50/50 dark:bg-white/[0.02] rounded-[32px] border border-zinc-200/50 dark:border-white/5"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="p-6 border-b border-zinc-200/50 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-t-[32px]">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">{stage.name}</h3>
                <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-tighter">
                  {stage.deals.length} Deals • ${stageValue.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {stage.deals.map((deal: any) => (
                <div 
                  key={deal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal.id)}
                  className="p-5 bg-white dark:bg-zinc-900 rounded-[24px] shadow-sm border border-zinc-200 dark:border-white/5 hover:border-indigo-500/50 hover:shadow-xl transition-all group cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-snug">{deal.name}</h4>
                    <button 
                      onClick={() => handleDelete(deal.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      ${deal.value.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                      {deal.probability}%
                    </span>
                  </div>

                  {(deal.lead || deal.customer) && (
                    <div className="flex items-center gap-2 mb-4 p-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                      <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                        <User className="w-3 h-3 text-zinc-500" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]">
                        {deal.lead?.name || deal.customer?.name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {deal.expectedClose ? new Date(deal.expectedClose).toLocaleDateString() : "No Date"}
                      </span>
                    </div>
                    <Link href={`/leads/${deal.leadId || ''}`} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              ))}
              
              {stage.deals.length === 0 && (
                <div className="h-full min-h-[150px] flex items-center justify-center flex-col opacity-20 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-[24px]">
                  <GripVertical className="w-6 h-6 text-zinc-400 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-center text-zinc-500">Drop deals</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
