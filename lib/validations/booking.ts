import { z } from "zod"

// Mirrors server booking.validation.ts createSchema. travelDate is sent as a
// plain "YYYY-MM-DD" string from the native date input; the server coerces it.
export const createBookingSchema = z.object({
  packageId: z
    .string({ message: "Package id is required" })
    .min(1, "Package id must not be empty"),
  travelDate: z
    .string({ message: "Travel date is required" })
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Travel date must be a valid date",
    })
    .refine((value) => {
      const travelDay = new Date(value)
      const today = new Date()
      const travelUtc = new Date(
        Date.UTC(
          travelDay.getUTCFullYear(),
          travelDay.getUTCMonth(),
          travelDay.getUTCDate(),
        ),
      ).getTime()
      const todayUtc = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
      ).getTime()
      return travelUtc >= todayUtc
    }, { message: "Travel date cannot be in the past." }),
  travelers: z
    .number({ message: "Travelers is required" })
    .int("Travelers must be a whole number")
    .min(1, "Travelers must be at least 1")
    .max(20, "Travelers must be at most 20"),
})
export type TCreateBookingSchema = z.infer<typeof createBookingSchema>
