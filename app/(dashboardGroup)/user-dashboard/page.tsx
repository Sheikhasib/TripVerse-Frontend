"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useDashboardOverview } from "@/hooks/use-dashboard-overview"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { bookingsApi, type TBookingStatus } from "@/lib/api/bookings"
import { BookingTable } from "@/components/dashboard/booking-table"

const FILTERS: { value: TBookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function UserDashboardPage() {
  const [status, setStatus] = useState<TBookingStatus | "ALL">("ALL")

  const { data: overview, isLoading: isOverviewLoading } =
    useDashboardOverview("user")

  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings", status],
    queryFn: () =>
      bookingsApi.getMyBookings(
        status === "ALL" ? { limit: 50 } : { status, limit: 50 },
      ),
    staleTime: 30 * 1000,
  })

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

      <OverviewCards overview={overview} isLoading={isOverviewLoading} role="user" />

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

      <BookingTable
        bookings={data?.data ?? []}
        isLoading={isLoading}
        viewer="user"
        invalidateKeys={[["my-bookings"]]}
      />
    </div>
  )
}
