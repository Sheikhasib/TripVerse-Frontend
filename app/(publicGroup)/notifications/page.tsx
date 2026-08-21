"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "@phosphor-icons/react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/client"
import {
  useMarkAllAsRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications"
import { useMe } from "@/hooks/use-me"
import { NotificationItem } from "@/components/notifications/notification-item"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const PAGE_SIZE = 20
const SKELETON_COUNT = 5

type NotificationTab = "all" | "unread"

const NotificationsSkeleton = () => (
  <div className="divide-y divide-border rounded-lg border border-border bg-card">
    {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
      <div key={index} className="flex items-start gap-3 px-4 py-4">
        <Skeleton className="size-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
)

export default function NotificationsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<NotificationTab>("all")
  const [page, setPage] = useState(1)
  const { user, isLoading: meLoading } = useMe()
  const { data: unread } = useUnreadCount()
  const markAllAsRead = useMarkAllAsRead()

  const { data, isLoading, isError, error, refetch } = useNotifications({
    page,
    limit: PAGE_SIZE,
    unread: tab === "unread" ? true : undefined,
  })

  // Proxy guards this route, but if the session evaporates mid-view
  // (e.g. token revoked) send the visitor to login and back.
  useEffect(() => {
    if (!meLoading && !user) {
      router.replace("/login?redirectTo=%2Fnotifications")
    }
  }, [meLoading, user, router])

  if (!meLoading && !user) return null

  const items = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1
  const count = unread?.count ?? 0

  const handleMarkAll = async () => {
    try {
      await markAllAsRead.mutateAsync()
      toast.success("All notifications marked as read.")
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Something went wrong.",
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Booking updates and package decisions land here.
          </p>
        </div>
        {count > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markAllAsRead.isPending}
            className="cursor-pointer"
          >
            Mark all as read ({count})
          </Button>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as NotificationTab)
          setPage(1)
        }}
        className="mt-6"
      >
        <TabsList>
          <TabsTrigger value="all" className="cursor-pointer">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="cursor-pointer">
            Unread{count > 0 ? ` (${count})` : ""}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : isError ? (
          <EmptyState
            icon={<Bell size={40} />}
            title="Couldn't load your notifications"
            description={
              error instanceof ApiError
                ? error.message
                : "Something went wrong."
            }
            action={
              <Button
                type="button"
                onClick={() => refetch()}
                className="cursor-pointer"
              >
                Try again
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell size={40} />}
            title={
              tab === "unread" ? "You're all caught up" : "No notifications yet"
            }
            description={
              tab === "unread"
                ? "New booking updates and package decisions will show up here."
                : "Book a trip or submit a package and updates will show up here."
            }
          />
        ) : (
          <>
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onNavigate={(href) => router.push(href)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
