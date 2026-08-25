import { apiClient, apiClientFull } from "./client"
import type { TBookingStatus } from "./bookings"
import {
  DOCS_BACKED_CATEGORIES,
  REFUND_REASON_CATEGORIES,
} from "@/lib/validations/refund"
import type {
  TCreateRefundSchema,
  TRefundDecisionSchema,
} from "@/lib/validations/refund"

export type TRefundReasonCategory = (typeof REFUND_REASON_CATEGORIES)[number]

export type TRefundRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REFUNDED"

// Narrow booking shape returned by the refund endpoints (full scalars + the
// package select the server applies).
export type TRefundBookingRef = {
  id: string
  status: TBookingStatus
  travelDate: string
  travelers: number
  totalPrice: number
  package: {
    id: string
    title: string
    slug: string
    location: string
    images: string[]
  }
}

export type TRefundRequest = {
  id: string
  bookingId: string
  userId: string
  category: TRefundReasonCategory
  reason: string
  evidenceUrl?: string | null
  // Policy snapshot taken at submission — immutable after create.
  daysBeforeTravel: number
  suggestedPercentage: number
  status: TRefundRequestStatus
  approvedPercentage?: number | null
  refundAmount?: number | null
  reviewNote?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  booking: TRefundBookingRef
  user?: { id: string; name: string; email: string }
  reviewer?: { id: string; name: string; email: string } | null
}

export type TRefundQuery = {
  page?: number
  limit?: number
  status?: TRefundRequestStatus
}

export type TRefundDecisionResult = {
  refundRequest: TRefundRequest
  payout?:
    | { status: "SUCCESS"; refundedTotal: number }
    | { status: "FAILED"; message: string }
}

export const REFUND_CATEGORY_LABELS: Record<TRefundReasonCategory, string> = {
  MEDICAL_EMERGENCY: "Medical emergency",
  BEREAVEMENT: "Bereavement",
  VISA_REJECTION: "Visa rejection",
  FORCE_MAJEURE: "Force majeure",
  CHANGE_OF_PLANS: "Change of plans",
}

// Whole days between today and the travel date, UTC-midnight math like the
// server's toUTCMidnight helper — goes negative once travel has passed.
export const daysUntilTravel = (travelDate: string): number => {
  const toUtcMidnight = (value: string) => {
    const date = new Date(value)
    return Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    )
  }
  return Math.floor((toUtcMidnight(travelDate) - toUtcMidnight(new Date().toISOString())) / 86_400_000)
}

// Display-only replica of the server's suggestRefundPercentage so forms and
// tooltips can preview a tier without an API call — the snapshot the server
// returns at submission always wins over anything computed here.
export const suggestRefundPercentage = (
  category: TRefundReasonCategory,
  daysBeforeTravel: number,
): number => {
  if ((DOCS_BACKED_CATEGORIES as readonly string[]).includes(category)) {
    return 100
  }
  if (daysBeforeTravel >= 30) return 90
  if (daysBeforeTravel >= 15) return 50
  if (daysBeforeTravel >= 7) return 25
  return 0
}

const buildQuery = (params: TRefundQuery = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  if (params.status) query.set("status", params.status)
  return query.toString()
}

const createRefundRequest = (payload: TCreateRefundSchema) =>
  apiClient<TRefundRequest>("/api/refunds", {
    method: "POST",
    body: payload,
  })

const getMyRefundRequests = async (params: TRefundQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TRefundRequest[]>(
    `/api/refunds/mine${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const getAllRefundRequests = async (params: TRefundQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TRefundRequest[]>(
    `/api/refunds${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const decideRefundRequest = (id: string, payload: TRefundDecisionSchema) =>
  apiClient<TRefundDecisionResult>(`/api/refunds/${id}/decision`, {
    method: "PATCH",
    body: payload,
  })

const retryRefundPayout = (id: string) =>
  apiClient<TRefundDecisionResult>(`/api/refunds/${id}/retry-payout`, {
    method: "POST",
  })

export const refundsApi = {
  createRefundRequest,
  getMyRefundRequests,
  getAllRefundRequests,
  decideRefundRequest,
  retryRefundPayout,
}
