"use client"

import { Compass } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export function RouteLoading({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[60svh] w-full items-center justify-center",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <Compass
            className="size-6 animate-[spin_2s_linear_infinite]"
            weight="fill"
          />
        </div>
        <div className="h-2 w-24 animate-pulse rounded-full bg-muted" />
      </div>
      <span className="sr-only">Loading TripVerse…</span>
    </div>
  )
}