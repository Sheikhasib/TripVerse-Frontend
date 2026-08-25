"use client"

import { useState } from "react"
import Image from "next/image"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarMinus,
  Spinner,
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { refundsApi, REFUND_CATEGORY_LABELS } from "@/lib/api/refunds"
import type { TRefundRequest } from "@/lib/api/refunds"
import { refundDecisionSchema } from "@/lib/validations/refund"
import { ApiError } from "@/lib/api/client"
import { formatBDT, formatDateTime } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RefundStatusBadge } from "./refund-status-badge"
import { cn } from "@/lib/utils"

interface RefundReviewDialogProps {
  request: TRefundRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RefundReviewDialog({
  request,
  open,
  onOpenChange,
}: RefundReviewDialogProps) {
  const queryClient = useQueryClient()

  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE")
  const [approvedPct, setApprovedPct] = useState<number | undefined>(
    request.suggestedPercentage,
  )
  const [note, setNote] = useState("")
  const [noteError, setNoteError] = useState("")

  const previewAmount =
    action === "APPROVE" && typeof approvedPct === "number"
      ? Math.round(Number(request.booking.totalPrice) * approvedPct) / 100
      : null

  const switchAction = (next: "APPROVE" | "REJECT") => {
    setAction(next)
    setNoteError("")
    if (next === "APPROVE") {
      setNote("")
    } else {
      setApprovedPct(undefined)
    }
  }

  const reset = () => {
    setAction("APPROVE")
    setApprovedPct(request.suggestedPercentage)
    setNote("")
    setNoteError("")
  }

  const decisionMutation = useMutation({
    mutationFn: () => {
      if (action === "REJECT" && !note.trim()) {
        setNoteError("A review note is required when rejecting.")
        throw new Error("__validation")
      }
      setNoteError("")

      const result = refundDecisionSchema.safeParse({
        action,
        approvedPercentage: action === "APPROVE" ? approvedPct : undefined,
        reviewNote: action === "REJECT" ? note : undefined,
      })
      if (!result.success) {
        const firstIssue = result.error.issues[0]
        throw new Error(
          firstIssue?.message ?? "Please check the form for errors.",
        )
      }

      return refundsApi.decideRefundRequest(request.id, result.data)
    },
    onSuccess: (result) => {
      const refund = result.refundRequest
      if (result.payout?.status === "SUCCESS") {
        toast.success(
          `Refund approved. ${formatBDT(result.payout.refundedTotal)} paid out.`,
        )
      } else if (result.payout?.status === "FAILED") {
        toast.warning(result.payout.message, {
          description:
            "The approval stands — retry the payout from the queue.",
        })
      } else {
        toast.success(
          refund.status === "APPROVED"
            ? "Refund approved."
            : "Refund rejected.",
        )
      }

      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] })
      queryClient.invalidateQueries({
        queryKey: ["booking", request.bookingId],
      })
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["my-refunds"] })

      reset()
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "__validation") return
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle>Review refund application</DialogTitle>
            <RefundStatusBadge status={request.status} />
          </div>
          <DialogDescription>
            {request.user?.name ?? "Customer"} — {request.user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Package</p>
            <p className="text-muted-foreground">
              {request.booking.package.title}
              <span className="mx-1.5 text-border">·</span>
              {formatDateTime(request.booking.travelDate)}
            </p>
          </div>

          <div>
            <p className="font-medium">Reason</p>
            <p className="text-muted-foreground">
              {REFUND_CATEGORY_LABELS[request.category]}
            </p>
          </div>

          <div className="rounded-md bg-muted/40 p-3 leading-relaxed whitespace-pre-line text-muted-foreground">
            {request.reason}
          </div>

          {request.evidenceUrl && (
            <div>
              <p className="mb-1 font-medium">Supporting document</p>
              <div className="relative aspect-video max-w-sm overflow-hidden rounded-md ring-1 ring-foreground/10">
                <Image
                  src={request.evidenceUrl}
                  alt="Supporting document"
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-x-8 gap-y-1 text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <CalendarMinus size={15} className="text-primary" />
              Snapshot at application:
              <span className="tabular-nums text-foreground">
                {request.daysBeforeTravel}d · {request.suggestedPercentage}%
              </span>
            </p>
            <p>
              Booking total:{" "}
              <span className="tabular-nums text-foreground">
                {formatBDT(Number(request.booking.totalPrice))}
              </span>
            </p>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex gap-2">
              {(["APPROVE", "REJECT"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => switchAction(a)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    action === a
                      ? a === "APPROVE"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-destructive bg-destructive text-destructive-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {a === "APPROVE" ? "Approve" : "Reject"}
                </button>
              ))}
            </div>

            {action === "APPROVE" ? (
              <>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Approved percentage (0–100)
                  </p>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={approvedPct ?? ""}
                    onChange={(e) =>
                      setApprovedPct(
                        e.target.value === ""
                          ? undefined
                          : Math.min(100, Math.max(0, Number(e.target.value))),
                      )
                    }
                  />
                </div>
                {previewAmount !== null && previewAmount > 0 && (
                  <p className="tabular-nums text-xs text-muted-foreground">
                    Gateway will pay out:{" "}
                    <span className="font-medium text-foreground">
                      {formatBDT(previewAmount)}
                    </span>
                  </p>
                )}
                {approvedPct !== undefined && approvedPct < request.suggestedPercentage && (
                  <p className="text-xs text-muted-foreground">
                    Approving below the suggested {request.suggestedPercentage}% —
                    admin discretion.
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <Textarea
                  placeholder="Required — explain why the application was rejected"
                  rows={3}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value)
                    if (noteError) setNoteError("")
                  }}
                />
                {noteError && (
                  <p className="text-xs text-destructive">{noteError}</p>
                )}
                <p className="text-xs tabular-nums text-muted-foreground">
                  {(note ?? "").length}/1000
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              className="cursor-pointer"
              disabled={decisionMutation.isPending}
              onClick={() => decisionMutation.mutate()}
            >
              {decisionMutation.isPending ? (
                <Spinner className="size-4 animate-spin" />
              ) : null}
              {decisionMutation.isPending
                ? "Submitting…"
                : action === "APPROVE"
                  ? "Approve refund"
                  : "Reject application"}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
