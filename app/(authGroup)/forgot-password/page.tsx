import { Suspense } from "react"
import type { Metadata } from "next"
import { RouteLoading } from "@/components/shared/route-loading"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = { title: "Forgot Password" }

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<RouteLoading className="min-h-[40vh]" />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}