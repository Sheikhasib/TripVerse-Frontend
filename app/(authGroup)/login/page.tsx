import { Suspense } from "react"
import type { Metadata } from "next"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Login" }

export default function LoginPage() {
  return (
    <Suspense
      fallback={<Skeleton className="h-96 w-full max-w-md" />}
    >
      <LoginForm />
    </Suspense>
  )
}
