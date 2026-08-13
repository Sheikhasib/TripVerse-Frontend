import { z } from "zod"

// Mirrors server contact.validation.ts createMessageSchema (strict object).
export const contactSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.email({ message: "Please provide a valid email address" }).trim(),
  subject: z
    .string({ message: "Subject is required" })
    .trim()
    .min(2, "Subject must be at least 2 characters")
    .max(200, "Subject must be at most 200 characters"),
  message: z
    .string({ message: "Message is required" })
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be at most 2000 characters"),
})
export type TContactSchema = z.infer<typeof contactSchema>

// Mirrors server user.validation.ts updateProfileSchema (password change is a
// separate concern handled in the dashboard; profile page edits identity only).
export const profileSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .trim()
    .url("Please provide a valid image URL")
    .optional()
    .or(z.literal("")),
})
export type TProfileSchema = z.infer<typeof profileSchema>