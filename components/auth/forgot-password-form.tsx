"use client"

import Link from "next/link"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import {
  forgotPasswordSchema,
  type TForgotPasswordSchema,
} from "@/lib/validations/auth"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { AuthCard } from "./auth-card"

const ForgotPasswordForm = () => {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const form = useForm<TForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: TForgotPasswordSchema) => {
    try {
      await authApi.forgotPassword(values)
      setSubmittedEmail(values.email)
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  if (submittedEmail) {
    const resetUrl = `/reset-password?email=${encodeURIComponent(submittedEmail)}`
    return (
      <AuthCard
        title="Check your email"
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to login
          </Link>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            If an account with that email exists, a password reset OTP has been
            sent.
          </p>
          <Button asChild className="w-full">
            <Link href={resetUrl}>I have a code</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t get it? Try again or check your spam folder.
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset code"
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Spinner className="size-4 animate-spin" />
            ) : null}
            Send reset code
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}

export { ForgotPasswordForm }