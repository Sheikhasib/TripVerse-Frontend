"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarBlank,
  FileText,
  HandCoins,
  MapPin,
  Receipt,
  Ticket,
  Users,
  X,
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { bookingsApi } from "@/lib/api/bookings"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { RouteLoading } from "@/components/shared/route-loading"
import { EmptyState } from "@/components/shared/empty-state"
import { GoBack } from "@/components/shared/go-back"
import { BookingStatusBadge } from "@/components/dashboard/booking-status-badge"
import { PayNowButton } from "@/components/payment/pay-now-button"
import { PaymentAttempts } from "@/components/payment/payment-attempts"
import { PaymentReceipt } from "@/components/payment/payment-receipt"
import { RefundRequestDialog } from "@/components/refund/refund-request-form"
import { RefundRequestCard } from "@/components/refund/refund-request-card"
import { formatBDT, formatDate } from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function UserBookingDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const queryClient = useQueryClient()
  const [applyOpen, setApplyOpen] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingsApi.getBookingById(id),
    enabled: Boolean(id),
  })

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.updateBookingStatus(id, "CANCELLED"),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] })
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
      if (!updatedBooking.refund) {
        toast.success("Booking cancelled.")
      } else if (updatedBooking.refund.status === "SUCCESS") {
        toast.success(
          `Booking cancelled. Refund of ${formatBDT(Number(updatedBooking.totalPrice))} is on its way.`,
        )
      } else {
        toast.warning(updatedBooking.refund.message, {
          description:
            "The cancellation is complete; we'll follow up on the refund.",
        })
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    },
  })

  if (isLoading) {
    return <RouteLoading />
  }

  if (!booking) {
    return (
      <EmptyState
        icon={<Ticket size={40} />}
        title="Booking not found"
        description="This booking doesn't exist or you don't have access to it."
        action={
          <Button asChild variant="outline">
            <Link href="/user-dashboard/bookings">Back to bookings</Link>
          </Button>
        }
      />
    )
  }

  // Paid bookings can't be cancelled by the customer (server 403s the
  // transition) — money is committed; they apply for a refund instead.
  const cancellable = booking.status === "PENDING"
  const refundable =
    booking.status === "PAID" || booking.status === "CONFIRMED"
  const hasLiveRefundRequest =
    booking.refundRequests?.some(
      (request) => request.status !== "REJECTED",
    ) ?? false

  const terminalPayment =
    booking.payments?.find((payment) => payment.status === "SUCCESS") ??
    booking.payments?.find((payment) => payment.status === "REFUNDED")

  return (
    <div className="space-y-6">
      <GoBack href="/user-dashboard/bookings" label="Back to bookings" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Booking details
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDate(booking.createdAt)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {booking.package.images?.[0] && (
                <Image
                  src={booking.package.images[0]}
                  alt={booking.package.title}
                  width={56}
                  height={42}
                  className="h-11 w-14 rounded object-cover"
                />
              )}
              <Link
                href={`/packages/${booking.package.slug}`}
                className="transition-colors hover:text-primary"
              >
                {booking.package.title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={15} className="text-primary" />
              {booking.package.location}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Travel date
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-medium">
                  <CalendarBlank size={15} className="text-primary" />
                  {formatDate(booking.travelDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Travelers
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-medium">
                  <Users size={15} className="text-primary" />
                  {booking.travelers}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Total price
                </p>
                <p className="mt-1 font-semibold tabular-nums">
                  {formatBDT(Number(booking.totalPrice))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PayNowButton booking={booking} />
            {cancellable ? (
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  <X />
                  {cancelMutation.isPending ? "Cancelling…" : "Cancel booking"}
                </Button>
              </motion.div>
            ) : refundable ? (
              hasLiveRefundRequest ? (
                <p className="text-sm text-muted-foreground">
                  A refund application for this booking is under review.
                </p>
              ) : (
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full"
                    onClick={() => setApplyOpen(true)}
                  >
                    <HandCoins />
                    Apply for refund
                  </Button>
                </motion.div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                This booking can&apos;t be cancelled.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Receipt size={18} className="text-primary" />
          Payment
        </h2>
        {terminalPayment && (
          <PaymentReceipt payment={terminalPayment} booking={booking} />
        )}
        <PaymentAttempts
          payments={booking.payments ?? []}
          isLoading={isLoading}
        />
      </section>

      {(booking.refundRequests?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <FileText size={18} className="text-primary" />
            Refund requests
          </h2>
          {booking.refundRequests?.map((request) => (
            <RefundRequestCard key={request.id} request={request} />
          ))}
        </section>
      )}

      {refundable && !hasLiveRefundRequest && (
        <RefundRequestDialog
          bookingId={booking.id}
          travelDate={booking.travelDate}
          totalPrice={Number(booking.totalPrice)}
          open={applyOpen}
          onOpenChange={setApplyOpen}
        />
      )}
    </div>
  )
}