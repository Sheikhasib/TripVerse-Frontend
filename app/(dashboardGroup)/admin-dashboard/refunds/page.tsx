"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowsCounterClockwise, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { refundsApi, REFUND_CATEGORY_LABELS } from "@/lib/api/refunds"
import type {
  TRefundRequest,
  TRefundRequestStatus,
} from "@/lib/api/refunds"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { RouteLoading } from "@/components/shared/route-loading"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { RefundStatusBadge } from "@/components/refund/refund-status-badge"
import { RefundReviewDialog } from "@/components/refund/refund-review-dialog"
import { formatBDT } from "@/lib/format"
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

export default function AdminRefundsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<TRefundRequestStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<TRefundRequest | null>(
    null,
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-refunds", status, page],
    queryFn: () =>
      refundsApi.getAllRefundRequests({
        page,
        limit: PAGE_SIZE,
        status: status === "ALL" ? undefined : status,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    retry: false,
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => refundsApi.retryRefundPayout(id),
    onSuccess: (result) => {
      if (result.payout?.status === "SUCCESS") {
        toast.success(
          `Payout completed. ${formatBDT(result.payout.refundedTotal)} refunded.`,
        )
      } else if (result.payout?.status === "FAILED") {
        toast.warning(result.payout.message, {
          description:
            "The gateway is still failing — confirm gateway state before retrying soon after a failure.",
        })
      }
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] })
      queryClient.invalidateQueries({
        queryKey: ["booking", result.refundRequest.bookingId],
      })
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["my-refunds"] })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    },
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
        title="No refund requests"
        description="There are no refund applications to review."
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
          Review and decide on customer refund applications.
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
              <TableHead>Applicant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Snapshot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <p className="font-medium">{request.booking.package.title}</p>
                  <p className="text-xs text-muted-foreground">
                    #{request.bookingId.slice(0, 8)}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="whitespace-nowrap">{request.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.user?.email}
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {REFUND_CATEGORY_LABELS[request.category]}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {request.daysBeforeTravel}d · {request.suggestedPercentage}%
                </TableCell>
                <TableCell>
                  <RefundStatusBadge status={request.status} />
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
                <TableCell className="text-right">
                  {request.status === "PENDING" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Review
                    </Button>
                  ) : request.status === "APPROVED" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      disabled={
                        retryMutation.isPending &&
                        retryMutation.variables === request.id
                      }
                      onClick={() => retryMutation.mutate(request.id)}
                    >
                      {retryMutation.isPending &&
                      retryMutation.variables === request.id ? (
                        <Spinner className="size-3.5 animate-spin" />
                      ) : null}
                      Retry payout
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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

      {selectedRequest && (
        <RefundReviewDialog
          request={selectedRequest}
          open={selectedRequest !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedRequest(null)
          }}
        />
      )}
    </div>
  )
}
