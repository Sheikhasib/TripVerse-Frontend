"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Package } from "@phosphor-icons/react"
import { packagesApi } from "@/lib/api/packages"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { PackageForm } from "@/components/dashboard/package-form"

export default function EditPackagePage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const { data, isLoading } = useQuery({
    queryKey: ["my-packages"],
    queryFn: () => packagesApi.getMyPackages({ limit: 50 }),
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/5">
          <Skeleton className="h-10 w-72" />
          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const row = (data?.data ?? []).find((pkg) => pkg.id === id)

  if (!row) {
    return (
      <EmptyState
        icon={<Package size={40} />}
        title="Package not found"
        description="We couldn't find that package. It may have been deleted, or the link may be out of date."
        action={
          <Button asChild>
            <Link href="/agent-dashboard/my-packages">
              <ArrowLeft />
              Back to My Packages
            </Link>
          </Button>
        }
      />
    )
  }

  return <PackageForm mode="edit" packageRow={row} />
}