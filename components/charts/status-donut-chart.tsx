"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { TBookingsByStatus } from "@/lib/api/dashboard"
import { useChartColors } from "./use-chart-tokens"

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
}

export function StatusDonutChart({ data }: { data: TBookingsByStatus[] }) {
  const colors = useChartColors()
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.status}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight tabular-nums">
            {total}
          </span>
          <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            total
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((entry, index) => (
          <span
            key={entry.status}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            {entry.status}
            <span className="font-semibold text-foreground tabular-nums">
              {entry.count}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}