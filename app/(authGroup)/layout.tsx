import Link from "next/link"
import { Compass } from "@phosphor-icons/react/dist/ssr"
import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
          <Compass className="size-5" weight="fill" />
        </span>
        TripVerse
      </Link>
      {children}
    </div>
  )
}
