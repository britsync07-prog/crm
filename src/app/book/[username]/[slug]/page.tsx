"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Download
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfDay } from "date-fns";
import { toast } from "react-hot-toast";

interface HostInfo {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  timeZone: string;
}

interface EventTypeInfo {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  color: string;
  locationType: string;
}

interface Slot {
  start: string;
  end: string;
  time: string;
}

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function CalendlyBookingPage() {
  const params = useParams();
  const username = params.username as string;
  const slug = params.slug as string;
  const router = useRouter();

  const [host, setHost] = useState<HostInfo | null>(null);
  const [eventType, setEventType] = useState<EventTypeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scheduling flow state
  const [step, setStep] = useState<"SELECT_TIME" | "ENTER_DETAILS" | "CONFIRMED">("SELECT_TIME");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedTimeOnly, setSelectedTimeOnly] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState<string>("UTC");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState("");
  const [showGuestsInput, setShowGuestsInput] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Auto-detect local timezone
  useEffect(() => {
    try {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (localTz) setTimeZone(localTz);
    } catch {}
  }, []);

  // Fetch initial host and event type info
  useEffect(() => {
    if (!username || !slug) return;

    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/book/${username}/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setHost(data.host);
          setEventType(data.eventType);
          if (typeof document !== "undefined" && data.eventType?.title && data.host?.name) {
            document.title = `${data.eventType.title} | ${data.host.name}`;
          }
          if (data.host?.timeZone) {
            // Keep user local timezone if available, or fall back to host's
            setTimeZone(prev => prev || data.host.timeZone);
          }
        } else {
          setError("Event type not found or link is inactive");
        }
      } catch {
        setError("Failed to load booking page");
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [username, slug]);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    if (!selectedDate || !username || !slug) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setSelectedTimeOnly(null);
      try {
        const dateIso = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(`/api/book/${username}/${slug}?date=${dateIso}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, username, slug]);

  const handleDateClick = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return;
    setSelectedDate(date);
  };

  const handleTimeSlotClick = (slot: Slot) => {
    if (selectedTimeOnly === slot.time) {
      // Clicked Next
      setSelectedSlot(slot);
      setStep("ENTER_DETAILS");
    } else {
      setSelectedTimeOnly(slot.time);
      setSelectedSlot(slot);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        slotStart: selectedSlot.start,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        guests: guests.trim() ? guests.split(",").map(g => g.trim()) : null,
        notes: notes.trim() || null,
      };

      const res = await fetch(`/api/book/${username}/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmedBooking(data.meeting);
        setStep("CONFIRMED");
      } else {
        const err = await res.json();
        toast.error(err.error || "Booking failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadIcs = () => {
    if (!confirmedBooking) return;
    const start = new Date(confirmedBooking.start).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(confirmedBooking.end).toISOString().replace(/-|:|\.\d+/g, "");
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Calendly CRM//EN",
      "BEGIN:VEVENT",
      `UID:${confirmedBooking.meetingId}@calendly.crm`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${confirmedBooking.title}`,
      `DESCRIPTION:Join Video Meeting: ${confirmedBooking.meetingUrl}`,
      `LOCATION:${confirmedBooking.meetingUrl}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `meeting-${confirmedBooking.meetingId}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGoogleCalendarUrl = () => {
    if (!confirmedBooking) return "#";
    const start = new Date(confirmedBooking.start).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(confirmedBooking.end).toISOString().replace(/-|:|\.\d+/g, "");
    const title = encodeURIComponent(confirmedBooking.title);
    const details = encodeURIComponent(`Join Video Meeting: ${confirmedBooking.meetingUrl}`);
    const location = encodeURIComponent(confirmedBooking.meetingUrl);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#006bff]" />
      </div>
    );
  }

  if (error || !host || !eventType) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Event Not Found</h2>
          <p className="text-xs text-slate-500">{error || "This booking link does not exist."}</p>
        </div>
      </div>
    );
  }

  // Calendar dates computation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = startOfDay(new Date());

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 sm:py-12 px-3 sm:px-4 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row transition-all">
        {/* Left Column: Event & Host Details */}
        <div className="w-full md:w-[38%] border-b md:border-b-0 md:border-r border-slate-200 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {step === "ENTER_DETAILS" && (
              <button
                type="button"
                onClick={() => setStep("SELECT_TIME")}
                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                title="Back to date and time"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Host info */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {host.name}
              </p>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {eventType.title}
              </h1>
            </div>

            {/* Metadata Badges */}
            <div className="space-y-2.5 pt-1 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{eventType.duration} min</span>
              </div>

              <div className="flex items-center gap-2">
                {eventType.locationType === "VIDEO" ? (
                  <>
                    <Video className="w-4 h-4 text-[#006bff] shrink-0" />
                    <span>Web conferencing details provided upon confirmation.</span>
                  </>
                ) : eventType.locationType === "PHONE" ? (
                  <>
                    <Phone className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Phone Call</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>In-Person Meeting</span>
                  </>
                )}
              </div>

              {step !== "SELECT_TIME" && selectedSlot && selectedDate && (
                <div className="flex items-center gap-2 text-[#006bff]">
                  <CalendarIcon className="w-4 h-4 shrink-0" />
                  <span>
                    {selectedSlot.time}, {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {eventType.description && (
              <div className="pt-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  {eventType.description}
                </p>
              </div>
            )}
          </div>

          {/* Timezone Selector in Left Footer */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="bg-transparent border-none outline-none cursor-pointer text-slate-700 hover:text-slate-900 text-xs font-medium truncate max-w-[200px]"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Scheduling Flow */}
        <div className="w-full md:w-[62%] p-6 sm:p-8 flex flex-col justify-center">
          {/* STEP 1: SELECT DATE & TIME */}
          {step === "SELECT_TIME" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900">
                Select a Date & Time
              </h2>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar Date Picker */}
                <div className="flex-1 space-y-4">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">
                      {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                        disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), today)}
                        className="p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                        className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Day Headers (Mon - Sun) */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      const isPast = isBefore(day, today);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, today);

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isPast || !isCurrentMonth}
                          onClick={() => handleDateClick(day)}
                          className={`h-9 w-9 rounded-full mx-auto flex items-center justify-center text-xs font-semibold transition-all relative ${
                            isSelected
                              ? "bg-[#006bff] text-white shadow-md font-bold"
                              : isPast || !isCurrentMonth
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-800 hover:bg-blue-50 hover:text-[#006bff]"
                          }`}
                        >
                          <span>{format(day, "d")}</span>
                          {isToday && !isSelected && (
                            <span className="w-1 h-1 bg-[#006bff] rounded-full absolute bottom-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Column */}
                {selectedDate && (
                  <div className="w-full lg:w-48 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-6 pt-4 lg:pt-0 space-y-3">
                    <p className="text-xs font-bold text-slate-700">
                      {format(selectedDate, "EEEE, MMM d")}
                    </p>

                    {loadingSlots ? (
                      <div className="py-12 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-[#006bff]" />
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 italic">
                        No available slots on this date.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {slots.map((slot) => {
                          const isClicked = selectedTimeOnly === slot.time;

                          return (
                            <div key={slot.start} className="flex items-center gap-1.5 transition-all">
                              <button
                                type="button"
                                onClick={() => handleTimeSlotClick(slot)}
                                className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-bold text-center transition-all ${
                                  isClicked
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "border-[#006bff] text-[#006bff] hover:bg-blue-50"
                                }`}
                              >
                                {slot.time}
                              </button>

                              {isClicked && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSlot(slot);
                                    setStep("ENTER_DETAILS");
                                  }}
                                  className="py-2.5 px-3 bg-[#006bff] hover:bg-[#0056d2] text-white rounded-lg text-xs font-bold shadow-sm animate-in fade-in slide-in-from-left-2 duration-200"
                                >
                                  Next
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: ENTER DETAILS FORM */}
          {step === "ENTER_DETAILS" && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Enter Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Please provide your contact information to confirm this meeting.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-[#006bff] focus:ring-1 focus:ring-[#006bff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-[#006bff] focus:ring-1 focus:ring-[#006bff]"
                />
              </div>

              {/* Add Guests Toggle */}
              <div>
                {!showGuestsInput ? (
                  <button
                    type="button"
                    onClick={() => setShowGuestsInput(true)}
                    className="text-xs font-semibold text-[#006bff] hover:underline"
                  >
                    + Add Guests
                  </button>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Guest Emails (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="guest1@example.com, guest2@example.com"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#006bff]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Please share anything that will help prepare for our meeting:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Goals, agenda, questions..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-[#006bff]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-[#006bff] hover:bg-[#0056d2] text-white rounded-full text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Schedule Event</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CONFIRMED SCREEN */}
          {step === "CONFIRMED" && confirmedBooking && (
            <div className="text-center py-6 space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900">
                  You are scheduled
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  A calendar invitation has been sent to your email address.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3 max-w-md mx-auto text-xs">
                <div className="font-bold text-slate-900 text-sm">
                  {confirmedBooking.title}
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  <span>
                    {format(new Date(confirmedBooking.start), "EEEE, MMMM d, yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    {format(new Date(confirmedBooking.start), "h:mm a")} – {format(new Date(confirmedBooking.end), "h:mm a")} ({timeZone})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Video className="w-4 h-4 text-[#006bff]" />
                  <span>Web conferencing link will be active at start time.</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={confirmedBooking.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#006bff] hover:bg-[#0056d2] text-white rounded-full text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Video Meeting</span>
                </a>

                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-full text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Add to Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={downloadIcs}
                  className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-full text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ics</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
