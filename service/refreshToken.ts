"use server"

import { jwtUtils } from "@/utils/jwt"

const refreshUrl = () =>
  `${process.env.BACKEND_API_URL ?? ""}/api/auth/refresh`

// Calls the backend refresh endpoint with the (httpOnly) refresh token and
// returns the new access token, or null if the refresh token is invalid/expired.
const getNewAccessToken = async (
  refreshToken: string | undefined,
): Promise<string | null> => {
  if (!refreshToken) {
    return null
  }

  let res: Response
  try {
    res = await fetch(refreshUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    })
  } catch {
    return null
  }

  const envelope = (await res.json().catch(() => null)) as
    | { success: boolean; data?: { accessToken?: string } }
    | null

  if (!res.ok || !envelope?.success) {
    return null
  }

  return envelope.data?.accessToken ?? null
}

type TTokenResult =
  | { status: "ok"; accessToken: string }
  | { status: "new"; accessToken: string }
  | { status: "unauthenticated" }

// Returns a valid access token for the request, refreshing it if the access
// token is invalid/expired but the refresh token is still valid. Does not
// write cookies itself — proxy.ts persists refreshed tokens to the browser.
const getAccessToken = async (
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<TTokenResult> => {
  if (accessToken) {
    const verified = jwtUtils.verifyToken(
      accessToken,
      process.env.JWT_ACCESS_SECRET ?? "",
    )
    if (verified.success) {
      return { status: "ok", accessToken }
    }
  }

  const fresh = await getNewAccessToken(refreshToken)
  if (!fresh) {
    return { status: "unauthenticated" }
  }

  return { status: "new", accessToken: fresh }
}

export { getAccessToken, getNewAccessToken }
export type { TTokenResult }