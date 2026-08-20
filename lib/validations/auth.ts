import { z } from "zod"

export const roleSchema = z.enum(["USER", "AGENT", "ADMIN"])
export type TRole = z.infer<typeof roleSchema>

export const registerSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.email({ message: "Please provide a valid email" }).trim(),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be at most 72 characters"),
  phone: z.string().max(20, "Phone number is too long").optional(),
  role: roleSchema.optional(),
})
export type TRegisterSchema = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.email({ message: "Please provide a valid email" }).trim(),
  password: z.string({ message: "Password is required" }).min(1),
})
export type TLoginSchema = z.infer<typeof loginSchema>

export const googleLoginSchema = z.object({
  idToken: z.string({ message: "Google idToken is required" }).min(1),
})

export const demoLoginSchema = z.object({
  role: roleSchema,
})
export type TDemoLoginSchema = z.infer<typeof demoLoginSchema>

const emailField = z.email({ message: "Please provide a valid email" }).trim()

export const otpSchema = z
  .string({ message: "OTP is required" })
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits")

export const verifyEmailSchema = z.object({
  email: emailField,
  otp: otpSchema,
})
export type TVerifyEmailSchema = z.infer<typeof verifyEmailSchema>

export const resendSchema = z.object({
  email: emailField,
})
export type TResendSchema = z.infer<typeof resendSchema>

export const forgotPasswordSchema = z.object({
  email: emailField,
})
export type TForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  email: emailField,
  otp: otpSchema,
  newPassword: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be at most 72 characters"),
})
export type TResetPasswordSchema = z.infer<typeof resetPasswordSchema>

// Client-only — the confirm field is never sent to the server.
export const resetPasswordFormSchema = resetPasswordSchema
  .extend({
    confirmPassword: z.string({ message: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type TResetPasswordFormSchema = z.infer<typeof resetPasswordFormSchema>