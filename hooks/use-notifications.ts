"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cookieUtils } from "@/utils/cookies"
import { notificationsApi } from "@/lib/api/notifications"

// Badge poll — refreshes the unread count while the app is open. No fetch and
// no polling for anonymous visitors.
export const useUnreadCount = () => {
  const hasToken = Boolean(cookieUtils.getCookie("accessTokenClient"))

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: hasToken,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  })
}

export const useNotifications = ({
  page = 1,
  limit = 20,
  unread,
}: { page?: number; limit?: number; unread?: boolean } = {}) =>
  useQuery({
    queryKey: ["notifications", page, unread ?? "all"],
    queryFn: () => notificationsApi.getMyNotifications({ page, limit, unread }),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

// Both mutations share one invalidation prefix: ["notifications"] matches the
// unread-count key AND every list key, so the badge and dropdown/page agree
// instantly after mark-read / mark-all.
const invalidateNotificationKeys = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: ["notifications"] })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => invalidateNotificationKeys(queryClient),
  })
}

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => invalidateNotificationKeys(queryClient),
  })
}
