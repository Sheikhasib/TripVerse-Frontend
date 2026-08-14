"use client"

import type { ReactNode } from "react"
import { useDashboardOverview } from "@/hooks/use-dashboard-overview"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { ChartBar } from "@phosphor-icons/react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import { formatBDT } from "@/lib/format"

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f50",
  "#a5b4fc",
  "#f472b6",
]

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(date),
  )

function ChartCard({
  title,
  children,
  isEmpty,
}: {
  title: string
  children: ReactNode
  isEmpty?: boolean
}) {
  return (
    <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/5">
      <h2 className="mb-4 font-medium">{title}</h2>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">No data available yet.</p>
      ) : (
        children
      )}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { data: overview, isLoading } = useDashboardOverview("admin")

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-72 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!overview) {
    return (
      <EmptyState
        icon={<ChartBar size={40} />}
        title="No analytics"
        description="Couldn't load analytics data. Try again."
      />
    )
  }

  const revenueOverTime = overview.revenueOverTime ?? []
  const bookingsByStatus = overview.bookingsByStatus ?? []
  const packagesByCategory = overview.packagesByCategory ?? []
  const usersByRole = overview.usersByRole ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide metrics at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue Over Time" isEmpty={revenueOverTime.length === 0}>
          {revenueOverTime.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueOverTime} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis tickFormatter={(value) => formatBDT(Number(value))} width={90} />
                <Tooltip
                  formatter={(value) => formatBDT(Number(value))}
                  labelFormatter={(label) => formatDate(String(label))}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Bookings by Status" isEmpty={bookingsByStatus.length === 0}>
          {bookingsByStatus.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bookingsByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {bookingsByStatus.map((entry, index) => (
                    <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Packages by Category" isEmpty={packagesByCategory.length === 0}>
          {packagesByCategory.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={packagesByCategory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {packagesByCategory.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Users by Role" isEmpty={usersByRole.length === 0}>
          {usersByRole.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={usersByRole} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="role" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {usersByRole.map((entry, index) => (
                    <Cell key={entry.role} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}