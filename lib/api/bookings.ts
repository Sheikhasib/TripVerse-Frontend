import { apiClient, apiClientFull } from "./client"
import type { TCreateBookingSchema } from "@/lib/validations/booking"

export type TPaymentStatus =
  | "INITIATED"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"

export type TPayment = {
  id: string
  tranId: string
  amount: number
  currency: string
  status: TPaymentStatus
  cardType?: string | null
  bankTranId?: string | null
  valId?: string | null
  paidAt?: string | null
  refundRefId?: string | null
  refundInitiatedAt?: string | null
  refundCompletedAt?: string | null
}

export type TBookingStatus =
  | "PENDING"
  | "PAID"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"

export type TBookingPackage = {
  id: string
  title: string
  slug: string
  location: string
  images: string[]
  price: number
  agentId?: string
}

export type TBookingUser = { id: string; name: string; email: string }

export type TBooking = {
  id: string
  userId: string
  packageId: string
  travelDate: string
  travelers: number
  totalPrice: number
  status: TBookingStatus
  createdAt: string
  updatedAt: string
  package: TBookingPackage
  user?: TBookingUser
  payments?: TPayment[]
  refund?: { status: "SUCCESS" } | { status: "FAILED"; message: string }
}

export type TBookingQuery = {
  page?: number
  limit?: number
  status?: TBookingStatus
  search?: string
}

// ── Internal (authenticated) booking API ──────────────────────────────────
// Runs client-side through the same-origin /api rewrite so the browser's auth
// cookies reach the backend (server components send no token).

const buildQuery = (params: TBookingQuery = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  if (params.status) query.set("status", params.status)
  if (params.search) query.set("search", params.search)
  return query.toString()
}

const getMyBookings = async (params: TBookingQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TBooking[]>(
    `/api/bookings/my-bookings${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const getAgentBookings = async (params: TBookingQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TBooking[]>(
    `/api/bookings/agent-bookings${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const getAllBookings = async (params: TBookingQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TBooking[]>(
    `/api/bookings${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const getBookingById = (id: string) => apiClient<TBooking>(`/api/bookings/${id}`)

const createBooking = (payload: TCreateBookingSchema) =>
  apiClient<TBooking>("/api/bookings", {
    method: "POST",
    body: payload,
  })

const updateBookingStatus = (id: string, status: TBookingStatus) =>
  apiClient<TBooking>(`/api/bookings/${id}/status`, {
    method: "PATCH",
    body: { status },
  })

export const bookingsApi = {
  getMyBookings,
  getAgentBookings,
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
}