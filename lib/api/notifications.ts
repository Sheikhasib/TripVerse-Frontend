import { apiClient, apiClientFull } from "./client"

export type TNotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "PACKAGE_APPROVED"
  | "PACKAGE_REJECTED"

export type TNotification = {
  id: string
  userId: string
  type: TNotificationType
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export type TNotificationsQuery = {
  page?: number
  limit?: number
  unread?: boolean
}

// ── Notification API (any authenticated user) ─────────────────────────────
// Runs client-side through the same-origin /api rewrite so the browser's auth
// cookies reach the backend.

const buildQuery = ({ page, limit, unread }: TNotificationsQuery = {}) => {
  const query = new URLSearchParams()
  if (page) query.set("page", String(page))
  if (limit) query.set("limit", String(limit))
  // The server accepts only the literal strings "true"/"false" for this param
  // — a bare boolean would serialize wrong.
  if (unread !== undefined) query.set("unread", unread ? "true" : "false")
  return query.toString()
}

const getMyNotifications = async (params: TNotificationsQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TNotification[]>(
    `/api/notifications${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const getUnreadCount = () =>
  apiClient<{ count: number }>("/api/notifications/unread-count")

const markAllAsRead = () =>
  apiClient<{ count: number }>("/api/notifications/read-all", {
    method: "PATCH",
  })

const markAsRead = (id: string) =>
  apiClient<{ count: number }>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  })

export const notificationsApi = {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
}
