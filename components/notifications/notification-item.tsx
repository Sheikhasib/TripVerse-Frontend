"use client"

import {
  Bell,
  CalendarCheck,
  CheckCircle,
  Ticket,
  X,
  XCircle,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import type { TNotification, TNotificationType } from "@/lib/api/notifications"
import {
  formatRelativeTime,
  resolveNotificationLink,
} from "@/lib/notifications"
import { useMe } from "@/hooks/use-me"
import { useMarkAsRead } from "@/hooks/use-notifications"

const TYPE_ICONS: Record<
  TNotificationType,
  typeof Ticket
> = {
  BOOKING_CREATED: Ticket,
  BOOKING_CONFIRMED: CalendarCheck,
  BOOKING_CANCELLED: X,
  PACKAGE_APPROVED: CheckCircle,
  PACKAGE_REJECTED: XCircle,
}

interface NotificationItemProps {
  notification: TNotification
  onNavigate?: (href: string) => void
}

// One notification row. Clicking marks it read (errors surface verbatim but
// never block navigation — stale rows must not trap the user) and resolves
// the backend-style link to a real client route.
export function NotificationItem({
  notification,
  onNavigate,
}: NotificationItemProps) {
  const { user } = useMe()
  const markAsRead = useMarkAsRead()
  const unread = !notification.isRead
  const Icon = TYPE_ICONS[notification.type] ?? Bell

  const handleClick = async () => {
    if (unread) {
      try {
        await markAsRead.mutateAsync(notification.id)
      } catch (error) {
        toast.error(
          error instanceof ApiError ? error.message : "Something went wrong.",
        )
      }
    }
    onNavigate?.(
      resolveNotificationLink(notification.link, user?.role ?? "USER"),
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${notification.title}${unread ? " (unread)" : ""}`}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-muted",
        unread && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border",
          unread
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground",
        )}
      >
        <Icon size={15} weight={unread ? "fill" : "regular"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {notification.title}
          </span>
          {unread && (
            <span
              className="size-2 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
          )}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
          {notification.message}
        </span>
        <span className="mt-1 block text-[10px] font-medium tracking-wider uppercase text-muted-foreground/70">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </span>
    </button>
  )
}
