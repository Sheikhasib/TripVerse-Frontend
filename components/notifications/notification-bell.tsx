"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, BellRinging } from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import {
  useMarkAllAsRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications"
import { useMe } from "@/hooks/use-me"
import { NotificationItem } from "./notification-item"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const DROPDOWN_LIMIT = 10

const badgeLabel = (count: number) => (count > 99 ? "99+" : String(count))

// Bell + unread badge for any authenticated role. Renders nothing when
// anonymous — no icon, no fetch, no polling.
export function NotificationBell({ className }: { className?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { user } = useMe()
  const { data: unread } = useUnreadCount()
  const { data } = useNotifications({ limit: DROPDOWN_LIMIT })
  const markAllAsRead = useMarkAllAsRead()

  if (!user) return null

  const count = unread?.count ?? 0
  const items = data?.data ?? []

  const handleMarkAll = async () => {
    try {
      await markAllAsRead.mutateAsync()
      toast.success("All notifications marked as read.")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
          className={cn(
            "relative inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted",
            className,
          )}
        >
          {count > 0 ? (
            <BellRinging className="size-5 text-primary" />
          ) : (
            <Bell className="size-5" />
          )}
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-semibold leading-4 text-white">
              {badgeLabel(count)}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold tracking-tight">
            Notifications
          </span>
          {count > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markAllAsRead.isPending}
              className="cursor-pointer text-xs font-medium text-primary transition-colors duration-200 hover:text-primary/80 disabled:pointer-events-none disabled:opacity-60"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNavigate={(href) => {
                  setOpen(false)
                  router.push(href)
                }}
              />
            ))
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem asChild className="justify-center">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
