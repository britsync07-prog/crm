"use client";

import { useState } from "react";
import { 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  Pencil, 
  Trash2, 
  Share2, 
  X, 
  Loader2,
  Search
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { useEventTypes, type EventType } from "@/hooks/useCalendar";

interface CalendlyEventTypesProps {
  userHandle: string;
  userName: string;
}

const COLOR_PRESETS = [
  "#006bff", // Calendly Blue
  "#8247e5", // Calendly Purple
  "#00a35c", // Emerald Green
  "#e55c00", // Warm Orange
  "#e53935", // Crimson Red
  "#0ea5e9", // Sky Blue
  "#14b8a6", // Teal
  "#ec4899", // Rose
];

export default function CalendlyEventTypes({ userHandle, userName }: CalendlyEventTypesProps) {
  const queryClient = useQueryClient();
  const { data: eventTypes = [], isLoading } = useEventTypes();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [shareModalEvent, setShareModalEvent] = useState<EventType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState(30);
  const [color, setColor] = useState("#006bff");
  const [locationType, setLocationType] = useState("VIDEO");
  const [description, setDescription] = useState("");
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle("");
    setSlug("");
    setDuration(30);
    setColor("#006bff");
    setLocationType("VIDEO");
    setDescription("");
    setBufferBefore(0);
    setBufferAfter(0);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (event: EventType) => {
    setEditingEvent(event);
    setTitle(event.title);
    setSlug(event.slug);
    setDuration(event.duration);
    setColor(event.color || "#006bff");
    setLocationType(event.locationType || "VIDEO");
    setDescription(event.description || "");
    setBufferBefore(event.bufferBefore || 0);
    setBufferAfter(event.bufferAfter || 0);
    setIsCreateModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingEvent) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleSaveEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Event title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        duration: Number(duration),
        color,
        locationType,
        description: description.trim(),
        bufferBefore: Number(bufferBefore),
        bufferAfter: Number(bufferAfter),
      };

      if (editingEvent) {
        const res = await fetch(`/api/calendar/event-types/${editingEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Event type updated");
          setIsCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.calendarEventTypes });
        } else {
          const err = await res.json();
          toast.error(err.error || "Update failed");
        }
      } else {
        const res = await fetch("/api/calendar/event-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Event type created");
          setIsCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.calendarEventTypes });
        } else {
          const err = await res.json();
          toast.error(err.error || "Creation failed");
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/calendar/event-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        queryClient.setQueryData<EventType[]>(queryKeys.calendarEventTypes, prev =>
          prev ? prev.map(et => et.id === id ? { ...et, isActive: !currentStatus } : et) : []
        );
        toast.success(!currentStatus ? "Event type turned ON" : "Event type turned OFF");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/calendar/event-types/${id}`, { method: "DELETE" });
      if (res.ok) {
        queryClient.setQueryData<EventType[]>(queryKeys.calendarEventTypes, prev =>
          prev ? prev.filter(et => et.id !== id) : []
        );
        toast.success("Event type deleted");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const copyEventLink = (eventSlug: string, eventId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/book/${userHandle}/${eventSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(eventId);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredEvents = eventTypes.filter(et => 
    et.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    et.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sub-header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter event types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#006bff] focus:ring-1 focus:ring-[#006bff] transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#006bff] hover:bg-[#0056d2] text-white rounded-full text-sm font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Event Type</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#006bff]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isCopied = copiedId === event.id;
            const bookingPath = `/book/${userHandle}/${event.slug}`;

            return (
              <div
                key={event.id}
                className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${
                  !event.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Top Colored Accent Stripe */}
                <div 
                  className="h-1.5 w-full" 
                  style={{ backgroundColor: event.color || "#006bff" }}
                />

                <div className="p-5 flex-1 space-y-3">
                  {/* Top Card Controls */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-[#006bff] transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{event.duration} mins</span>
                        <span>•</span>
                        <span>One-on-One</span>
                      </div>
                    </div>

                    {/* Active Toggle Switch */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer" title={event.isActive ? "Turn OFF" : "Turn ON"}>
                        <input
                          type="checkbox"
                          checked={event.isActive}
                          onChange={() => handleToggleActive(event.id, event.isActive)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-700 peer-checked:bg-[#006bff]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Description / Location */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
                      {event.locationType === "VIDEO" ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-[#006bff]" />
                          <span>CRM Video Meeting (LiveKit)</span>
                        </>
                      ) : event.locationType === "PHONE" ? (
                        <>
                          <Phone className="w-3.5 h-3.5 text-green-600" />
                          <span>Phone Call</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>In-Person Meeting</span>
                        </>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* View Booking Page Link */}
                  <div className="pt-1">
                    <a
                      href={bookingPath}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#006bff] hover:underline"
                    >
                      <span>View booking page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/40 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => copyEventLink(event.slug, event.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006bff] hover:text-[#0056d2] transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied!" : "Copy link"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShareModalEvent(event)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors"
                      title="Share options"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(event)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit Event Type"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id, event.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      title="Delete Event Type"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-8">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-zinc-700" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No event types found</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Create an event type to start sharing your calendar and booking meetings with clients.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#006bff] text-white rounded-full text-xs font-semibold hover:bg-[#0056d2]"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event Type</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingEvent ? "Edit Event Type" : "New Event Type"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Host: {userName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form id="event-type-form" onSubmit={handleSaveEventType} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Event name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30 Minute Meeting"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-[#006bff] focus:ring-1 focus:ring-[#006bff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Duration *
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Location
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
                  >
                    <option value="VIDEO">CRM Video Meeting (LiveKit)</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="IN_PERSON">In-Person Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Event link slug
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden text-xs bg-slate-50 dark:bg-zinc-800 text-slate-500">
                  <span className="px-3 py-2 border-r border-slate-200 dark:border-zinc-700">/book/{userHandle}/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Share details or agenda for this meeting..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
                />
              </div>

              {/* Event Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                  Event color
                </label>
                <div className="flex items-center gap-3">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-[#006bff]" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Buffers */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Buffer before event
                  </label>
                  <select
                    value={bufferBefore}
                    onChange={(e) => setBufferBefore(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value={0}>None</option>
                    <option value={5}>5 mins</option>
                    <option value={10}>10 mins</option>
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Buffer after event
                  </label>
                  <select
                    value={bufferAfter}
                    onChange={(e) => setBufferAfter(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value={0}>None</option>
                    <option value={5}>5 mins</option>
                    <option value={10}>10 mins</option>
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="event-type-form"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#006bff] hover:bg-[#0056d2] text-white rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingEvent ? "Save changes" : "Create"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Share &quot;{shareModalEvent.title}&quot;
              </h3>
              <button
                type="button"
                onClick={() => setShareModalEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Direct booking link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/book/${userHandle}/${shareModalEvent.slug}`}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs select-all text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => copyEventLink(shareModalEvent.slug, shareModalEvent.id)}
                  className="px-3 py-2 bg-[#006bff] text-white rounded-lg text-xs font-semibold hover:bg-[#0056d2] shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Website embed code
              </label>
              <textarea
                readOnly
                rows={2}
                value={`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/book/${userHandle}/${shareModalEvent.slug}" width="100%" height="700" frameborder="0"></iframe>`}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-slate-700 dark:text-zinc-300 select-all"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShareModalEvent(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
