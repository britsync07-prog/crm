import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

export interface CalendarUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  bookingSlug: string;
}

export interface CalendarSettingsData {
  availableStart?: string;
  availableEnd?: string;
  timeZone?: string;
  reminderAccountId?: string | null;
  weeklySchedule?: string | null;
  bufferMinutes?: number;
  noticeHours?: number;
  bookingWindowDays?: number;
  bookingSlug?: string | null;
  user: CalendarUser;
}

export interface EventType {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  color: string;
  locationType: string;
  locationDetails?: string | null;
  isActive: boolean;
  bufferBefore: number;
  bufferAfter: number;
}

export interface ScheduledMeeting {
  id: string;
  meetingId: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  submitterEmail: string;
  submitterName?: string | null;
  guests?: string[] | null;
  notes?: string | null;
  meetingUrl: string;
}

export function useCalendarSettings() {
  return useQuery<CalendarSettingsData>({
    queryKey: queryKeys.calendarSettings,
    queryFn: async () => {
      const res = await fetch("/api/calendar/settings");
      if (!res.ok) throw new Error("Failed to load calendar settings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEventTypes() {
  return useQuery<EventType[]>({
    queryKey: queryKeys.calendarEventTypes,
    queryFn: async () => {
      const res = await fetch("/api/calendar/event-types");
      if (!res.ok) throw new Error("Failed to load event types");
      return res.json();
    },
  });
}

export function useScheduledMeetings(status: string) {
  return useQuery<ScheduledMeeting[]>({
    queryKey: queryKeys.calendarMeetings(status),
    queryFn: async () => {
      const res = await fetch(`/api/calendar/meetings?status=${status}`);
      if (!res.ok) throw new Error("Failed to load meetings");
      return res.json();
    },
  });
}
