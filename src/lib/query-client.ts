import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,          // Data is considered fresh for 60 seconds
        gcTime: 10 * 60 * 1000,         // Keep unmounted cache in memory for 10 minutes
        refetchOnWindowFocus: false,    // Prevent focus storms when switching tabs/windows
        refetchOnReconnect: true,       // Refresh if network reconnects
        retry: 1,                       // Maximum 1 retry on network failure
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a fresh QueryClient per request
    return makeQueryClient();
  } else {
    // Browser: reuse existing QueryClient instance across client renders
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Centralized strongly-typed query keys
export const queryKeys = {
  meetings: ["meetings"] as const,
  forms: ["forms"] as const,
  formSubmissions: (formId: string) => ["forms", formId, "submissions"] as const,
  calendarSettings: ["calendar", "settings"] as const,
  calendarEventTypes: ["calendar", "eventTypes"] as const,
  calendarMeetings: (status: string) => ["calendar", "meetings", status] as const,
  emailAccounts: ["emailAccounts"] as const,
  outreachAnalytics: ["outreach", "analytics"] as const,
  outreachCampaigns: ["outreach", "campaigns"] as const,
  outreachLeadOptions: ["outreach", "leadOptions"] as const,
  teamMembers: ["organization", "members"] as const,
  pricing: ["pricing"] as const,
};
