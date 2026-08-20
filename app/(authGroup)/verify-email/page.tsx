import { Suspense } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { RouteLoading } from "@/components/shared/route-loading"
import { VerifyEmailCard } from "@/components/auth/verify-email-card"
import { parseSentAt } from "@/utils/sent-at"

export const metadata: Metadata = { title: "Verify Email" }

type TVerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; sentAt?: string }>
}

export default async function VerifyEmailPage({
  searchParams,
}: TVerifyEmailPageProps) {
  const sp = await searchParams
  if (!sp.email) {
    redirect("/register")
  }
  return (
    <Suspense fallback={<RouteLoading className="min-h-[40vh]" />}>
      <VerifyEmailCard email={sp.email} sentAt={parseSentAt(sp.sentAt)} />
    </Suspense>
  )
}