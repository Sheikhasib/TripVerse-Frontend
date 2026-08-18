"use client"

import { useQuery } from "@tanstack/react-query"
import { authApi, type TAuthUser } from "@/lib/api/auth"
import { cookieUtils } from "@/utils/cookies"

const ACCESS_TOKEN_CLIENT_COOKIE = "accessTokenClient"

const getClientToken = () => cookieUtils.getCookie(ACCESS_TOKEN_CLIENT_COOKIE)

// Returns the current authenticated user (null when logged out). Only fires
// the /api/auth/me request when a client-readable token cookie exists, so the
// navbar never triggers a refresh round-trip for anonymous visitors. The
// token presence is part of the query key: when a user logs in or out the key
// flips, so the cached anonymous (null) or previous user payload is replaced
// by a fresh fetch instead of lingering until a manual page reload.
export const useMe = () => {
  const hasToken = Boolean(getClientToken())

  const query = useQuery<TAuthUser | null>({
    queryKey: ["me", hasToken],
    queryFn: async () => {
      if (!hasToken) return null
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