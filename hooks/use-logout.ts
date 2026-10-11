"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { authApi } from "@/lib/api/auth"

// Single logout flow for the navbar and dashboard: call the API, then clear the
// whole React Query cache so the next account on this tab never sees the
// previous user's cached data.
const useLogout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCallback(async () => {
    try {
      await authApi.logout()
      toast.success("Logged out successfully")
    } catch {
      toast.error("Failed to log out. Please try again.")
    }
    queryClient.clear()
    router.push("/login")
    router.refresh()
  }, [queryClient, router])
}

export { useLogout }
