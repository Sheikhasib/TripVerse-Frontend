"use client"

import { motion } from "framer-motion"
import { CreditCard } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { formatBDT } from "@/lib/format"
import { useCreatePayment } from "@/hooks/usePayments"
import type { TBooking } from "@/lib/api/bookings"

interface PayNowButtonProps {
  booking: TBooking
  className?: string
}

export function PayNowButton({ booking, className }: PayNowButtonProps) {
  const createPayment = useCreatePayment()

  const hasSuccessPayment = booking.payments?.some(
    (payment) => payment.status === "SUCCESS",
  )
  const payable = booking.status === "PENDING" && !hasSuccessPayment

  if (!payable) {
    return null
  }

  return (
    <motion.div whileTap={{ scale: 0.97 }} className={className}>
      <Button
        className="w-full"
        disabled={createPayment.isPending}
        onClick={() => createPayment.mutate({ bookingId: booking.id })}
      >
        <CreditCard size={16} />
        {createPayment.isPending
          ? "Initiating…"
          : `Pay now — ${formatBDT(Number(booking.totalPrice))}`}
      </Button>
    </motion.div>
  )
}