"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarCheck,
  Compass,
  CurrencyCircleDollar,
  Package,
  Receipt,
  Star,
  TrendDown,
  TrendUp,
  Users,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { BookingStatusBadge } from "@/components/dashboard/booking-status-badge"
import { TripJourney } from "@/components/dashboard/trip-journey"
import { formatBDT } from "@/lib/format"
import type { TBookingStatus } from "@/lib/api/bookings"
import type {
  TDashboardRole,
  TDashboardView,
  TRevenuePoint,
} from "@/lib/api/dashboard"

type StatDef = {
  label: string
  href: string
  icon: Icon
  value: ReactNode
  trend?: number | null
}

const computeTrend = (series: TRevenuePoint[] | undefined): number | null => {
  if (!series || series.length < 8) return null
  const window = Math.min(7, Math.floor(series.length / 2))
  const sum = (rows: TRevenuePoint[]) =>
    rows.reduce((acc, row) => acc + row.revenue, 0)
  const recent = sum(series.slice(-window))
  const previous = sum(series.slice(-window * 2, -window))
  if (previous <= 0) return null
  return ((recent - previous) / previous) * 100
}

function TrendChip({ trend }: { trend?: number | null }) {
  if (trend === undefined || trend === null) return null
  const up = trend >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        up
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {up ? <TrendUp className="size-3" /> : <TrendDown className="size-3" />}
      {Math.abs(trend).toFixed(1)}%
    </span>
  )
}

function StatLinkCard({ label, href, icon: Icon, value, trend }: StatDef) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" weight="fill" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums">
            {value}
          </span>
          {trend !== undefined && <TrendChip trend={trend} />}
        </span>
        <span className="mt-0.5 block text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

function StatsGrid({ stats }: { stats: StatDef[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatLinkCard key={stat.label} {...stat} />
      ))}
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
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {upcoming.map((booking) => (
        <Link
          key={booking.id}
          href={`/user-dashboard/bookings/${booking.id}`}
          className="group block space-y-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <p className="truncate text-sm font-medium">{booking.package.title}</p>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(booking.travelDate))}{" "}
            · {booking.travelers} travelers
          </p>
          <TripJourney status={booking.status} />
          <p className="text-base font-semibold">
            {formatBDT(Number(booking.totalPrice))}
          </p>
        </Link>
      ))}
    </div>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <Skeleton className="mb-3 size-11 rounded-md" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
    )
  }

  if (role === "user") {
    const stats: StatDef[] = [
      {
        label: "Total Bookings",
        href: "/user-dashboard/bookings",
        icon: Receipt,
        value: overview.bookings ?? 0,
      },
      {
        label: "Total Spend",
        href: "/user-dashboard/payments",
        icon: CurrencyCircleDollar,
        value: formatBDT(overview.totalSpend ?? 0),
      },
      {
        label: "Upcoming Trips",
        href: "/user-dashboard/bookings",
        icon: CalendarCheck,
        value: overview.upcomingCount ?? 0,
      },
      {
        label: "Browse Trips",
        href: "/packages",
        icon: Compass,
        value: "Explore",
      },
    ]
    return (
      <div className="space-y-6">
        <StatsGrid stats={stats} />
        {(overview.upcoming?.length ?? 0) > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Next up
            </h3>
            <UpcomingList upcoming={overview.upcoming!} />
          </div>
        )}
      </div>
    )
  }

  const trend = computeTrend(overview.revenueOverTime)

  if (role === "agent") {
    const stats: StatDef[] = [
      {
        label: "My Packages",
        href: "/agent-dashboard/my-packages",
        icon: Package,
        value: overview.packages ?? 0,
      },
      {
        label: "Bookings",
        href: "/agent-dashboard/bookings",
        icon: Receipt,
        value: overview.bookings ?? 0,
      },
      {
        label: "Revenue",
        href: "/agent-dashboard/bookings",
        icon: CurrencyCircleDollar,
        value: formatBDT(overview.revenue ?? 0),
        trend,
      },
      {
        label: "Average Rating",
        href: "/agent-dashboard/my-packages",
        icon: Star,
        value: (overview.averageRating ?? 0).toFixed(1),
      },
    ]
    return (
      <div className="space-y-6">
        <StatsGrid stats={stats} />
        {(overview.bookingsByStatus?.length ?? 0) > 0 && (
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
        )}
      </div>
    )
  }

  const stats: StatDef[] = [
    {
      label: "Total Users",
      href: "/admin-dashboard/users",
      icon: Users,
      value: overview.users ?? 0,
    },
    {
      label: "Total Packages",
      href: "/admin-dashboard/packages",
      icon: Package,
      value: overview.packages ?? 0,
    },
    {
      label: "Bookings",
      href: "/admin-dashboard/bookings",
      icon: Receipt,
      value: overview.bookings ?? 0,
    },
    {
      label: "Revenue",
      href: "/admin-dashboard/analytics",
      icon: CurrencyCircleDollar,
      value: formatBDT(overview.revenue ?? 0),
      trend,
    },
  ]

  return (
    <div className="space-y-6">
      <StatsGrid stats={stats} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(overview.usersByRole?.length ?? 0) > 0 && (
          <Breakdown
            title="Users by role"
            items={(overview.usersByRole ?? []).map((item) => ({
              label: item.role,
              count: item.count,
            }))}
          />
        )}
        {(overview.packagesByCategory?.length ?? 0) > 0 && (
          <Breakdown
            title="Packages by category"
            items={(overview.packagesByCategory ?? []).map((item) => ({
              label: item.category,
              count: item.count,
            }))}
          />
        )}
        {(overview.bookingsByStatus?.length ?? 0) > 0 && (
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
        )}
      </div>
    </div>
  )
}