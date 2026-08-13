import { Compass } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import type { ReactNode } from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { DashboardUserMenu } from "@/components/dashboard/dashboard-user-menu"
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Compass className="size-5" weight="fill" />
              </span>
              TripVerse
            </Link>
            <div className="hidden md:block">
              <DashboardNav />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DashboardUserMenu />
            <div className="md:hidden">
              <DashboardMobileNav />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}