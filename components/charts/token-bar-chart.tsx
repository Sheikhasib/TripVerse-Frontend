"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useChartColors } from "./use-chart-tokens"

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
}

type Row = { [key: string]: string | number }

interface TokenBarChartProps {
  data: Row[]
  dataKey?: string
  nameKey?: string
}

// Vertical bar chart colored from the theme's chart tokens (per-bar), used for
// any `{ label, count }` shaped breakdown from the dashboard API.
export function TokenBarChart({
  data,
  dataKey = "count",
  nameKey = "name",
}: TokenBarChartProps) {
  const colors = useChartColors()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="stroke-border/60"
        />
        <XAxis
          dataKey={nameKey}
          tick={{ fontSize: 11 }}
          stroke="currentColor"
          className="text-muted-foreground"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          stroke="currentColor"
          className="text-muted-foreground"
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => [value, "Count"]}
          contentStyle={tooltipStyle}
        />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={String(entry[nameKey])}
              fill={colors[index % colors.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}