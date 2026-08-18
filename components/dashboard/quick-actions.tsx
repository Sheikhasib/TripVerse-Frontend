"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  Compass,
  Newspaper,
  Package,
  Plus,
  Receipt,
  Users,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import { RouteLoading } from "@/components/shared/route-loading"
import { useMe } from "@/hooks/use-me"
import type { TRole } from "@/lib/validations/auth"

type QuickAction = {
  label: string
  description: string
  href: string
  icon: Icon
}

const QUICK_ACTIONS: Record<TRole, QuickAction[]> = {
  USER: [
    {
      label: "Browse trips",
      description: "Discover new destinations",
      href: "/packages",
      icon: Compass,
    },
    {
      label: "My bookings",
      description: "View your upcoming trips",
      href: "/user-dashboard/bookings",
      icon: Receipt,
    },
  ],
  AGENT: [
    {
      label: "Create package",
      description: "List a new tour package",
      href: "/agent-dashboard/packages/new",
      icon: Plus,
    },
    {
      label: "Write a post",
      description: "Share travel stories",
      href: "/agent-dashboard/my-posts",
      icon: Newspaper,
    },
  ],
  ADMIN: [
    {
      label: "Manage packages",
      description: "Moderate every listing",
      href: "/admin-dashboard/packages",
      icon: Package,
    },
    {
      label: "Manage users",
      description: "Review accounts",
      href: "/admin-dashboard/users",
      icon: Users,
    },
  ],
}

export function QuickActions() {
  const { user, isLoading } = useMe()

  if (isLoading || !user) {
    return <RouteLoading className="min-h-40" />
  }

  const actions = QUICK_ACTIONS[user.role] ?? []

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-4 rounded-lg border border-dashed border-border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{action.label}</span>
              <span className="block text-xs text-muted-foreground">
                {action.description}
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        )
      })}
    </div>
  )
}