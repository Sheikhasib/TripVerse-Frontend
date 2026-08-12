import { NextRequest, NextResponse } from "next/server"
import { jwtUtils } from "./utils/jwt"
import { getNewAccessToken, type TTokenPair } from "./service/refreshToken"

const isProduction = process.env.NODE_ENV === "production"

// Mirrors the backend's auth.controller.ts cookieOptions.
const baseCookieOptions = {
  path: "/",
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
}

const accessCookieOptions = {
  ...baseCookieOptions,
  httpOnly: true,
  maxAge: 24 * 60 * 60, // 1 day
}

const refreshCookieOptions = {
  ...baseCookieOptions,
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60, // 30 days
}

// Client-readable token cookie — read by lib/api/client.ts for the
// Authorization header on client-side requests.
const clientCookieOptions = {
  ...baseCookieOptions,
  httpOnly: false,
  maxAge: 24 * 60 * 60,
}

const ACCESS_COOKIE = "accessToken"
const REFRESH_COOKIE = "refreshToken"
const ACCESS_CLIENT_COOKIE = "accessTokenClient"

const PUBLIC_EXACT_PATHS = [
  "/",
  "/about",
  "/contact",
  "/help",
  "/privacy",
  "/blog",
  "/not-found",
]

const PUBLIC_PREFIXES = ["/packages", "/blog"]

const AUTH_PATHS = ["/login", "/register"]

const DASHBOARD_PREFIXES = [
  { prefix: "/user-dashboard", role: "USER" },
  { prefix: "/agent-dashboard", role: "AGENT" },
  { prefix: "/admin-dashboard", role: "ADMIN" },
] as const

const ROLE_DASHBOARD: Record<string, string> = {
  USER: "/user-dashboard",
  AGENT: "/agent-dashboard",
  ADMIN: "/admin-dashboard",
}

const isPublicPath = (pathname: string) =>
  PUBLIC_EXACT_PATHS.includes(pathname) ||
  PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

const isAuthPath = (pathname: string) => AUTH_PATHS.includes(pathname)

// Returns true when the path is a dashboard whose role doesn't match the
// authenticated user's role.
const isRoleMismatch = (pathname: string, role: string) => {
  for (const dashboard of DASHBOARD_PREFIXES) {
    const onDashboard =
      pathname === dashboard.prefix ||
      pathname.startsWith(`${dashboard.prefix}/`)
    if (onDashboard) {
      return role !== dashboard.role
    }
  }
  return false
}

const attachCookies = (
  response: NextResponse,
  refreshedPair: TTokenPair | null,
  clearStale: boolean,
) => {
  if (refreshedPair) {
    response.cookies.set(ACCESS_COOKIE, refreshedPair.accessToken, accessCookieOptions)
    response.cookies.set(REFRESH_COOKIE, refreshedPair.refreshToken, refreshCookieOptions)
    response.cookies.set(ACCESS_CLIENT_COOKIE, refreshedPair.accessToken, clientCookieOptions)
    return
  }

  if (clearStale) {
    response.cookies.set(ACCESS_COOKIE, "", { ...accessCookieOptions, maxAge: 0 })
    response.cookies.set(REFRESH_COOKIE, "", { ...refreshCookieOptions, maxAge: 0 })
    response.cookies.set(ACCESS_CLIENT_COOKIE, "", { ...clientCookieOptions, maxAge: 0 })
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  let auth: { token: string; role: string } | null = null
  let refreshedPair: TTokenPair | null = null
  // True when a refresh attempt failed due to a transient error (network/5xx).
  // The refresh token may still be valid, so cookies must NOT be cleared.
  let refreshFailedTransiently = false

  const verify = (token: string) => {
    const result = jwtUtils.verifyToken(
      token,
      process.env.JWT_ACCESS_SECRET ?? "",
    )
    if (!result.success) {
      return null
    }
    return (result.data as { role?: string }).role ?? ""
  }

  if (accessToken) {
    const role = verify(accessToken)
    if (role !== null) {
      auth = { token: accessToken, role }
    }
  }

  if (!auth && refreshToken) {
    const result = await getNewAccessToken(refreshToken)
    if (result.status === "ok") {
      const role = verify(result.tokenPair.accessToken)
      if (role !== null) {
        auth = { token: result.tokenPair.accessToken, role }
        refreshedPair = result.tokenPair
      }
    } else if (result.status === "error") {
      refreshFailedTransiently = true
    }
  }

  const authenticated = auth !== null
  const hadCookies = Boolean(accessToken || refreshToken)
  // Clear stale cookies only when the user is definitively unauthenticated
  // (both tokens rejected). A transient refresh failure must not log them out.
  const clearStaleCookies = !authenticated && hadCookies && !refreshFailedTransiently

  // 1. Auth routes: authenticated users go straight to their dashboard.
  if (isAuthPath(pathname)) {
    if (authenticated) {
      const response = NextResponse.redirect(
        new URL(ROLE_DASHBOARD[auth!.role] ?? "/", request.url),
      )
      attachCookies(response, refreshedPair, false)
      return response
    }
    return NextResponse.next()
  }

  // 2. Public routes: always accessible.
  if (isPublicPath(pathname)) {
    const response = NextResponse.next()
    attachCookies(response, refreshedPair, clearStaleCookies)
    return response
  }

  // 3. Protected routes, unauthenticated → login (preserving the target).
  if (!authenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    const response = NextResponse.redirect(loginUrl)
    attachCookies(response, null, clearStaleCookies)
    return response
  }

  // 4. Role mismatch on a dashboard → not-found.
  if (isRoleMismatch(pathname, auth!.role)) {
    const response = NextResponse.redirect(new URL("/not-found", request.url))
    attachCookies(response, refreshedPair, false)
    return response
  }

  // 5. Authenticated, allowed (dashboards + /profile).
  const response = NextResponse.next()
  attachCookies(response, refreshedPair, false)
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
