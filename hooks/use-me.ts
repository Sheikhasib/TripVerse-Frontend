"use client"

import { useQuery } from "@tanstack/react-query"
import { authApi, type TAuthUser } from "@/lib/api/auth"
import { cookieUtils } from "@/utils/cookies"

const ACCESS_TOKEN_CLIENT_COOKIE = "accessTokenClient"

const hasClientToken = () =>
  Boolean(cookieUtils.getCookie(ACCESS_TOKEN_CLIENT_COOKIE))

// Returns the current authenticated user (null when logged out). Only fires
// the /api/auth/me request when a client-readable token cookie exists, so the
// navbar never triggers a refresh round-trip for anonymous visitors.
export const useMe = () => {
  const query = useQuery<TAuthUser | null>({
    queryKey: ["me"],
    queryFn: async () => {
      if (!hasClientToken()) return null
      try {
        return await authApi.me()
      } catch {
        return null
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  })

  return { user: query.data ?? null, isLoading: query.isLoading }
}