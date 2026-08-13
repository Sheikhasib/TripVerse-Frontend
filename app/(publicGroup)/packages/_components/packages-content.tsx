"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { packagesApi } from "@/lib/api/packages"
import { parsePackageQuery } from "@/lib/api/queryParams"
import { PackageFilters } from "./package-filters"
import { PackageGrid } from "./package-grid"
import { PaginationPages } from "@/components/shared/pagination"
import type { TPublicPackage, TPublicPackageQuery } from "@/lib/api/packages"

interface PackagesContentProps {
  initialParams: TPublicPackageQuery
  initialData: TPublicPackage[]
  initialTotalPages: number
  categories: { slug: string; name: string }[]
}

const PAGE_LIMIT = 12

export function PackagesContent({
  initialParams,
  initialData,
  initialTotalPages,
  categories,
}: PackagesContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const params: TPublicPackageQuery = {
    ...initialParams,
    ...parsePackageQuery(searchParams),
  }
  const page = params.page ?? 1

  const { data, isLoading } = useQuery({
    queryKey: ["packages", params],
    queryFn: () => packagesApi.getList({ ...params, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  })

  const packages = data?.data ?? initialData
  const totalPages = Math.max(1, data?.meta?.totalPages ?? initialTotalPages)

  const handleParamsChange = useCallback(
    (patch: Partial<TPublicPackageQuery>) => {
      const next = new URLSearchParams(searchParams.toString())
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      })
      next.delete("page")
      const qs = next.toString()
      router.push(`/packages${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [router, searchParams],
  )

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(searchParams.toString())
      if (nextPage <= 1) {
        next.delete("page")
      } else {
        next.set("page", String(nextPage))
      }
      const qs = next.toString()
      router.push(`/packages${qs ? `?${qs}` : ""}`, { scroll: true })
    },
    [router, searchParams],
  )

  return (
    <div className="space-y-8">
      <PackageFilters
        params={params}
        categories={categories}
        onParamsChange={handleParamsChange}
      />
      <PackageGrid packages={packages} isLoading={isLoading} />
      <PaginationPages
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}