"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useDashboardOverview } from "@/hooks/use-dashboard-overview"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { Package, Clock } from "@phosphor-icons/react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { bookingsApi, type TBookingStatus } from "@/lib/api/bookings"
import { packagesApi } from "@/lib/api/packages"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatBDT } from "@/lib/format"

const BOOKING_FILTERS: { value: TBookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(date),
  )

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<TBookingStatus | "ALL">("ALL")

  const { data: overview, isLoading: isOverviewLoading } =
    useDashboardOverview("admin")

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: () => packagesApi.getAllPackages({ limit: 50 }),
    staleTime: 30 * 1000,
  })

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-bookings", status],
    queryFn: () =>
      bookingsApi.getAllBookings({
        status: status === "ALL" ? undefined : status,
        limit: 50,
      }),
    staleTime: 30 * 1000,
  })

  const revenueOverTime = overview?.revenueOverTime ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the platform — users, packages, bookings, and analytics.
        </p>
      </div>

      <OverviewCards overview={overview} isLoading={isOverviewLoading} role="admin" />

      <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/5">
        <h2 className="mb-4 font-medium">Revenue Over Time</h2>
        {revenueOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
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
        ) : (
          <p className="text-sm text-muted-foreground">
            No revenue data available yet.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-medium">Packages Overview</h2>
        {packagesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : packages?.data.length === 0 ? (
          <EmptyState
            icon={<Package size={40} />}
            title="No packages yet"
            description="No packages found."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages?.data?.map((pkg) => (
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

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">Bookings Overview</h2>
          <div className="flex flex-wrap gap-2">
            {BOOKING_FILTERS.map((filter) => (
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
        {bookingsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        ) : bookings?.data.length === 0 ? (
          <EmptyState
            icon={<Clock size={40} />}
            title="No bookings yet"
            description="No bookings found with the current filter."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookings?.data?.map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg bg-card p-4 ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
              >
                <div className="relative mb-3 h-20 w-32">
                  {booking.package.images?.[0] && (
                    <Image
                      src={booking.package.images[0]}
                      alt={booking.package.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 128px"
                      className="rounded object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="truncate font-medium">{booking.package.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.travelers} travelers ·{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(booking.travelDate))}
                  </p>
                </div>
                <p className="mt-1 text-lg font-bold">
                  {formatBDT(Number(booking.totalPrice))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
