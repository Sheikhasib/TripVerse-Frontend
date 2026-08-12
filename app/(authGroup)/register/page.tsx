import { Suspense } from "react"
import type { Metadata } from "next"
import { Skeleton } from "@/components/ui/skeleton"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Register" }

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<Skeleton className="h-[34rem] w-full max-w-md" />}
    >
      <RegisterForm />
    </Suspense>
  )
}
