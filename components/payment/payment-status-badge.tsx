import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TPaymentStatus } from "@/lib/api/bookings"

const STATUS_CONFIG: Record<
  TPaymentStatus,
  { label: string; className: string }
> = {
  INITIATED: {
    label: "Initiated",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  SUCCESS: {
    label: "Success",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  FAILED: {
    label: "Failed",
    className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-muted bg-muted/40 text-muted-foreground",
  },
  REFUNDED: {
    label: "Refunded",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
}

export function PaymentStatusBadge({ status }: { status: TPaymentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.INITIATED
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", config.className)}
    >
      {config.label}
    </Badge>
  )
}