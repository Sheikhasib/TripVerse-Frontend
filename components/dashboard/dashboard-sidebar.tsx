"use client"

import { usePathname, useRouter } from "next/navigation"
import { Compass, SignOut } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useMe } from "@/hooks/use-me"
import { authApi } from "@/lib/api/auth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { ProgressLink } from "@/components/shared/progress-link"
import {
  NAV_SECTIONS_BY_ROLE,
  roleDisplayName,
} from "./dashboard-nav-items"

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()

function SidebarContents() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useMe()

  const sections = user ? NAV_SECTIONS_BY_ROLE[user.role] ?? [] : []

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const handleLogout = async () => {
    try {
      await authApi.logout()
      toast.success("Logged out successfully")
    } catch {
      toast.error("Failed to log out. Please try again.")
    }
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <Compass className="size-5" weight="fill" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">TripVerse</span>
          <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            Dashboard
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, index) => (
          <div key={section.title} className={cn(index > 0 && "mt-6")}>
            <p className="mb-1 px-3 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              {section.title}
            </p>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <ProgressLink
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className="size-4 shrink-0"
                        weight={active ? "fill" : "regular"}
                      />
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <span className="size-1.5 rounded-full bg-primary" />
                      )}
                    </ProgressLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        {isLoading || !user ? (
          <div className="flex items-center gap-2 px-2 py-2">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md px-2 py-2">
            <Avatar className="size-9 shrink-0">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name || "Avatar"} />
              ) : (
                <AvatarFallback className="text-xs text-primary">
                  {getInitials(user.name || "N/A")}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium">
                {user.name || "N/A"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
              <span className="mt-0.5 w-fit rounded border border-primary/30 px-1 py-px text-[10px] font-semibold tracking-widest text-primary uppercase">
                {roleDisplayName(user.role)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <SignOut />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] w-64 shrink-0 border-r border-border bg-card/40 md:block">
      <SidebarContents />
    </aside>
  )
}

export function DashboardMobileNav({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-72 bg-background p-0 sm:max-w-xs"
      >
        <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Dashboard navigation menu
        </SheetDescription>
        <SidebarContents />
      </SheetContent>
    </Sheet>
  )
}