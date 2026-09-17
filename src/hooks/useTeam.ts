import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

export interface Member {
  id: string;
  email: string;
  role: string;
  status: string;
  inviteToken: string;
  name: string | null;
  invitedByName: string | null;
  joinedAt: string | null;
  lastActive: string | null;
}

export interface TeamData {
  members: Member[];
  seatLimit: number;
  plan: string;
  myRole: string | null;
}

export function useTeamMembers() {
  return useQuery<TeamData>({
    queryKey: queryKeys.teamMembers,
    queryFn: async () => {
      const res = await fetch("/api/organization/members");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load team members");
      }
      const data = await res.json();
      return {
        members: data.members ?? [],
        seatLimit: data.seatLimit ?? 1,
        plan: data.plan ?? "free",
        myRole: data.myRole ?? null,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
