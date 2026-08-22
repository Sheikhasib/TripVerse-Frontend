import { apiClientFull } from "./client";
import type {
  TCreateReviewSchema,
  TUpdateReviewSchema,
} from "@/lib/validations/review";

export type TReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; avatarUrl?: string | null };
};

export type TReviewQuery = {
  page?: number;
  limit?: number;
};

// POST /api/reviews returns the created review row plus the package's
// recomputed average rating. The server's create response does not include the
// review's user relation, so this is a lean subset of TReview.
export type TReviewCreated = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TCreateReviewResponse = {
  review: TReviewCreated;
  rating: number;
};

// PATCH returns the updated row (no user relation, same as create) plus the
// package's fresh average after recompute.
export type TUpdateReviewResponse = {
  review: TReviewCreated;
  rating: number;
};

export type TDeleteReviewResponse = {
  reviewId: string;
  rating: number;
};

const buildQuery = (params: TReviewQuery = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  return query.toString();
};

const getReviews = async (packageId: string, params: TReviewQuery = {}) => {
  const qs = buildQuery(params);
  const envelope = await apiClientFull<TReview[]>(
    `/api/reviews/package/${packageId}${qs ? `?${qs}` : ""}`,
  );
  return { data: envelope.data, meta: envelope.meta };
};

const createReview = async (payload: TCreateReviewSchema) => {
  const envelope = await apiClientFull<TCreateReviewResponse>("/api/reviews", {
    method: "POST",
    body: payload,
  });
  return envelope.data;
};

const updateReview = async (id: string, payload: TUpdateReviewSchema) => {
  const envelope = await apiClientFull<TUpdateReviewResponse>(
    `/api/reviews/${id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  return envelope.data;
};

const deleteReview = async (id: string) => {
  const envelope = await apiClientFull<TDeleteReviewResponse>(
    `/api/reviews/${id}`,
    { method: "DELETE" },
  );
  return envelope.data;
};

export const reviewsApi = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
};
