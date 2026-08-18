"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { bookingsApi, type TBookingStatus } from "@/lib/api/bookings"
import { RouteLoading } from "@/components/shared/route-loading"
import { BookingTable } from "@/components/dashboard/booking-table"
import { Pagination } from "@/components/shared/pagination"

const PAGE_SIZE = 10

const FILTERS: { value: TBookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function UserBookingsPage() {
  const [status, setStatus] = useState<TBookingStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings", status, page],
    queryFn: () =>
      bookingsApi.getMyBookings(
        status === "ALL" ? { page, limit: PAGE_SIZE } : { status, page, limit: PAGE_SIZE },
      ),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

  const totalPages = data?.meta?.totalPages ?? 1

  if (isLoading) return <RouteLoading />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My bookings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track the trips you&apos;ve booked and their confirmation status.
          </p>
        </div>
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

      <BookingTable
        bookings={data?.data ?? []}
        isLoading={isLoading}
        viewer="user"
        invalidateKeys={[["my-bookings"]]}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
