import { apiClient } from "./client"
import type { TMeta } from "./client"

export type TCategory = {
  id: string
  name: string
  slug: string
  _count?: { packages: number }
}

export type TAgentPublic = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type TPublicPackage = {
  id: string
  title: string
  slug: string
  description: string
  location: string
  price: number
  duration: number
  images: string[]
  rating: number
  category: TCategory
  agent?: TAgentPublic | null
  createdAt?: string
  updatedAt?: string
}

export type TPublicPackageQuery = {
  search?: string
  category?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  maxDuration?: number
  sortBy?: "newest" | "price" | "rating" | "title"
  sortOrder?: "asc" | "desc"
  page?: number
  limit?: number
}

export type TReview = {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: { name: string; avatarUrl?: string | null }
}

const getList = (params: TPublicPackageQuery = {}) => {
  const query = new URLSearchParams()
  if (params.search) query.set("search", params.search)
  if (params.category) query.set("category", params.category)
  if (params.location) query.set("location", params.location)
  if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice))
  if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice))
  if (params.minRating !== undefined) query.set("minRating", String(params.minRating))
  if (params.maxDuration !== undefined)
    query.set("maxDuration", String(params.maxDuration))
  if (params.sortBy) query.set("sortBy", params.sortBy)
  if (params.sortOrder) query.set("sortOrder", params.sortOrder)
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))

  const qs = query.toString()
  return apiClient<{ data: TPublicPackage[]; meta: TMeta }>(
    `/api/packages${qs ? `?${qs}` : ""}`,
  )
}

const getBySlug = (slug: string) =>
  apiClient<TPublicPackage>(`/api/packages/${slug}`)

const getCategories = () => apiClient<TCategory[]>("/api/categories")

const getReviews = (packageId: string, params: { page?: number; limit?: number } = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  const qs = query.toString()
  return apiClient<{ data: TReview[]; meta: TMeta }>(
    `/api/reviews/package/${packageId}${qs ? `?${qs}` : ""}`,
  )
}

export const packagesApi = {
  getList,
  getBySlug,
  getCategories,
  getReviews,
}