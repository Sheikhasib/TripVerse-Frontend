"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { verifyEmailSchema, type TVerifyEmailSchema } from "@/lib/validations/auth"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { decodeJwtPayload } from "@/utils/token"
import { sentAtNow } from "@/utils/sent-at"
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

// Mirrors the server's OTP_EXPIRATION_SECONDS (5 min Redis TTL).
const OTP_TTL_MS = 5 * 60 * 1000

type TVerifyEmailCardProps = {
  email: string
  sentAt?: number
  // Register phase 2 passes this to return to phase 1; standalone /verify-email
  // omits it and gets a link to /register instead.
  onRestart?: () => void
}

const VerifyEmailCard = ({ email, sentAt, onRestart }: TVerifyEmailCardProps) => {
  const afterAuth = useAfterAuth()
  const [stale, setStale] = useState(false)
  const { secondsLeft, resending, resend } = useOtpResend(
    (resendEmail) => authApi.resendVerification({ email: resendEmail }),
    email,
    "A new verification code has been sent.",
    sentAt,
  )

  // The staged registration shares the OTP's 5-minute TTL; past it, resend no-ops
  // silently (uniform 200), so warn instead of letting the false-success toast mislead.
  useEffect(() => {
    if (sentAt == null) return undefined
    const check = () => setStale(sentAtNow() - sentAt > OTP_TTL_MS)
    check()
    const id = setInterval(check, 1000)
    return () => clearInterval(id)
  }, [sentAt])

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
        <div className="mt-2 text-xs text-muted-foreground">
          {stale ? "This code may have expired — " : "Wrong email? "}
          {onRestart ? (
            <button
              type="button"
              onClick={onRestart}
              className="font-medium text-primary hover:underline"
            >
              Start over
            </button>
          ) : (
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Start over
            </Link>
          )}
        </div>
      </div>
    </AuthCard>
  )
}

export { VerifyEmailCard }
