import { Suspense } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { RouteLoading } from "@/components/shared/route-loading"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = { title: "Reset Password" }

type TResetPasswordPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function ResetPasswordPage({
  searchParams,
}: TResetPasswordPageProps) {
  const { email } = await searchParams
  if (!email) {
    redirect("/forgot-password")
  }
  return (
    <Suspense fallback={<RouteLoading className="min-h-[40vh]" />}>
      <ResetPasswordForm email={email} />
    </Suspense>
  )
}