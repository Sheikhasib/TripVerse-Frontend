"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { WarningCircle } from "@phosphor-icons/react"
import { bookingsApi } from "@/lib/api/bookings"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const PageSkeleton = () => (
  <div className="w-full space-y-4">
    <Skeleton className="h-24 rounded-xl" />
    <Skeleton className="h-40 rounded-xl" />
  </div>
)

const signInUrl = (bookingId: string) =>
  `/login?redirectTo=${encodeURIComponent(`/payment/fail?bookingId=${bookingId}`)}`

function PaymentFailContent() {
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
        <WarningCircle size={40} className="mx-auto text-muted-foreground/60" />
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
          in to retry the payment.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href={signInUrl(bookingId)}>Sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  const bookingLink = `/user-dashboard/bookings/${bookingId}`

  return (
    <div className="w-full rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <WarningCircle size={40} className="mx-auto text-red-500" />
      <h1 className="mt-4 text-lg font-semibold">Payment failed</h1>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {booking
          ? "Your booking remains PENDING — no money was charged. You can try again."
          : "The payment didn't go through. Your booking remains PENDING."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href={bookingLink}>Retry payment</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/user-dashboard/bookings">Back to bookings</Link>
        </Button>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center px-4 py-10">
      <Suspense fallback={<PageSkeleton />}>
        <PaymentFailContent />
      </Suspense>
    </div>
  )
}