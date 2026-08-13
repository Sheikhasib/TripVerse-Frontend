"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useMe } from "@/hooks/use-me"
import { List, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import type { TRole } from "@/lib/validations/auth"

type NavItem = { label: string; href: string }

const NAV_BY_ROLE: Record<TRole, NavItem[]> = {
  USER: [],
  AGENT: [
    { label: "My Packages", href: "/agent-dashboard/my-packages" },
    { label: "New Package", href: "/agent-dashboard/packages/new" },
  ],
  ADMIN: [{ label: "Manage Packages", href: "/admin-dashboard/packages" }],
}

export function DashboardMobileNav() {
  const pathname = usePathname()
  const { user } = useMe()
  const [open, setOpen] = useState(false)

  const items = user ? NAV_BY_ROLE[user.role] ?? [] : []

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Open dashboard menu"
      >
        <List />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-xs">
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Dashboard navigation menu
          </SheetDescription>
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <span className="text-sm font-semibold tracking-tight">
                Dashboard
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:text-primary",
                        pathname === item.href ||
                          pathname.startsWith(`${item.href}/`)
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}