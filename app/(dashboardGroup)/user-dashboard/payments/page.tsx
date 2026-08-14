"use client"

import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Receipt } from "@phosphor-icons/react"
import { bookingsApi } from "@/lib/api/bookings"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { PaymentStatusBadge } from "@/components/payment/payment-status-badge"
import { formatBDT, formatDate } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function UserPaymentsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => bookingsApi.getMyBookings({ limit: 50 }),
    staleTime: 30 * 1000,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="mb-3 h-14 rounded-md last:mb-0" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={<Receipt size={40} />}
        title="Couldn't load payments"
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

  const bookings = data?.data ?? []

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={40} />}
        title="No payments yet"
        description="Once you pay for a booking, its payment history will show up here."
        action={
          <Button asChild>
            <Link href="/packages">Browse packages</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Payments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment history for your bookings.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid at</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const latest = booking.payments?.[0]
              return (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {booking.package.images?.[0] && (
                        <Image
                          src={booking.package.images[0]}
                          alt={booking.package.title}
                          width={48}
                          height={36}
                          className="h-9 w-12 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/packages/${booking.package.slug}`}
                          className="max-w-[200px] truncate font-medium transition-colors hover:text-primary"
                        >
                          {booking.package.title}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {booking.package.location}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/user-dashboard/bookings/${booking.id}`}
                      className="font-mono text-sm transition-colors hover:text-primary"
                    >
                      #{booking.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {latest?.status === "REFUNDED" ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatBDT(Number(latest.amount))}
                      </span>
                    ) : (
                      formatBDT(Number(booking.totalPrice))
                    )}
                  </TableCell>
                  <TableCell>
                    {latest ? (
                      <div className="flex flex-col gap-0.5">
                        <PaymentStatusBadge status={latest.status} />
                        {latest.status === "REFUNDED" && latest.refundedAt && (
                          <span className="text-xs text-muted-foreground">
                            Refunded {formatDate(latest.refundedAt)}
                            {latest.refundRefId ? ` · #${latest.refundRefId.slice(0, 8)}` : ""}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {latest?.paidAt ? formatDate(latest.paidAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/user-dashboard/bookings/${booking.id}`}>
                        View
                        <ArrowRight size={15} />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}