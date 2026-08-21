import { apiClient, apiClientFull } from "./client"
import type { TPublicPackage } from "./packages"

export type TWishlistItem = {
  id: string
  userId: string
  packageId: string
  createdAt: string
  package: TPublicPackage
}

export type TWishlistQuery = {
  page?: number
  limit?: number
}

// ── Wishlist API (USER) ───────────────────────────────────────────────────
// Runs client-side through the same-origin /api rewrite so the browser's auth
// cookies reach the backend. Save and remove are idempotent server-side.

const buildQuery = (params: TWishlistQuery = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  return query.toString()
}

const addToWishlist = (packageId: string) =>
  apiClient<TWishlistItem>("/api/wishlist", {
    method: "POST",
    body: { packageId },
  })

const getMyWishlist = async (params: TWishlistQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TWishlistItem[]>(
    `/api/wishlist${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const removeFromWishlist = (packageId: string) =>
  apiClient<null>(`/api/wishlist/${packageId}`, { method: "DELETE" })

export const wishlistApi = {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
}
