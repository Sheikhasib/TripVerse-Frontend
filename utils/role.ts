import type { TRole } from "@/lib/validations/auth"

// Client-safe copy of the map in proxy.ts — used for the post-login redirect.
export const ROLE_DASHBOARD: Record<TRole, string> = {
  USER: "/user-dashboard",
  AGENT: "/agent-dashboard",
  ADMIN: "/admin-dashboard",
}

export const roleDashboard = (role: string): string =>
  ROLE_DASHBOARD[role as TRole] ?? "/"
