"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useDashboardOverview } from "@/hooks/use-dashboard-overview"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { BookingTable } from "@/components/dashboard/booking-table"
import { ChartCard } from "@/components/charts/chart-card"
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart"
import { StatusDonutChart } from "@/components/charts/status-donut-chart"
import { bookingsApi, type TBookingStatus } from "@/lib/api/bookings"

const FILTERS: { value: TBookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function AgentDashboardPage() {
  const [status, setStatus] = useState<TBookingStatus | "ALL">("ALL")

  const { data: overview, isLoading: isOverviewLoading } =
    useDashboardOverview("agent")

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["agent-bookings", status],
    queryFn: () =>
      bookingsApi.getAgentBookings({
        status: status === "ALL" ? undefined : status,
        limit: 50,
      }),
    staleTime: 30 * 1000,
  })

  const chartsLoading = isOverviewLoading
  const revenueOverTime = overview?.revenueOverTime ?? []
  const bookingsByStatus = overview?.bookingsByStatus ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Manager
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your dashboard — manage packages, bookings, and more.
        </p>
      </div>

      <QuickActions />

      <OverviewCards
        overview={overview}
        isLoading={isOverviewLoading}
        role="agent"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Revenue Over Time"
          description="Paid revenue, last 30 days"
          loading={chartsLoading}
          empty={revenueOverTime.length === 0}
        >
          <RevenueAreaChart data={revenueOverTime} />
        </ChartCard>

        <ChartCard
          title="Bookings by Status"
          description="Bookings on your packages"
          loading={chartsLoading}
          empty={bookingsByStatus.length === 0}
        >
          <StatusDonutChart data={bookingsByStatus} />
        </ChartCard>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">Recent Bookings</h2>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  status === filter.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <BookingTable
          bookings={bookings?.data ?? []}
          isLoading={bookingsLoading}
          viewer="agent"
          invalidateKeys={[["agent-bookings"]]}
        />
      </div>
    </div>
  )
}