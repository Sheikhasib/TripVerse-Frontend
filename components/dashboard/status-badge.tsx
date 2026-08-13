import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TPackageStatus } from "@/lib/api/packages"

const STATUS_CONFIG: Record<
  TPackageStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  },
  APPROVED: {
    label: "Approved",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-red-500/30 bg-red-500/10 text-red-600",
  },
}

export function StatusBadge({ status }: { status: TPackageStatus }) {
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