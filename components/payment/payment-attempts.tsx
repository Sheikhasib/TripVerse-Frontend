"use client"

import { motion } from "framer-motion"
import { Receipt } from "@phosphor-icons/react"
import { RouteLoading } from "@/components/shared/route-loading"
import { EmptyState } from "@/components/shared/empty-state"
import { PaymentStatusBadge } from "./payment-status-badge"
import { formatBDT, formatDateTime } from "@/lib/format"
import type { TPayment } from "@/lib/api/bookings"

interface PaymentAttemptsProps {
  payments: TPayment[]
  isLoading?: boolean
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export function PaymentAttempts({
  payments,
  isLoading = false,
}: PaymentAttemptsProps) {
  if (isLoading) {
    return <RouteLoading className="min-h-40" />
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={40} />}
        title="No payments yet"
        description="Payment attempts for this booking will appear here."
      />
    )
  }

  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="show"
      className="divide-y divide-border rounded-lg bg-card ring-1 ring-foreground/5"
    >
      {payments.map((payment) => (
        <motion.li
          key={payment.id}
          variants={item}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <PaymentStatusBadge status={payment.status} />
            <p className="truncate text-sm font-medium tabular-nums">
              {formatBDT(Number(payment.amount))}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            {payment.tranId && (
              <p className="truncate font-mono text-xs text-muted-foreground">
                {payment.tranId}
              </p>
            )}
            {payment.status === "REFUNDED" && payment.refundCompletedAt ? (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Refunded {formatDateTime(payment.refundCompletedAt)}
              </p>
            ) : (
              payment.paidAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(payment.paidAt)}
                </p>
              )
            )}
          </div>
        </motion.li>
      ))}
    </motion.ul>
  )
}