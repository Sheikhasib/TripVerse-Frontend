"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useDashboardOverview } from "@/hooks/use-dashboard-overview"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { Package } from "@phosphor-icons/react"
import { bookingsApi, type TBookingStatus } from "@/lib/api/bookings"
import { packagesApi } from "@/lib/api/packages"
import { BookingTable } from "@/components/dashboard/booking-table"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBDT } from "@/lib/format"

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

  const { data: myPackages, isLoading: packagesLoading } = useQuery({
    queryKey: ["my-packages"],
    queryFn: () => packagesApi.getMyPackages({ limit: 50 }),
    staleTime: 30 * 1000,
  })

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["agent-bookings", status],
    queryFn: () =>
      bookingsApi.getAgentBookings({
        status: status === "ALL" ? undefined : status,
        limit: 50,
      }),
    staleTime: 30 * 1000,
  })

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

      <OverviewCards overview={overview} isLoading={isOverviewLoading} role="agent" />

      <div>
        <h2 className="mb-3 font-medium">My Packages</h2>
        {packagesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : myPackages?.data.length === 0 ? (
          <EmptyState
            icon={<Package size={40} />}
            title="No packages yet"
            description="Create your first package to get started."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myPackages?.data?.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-lg bg-card p-4 ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
              >
                <div className="relative mb-3 h-24 w-32">
                  {pkg.images?.[0] && (
                    <Image
                      src={pkg.images[0]}
                      alt={pkg.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 128px"
                      className="rounded object-cover"
                    />
                  )}
                </div>
                <h3 className="truncate font-medium">{pkg.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {pkg.category?.name}
                </p>
                <p className="text-lg font-bold">{formatBDT(Number(pkg.price))}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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
        bookings={bookings?.data ?? []}
        isLoading={bookingsLoading}
        viewer="agent"
        invalidateKeys={[["agent-bookings"]]}
      />
    </div>
  )
}
