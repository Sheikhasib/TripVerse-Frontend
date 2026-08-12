import { apiClient } from "./client"
import { cookieUtils } from "@/utils/cookies"
import type {
  TDemoLoginSchema,
  TLoginSchema,
  TRegisterSchema,
  TRole,
} from "@/lib/validations/auth"

export type TAuthUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  avatarUrl?: string | null
  role: TRole
  status: "ACTIVE" | "SUSPENDED"
  authProvider: "CREDENTIAL" | "GOOGLE"
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

type TTokenPair = { accessToken: string; refreshToken: string }
type TLoginResult = TTokenPair & { user?: TAuthUser }

// Client-readable access token cookie, kept in sync with the httpOnly
// accessToken cookie by proxy.ts (Step 4). Used by apiClient for the
// Authorization header on client-side requests.
const ACCESS_TOKEN_CLIENT_COOKIE = "accessTokenClient"

const login = (payload: TLoginSchema) =>
  apiClient<TLoginResult>("/api/auth/login", {
    method: "POST",
    body: payload,
  })

const register = (payload: TRegisterSchema) =>
  apiClient<TAuthUser>("/api/auth/register", {
    method: "POST",
    body: payload,
  })

const demoLogin = (payload: TDemoLoginSchema) =>
  apiClient<TLoginResult>("/api/auth/demo-login", {
    method: "POST",
    body: payload,
  })

const googleLogin = (idToken: string) =>
  apiClient<TLoginResult>("/api/auth/google", {
    method: "POST",
    body: { idToken },
  })

const logout = () =>
  apiClient<null>("/api/auth/logout", {
    method: "POST",
  })

const me = () => apiClient<TAuthUser>("/api/auth/me")

const setAccessTokenClient = (accessToken: string) => {
  cookieUtils.setCookie(ACCESS_TOKEN_CLIENT_COOKIE, accessToken)
}

const clearAccessTokenClient = () => {
  cookieUtils.deleteCookie(ACCESS_TOKEN_CLIENT_COOKIE)
}

export const authApi = {
  login,
  register,
  demoLogin,
  googleLogin,
  logout,
  me,
  setAccessTokenClient,
  clearAccessTokenClient,
}