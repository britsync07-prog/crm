import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

export interface Meeting {
  id: string;
  meetingId: string;
  title: string;
  status: string;
  createdAt: string;
}

export function useMeetings() {
  return useQuery<Meeting[]>({
    queryKey: queryKeys.meetings,
    queryFn: async () => {
      const res = await fetch("/api/meetings/list");
      if (!res.ok) throw new Error("Failed to load meetings");
      return res.json();
    },
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; startTime: string; endTime: string }) => {
      const res = await fetch("/api/meetings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create meeting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings });
    },
  });
}
