import { NextRequest, NextResponse } from "next/server"
import { jwtUtils } from "@/utils/jwt"

// lib/api/client.ts sends the browser here when the backend answers 401 to a
// request that carried a token. Two causes:
// - The access token expired. proxy.ts has already refreshed it on the way
//   in (its cookies ride on this response), so just go back to the page.
// - The token is still valid but the backend revoked it: proxy.ts only checks
//   the signature, while the backend also checks tokenVersion, which any
//   logout of the same account bumps (the demo accounts are shared). Retrying
//   can never succeed, and the httpOnly cookies can't be cleared from the
//   browser, so clear them here and start a fresh login.
const isProduction = process.env.NODE_ENV === "production"

const expiredCookie = {
  path: "/",
  maxAge: 0,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
}

const safePath = (value: string | null) =>
  value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : null

export function GET(request: NextRequest) {
  const redirectTo = safePath(request.nextUrl.searchParams.get("redirectTo"))
  const accessToken = request.cookies.get("accessToken")?.value

  const stillValid =
    accessToken !== undefined &&
    jwtUtils.verifyToken(accessToken, process.env.JWT_ACCESS_SECRET ?? "")
      .success

  if (!stillValid) {
    return NextResponse.redirect(new URL(redirectTo ?? "/", request.url))
  }

  const loginUrl = new URL("/login", request.url)
  if (redirectTo) {
    loginUrl.searchParams.set("redirectTo", redirectTo)
  }

  const response = NextResponse.redirect(loginUrl)
  response.cookies.set("accessToken", "", { ...expiredCookie, httpOnly: true })
  response.cookies.set("refreshToken", "", { ...expiredCookie, httpOnly: true })
  response.cookies.set("accessTokenClient", "", expiredCookie)
  return response
}
