"use client"

import Image from "next/image"
import Link from "next/link"
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { Check, CreditCard, X, Ticket } from "@phosphor-icons/react"
import { toast } from "sonner"
import { bookingsApi, type TBooking, type TBookingStatus } from "@/lib/api/bookings"
import { ApiError } from "@/lib/api/client"
import { formatBDT } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { BookingStatusBadge } from "./booking-status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type TBookingViewer = "user" | "agent" | "admin"

interface BookingTableProps {
  bookings: TBooking[]
  isLoading: boolean
  viewer: TBookingViewer
  // Query keys to invalidate after a status transition (page-specific).
  invalidateKeys: QueryKey[]
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))

// Mirrors the server's toUTCMidnight comparison for the two time-gated
// transitions: COMPLETED only after the travel date passes, PENDING (revert)
// only before it.
const travelDay = (booking: TBooking) => new Date(booking.travelDate).getTime()
const canComplete = (booking: TBooking) => travelDay(booking) <= Date.now()
const canRevert = (booking: TBooking) => travelDay(booking) > Date.now()

interface Action {
  label: string
  next: TBookingStatus
  icon: "check" | "x"
  disabled?: boolean
}

const getActions = (
  booking: TBooking,
  viewer: TBookingViewer,
): Action[] => {
  const staff = viewer !== "user"
  const actions: Action[] = []

  switch (booking.status) {
    case "PENDING":
    case "PAID":
      if (staff) {
        actions.push({ label: "Confirm", next: "CONFIRMED", icon: "check" })
      }
      actions.push({ label: "Cancel", next: "CANCELLED", icon: "x" })
      break
    case "CONFIRMED":
      if (staff) {
        actions.push({
          label: "Complete",
          next: "COMPLETED",
          icon: "check",
          disabled: !canComplete(booking),
        })
        actions.push({
          label: "Revert to pending",
          next: "PENDING",
          icon: "x",
          disabled: !canRevert(booking),
        })
      }
      actions.push({ label: "Cancel", next: "CANCELLED", icon: "x" })
      break
    default:
      break
  }

  return actions
}

export function BookingTable({
  bookings,
  isLoading,
  viewer,
  invalidateKeys,
}: BookingTableProps) {
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TBookingStatus }) =>
      bookingsApi.updateBookingStatus(id, status),
    onSuccess: (_, variables) => {
      invalidateKeys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      )
      toast.success(
        variables.status === "CANCELLED"
          ? "Booking cancelled. Any payment will be refunded."
          : "Booking status updated.",
      )
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    },
  })

  const loading = isLoading || statusMutation.isPending

  if (isLoading) {
    return (
      <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="mb-3 h-14 rounded-md last:mb-0" />
        ))}
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<Ticket size={40} />}
        title="No bookings yet"
        description="Bookings will appear here once travellers place an order."
      />
    )
  }

  const showCustomer = viewer === "admin"

  return (
    <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            {showCustomer && <TableHead>Customer</TableHead>}
            <TableHead>Travel date</TableHead>
            <TableHead>Travelers</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
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
              {showCustomer && (
                <TableCell>
                  <p className="font-medium">{booking.user?.name ?? "Unknown"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {booking.user?.email}
                  </p>
                </TableCell>
              )}
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(booking.travelDate)}
              </TableCell>
              <TableCell className="tabular-nums">{booking.travelers}</TableCell>
              <TableCell className="tabular-nums">
                {formatBDT(Number(booking.totalPrice))}
              </TableCell>
              <TableCell>
                <BookingStatusBadge status={booking.status} />
              </TableCell>
              <TableCell className="text-right">
                {viewer === "user" && booking.status === "PENDING" && (
                  <Button asChild size="sm" className="mr-1">
                    <Link href={`/user-dashboard/bookings/${booking.id}`}>
                      <CreditCard size={14} />
                      Pay
                    </Link>
                  </Button>
                )}
                {getActions(booking, viewer).length > 0 ? (
                  <div className="flex items-center justify-end gap-1">
                    {getActions(booking, viewer).map((action) => (
                      <Button
                        key={action.next}
                        size="sm"
                        variant={
                          action.next === "CANCELLED" ? "outline" : "default"
                        }
                        className={
                          action.next === "CANCELLED"
                            ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                            : undefined
                        }
                        disabled={loading || action.disabled}
                        title={
                          action.disabled
                            ? action.next === "COMPLETED"
                              ? "Can only complete after the travel date"
                              : "Can only revert before the travel date"
                            : undefined
                        }
                        onClick={() =>
                          statusMutation.mutate({
                            id: booking.id,
                            status: action.next,
                          })
                        }
                      >
                        {action.icon === "check" ? (
                          <Check />
                        ) : (
                          <X />
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
