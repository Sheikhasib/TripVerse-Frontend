"use client"

import type { TUsersByRole } from "@/lib/api/dashboard"
import { TokenBarChart } from "./token-bar-chart"

export function UsersByRoleChart({ data }: { data: TUsersByRole[] }) {
  return <TokenBarChart data={data} dataKey="count" nameKey="role" />
}