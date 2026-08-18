import { Suspense } from "react"
import type { Metadata } from "next"
import { RouteLoading } from "@/components/shared/route-loading"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Register" }

export default function RegisterPage() {
  return (
    <Suspense fallback={<RouteLoading className="min-h-[40vh]" />}>
      <RegisterForm />
    </Suspense>
  )
}
