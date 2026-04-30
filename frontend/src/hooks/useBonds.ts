"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { ListBondsResponse, BondStatus } from "@/lib/types";

export function useBonds(
  params: { status?: BondStatus | "all"; limit?: number } = {}
): UseQueryResult<ListBondsResponse, ApiError> {
  return useQuery<ListBondsResponse, ApiError>({
    queryKey: ["bonds", params.status ?? "all", params.limit ?? 50],
    queryFn: () => api.listBonds(params),
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api.health(),
    refetchInterval: 60_000,
  });
}
