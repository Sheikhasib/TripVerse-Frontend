"use client"

import { useState } from "react"
import { Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { decodeJwtPayload } from "@/utils/token"
import { useAfterAuth } from "./use-after-auth"
import type { TRole } from "@/lib/validations/auth"

const DEMO_ROLES: TRole[] = ["USER", "AGENT", "ADMIN"]

const DemoLoginButtons = () => {
  const afterAuth = useAfterAuth()
  const [pendingRole, setPendingRole] = useState<TRole | null>(null)

  const handleDemo = async (role: TRole) => {
    setPendingRole(role)
    try {
      const data = await authApi.demoLogin({ role })
      const decodedRole = (decodeJwtPayload(data.accessToken)?.role as string) ??
        "USER"
      afterAuth(
        data.accessToken,
        decodedRole,
        `Demo ${role.charAt(0) + role.slice(1).toLowerCase()} logged in`,
      )
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    } finally {
      setPendingRole(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {DEMO_ROLES.map((role) => (
        <Button
          key={role}
          type="button"
          variant="outline"
          disabled={pendingRole !== null}
          onClick={() => handleDemo(role)}
        >
          {pendingRole === role ? (
            <Spinner className="size-4 animate-spin" />
          ) : null}
          Demo {role.charAt(0) + role.slice(1).toLowerCase()}
        </Button>
      ))}
    </div>
  )
}

export { DemoLoginButtons }
