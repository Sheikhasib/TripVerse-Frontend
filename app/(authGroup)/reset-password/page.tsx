import { Suspense } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { RouteLoading } from "@/components/shared/route-loading"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { parseSentAt } from "@/utils/sent-at"

export const metadata: Metadata = { title: "Reset Password" }

type TResetPasswordPageProps = {
  searchParams: Promise<{ email?: string; sentAt?: string }>
}

export default async function ResetPasswordPage({
  searchParams,
}: TResetPasswordPageProps) {
  const sp = await searchParams
  if (!sp.email) {
    redirect("/forgot-password")
  }
  return (
    <Suspense fallback={<RouteLoading className="min-h-[40vh]" />}>
      <ResetPasswordForm email={sp.email} sentAt={parseSentAt(sp.sentAt)} />
    </Suspense>
  )
}