"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { bookingsApi, type TBooking } from "@/lib/api/bookings"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { Receipt, CreditCard } from "@phosphor-icons/react"
import { formatBDT } from "@/lib/format"

type PaymentOutcomeProps = { booking: TBooking }

const STATUS_TEXT: Record<string, string> = {
  SUCCESS: "Payment successful",
  FAILED: "Payment failed",
  CANCELLED: "Payment cancelled",
  INITIATED: "Payment in progress",
  REFUNDED: "Payment refunded",
}

function PaymentSuccessPage({ booking }: PaymentOutcomeProps) {
  const payments = booking.payments ?? []

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={40} />}
        title="No payment receipt"
        description="No payment record found for this booking."
        action={
          <Button asChild>
            <Link href="/user-dashboard/bookings">Back to bookings</Link>
          </Button>
        }
      />
    )
  }

  const payment = payments[payments.length - 1]

  return (
    <div className="space-y-6 rounded-lg bg-card p-6">
      <Link
        href="/user-dashboard/bookings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        ← Back to bookings
      </Link>

      <div>
        <h3 className="text-xl font-bold">Payment received</h3>
        <p className="text-sm text-muted-foreground">Booking #{booking.id}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-2xl font-bold tabular-nums">
            {formatBDT(Number(payment.amount))}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Transaction ID</p>
          <p className="text-2xl font-bold">{payment.tranId}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Payment status</p>
        <span className="font-medium capitalize text-primary">
          {STATUS_TEXT[payment.status] ?? payment.status}
        </span>
      </div>

      {payment.status === "SUCCESS" && payment.valId && (
        <div>
          <p className="text-sm text-muted-foreground">Authorization ID</p>
          <p className="text-2xl font-bold">{payment.valId}</p>
        </div>
      )}

      {payment.status === "SUCCESS" && payment.cardType && (
        <div>
          <p className="text-sm text-muted-foreground">Card type</p>
          <p className="text-2xl font-bold">{payment.cardType}</p>
        </div>
      )}

      {payment.status === "SUCCESS" && payment.bankTranId && (
        <div>
          <p className="text-sm text-muted-foreground">Bank transaction ID</p>
          <p className="text-2xl font-bold">{payment.bankTranId}</p>
        </div>
      )}

      {payment.status === "SUCCESS" && payment.paidAt && (
        <div>
          <p className="text-sm text-muted-foreground">Paid at</p>
          <p className="text-2xl font-bold">{payment.paidAt}</p>
        </div>
      )}

      <div>
        <p className="text-sm text-muted-foreground">Booking reference</p>
        <p className="font-medium">
          <Link href={`/user-dashboard/bookings/${booking.id}`}>
            {booking.id}
          </Link>
        </p>
      </div>
    </div>
  )
}

function PaymentFailPage({ booking }: PaymentOutcomeProps) {
  return (
    <div className="space-y-4 rounded-lg bg-card p-6">
      <h3 className="text-lg font-semibold">Payment failed</h3>
      <p className="text-sm text-muted-foreground">
        The payment failed. Your booking remains <strong>{booking.status}</strong>.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/user-dashboard/bookings/${booking.id}`}>
            Retry payment
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/user-dashboard/bookings">Go back to bookings</Link>
        </Button>
      </div>
    </div>
  )
}

function tryParseJSON(text: string): { bookingId?: string } | null {
  try {
    return JSON.parse(text) as { bookingId?: string }
  } catch {
    return null
  }
}

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>()

  const activePayment =
    typeof window !== "undefined"
      ? window.localStorage.getItem("tv-active-payment")
      : null
  const parsed = activePayment ? tryParseJSON(activePayment) : null

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.getBookingById(bookingId),
    enabled: Boolean(bookingId),
  })

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Skeleton className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!booking) {
    return (
      <EmptyState
        icon={<CreditCard size={40} />}
        title="Booking not found"
        description="This booking doesn't exist."
        action={
          <Button asChild>
            <Link href="/user-dashboard/bookings">Back to bookings</Link>
          </Button>
        }
      />
    )
  }

  if (
    parsed &&
    parsed.bookingId === bookingId &&
    !(booking.payments ?? []).some((p) => p.status === "SUCCESS")
  ) {
    return (
      <div className="space-y-4 rounded-lg bg-card p-6">
        <h3 className="text-lg font-semibold">Continue your payment</h3>
        <p className="text-sm text-muted-foreground">
          It looks like you have an active payment session. Would you like to
          continue?
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              window.localStorage.removeItem("tv-active-payment")
              window.location.href = `/payment/success?bookingId=${bookingId}`
            }}
          >
            Continue
          </Button>
          <Button
            variant="outline"
            onClick={() => window.localStorage.removeItem("tv-active-payment")}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const payments = booking.payments ?? []
  const hasSuccessPayment = payments.some((p) => p.status === "SUCCESS")
  const hasFailedPayment = payments.some((p) => p.status === "FAILED")

  if (hasSuccessPayment) {
    return <PaymentSuccessPage booking={booking} />
  }

  if (hasFailedPayment) {
    return <PaymentFailPage booking={booking} />
  }

  return (
    <div className="space-y-4 rounded-lg bg-card p-6">
      <h3 className="text-lg font-semibold">Payment information</h3>
      <p className="text-sm text-muted-foreground">
        No completed payment found for this booking.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            window.location.href = `/payment/success?bookingId=${bookingId}`
          }}
        >
          Mark as paid (if payment completed externally)
        </Button>
        {booking.status === "PENDING" && (
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = `/payment/success?bookingId=${bookingId}`
            }}
          >
            Pay now
          </Button>
        )}
      </div>
    </div>
  )
}
