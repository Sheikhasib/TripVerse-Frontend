"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Package } from "@phosphor-icons/react"
import { packagesApi } from "@/lib/api/packages"
import { RouteLoading } from "@/components/shared/route-loading"
import { EmptyState } from "@/components/shared/empty-state"
import { GoBack } from "@/components/shared/go-back"
import { PackageForm } from "@/components/dashboard/package-form"

export default function AdminEditPackagePage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const { data: row, isLoading } = useQuery({
    queryKey: ["admin-package", id],
    queryFn: () => packagesApi.findAdminPackage(id),
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return <RouteLoading />
  }

  if (!row) {
    return (
      <EmptyState
        icon={<Package size={40} />}
        title="Package not found"
        description="We couldn't find that package. It may have been deleted, or the link may be out of date."
        action={
          <GoBack
            href="/admin-dashboard/packages"
            label="Back to Manage Packages"
          />
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <GoBack
        href="/admin-dashboard/packages"
        label="Back to Manage Packages"
      />
      <PackageForm mode="edit" packageRow={row} isAdmin />
    </div>
  )
}