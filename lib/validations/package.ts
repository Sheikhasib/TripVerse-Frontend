import { z } from "zod"

// Mirrors server package.validation.ts createPackageSchema (strict object).
export const createPackageSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string({ message: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(10000, "Description must be at most 10000 characters"),
  location: z
    .string({ message: "Location is required" })
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(200, "Location must be at most 200 characters"),
  price: z
    .number({ message: "Price is required" })
    .positive("Price must be a positive number")
    .refine((val) => Math.round(val * 100) / 100 === val, {
      message: "Price must have at most 2 decimal places",
    }),
  duration: z
    .number({ message: "Duration is required" })
    .int("Duration must be a whole number of days")
    .min(1, "Duration must be at least 1 day"),
  categoryId: z
    .string({ message: "Category is required" })
    .min(1, "Category must not be empty"),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one image is required")
    .max(6, "At most 6 images are allowed"),
})
export type TCreatePackageSchema = z.infer<typeof createPackageSchema>

// Mirrors server package.validation.ts updatePackageSchema — partial update,
// at least one field required.
export const updatePackageSchema = z
  .object({
    title: z
      .string({ message: "Title is required" })
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must be at most 200 characters")
      .optional(),
    description: z
      .string({ message: "Description is required" })
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(10000, "Description must be at most 10000 characters")
      .optional(),
    location: z
      .string({ message: "Location is required" })
      .trim()
      .min(2, "Location must be at least 2 characters")
      .max(200, "Location must be at most 200 characters")
      .optional(),
    price: z
      .number({ message: "Price is required" })
      .positive("Price must be a positive number")
      .refine((val) => Math.round(val * 100) / 100 === val, {
        message: "Price must have at most 2 decimal places",
      })
      .optional(),
    duration: z
      .number({ message: "Duration is required" })
      .int("Duration must be a whole number of days")
      .min(1, "Duration must be at least 1 day")
      .optional(),
    categoryId: z
      .string({ message: "Category is required" })
      .min(1, "Category must not be empty")
      .optional(),
    images: z
      .array(z.string().url("Each image must be a valid URL"))
      .min(1, "At least one image is required")
      .max(6, "At most 6 images are allowed")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  })
export type TUpdatePackageSchema = z.infer<typeof updatePackageSchema>

// The form works on a superset of both — all create fields, no agentId.
export const packageFormSchema = createPackageSchema
export type TPackageFormSchema = z.infer<typeof packageFormSchema>