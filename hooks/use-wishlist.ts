"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cookieUtils } from "@/utils/cookies"
import { wishlistApi } from "@/lib/api/wishlist"

const WISHLIST_PAGE_SIZE = 10

// Membership probe limit — the server caps page size at 50 and offers no
// single-id "is this saved?" endpoint, so membership is derived from page 1.
export const WISHLIST_MEMBERSHIP_LIMIT = 50

export const useWishlist = ({ page }: { page: number }) =>
  useQuery({
    queryKey: ["wishlist", page],
    queryFn: () =>
      wishlistApi.getMyWishlist({ page, limit: WISHLIST_PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

// Best-effort by design: a package saved on page 2+ of a >50-item wishlist
// reads as unsaved here until the user opens the wishlist page itself. There
// is no server endpoint to check a single id (Step 16).
export const useWishlistSaved = (packageId: string) => {
  const hasToken = Boolean(cookieUtils.getCookie("accessTokenClient"))

  return useQuery({
    queryKey: ["wishlist-saved", packageId],
    queryFn: async () => {
      const { data } = await wishlistApi.getMyWishlist({
        page: 1,
        limit: WISHLIST_MEMBERSHIP_LIMIT,
      })
      return data.some((item) => item.packageId === packageId)
    },
    enabled: hasToken,
    staleTime: 30 * 1000,
  })
}

// Both mutations invalidate the list pages AND every saved-membership probe,
// so a heart toggled on the detail page stays in sync with cards elsewhere.
const invalidateWishlistKeys = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["wishlist"] })
  queryClient.invalidateQueries({ queryKey: ["wishlist-saved"] })
}

export const useAddToWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: wishlistApi.addToWishlist,
    onSuccess: () => invalidateWishlistKeys(queryClient),
  })
}

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: wishlistApi.removeFromWishlist,
    onSuccess: () => invalidateWishlistKeys(queryClient),
  })
}
