"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { BookingStatusBadge } from "@/components/dashboard/booking-status-badge"
import { formatBDT } from "@/lib/format"
import type { TBookingStatus } from "@/lib/api/bookings"
import type { TDashboardRole, TDashboardView } from "@/lib/api/dashboard"

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

function Breakdown({
  title,
  items,
  renderLabel,
}: {
  title: string
  items: { label: string; count: number }[]
  renderLabel?: (label: string) => ReactNode
}) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm"
          >
            {renderLabel ? renderLabel(item.label) : item.label}
            <span className="font-semibold tabular-nums">{item.count}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function UpcomingList({
  upcoming,
}: {
  upcoming: NonNullable<TDashboardView["upcoming"]>
}) {
  return (
    <ul className="space-y-2">
      {upcoming.map((booking) => (
        <li key={booking.id}>
          <Link
            href={`/user-dashboard/bookings/${booking.id}`}
            className="block cursor-pointer rounded-lg border border-border bg-card p-3 transition-colors duration-200 hover:border-primary/40"
          >
            <p className="truncate text-sm font-medium">{booking.package.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
              }).format(new Date(booking.travelDate))}{" "}
              · {booking.travelers} travelers
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatBDT(Number(booking.totalPrice))}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

type OverviewCardsProps = {
  overview: TDashboardView | null | undefined
  isLoading: boolean
  role: TDashboardRole
}

export function OverviewCards({
  overview,
  isLoading,
  role,
}: OverviewCardsProps) {
  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg bg-card p-4 ring-1 ring-foreground/5"
          >
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (role === "user") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Bookings" value={overview.bookings ?? 0} />
        <StatCard label="Total Spend" value={formatBDT(overview.totalSpend ?? 0)} />
        <StatCard label="Upcoming Trips" value={overview.upcomingCount ?? 0} />
        {overview.upcoming && overview.upcoming.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Next up
            </h3>
            <UpcomingList upcoming={overview.upcoming} />
          </div>
        )}
      </div>
    )
  }

  if (role === "agent") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="My Packages" value={overview.packages ?? 0} />
        <StatCard label="Bookings" value={overview.bookings ?? 0} />
        <StatCard label="Revenue" value={formatBDT(overview.revenue ?? 0)} />
        <StatCard label="Average Rating" value={overview.averageRating ?? 0} />
        {(overview.bookingsByStatus?.length ?? 0) > 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Breakdown
              title="Bookings by status"
              items={(overview.bookingsByStatus ?? []).map((item) => ({
                label: item.status,
                count: item.count,
              }))}
              renderLabel={(label) => (
                <BookingStatusBadge status={label as TBookingStatus} />
              )}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Total Users" value={overview.users ?? 0} />
      <StatCard label="Total Packages" value={overview.packages ?? 0} />
      <StatCard label="Bookings" value={overview.bookings ?? 0} />
      <StatCard label="Revenue" value={formatBDT(overview.revenue ?? 0)} />
      {(overview.usersByRole?.length ?? 0) > 0 && (
        <div className="sm:col-span-2 lg:col-span-3">
          <Breakdown
            title="Users by role"
            items={(overview.usersByRole ?? []).map((item) => ({
              label: item.role,
              count: item.count,
            }))}
          />
        </div>
      )}
      {(overview.packagesByCategory?.length ?? 0) > 0 && (
        <div className="sm:col-span-2 lg:col-span-3">
          <Breakdown
            title="Packages by category"
            items={(overview.packagesByCategory ?? []).map((item) => ({
              label: item.category,
              count: item.count,
            }))}
          />
        </div>
      )}
      {(overview.bookingsByStatus?.length ?? 0) > 0 && (
        <div className="sm:col-span-2 lg:col-span-3">
          <Breakdown
            title="Bookings by status"
            items={(overview.bookingsByStatus ?? []).map((item) => ({
              label: item.status,
              count: item.count,
            }))}
            renderLabel={(label) => (
              <BookingStatusBadge status={label as TBookingStatus} />
            )}
          />
        </div>
      )}
    </div>
  )
}
