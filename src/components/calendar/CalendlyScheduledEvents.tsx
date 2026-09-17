"use client";

import { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  User, 
  Loader2, 
  X,
  Search,
  Download
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useScheduledMeetings, type ScheduledMeeting as Meeting } from "@/hooks/useCalendar";

export default function CalendlyScheduledEvents() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<"upcoming" | "past" | "canceled">("upcoming");
  const { data: meetings = [], isLoading } = useScheduledMeetings(activeSubTab);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cancel modal
  const [cancelingMeeting, setCancelingMeeting] = useState<Meeting | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancelMeeting = async () => {
    if (!cancelingMeeting) return;
    setIsCanceling(true);
    try {
      const res = await fetch(`/api/calendar/meetings/${cancelingMeeting.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Canceled by host" }),
      });

      if (res.ok) {
        toast.success("Meeting canceled and invitee notified");
        setCancelingMeeting(null);
        setCancelReason("");
        queryClient.invalidateQueries({ queryKey: ["calendar", "meetings"] });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel meeting");
      }
    } catch {
      toast.error("Operation failed");
    } finally {
      setIsCanceling(false);
    }
  };

  const downloadIcs = (meeting: Meeting) => {
    const start = new Date(meeting.startTime).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(meeting.endTime).toISOString().replace(/-|:|\.\d+/g, "");
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Calendly CRM//EN",
      "BEGIN:VEVENT",
      `UID:${meeting.meetingId}@calendly.crm`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${meeting.title}`,
      `DESCRIPTION:Join Video Meeting: ${meeting.meetingUrl}\\n\\nNotes: ${meeting.notes || "None"}`,
      `LOCATION:${meeting.meetingUrl}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `meeting-${meeting.meetingId}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.submitterEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.submitterName && m.submitterName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Sub-tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          {(["upcoming", "past", "canceled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeSubTab === tab
                  ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#006bff]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-8">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-zinc-700" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No {activeSubTab} events
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {activeSubTab === "upcoming" 
              ? "When guests book meetings via your link, they will appear here." 
              : `You have no ${activeSubTab} events in your calendar history.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((meeting) => {
            const startDate = new Date(meeting.startTime);
            const endDate = new Date(meeting.endTime);

            return (
              <div
                key={meeting.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Date & Meeting Info */}
                <div className="flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[10px] font-bold text-[#006bff] uppercase tracking-wider">
                      {format(startDate, "MMM")}
                    </span>
                    <span className="text-2xl font-black text-[#006bff] leading-none">
                      {format(startDate, "dd")}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-500 dark:text-zinc-400">
                      {format(startDate, "EEE")}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {meeting.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-zinc-300">
                          {meeting.submitterName || "Invitee"}:
                        </span>
                        <span>{meeting.submitterEmail}</span>
                      </span>
                    </div>

                    {meeting.notes && (
                      <p className="text-xs text-slate-500 italic pt-1">
                        &quot;{meeting.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  {meeting.status === "ACTIVE" && (
                    <a
                      href={meeting.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#006bff] hover:bg-[#0056d2] text-white rounded-full text-xs font-bold shadow-sm transition-all active:scale-95"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => downloadIcs(meeting)}
                    className="p-2 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-xs font-semibold transition-colors"
                    title="Download .ics Calendar Invite"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {meeting.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() => setCancelingMeeting(meeting)}
                      className="px-3.5 py-2 border border-red-200 dark:border-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Cancel Meeting
              </h3>
              <button
                type="button"
                onClick={() => setCancelingMeeting(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Are you sure you want to cancel &quot;{cancelingMeeting.title}&quot;? An email notification will be sent to <strong>{cancelingMeeting.submitterEmail}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Let the invitee know why you need to cancel..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelingMeeting(null)}
                disabled={isCanceling}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400"
              >
                Keep Event
              </button>
              <button
                type="button"
                onClick={handleCancelMeeting}
                disabled={isCanceling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCanceling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Cancel Event</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
