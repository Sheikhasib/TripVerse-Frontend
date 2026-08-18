"use client"

import { useDashboardOverview } from "@/hooks/use-dashboard-overview"
import { RouteLoading } from "@/components/shared/route-loading"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ChartCard } from "@/components/charts/chart-card"
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart"
import { StatusDonutChart } from "@/components/charts/status-donut-chart"
import { CategoryBarChart } from "@/components/charts/category-bar-chart"
import { UsersByRoleChart } from "@/components/charts/users-by-role-chart"

export default function AdminDashboardPage() {
  const { data: overview, isLoading: isOverviewLoading } =
    useDashboardOverview("admin")

  if (isOverviewLoading) return <RouteLoading />

  const chartsLoading = isOverviewLoading
  const revenueOverTime = overview?.revenueOverTime ?? []
  const bookingsByStatus = overview?.bookingsByStatus ?? []
  const packagesByCategory = overview?.packagesByCategory ?? []
  const usersByRole = overview?.usersByRole ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the platform — users, packages, bookings, and analytics.
        </p>
      </div>

      <QuickActions />

      <OverviewCards
        overview={overview}
        isLoading={isOverviewLoading}
        role="admin"
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
          description="Bookings per status"
          loading={chartsLoading}
          empty={bookingsByStatus.length === 0}
        >
          <StatusDonutChart data={bookingsByStatus} />
        </ChartCard>

        <ChartCard
          title="Packages by Category"
          description="Listings per category"
          loading={chartsLoading}
          empty={packagesByCategory.length === 0}
        >
          <CategoryBarChart data={packagesByCategory} />
        </ChartCard>

        <ChartCard
          title="Users by Role"
          description="Registered users per role"
          loading={chartsLoading}
          empty={usersByRole.length === 0}
        >
          <UsersByRoleChart data={usersByRole} />
        </ChartCard>
      </div>
    </div>
  )
}
