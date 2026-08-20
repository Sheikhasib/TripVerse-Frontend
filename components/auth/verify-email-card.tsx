"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { verifyEmailSchema, type TVerifyEmailSchema } from "@/lib/validations/auth"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { decodeJwtPayload } from "@/utils/token"
import { useOtpResend } from "@/hooks/use-otp-resend"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { AuthCard } from "./auth-card"
import { OtpInput } from "./otp-input"
import { useAfterAuth } from "./use-after-auth"

type TVerifyEmailCardProps = {
  email: string
}

const VerifyEmailCard = ({ email }: TVerifyEmailCardProps) => {
  const afterAuth = useAfterAuth()
  const { secondsLeft, resending, resend } = useOtpResend(
    (resendEmail) => authApi.resendVerification({ email: resendEmail }),
    email,
    "A new verification code has been sent.",
  )

  const form = useForm<TVerifyEmailSchema>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email, otp: "" },
  })

  const onSubmit = async (values: TVerifyEmailSchema) => {
    try {
      const data = await authApi.verifyEmail(values)
      const role = (decodeJwtPayload(data.accessToken)?.role as string) ?? "USER"
      afterAuth(data.accessToken, role, "Email verified — welcome to TripVerse")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  const handleResend = async () => {
    const ok = await resend()
    if (ok) {
      form.setValue("otp", "")
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      description={`Enter the 6-digit code sent to ${email}`}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification code</FormLabel>
                <FormControl>
                  <OtpInput {...field} />
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
            Verify email
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm" aria-live="polite">
        {secondsLeft > 0 ? (
          <span className="text-muted-foreground">
            Resend code in {secondsLeft}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>
    </AuthCard>
  )
}

export { VerifyEmailCard }
