"use client"

import { useEffect, useRef, useState } from "react"
import { Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { decodeJwtPayload } from "@/utils/token"
import { useAfterAuth } from "./use-after-auth"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (element: HTMLElement, options?: unknown) => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client"

const GoogleButton = () => {
  const afterAuth = useAfterAuth()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current || loaded) {
      return
    }

    const script = document.createElement("script")
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setPending(true)
          try {
            const data = await authApi.googleLogin(response.credential)
            const role = (decodeJwtPayload(data.accessToken)?.role as string) ??
              "USER"
            afterAuth(data.accessToken, role, "Logged in with Google")
          } catch (error) {
            toast.error(
              error instanceof ApiError ? error.message : "Something went wrong.",
            )
          } finally {
            setPending(false)
          }
        },
      })

      if (buttonRef.current) {
        window.google?.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          shape: "rectangular",
          text: "continue_with",
        })
      }
      setLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [afterAuth, loaded])

  if (!GOOGLE_CLIENT_ID) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonRef} className="min-h-10 w-full" />
      {pending ? <Spinner className="size-4 animate-spin text-muted-foreground" /> : null}
    </div>
  )
}

export { GoogleButton }
