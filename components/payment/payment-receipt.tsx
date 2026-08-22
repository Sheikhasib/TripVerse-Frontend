"use client"

import Link from "next/link"
import {
  ArrowClockwise,
  CalendarBlank,
  CheckCircle,
  MapPin,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { formatBDT, formatDate } from "@/lib/format"
import { PaymentStatusBadge } from "./payment-status-badge"
import type { TBooking, TPayment } from "@/lib/api/bookings"

interface PaymentReceiptProps {
  payment: TPayment
  booking: TBooking
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-right text-sm font-medium tabular-nums break-all">
      {value}
    </p>
  </div>
)

export function PaymentReceipt({ payment, booking }: PaymentReceiptProps) {
  const isRefunded = payment.status === "REFUNDED"
  const isRefundPending =
    payment.status === "SUCCESS" &&
    Boolean(payment.refundInitiatedAt) &&
    !payment.refundCompletedAt

  return (
    <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5">
      <div
        className={cn(
          "border-b px-6 py-5",
          isRefunded ? "border-border bg-blue-500/10" : "border-border bg-emerald-500/10",
        )}
      >
        <div className="flex items-center gap-3">
          {isRefunded ? (
            <ArrowClockwise size={22} className="text-blue-600" />
          ) : (
            <CheckCircle size={22} className="text-emerald-600" />
          )}
          <div>
            <h2 className="text-lg font-semibold">
              {isRefunded ? "Refund issued" : "Payment received"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRefunded
                ? "This payment has been returned to your original payment method."
                : "The agent will confirm your booking shortly."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {isRefunded ? "Amount refunded" : "Amount paid"}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {formatBDT(Number(payment.amount))}
          </p>
        </div>

        <div className="h-px bg-border" />

        <DetailRow label="Transaction ID" value={payment.tranId} />
        {payment.valId && (
          <DetailRow label="Authorization ID" value={payment.valId} />
        )}
        {payment.cardType && (
          <DetailRow label="Card type" value={payment.cardType} />
        )}
        {payment.bankTranId && (
          <DetailRow label="Bank transaction ID" value={payment.bankTranId} />
        )}
        {payment.paidAt && (
          <DetailRow label="Paid at" value={formatDate(payment.paidAt)} />
        )}
        {isRefunded && payment.refundCompletedAt && (
          <DetailRow
            label="Refunded at"
            value={formatDate(payment.refundCompletedAt)}
          />
        )}
        {isRefunded && payment.refundRefId && (
          <DetailRow label="Refund reference" value={payment.refundRefId} />
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Payment status</p>
          <PaymentStatusBadge status={payment.status} />
        </div>

        {isRefundPending && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowClockwise size={14} className="shrink-0" />
            Refund pending — support will follow up.
          </p>
        )}

        <div className="h-px bg-border" />

        <div>
          <p className="text-sm text-muted-foreground">Booking reference</p>
          <Link
            href={`/user-dashboard/bookings/${booking.id}`}
            className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary"
          >
            #{booking.id}
          </Link>
          <div className="mt-2 space-y-1 text-sm">
            <p className="font-medium">{booking.package.title}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin size={14} />
              {booking.package.location}
            </p>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarBlank size={14} />
              {formatDate(booking.travelDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}