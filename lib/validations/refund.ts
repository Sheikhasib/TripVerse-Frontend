import { z } from "zod"

export const REFUND_REASON_CATEGORIES = [
  "MEDICAL_EMERGENCY",
  "BEREAVEMENT",
  "VISA_REJECTION",
  "FORCE_MAJEURE",
  "CHANGE_OF_PLANS",
] as const

// Categories that require documentary evidence per the refund policy.
export const DOCS_BACKED_CATEGORIES = [
  "MEDICAL_EMERGENCY",
  "BEREAVEMENT",
  "VISA_REJECTION",
  "FORCE_MAJEURE",
] as const

export const REFUND_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REFUNDED",
] as const

// Mirrors server refund.validation.ts createSchema — evidence is mandatory for
// docs-backed categories, enforced here for inline errors before the API call.
export const createRefundSchema = z
  .object({
    bookingId: z
      .string({ message: "Booking id is required" })
      .min(1, "Booking id must not be empty"),
    category: z.enum(REFUND_REASON_CATEGORIES, {
      message: "Please choose a reason category",
    }),
    reason: z
      .string({ message: "Please describe your reason" })
      .trim()
      .min(20, "Please describe your reason in at least 20 characters")
      .max(2000, "Reason must be at most 2000 characters"),
    evidenceUrl: z.string().url("Evidence must be a valid URL").optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (DOCS_BACKED_CATEGORIES as readonly string[]).includes(data.category) &&
      !data.evidenceUrl
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["evidenceUrl"],
        message:
          "Supporting documents are required for this reason category.",
      })
    }
  })
export type TCreateRefundSchema = z.infer<typeof createRefundSchema>

// Mirrors server refund.validation.ts decisionSchema — a note is mandatory on
// REJECT; approvedPercentage is clamped 0–100 (the server applies its own
// override rules for docs-backed categories).
export const refundDecisionSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT"], {
      message: "Please provide a decision action",
    }),
    approvedPercentage: z
      .number({ message: "Percentage must be a number" })
      .int("Percentage must be a whole number")
      .min(0, "Percentage cannot be negative")
      .max(100, "Percentage cannot exceed 100")
      .optional(),
    reviewNote: z
      .string()
      .trim()
      .max(1000, "Review note must be at most 1000 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "REJECT" && !data.reviewNote) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewNote"],
        message: "A review note is required when rejecting a refund request.",
      })
    }
  })
export type TRefundDecisionSchema = z.infer<typeof refundDecisionSchema>
