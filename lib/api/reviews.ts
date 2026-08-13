import { apiClient, apiClientFull } from "./client"
import type { TCreateReviewSchema } from "@/lib/validations/review"

export type TReview = {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  updatedAt: string
  user: { name: string; avatarUrl?: string | null }
}

export type TReviewQuery = {
  page?: number
  limit?: number
}

const buildQuery = (params: TReviewQuery = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  return query.toString()
}

const getReviews = async (packageId: string, params: TReviewQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TReview[]>(
    `/api/reviews/package/${packageId}${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const createReview = async (payload: TCreateReviewSchema) => {
  const envelope = await apiClientFull<TReview>("/api/reviews", {
    method: "POST",
    body: payload,
  })
  return envelope.data
}

export const reviewsApi = {
  getReviews,
  createReview,
}