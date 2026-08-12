"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authApi } from "@/lib/api/auth"
import { roleDashboard } from "@/utils/role"

// Shared post-auth flow for login, demo login, and Google login: persist the
// client-readable token cookie, toast, then redirect to redirectTo (from
// proxy.ts) or the role's dashboard.
const useAfterAuth = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  return useCallback(
    (accessToken: string, role: string, message = "Logged in successfully") => {
      authApi.setAccessTokenClient(accessToken)
      toast.success(message)

      const redirectTo = searchParams.get("redirectTo")
      const safeTarget =
        redirectTo &&
        redirectTo.startsWith("/") &&
        !redirectTo.startsWith("//")
          ? redirectTo
          : roleDashboard(role)

      router.replace(safeTarget)
    },
    [router, searchParams],
  )
}

export { useAfterAuth }
