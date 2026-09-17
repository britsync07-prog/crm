import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

export interface FormItem {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  _count: {
    submissions: number;
  };
}

export function useForms() {
  return useQuery<FormItem[]>({
    queryKey: queryKeys.forms,
    queryFn: async () => {
      const res = await fetch("/api/forms");
      if (!res.ok) throw new Error("Failed to load forms");
      return res.json();
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete form");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms });
    },
  });
}
