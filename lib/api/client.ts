import { cookieUtils } from "@/utils/cookies"

export type TMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type TApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data: T
  meta?: TMeta
}

export class ApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
  }
}

export type TOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null
}

const isServer = () => typeof window === "undefined"

// Server-side calls hit the backend directly; client-side calls stay
// same-origin through the next.config.ts rewrites() proxy (Step 1).
const getBaseUrl = () =>
  isServer() ? (process.env.BACKEND_API_URL ?? "") : ""

const isJsonBody = (body: TOptions["body"]) =>
  body != null &&
  typeof body !== "string" &&
  !(body instanceof FormData) &&
  !(body instanceof Blob)

const resolveBody = (body: TOptions["body"]) =>
  isJsonBody(body) ? JSON.stringify(body) : body

const buildHeaders = (options: TOptions, token: string | undefined) => {
  const headers = new Headers(options.headers)

  if (isJsonBody(options.body)) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return headers
}

const request = async <T>(
  path: string,
  options: TOptions = {},
): Promise<TApiEnvelope<T>> => {
  const token = isServer()
    ? undefined
    : cookieUtils.getCookie("accessTokenClient")

  const base = getBaseUrl()
  const url = path.startsWith("http") ? path : `${base}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: buildHeaders(options, token),
      body: resolveBody(options.body) as BodyInit | null | undefined,
    })
  } catch {
    throw new ApiError(0, "Network error. Please check your connection.")
  }

  // 204 No Content carries no body to parse — treat it as a success envelope
  // (the wishlist DELETE answers 204; see Step 16).
  if (res.status === 204) {
    return {
      success: true,
      statusCode: 204,
      message: "No content",
      data: null,
    } as TApiEnvelope<T>
  }

  let envelope: TApiEnvelope<T>
  try {
    envelope = (await res.json()) as TApiEnvelope<T>
  } catch {
    throw new ApiError(res.status, `Request failed with status ${res.status}`)
  }

  if (!res.ok || envelope.success === false) {
    throw new ApiError(
      envelope.statusCode ?? res.status,
      envelope.message ?? "Something went wrong.",
    )
  }

  return envelope
}

export const apiClient = async <T>(path: string, options?: TOptions) =>
  (await request<T>(path, options)).data

export const apiClientFull = async <T>(path: string, options?: TOptions) =>
  request<T>(path, options)
