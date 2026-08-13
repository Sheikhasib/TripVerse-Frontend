import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TBookingStatus } from "@/lib/api/bookings"

const STATUS_CONFIG: Record<
  TBookingStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  },
  PAID: {
    label: "Paid",
    className: "border-purple-500/30 bg-purple-500/10 text-purple-600",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  COMPLETED: {
    label: "Completed",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-500/30 bg-red-500/10 text-red-600",
  },
}

export function BookingStatusBadge({ status }: { status: TBookingStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", config.className)}
    >
      {config.label}
    </Badge>
  )
}