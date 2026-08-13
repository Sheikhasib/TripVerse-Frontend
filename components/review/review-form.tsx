"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import Link from "next/link"
import { useMe } from "@/hooks/use-me"
import { reviewsApi } from "@/lib/api/reviews"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@phosphor-icons/react"

export function ReviewForm({ packageId }: { packageId: string }) {
  const router = useRouter()
  const { user, isLoading: userLoading } = useMe()
  const [rating, setRating] = useState(1)
  const [comment, setComment] = useState("")

  const onSubmit = async () => {
    try {
      await reviewsApi.createReview({ packageId, rating, comment })
      toast.success("Review submitted.")
      router.push(`/packages/${packageId}`)
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Something went wrong.")
      } else {
        toast.error("Something went wrong.")
      }
    }
  }

  if (userLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Spinner className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="border rounded-lg bg-card p-6 text-center">
        <h3 className="text-lg font-semibold">Sign in to review</h3>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to leave a review.</p>
        <Button onClick={() => router.push("/login?redirectTo=/packages")}>Sign in</Button>
      </div>
    )
  }

  if (user?.role !== "USER") {
    return (
      <div className="border rounded-lg bg-card p-6 text-center">
        <h3 className="text-lg font-semibold">Review not available</h3>
        <p className="mt-2 text-sm text-muted-foreground">Only users can review.</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-lg bg-card space-y-4">
      <h3 className="text-lg font-semibold">Leave a review</h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            required
            className="w-full p-2 border rounded"
          >
            <option value="1">1 star - Poor</option>
            <option value="2">2 stars - Fair</option>
            <option value="3">3 stars - Average</option>
            <option value="4">4 stars - Good</option>
            <option value="5">5 stars - Excellent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full p-2 border rounded resize-y"
          ></textarea>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => router.push(`/packages/${packageId}`)}>
            Cancel
          </Button>
          <Button type="submit">Submit review</Button>
        </div>
      </form>
    </div>
  )
}