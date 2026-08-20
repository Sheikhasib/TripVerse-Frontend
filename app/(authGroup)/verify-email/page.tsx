import { Suspense } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { RouteLoading } from "@/components/shared/route-loading"
import { VerifyEmailCard } from "@/components/auth/verify-email-card"

export const metadata: Metadata = { title: "Verify Email" }

type TVerifyEmailPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyEmailPage({
  searchParams,
}: TVerifyEmailPageProps) {
  const { email } = await searchParams
  if (!email) {
    redirect("/register")
  }
  return (
    <Suspense fallback={<RouteLoading className="min-h-[40vh]" />}>
      <VerifyEmailCard email={email} />
    </Suspense>
  )
}