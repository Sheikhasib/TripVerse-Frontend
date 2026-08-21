"use server"

import { jwtUtils } from "@/utils/jwt"

const refreshUrl = () =>
  `${process.env.BACKEND_API_URL ?? ""}/api/auth/refresh`

export type TTokenPair = { accessToken: string; refreshToken: string }

// Result of attempting to refresh an access token:
// - "ok"       → a new token pair was issued
// - "invalid"  → the refresh token is definitively rejected (missing/expired/
//                revoked) — safe to clear cookies
// - "error"    → a transient failure (network/5xx) — do NOT log the user out
export type TRefreshResult =
  | { status: "ok"; tokenPair: TTokenPair }
  | { status: "invalid" }
  | { status: "error" }

// Calls the backend refresh endpoint with the (httpOnly) refresh token and
// returns the rotated token pair, or a status describing the failure.
const getNewAccessToken = async (
  refreshToken: string | undefined,
): Promise<TRefreshResult> => {
  if (!refreshToken) {
    return { status: "invalid" }
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
    return { status: "error" }
  }

  // Server-side failures (5xx) are transient — the refresh token may still be
  // valid, so proxy.ts must not clear cookies.
  if (res.status >= 500) {
    return { status: "error" }
  }

  const envelope = (await res.json().catch(() => null)) as
    | { success: boolean; data?: { accessToken?: string; refreshToken?: string } }
    | null

  if (!res.ok || !envelope?.success || !envelope.data?.accessToken) {
    return { status: "invalid" }
  }

  // Under rotation a 200 always carries BOTH tokens. A success that omits the
  // new refresh token must not fall back to the presented one — that token may
  // already be revoked, and persisting it would self-inflict a reuse-detection
  // family nuke on the next refresh. Bail out as transient instead.
  if (!envelope.data.refreshToken) {
    return { status: "error" }
  }

  return {
    status: "ok",
    tokenPair: {
      accessToken: envelope.data.accessToken,
      refreshToken: envelope.data.refreshToken,
    },
  }
}

type TTokenResult =
  | { status: "ok"; accessToken: string }
  | { status: "new"; tokenPair: TTokenPair }
  | { status: "unauthenticated" }
  | { status: "error" }

// Returns a valid access token for the request, refreshing it if the access
// token is invalid/expired but the refresh token is still valid. Does not
// write cookies itself — proxy.ts persists refreshed tokens to the browser.
// "error" means a transient refresh failure — proxy.ts should keep the
// existing cookies rather than logging the user out.
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
  if (fresh.status === "ok") {
    return { status: "new", tokenPair: fresh.tokenPair }
  }
  if (fresh.status === "error") {
    return { status: "error" }
  }

  return { status: "unauthenticated" }
}

export { getAccessToken, getNewAccessToken }
export type { TTokenResult }