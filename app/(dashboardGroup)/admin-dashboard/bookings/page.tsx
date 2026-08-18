"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { bookingsApi, type TBookingStatus } from "@/lib/api/bookings"
import { RouteLoading } from "@/components/shared/route-loading"
import { BookingTable } from "@/components/dashboard/booking-table"
import { Pagination } from "@/components/shared/pagination"
import { Input } from "@/components/ui/input"

const PAGE_SIZE = 10

const FILTERS: { value: TBookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function AdminBookingsPage() {
  const [status, setStatus] = useState<TBookingStatus | "ALL">("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", status, search, page],
    queryFn: () =>
      bookingsApi.getAllBookings({
        status: status === "ALL" ? undefined : status,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

  const totalPages = data?.meta?.totalPages ?? 1

  if (isLoading) return <RouteLoading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every order across all agents. Manage confirmations, completions and
          cancellations.
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
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setStatus(filter.value)
                setPage(1)
              }}
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
        viewer="admin"
        invalidateKeys={[["admin-bookings"]]}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}