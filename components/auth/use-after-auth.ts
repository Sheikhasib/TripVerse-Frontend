"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { authApi } from "@/lib/api/auth"
import { ROLE_DASHBOARD, roleDashboard } from "@/utils/role"

const DASHBOARD_PREFIXES = Object.values(ROLE_DASHBOARD)

// redirectTo is user-controlled. Accept it only when it is a same-origin path,
// not an auth page, and not another role's dashboard; otherwise fall back to
// the role's own dashboard.
const resolveRedirect = (redirectTo: string | null, role: string) => {
  const own = roleDashboard(role)
  if (
    !redirectTo ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//") ||
    redirectTo.includes("\\")
  ) {
    return own
  }

  const path = redirectTo.split(/[?#]/)[0]
  if (path === "/login" || path === "/register") {
    return own
  }

  const foreignDashboard = DASHBOARD_PREFIXES.some(
    (prefix) =>
      prefix !== own && (path === prefix || path.startsWith(`${prefix}/`)),
  )
  return foreignDashboard ? own : redirectTo
}

// Shared post-auth flow for login, demo login, and Google login: persist the
// client-readable token cookie, drop any cached data from the previous
// session, toast, then redirect to a validated redirectTo or the role's
// dashboard.
const useAfterAuth = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  return useCallback(
    (accessToken: string, role: string, message = "Logged in successfully") => {
      authApi.setAccessTokenClient(accessToken)
      queryClient.clear()
      toast.success(message)

      router.replace(resolveRedirect(searchParams.get("redirectTo"), role))
    },
    [router, searchParams, queryClient],
  )
}

export { useAfterAuth }
