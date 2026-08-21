"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/client"
import { useCountdown } from "@/hooks/use-countdown"
import { sentAtNow } from "@/utils/sent-at"

const RESEND_SECONDS = 60

// Shared resend UX for the OTP cards: 60s countdown after the initial send,
// no auto-resend, verbatim error surfacing, fresh countdown on success.
// `sentAt` (epoch ms, optional) seeds the first countdown from time actually
// elapsed since the OTP was emailed, so a late arrival isn't locked out for a
// full 60s. On successful resend the ?sentAt= query param is refreshed so a
// mid-countdown reload seeds from the latest send, not the original one.
const useOtpResend = (
  resendAction: (email: string) => Promise<unknown>,
  email: string,
  successMessage: string,
  sentAt?: number,
) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { secondsLeft, start } = useCountdown(RESEND_SECONDS)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (sentAt != null) {
      const elapsed = Math.floor((Date.now() - sentAt) / 1000)
      start(Math.max(0, RESEND_SECONDS - elapsed))
    } else {
      start()
    }
  }, [sentAt, start])

  const resend = useCallback(async () => {
    setResending(true)
    try {
      await resendAction(email)
      toast.success(successMessage)
      start()
      const params = new URLSearchParams(searchParams.toString())
      params.set("sentAt", String(sentAtNow()))
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      return true
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
      return false
    } finally {
      setResending(false)
    }
  }, [
    email,
    pathname,
    resendAction,
    router,
    searchParams,
    start,
    successMessage,
  ])

  return { secondsLeft, resending, resend }
}

export { useOtpResend }
