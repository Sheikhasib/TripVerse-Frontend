"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { reviewsApi, type TReview } from "@/lib/api/reviews"
import { Rating } from "@/components/shared/rating"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import { RouteLoading } from "@/components/shared/route-loading"
import { PaginationPages } from "@/components/shared/pagination"
import { Star } from "@phosphor-icons/react"

interface ReviewListProps {
  packageId: string
}

const PAGE_LIMIT = 10

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()

export function ReviewList({ packageId }: ReviewListProps) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", packageId, page],
    queryFn: () => reviewsApi.getReviews(packageId, { page, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  })

  const reviews: TReview[] = data?.data ?? []
  const totalPages = Math.max(1, data?.meta?.totalPages ?? 1)

  if (isLoading && reviews.length === 0) {
    return <RouteLoading className="min-h-60" />
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<Star size={36} />}
        title="No reviews yet"
        description="Be the first to share your experience of this package."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
      <PaginationPages page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function ReviewItem({ review }: { review: TReview }) {
  return (
    <figure className="rounded-lg bg-card p-5 ring-1 ring-foreground/5">
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          {review.user.avatarUrl ? (
            <AvatarImage src={review.user.avatarUrl} alt={review.user.name} />
          ) : (
            <AvatarFallback className="text-xs text-primary">
              {getInitials(review.user.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <figcaption className="text-sm font-medium">
            {review.user.name}
          </figcaption>
          <p className="text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
          </p>
        </div>
        <Rating value={review.rating} />
      </div>
      {review.comment && (
        <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {review.comment}
        </blockquote>
      )}
    </figure>
  )
}