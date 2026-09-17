"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import CalendlyEventTypes from "@/components/calendar/CalendlyEventTypes";
import CalendlyScheduledEvents from "@/components/calendar/CalendlyScheduledEvents";
import CalendlyAvailability from "@/components/calendar/CalendlyAvailability";
import { useCalendarSettings } from "@/hooks/useCalendar";

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<"event_types" | "scheduled_events" | "availability">("event_types");
  const { data: settingsData } = useCalendarSettings();
  const userHandle = settingsData?.user?.bookingSlug || settingsData?.user?.id || "";
  const userName = settingsData?.user?.name || "Host";
  const userImage = settingsData?.user?.image || null;
  const [isCopied, setIsCopied] = useState(false);

  const copyPublicLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/book/${userHandle}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Public booking link copied to clipboard");
    setTimeout(() => setIsCopied(false), 2500);
  };

  const bookingPageUrl = `/book/${userHandle}`;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 pb-24">
      {/* Calendly Navigation Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top Bar: User info + Link + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#006bff]/10 border border-[#006bff]/20 text-[#006bff] flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
                {userImage ? (
                  <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span>{userName[0]?.toUpperCase() || "U"}</span>
                )}
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {userName}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  <span className="font-medium text-slate-400">My Link:</span>
                  <a
                    href={bookingPageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#006bff] hover:underline truncate max-w-[220px]"
                  >
                    /book/{userHandle}
                  </a>
                  <button
                    type="button"
                    onClick={copyPublicLink}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:text-[#006bff] transition-colors"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? "Copied" : "Copy link"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <a
                href={bookingPageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-full text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span>View landing page</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Calendly Tabs Bar */}
          <div className="flex items-center gap-8 -mb-px border-t border-slate-100 dark:border-zinc-800/80 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab("event_types")}
              className={`pb-3.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === "event_types"
                  ? "border-[#006bff] text-[#006bff]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Event Types
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("scheduled_events")}
              className={`pb-3.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === "scheduled_events"
                  ? "border-[#006bff] text-[#006bff]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Scheduled Events
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("availability")}
              className={`pb-3.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === "availability"
                  ? "border-[#006bff] text-[#006bff]"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Availability
            </button>
          </div>
        </div>
      </div>

      {/* Calendly Tab Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {activeTab === "event_types" && (
          <CalendlyEventTypes userHandle={userHandle} userName={userName} />
        )}

        {activeTab === "scheduled_events" && (
          <CalendlyScheduledEvents />
        )}

        {activeTab === "availability" && (
          <CalendlyAvailability />
        )}
      </main>
    </div>
  );
}
