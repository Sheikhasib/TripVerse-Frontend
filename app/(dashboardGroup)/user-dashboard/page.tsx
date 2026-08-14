"use client"

import { useDashboardOverview } from "@/hooks/use-dashboard-overview"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ChartCard } from "@/components/charts/chart-card"
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart"
import { StatusDonutChart } from "@/components/charts/status-donut-chart"

export default function UserDashboardPage() {
  const { data: overview, isLoading: isOverviewLoading } =
    useDashboardOverview("user")

  const chartsLoading = isOverviewLoading
  const revenueOverTime = overview?.revenueOverTime ?? []
  const bookingsByStatus = overview?.bookingsByStatus ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your trips and bookings all in one place.
        </p>
      </div>

      <QuickActions />

      <OverviewCards
        overview={overview}
        isLoading={isOverviewLoading}
        role="user"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="My Spending"
          description="Paid bookings, last 30 days"
          loading={chartsLoading}
          empty={revenueOverTime.length === 0}
        >
          <RevenueAreaChart data={revenueOverTime} label="Spending" />
        </ChartCard>

        <ChartCard
          title="Bookings by Status"
          description="Breakdown of your bookings"
          loading={chartsLoading}
          empty={bookingsByStatus.length === 0}
        >
          <StatusDonutChart data={bookingsByStatus} />
        </ChartCard>
      </div>
    </div>
  )
}
