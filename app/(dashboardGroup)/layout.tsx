"use client"

import { useState } from "react"
import Link from "next/link"
import { Compass, List } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { DashboardUserMenu } from "@/components/dashboard/dashboard-user-menu"
import { NotificationBell } from "@/components/notifications/notification-bell"
import {
  DashboardSidebar,
  DashboardMobileNav,
} from "@/components/dashboard/dashboard-sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open dashboard menu"
            >
              <List />
            </Button>
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Compass className="size-5" weight="fill" />
              </span>
              <span className="hidden sm:inline">TripVerse</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <DashboardUserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        <DashboardSidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <DashboardMobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </div>
  )
}