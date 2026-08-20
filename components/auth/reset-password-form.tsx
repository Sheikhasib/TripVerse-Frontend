"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Eye, EyeSlash, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import {
  resetPasswordFormSchema,
  type TResetPasswordFormSchema,
} from "@/lib/validations/auth"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { useCountdown } from "@/hooks/use-countdown"
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
import { OtpInput } from "./otp-input"

const RESEND_SECONDS = 60

type TResetPasswordFormProps = {
  email: string
}

const ResetPasswordForm = ({ email }: TResetPasswordFormProps) => {
  const router = useRouter()
  const { secondsLeft, start } = useCountdown(RESEND_SECONDS)
  const [showPassword, setShowPassword] = useState(false)
  const [resending, setResending] = useState(false)

  const form = useForm<TResetPasswordFormSchema>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { email, otp: "", newPassword: "", confirmPassword: "" },
  })

  // The OTP was just sent by the forgot step — lock resend for the first 60s.
  useEffect(() => {
    start()
  }, [start])

  const onSubmit = async (values: TResetPasswordFormSchema) => {
    try {
      await authApi.resetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      })
      toast.success("Password reset — please log in with your new password")
      router.replace("/login")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.forgotPassword({ email })
      toast.success("A new reset code has been sent.")
      start()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      description={`Enter the 6-digit code sent to ${email}`}
      footer={
        <>
          Remembered it?{" "}
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
                <FormLabel>Reset code</FormLabel>
                <FormControl>
                  <OtpInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="pr-10"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeSlash className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
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
            Reset password
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm">
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

export { ResetPasswordForm }