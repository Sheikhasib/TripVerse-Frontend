"use client"

import { CalendarBlank, Clock, MapPin } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Rating } from "@/components/shared/rating"
import type { TPublicPackage } from "@/lib/api/packages"

interface BookingPanelProps {
  pkg: TPublicPackage
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)

// Sticky booking panel. The actual date-picker + create-booking form lands in
// Step 8 — until then this is the visual anchor with the price summary.
export function BookingPanel({ pkg }: BookingPanelProps) {
  return (
    <div className="space-y-4 rounded-lg bg-card p-6 ring-1 ring-foreground/5 lg:sticky lg:top-24">
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold tabular-nums text-primary">
          {formatPrice(pkg.price)}
        </span>
        <span className="text-sm text-muted-foreground">/ person</span>
      </div>

      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2 text-muted-foreground">
          <MapPin size={15} className="text-primary" />
          {pkg.location}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Clock size={15} className="text-primary" />
          {pkg.duration} days
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <CalendarBlank size={15} className="text-primary" />
          Dates available on booking
        </p>
      </div>

      {typeof pkg.rating === "number" && pkg.rating > 0 && (
        <div className="flex items-center gap-2 border-t border-border/60 pt-4">
          <Rating value={pkg.rating} />
          <span className="text-sm font-semibold tabular-nums">
            {pkg.rating.toFixed(1)}
          </span>
        </div>
      )}

      <Button size="lg" className="w-full" disabled>
        Book Now
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Booking opens soon — Step 8
      </p>
    </div>
  )
}