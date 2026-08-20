"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/client"
import { useCountdown } from "@/hooks/use-countdown"

const RESEND_SECONDS = 60

// Shared resend UX for the OTP cards: 60s countdown after the initial send,
// no auto-resend, verbatim error surfacing, fresh countdown on success.
const useOtpResend = (
  resendAction: (email: string) => Promise<unknown>,
  email: string,
  successMessage: string,
) => {
  const { secondsLeft, start } = useCountdown(RESEND_SECONDS)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    start()
  }, [start])

  const resend = useCallback(async () => {
    setResending(true)
    try {
      await resendAction(email)
      toast.success(successMessage)
      start()
      return true
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
      return false
    } finally {
      setResending(false)
    }
  }, [email, resendAction, start, successMessage])

  return { secondsLeft, resending, resend }
}

export { useOtpResend }
