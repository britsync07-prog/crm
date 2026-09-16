"use client";

import { useState, useEffect } from "react";
import { Globe, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const DAYS_OF_WEEK = [
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
  { index: 0, name: "Sunday" },
];

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "20:00", "21:00", "22:00"
];

const TIMEZONES = [
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

interface ScheduleDay {
  active: boolean;
  start: string;
  end: string;
}

export default function CalendlyAvailability() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [timeZone, setTimeZone] = useState("UTC");
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [noticeHours, setNoticeHours] = useState(2);
  const [bookingWindowDays, setBookingWindowDays] = useState(60);
  const [bookingSlug, setBookingSlug] = useState("");
  const [userHandle, setUserHandle] = useState("");

  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, ScheduleDay>>({
    1: { active: true, start: "09:00", end: "17:00" },
    2: { active: true, start: "09:00", end: "17:00" },
    3: { active: true, start: "09:00", end: "17:00" },
    4: { active: true, start: "09:00", end: "17:00" },
    5: { active: true, start: "09:00", end: "17:00" },
    6: { active: false, start: "09:00", end: "17:00" },
    0: { active: false, start: "09:00", end: "17:00" },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/calendar/settings");
        if (res.ok) {
          const data = await res.json();
          setTimeZone(data.timeZone || "UTC");
          setBufferMinutes(data.bufferMinutes ?? 0);
          setNoticeHours(data.noticeHours ?? 2);
          setBookingWindowDays(data.bookingWindowDays ?? 60);
          setBookingSlug(data.bookingSlug || "");
          setUserHandle(data.user?.bookingSlug || "");

          if (data.weeklySchedule) {
            try {
              const parsed = JSON.parse(data.weeklySchedule);
              setWeeklySchedule(prev => ({ ...prev, ...parsed }));
            } catch {}
          } else if (data.availableStart && data.availableEnd) {
            // Apply availableStart and availableEnd to weekdays
            setWeeklySchedule({
              1: { active: true, start: data.availableStart, end: data.availableEnd },
              2: { active: true, start: data.availableStart, end: data.availableEnd },
              3: { active: true, start: data.availableStart, end: data.availableEnd },
              4: { active: true, start: data.availableStart, end: data.availableEnd },
              5: { active: true, start: data.availableStart, end: data.availableEnd },
              6: { active: false, start: data.availableStart, end: data.availableEnd },
              0: { active: false, start: data.availableStart, end: data.availableEnd },
            });
          }
        }
      } catch {
        toast.error("Failed to load availability settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggleDay = (dayIndex: number) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        active: !prev[dayIndex]?.active,
      },
    }));
  };

  const handleTimeChange = (dayIndex: number, field: "start" | "end", value: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Pick Monday's hours as default fallback for availableStart/End
      const defaultStart = weeklySchedule[1]?.start || "09:00";
      const defaultEnd = weeklySchedule[1]?.end || "17:00";

      const payload = {
        availableStart: defaultStart,
        availableEnd: defaultEnd,
        timeZone,
        weeklySchedule: JSON.stringify(weeklySchedule),
        bufferMinutes: Number(bufferMinutes),
        noticeHours: Number(noticeHours),
        bookingWindowDays: Number(bookingWindowDays),
        bookingSlug: bookingSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
      };

      const res = await fetch("/api/calendar/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Availability & schedule rules updated");
      } else {
        toast.error("Failed to update availability");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#006bff]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-8">
      {/* Section 1: Weekly Working Hours */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Weekly hours
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Set your regular available hours when invitees can book time with you.
          </p>
        </div>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-zinc-800">
          {DAYS_OF_WEEK.map(({ index, name }) => {
            const dayConfig = weeklySchedule[index] || { active: false, start: "09:00", end: "17:00" };

            return (
              <div key={index} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Day Checkbox & Name */}
                <div className="flex items-center gap-3 w-36">
                  <input
                    type="checkbox"
                    id={`day-${index}`}
                    checked={dayConfig.active}
                    onChange={() => handleToggleDay(index)}
                    className="w-4 h-4 rounded text-[#006bff] focus:ring-[#006bff] cursor-pointer"
                  />
                  <label htmlFor={`day-${index}`} className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer select-none">
                    {name}
                  </label>
                </div>

                {/* Hours Pickers */}
                {dayConfig.active ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={dayConfig.start}
                      onChange={(e) => handleTimeChange(index, "start", e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-400 font-medium">–</span>
                    <select
                      value={dayConfig.end}
                      onChange={(e) => handleTimeChange(index, "end", e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">
                    Unavailable
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Timezone & Scheduling Rules */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Scheduling parameters
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Configure buffers, booking notice, and your public booking handle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#006bff]" />
              <span>Timezone</span>
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {/* Booking Handle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Public booking handle
            </label>
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden text-xs bg-slate-50 dark:bg-zinc-800">
              <span className="px-3 py-2 text-slate-400 border-r border-slate-200 dark:border-zinc-700">/book/</span>
              <input
                type="text"
                placeholder={userHandle || "my-handle"}
                value={bookingSlug}
                onChange={(e) => setBookingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none font-medium"
              />
            </div>
          </div>

          {/* Minimum Notice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Minimum scheduling notice
            </label>
            <select
              value={noticeHours}
              onChange={(e) => setNoticeHours(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
            >
              <option value={0}>No notice (allow immediate bookings)</option>
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours (1 day)</option>
              <option value={48}>48 hours (2 days)</option>
            </select>
          </div>

          {/* Booking Window */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Future booking horizon
            </label>
            <select
              value={bookingWindowDays}
              onChange={(e) => setBookingWindowDays(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#006bff]"
            >
              <option value={14}>14 calendar days into future</option>
              <option value={30}>30 calendar days into future</option>
              <option value={60}>60 calendar days into future</option>
              <option value={90}>90 calendar days into future</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#006bff] hover:bg-[#0056d2] text-white rounded-full text-sm font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? "Saving..." : "Save Availability"}</span>
        </button>
      </div>
    </form>
  );
}
