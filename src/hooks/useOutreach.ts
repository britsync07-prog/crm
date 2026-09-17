import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

export function useEmailAccounts() {
  return useQuery<any[]>({
    queryKey: queryKeys.emailAccounts,
    queryFn: async () => {
      const res = await fetch("/api/email-accounts");
      if (!res.ok) throw new Error("Failed to load sender accounts.");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useOutreachAnalytics() {
  return useQuery<any>({
    queryKey: queryKeys.outreachAnalytics,
    queryFn: async () => {
      const res = await fetch("/api/outreach/analytics/account");
      if (!res.ok) throw new Error("Failed to load account analytics.");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useOutreachCampaigns() {
  return useQuery<any[]>({
    queryKey: queryKeys.outreachCampaigns,
    queryFn: async () => {
      const res = await fetch("/api/outreach/campaigns");
      if (!res.ok) throw new Error("Failed to load campaign history.");
      const data = await res.json();
      return Array.isArray(data?.history) ? data.history : [];
    },
    staleTime: 60 * 1000,
  });
}

export function useOutreachLeadOptions() {
  return useQuery<{ categories: any[]; statuses: any[] }>({
    queryKey: queryKeys.outreachLeadOptions,
    queryFn: async () => {
      const res = await fetch("/api/outreach/leads/options");
      if (!res.ok) throw new Error("Failed to load lead targeting options.");
      const data = await res.json();
      return {
        categories: Array.isArray(data?.categories) ? data.categories : [],
        statuses: Array.isArray(data?.statuses) ? data.statuses : [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
