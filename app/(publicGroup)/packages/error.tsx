"use client"

import { useEffect } from "react"
import { Warning } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export default function PackagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Warning size={40} className="text-destructive" />
      <h1 className="text-2xl font-bold tracking-tight">Couldn&apos;t load packages</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        We hit a snag fetching packages. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}