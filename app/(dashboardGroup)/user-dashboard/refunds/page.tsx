"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowsCounterClockwise } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { refundsApi, REFUND_CATEGORY_LABELS } from "@/lib/api/refunds"
import type { TRefundRequestStatus } from "@/lib/api/refunds"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { RouteLoading } from "@/components/shared/route-loading"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { RefundStatusBadge } from "@/components/refund/refund-status-badge"
import { formatBDT, formatDate } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 10

const FILTERS: { value: TRefundRequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REFUNDED", label: "Refunded" },
]

export default function UserRefundsPage() {
  const [status, setStatus] = useState<TRefundRequestStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-refunds", status, page],
    queryFn: () =>
      refundsApi.getMyRefundRequests({
        page,
        limit: PAGE_SIZE,
        status: status === "ALL" ? undefined : status,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    retry: false,
  })

  if (isLoading) return <RouteLoading />

  if (error) {
    return (
      <EmptyState
        icon={<ArrowsCounterClockwise size={40} />}
        title="Couldn't load refund requests"
        description={
          error instanceof ApiError ? error.message : "Something went wrong."
        }
        action={
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  const requests = data?.data ?? []

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<ArrowsCounterClockwise size={40} />}
        title="No refund requests yet"
        description="Refund applications for your bookings will appear here."
        action={
          <Button asChild>
            <Link href="/user-dashboard/bookings">Go to bookings</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Refund requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track the status of your refund applications.
        </p>
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

      <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Snapshot</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {request.booking.package.images?.[0] && (
                      <Image
                        src={request.booking.package.images[0]}
                        alt={request.booking.package.title}
                        width={48}
                        height={36}
                        className="h-9 w-12 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/packages/${request.booking.package.slug}`}
                        className="max-w-[200px] truncate font-medium transition-colors hover:text-primary"
                      >
                        {request.booking.package.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {request.booking.package.location}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {REFUND_CATEGORY_LABELS[request.category]}
                </TableCell>
                <TableCell>
                  <RefundStatusBadge status={request.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {request.daysBeforeTravel}d · {request.suggestedPercentage}%
                </TableCell>
                <TableCell className="tabular-nums">
                  {request.refundAmount != null ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatBDT(Number(request.refundAmount))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(request.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/user-dashboard/bookings/${request.bookingId}`}
                    >
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  )
}
