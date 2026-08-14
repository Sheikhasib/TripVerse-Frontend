"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { TRevenuePoint } from "@/lib/api/dashboard"
import { formatBDT } from "@/lib/format"
import { useChartTokens } from "./use-chart-tokens"

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
}

export function RevenueAreaChart({
  data,
  label = "Revenue",
}: {
  data: TRevenuePoint[]
  label?: string
}) {
  const tokens = useChartTokens()
  const color = tokens["--color-primary"] || "currentColor"

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => String(value).slice(5)}
          stroke="currentColor"
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => formatBDT(Number(value))}
          stroke="currentColor"
          className="text-muted-foreground"
          width={90}
        />
        <Tooltip
          formatter={(value) => [formatBDT(Number(value)), label]}
          labelFormatter={(label) => String(label)}
          contentStyle={tooltipStyle}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={color}
          strokeWidth={2}
          fill="url(#revenue-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}