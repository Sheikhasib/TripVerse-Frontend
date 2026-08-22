"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { PencilSimple, Star, Trash } from "@phosphor-icons/react";
import { reviewsApi, type TReview } from "@/lib/api/reviews";
import { Rating } from "@/components/shared/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { RouteLoading } from "@/components/shared/route-loading";
import { PaginationPages } from "@/components/shared/pagination";
import { ReviewEditDialog } from "@/components/review/review-edit-dialog";
import { ReviewDeleteDialog } from "@/components/review/review-delete-dialog";
import { useMe } from "@/hooks/use-me";

interface ReviewListProps {
  packageId: string;
}

const PAGE_LIMIT = 10;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

export function ReviewList({ packageId }: ReviewListProps) {
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<TReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TReview | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { user: me } = useMe();

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", packageId, page],
    queryFn: () =>
      reviewsApi.getReviews(packageId, { page, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  });

  const reviews: TReview[] = data?.data ?? [];
  const totalPages = Math.max(1, data?.meta?.totalPages ?? 1);

  // Deleting the last row of a non-first page would leave an empty page; walk
  // back so the list doesn't collapse into the global empty state.
  const handleDeleted = () => {
    if (reviews.length === 1 && page > 1) {
      setPage((current) => current - 1);
    }
  };

  if (isLoading && reviews.length === 0) {
    return <RouteLoading className="min-h-60" />;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<Star size={36} />}
        title="No reviews yet"
        description="Be the first to share your experience of this package."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            canEdit={Boolean(me && me.id === review.user.id)}
            canDelete={Boolean(
              me && (me.id === review.user.id || me.role === "ADMIN"),
            )}
            onEdit={() => {
              setEditTarget(review);
              setEditOpen(true);
            }}
            onDelete={() => {
              setDeleteTarget(review);
              setDeleteOpen(true);
            }}
          />
        ))}
      </div>
      <PaginationPages
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Kept mounted while closed so Radix exit animations play; each open
          replaces the target before flipping open. */}
      <ReviewEditDialog
        review={editTarget}
        packageId={packageId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ReviewDeleteDialog
        review={deleteTarget}
        packageId={packageId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

function ReviewItem({
  review,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  review: TReview;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1">
            {canEdit && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onEdit}
                aria-label="Edit review"
                title="Edit review"
                className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
              >
                <PencilSimple size={16} />
              </motion.button>
            )}
            {canDelete && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onDelete}
                aria-label="Delete review"
                title="Delete review"
                className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash size={16} />
              </motion.button>
            )}
          </div>
        )}
        <Rating value={review.rating} />
      </div>
      {review.comment && (
        <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {review.comment}
        </blockquote>
      )}
    </figure>
  );
}
