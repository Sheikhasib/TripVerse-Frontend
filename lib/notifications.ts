import { formatDate } from "@/lib/format"
import { roleDashboard } from "@/utils/role"

// Backend notification links carry backend route prefixes that don't exist on
// this frontend ("/dashboard/..."). Translate to real client routes; anything
// unrecognizable falls back to the viewer's dashboard so a link can never 404
// or bounce to login.
export const resolveNotificationLink = (
  link: string | null,
  role: string,
): string => {
  const fallback = roleDashboard(role)
  if (!link?.startsWith("/dashboard")) return fallback

  const rest = link.slice("/dashboard".length)

  if (rest.startsWith("/agent/packages/")) {
    const packageId = rest.split("/")[3]
    return packageId ? `/agent-dashboard/packages/${packageId}/edit` : fallback
  }
  if (rest.startsWith("/agent/bookings")) {
    // Agent bookings have no detail page today — land on the list.
    return "/agent-dashboard/bookings"
  }
  if (rest.startsWith("/agent")) {
    return `/agent-dashboard${rest.slice("/agent".length)}`
  }
  if (rest.startsWith("/admin")) {
    return `/admin-dashboard${rest.slice("/admin".length)}`
  }
  if (rest.startsWith("/bookings")) {
    // Customer booking links are role-scoped: USER has a detail page, the
    // other roles land on their bookings list.
    switch (role) {
      case "USER":
        return `/user-dashboard${rest}`
      case "AGENT":
        return "/agent-dashboard/bookings"
      default:
        return "/admin-dashboard/bookings"
    }
  }

  return fallback
}

export const formatRelativeTime = (value: string): string => {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  )
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}
