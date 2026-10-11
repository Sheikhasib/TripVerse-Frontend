"use client"

import { useState } from "react"
import Image from "next/image"
import { CalendarMinus, FileText, Receipt } from "@phosphor-icons/react"
import {
  REFUND_CATEGORY_LABELS,
  type TRefundRequest,
} from "@/lib/api/refunds"
import { formatBDT, formatDateTime } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefundStatusBadge } from "./refund-status-badge"

interface RefundRequestCardProps {
  request: TRefundRequest
}

export function RefundRequestCard({ request }: RefundRequestCardProps) {
  const [imgError, setImgError] = useState(false)
  const reviewed = request.reviewedAt != null

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText size={17} className="text-primary" />
            Refund application
            <span className="text-sm font-normal text-muted-foreground">
              {formatDateTime(request.createdAt)}
            </span>
          </CardTitle>
          <RefundStatusBadge status={request.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Category: </span>
            <span className="font-medium text-foreground">
              {REFUND_CATEGORY_LABELS[request.category]}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarMinus size={15} className="text-primary" />
            Snapshot at time of application:
            <span className="font-medium tabular-nums text-foreground">
              {request.daysBeforeTravel}d · {request.suggestedPercentage}%
            </span>
          </p>
        </div>

        <div>
          <p className="mb-1 font-medium">Reason</p>
          <p className="rounded-md bg-muted/40 p-3 leading-relaxed whitespace-pre-line text-muted-foreground">
            {request.reason}
          </p>
        </div>

        {request.evidenceUrl && !imgError && (
          <div>
            <p className="mb-1 font-medium">Supporting document</p>
            <div className="relative aspect-video max-w-md overflow-hidden rounded-md ring-1 ring-foreground/10">
              <Image
                src={request.evidenceUrl}
                alt="Supporting document"
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          </div>
        )}

        {reviewed ? (
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">Decision</p>
              <p className="text-xs text-muted-foreground">
                {request.reviewer?.name
                  ? `by ${request.reviewer.name} · `
                  : ""}
                {formatDateTime(request.reviewedAt as string)}
              </p>
            </div>
            {request.status === "REJECTED" ? (
              <p className="leading-relaxed text-muted-foreground">
                &ldquo;{request.reviewNote}&rdquo;
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Approved refund:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {request.approvedPercentage}% ·{" "}
                    {formatBDT(Number(request.refundAmount ?? 0))}
                  </span>
                </p>
                {request.status === "APPROVED" && (
                  <p className="text-xs text-muted-foreground">
                    Payout in progress — refunded amounts appear here once the
                    gateway confirms.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Receipt size={14} />
            Under review — we&apos;ll update you within 5 business days.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
