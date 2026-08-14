"use client"

import {
  CalendarCheck,
  Clock,
  CreditCard,
  Flag,
  X,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const STEPS: { key: string; label: string; icon: Icon }[] = [
  { key: "PENDING", label: "Booked", icon: Clock },
  { key: "PAID", label: "Paid", icon: CreditCard },
  { key: "CONFIRMED", label: "Confirmed", icon: CalendarCheck },
  { key: "COMPLETED", label: "Completed", icon: Flag },
]

const STEP_INDEX: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  CONFIRMED: 2,
  COMPLETED: 3,
}

// Renders a booking's progress through the trip lifecycle as a stepper,
// highlighting the current step. A cancelled booking shows a rejected state.
export function TripJourney({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm font-medium text-destructive">
        <X className="size-4" />
        This trip was cancelled
      </div>
    )
  }

  const currentIndex = STEP_INDEX[status] ?? -1
  if (currentIndex === -1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground">
        <Clock className="size-4" />
        {status}
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute top-4 right-0 left-0 h-px bg-border"
      />
      <ol className="relative flex justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const done = index < currentIndex
          const current = index === currentIndex
          return (
            <li key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border transition-colors",
                  done &&
                    "border-primary bg-primary text-primary-foreground",
                  current &&
                    "border-primary bg-background text-primary ring-2 ring-primary/25",
                  !done && !current && "border-border bg-background text-muted-foreground",
                )}
              >
                <Icon
                  className="size-4"
                  weight={done || current ? "fill" : "regular"}
                />
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  done || current
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}