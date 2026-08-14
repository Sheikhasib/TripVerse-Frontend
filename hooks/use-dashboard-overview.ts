"use client"

import { useQuery } from "@tanstack/react-query"
import { dashboardApi, type TDashboardRole, type TDashboardView } from "@/lib/api/dashboard"

export const useDashboardOverview = (role: TDashboardRole) =>
  useQuery<TDashboardView>({
    queryKey: ["dashboard-overview", role],
    queryFn: () => dashboardApi.getOverview(role),
    staleTime: 30 * 1000,
  })
