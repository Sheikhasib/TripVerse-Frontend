import { apiClient, apiClientFull } from "./client"
import { cookieUtils } from "@/utils/cookies"
import type {
  TDemoLoginSchema,
  TForgotPasswordSchema,
  TLoginSchema,
  TRegisterSchema,
  TResendSchema,
  TResetPasswordSchema,
  TRole,
  TVerifyEmailSchema,
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

const register = async (payload: TRegisterSchema) => {
  const envelope = await apiClientFull<null>("/api/auth/register", {
    method: "POST",
    body: payload,
  })
  return envelope.message
}

const verifyEmail = (payload: TVerifyEmailSchema) =>
  apiClient<TLoginResult>("/api/auth/verify-email", {
    method: "POST",
    body: payload,
  })

const resendVerification = (payload: TResendSchema) =>
  apiClient<null>("/api/auth/resend-verification", {
    method: "POST",
    body: payload,
  })

const forgotPassword = (payload: TForgotPasswordSchema) =>
  apiClient<null>("/api/auth/forgot-password", {
    method: "POST",
    body: payload,
  })

const resetPassword = (payload: TResetPasswordSchema) =>
  apiClient<null>("/api/auth/reset-password", {
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

const logout = async () => {
  try {
    return await apiClient<null>("/api/auth/logout", {
      method: "POST",
    })
  } finally {
    // The backend clears the httpOnly cookies, but the client-readable
    // accessTokenClient cookie is set via document.cookie and can only be
    // cleared here.
    clearAccessTokenClient()
  }
}

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
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  demoLogin,
  googleLogin,
  logout,
  me,
  setAccessTokenClient,
  clearAccessTokenClient,
}