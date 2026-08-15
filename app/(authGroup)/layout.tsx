import { Navbar } from "@/components/shared/navbar"
import { Footer } from "@/components/shared/footer"
import { GoBack } from "@/components/shared/go-back"
import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-10">
        <GoBack href="/" label="Back to home" className="mb-6 self-start" />
        {children}
      </main>
      <Footer />
    </div>
  )
}