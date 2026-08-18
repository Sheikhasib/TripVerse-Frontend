import { Suspense } from "react"
import type { Metadata } from "next"
import { RouteLoading } from "@/components/shared/route-loading"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Login" }

export default function LoginPage() {
  return (
    <Suspense fallback={<RouteLoading className="min-h-[40vh]" />}>
      <LoginForm />
    </Suspense>
  )
}
