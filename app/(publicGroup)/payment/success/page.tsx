"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle, ArrowLeft } from "@phosphor-icons/react"
import { bookingsApi } from "@/lib/api/bookings"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { RouteLoading } from "@/components/shared/route-loading"
import { PaymentReceipt } from "@/components/payment/payment-receipt"

const PageSkeleton = () => <RouteLoading className="min-h-[40vh]" />

const signInUrl = (bookingId: string) =>
  `/login?redirectTo=${encodeURIComponent(
    `/payment/success?bookingId=${bookingId}`,
  )}`

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")

  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.getBookingById(bookingId as string),
    enabled: Boolean(bookingId),
    retry: false,
  })

  if (!bookingId) {
    return (
      <div className="w-full rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <CheckCircle size={40} className="mx-auto text-muted-foreground/60" />
        <h1 className="mt-4 text-lg font-semibold">No booking reference</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t find a booking id in the payment redirect. Check your
          bookings for the payment status.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/user-dashboard/bookings">View my bookings</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error instanceof ApiError && error.statusCode === 401) {
    return (
      <div className="w-full rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold">Sign in to continue</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Your session expired while you were at the payment gateway. Sign back
          in to see the payment status.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href={signInUrl(bookingId)}>Sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="w-full rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <h1 className="text-lg font-semibold">Booking not found</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          This booking doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/user-dashboard/bookings">Back to bookings</Link>
          </Button>
        </div>
      </div>
    )
  }

  const successPayment = booking.payments?.find(
    (payment) => payment.status === "SUCCESS",
  )

  if (booking.status === "PAID" && successPayment) {
    return (
      <div className="w-full space-y-6">
        <Button asChild variant="ghost" className="-mx-3 w-fit px-3 text-muted-foreground">
          <Link href="/user-dashboard/bookings">
            <ArrowLeft size={15} className="text-primary" />
            Back to bookings
          </Link>
        </Button>
        <PaymentReceipt payment={successPayment} booking={booking} />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/user-dashboard/bookings">View my bookings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/user-dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">Not paid yet</h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        This booking is still pending payment. You can retry from the booking
        detail page.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href={`/user-dashboard/bookings/${bookingId}`}>
            Go to booking
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  )
}