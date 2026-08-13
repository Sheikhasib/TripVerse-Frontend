import { z } from "zod"

export const createReviewSchema = z.object({
  packageId: z
    .string({ message: "Package id is required" })
    .min(1, "Package id must not be empty"),
  rating: z
    .number({ message: "Rating is required" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string({ message: "Comment is required" })
    .trim()
    .min(1, "Comment must not be empty")
    .max(1000, "Comment must be at most 1000 characters"),
})
export type TCreateReviewSchema = z.infer<typeof createReviewSchema>