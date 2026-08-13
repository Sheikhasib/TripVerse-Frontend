"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { bookingsApi, type TBookingStatus } from "@/lib/api/bookings"
import { BookingTable } from "@/components/dashboard/booking-table"
import { Input } from "@/components/ui/input"

const FILTERS: { value: TBookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function AgentBookingsPage() {
  const [status, setStatus] = useState<TBookingStatus | "ALL">("ALL")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["agent-bookings", status, search],
    queryFn: () =>
      bookingsApi.getAgentBookings({
        status: status === "ALL" ? undefined : status,
        search: search || undefined,
        limit: 50,
      }),
    staleTime: 30 * 1000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Orders for your packages. Confirm requests and complete trips once
          the travel date has passed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by package title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
      </div>

      <BookingTable
        bookings={data?.data ?? []}
        isLoading={isLoading}
        viewer="agent"
        invalidateKeys={[["agent-bookings"]]}
      />
    </div>
  )
}