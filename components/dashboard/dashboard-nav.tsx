"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useMe } from "@/hooks/use-me"
import { Skeleton } from "@/components/ui/skeleton"
import type { TRole } from "@/lib/validations/auth"

type NavItem = { label: string; href: string }

const NAV_BY_ROLE: Record<TRole, NavItem[]> = {
  USER: [
    { label: "Overview", href: "/user-dashboard" },
    { label: "My Bookings", href: "/user-dashboard/bookings" },
    { label: "Payments", href: "/user-dashboard/payments" },
    { label: "Profile", href: "/user-dashboard/profile" },
    { label: "Settings", href: "/user-dashboard/settings" },
  ],
  AGENT: [
    { label: "Manager", href: "/agent-dashboard" },
    { label: "My Packages", href: "/agent-dashboard/my-packages" },
    { label: "New Package", href: "/agent-dashboard/packages/new" },
    { label: "Bookings", href: "/agent-dashboard/bookings" },
  ],
  ADMIN: [
    { label: "Overview", href: "/admin-dashboard" },
    { label: "Manage Packages", href: "/admin-dashboard/packages" },
    { label: "Manage Users", href: "/admin-dashboard/users" },
    { label: "Manage Bookings", href: "/admin-dashboard/bookings" },
    { label: "Analytics", href: "/admin-dashboard/analytics" },
    { label: "Settings", href: "/admin-dashboard/settings" },
  ],
}

export function DashboardNav() {
  const pathname = usePathname()
  const { user, isLoading } = useMe()

  if (isLoading || !user) {
    return (
      <nav className="hidden items-center gap-1 md:flex" aria-label="Dashboard">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </nav>
    )
  }

  const items = NAV_BY_ROLE[user.role] ?? []

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Dashboard">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}