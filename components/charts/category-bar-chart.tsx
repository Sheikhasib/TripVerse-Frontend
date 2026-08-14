"use client"

import type { TPackagesByCategory } from "@/lib/api/dashboard"
import { TokenBarChart } from "./token-bar-chart"

export function CategoryBarChart({ data }: { data: TPackagesByCategory[] }) {
  return <TokenBarChart data={data} dataKey="count" nameKey="category" />
}