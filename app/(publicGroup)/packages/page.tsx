import { packagesApi } from "@/lib/api/packages"
import { parsePackageQuery } from "@/lib/api/queryParams"
import { PackagesContent } from "./_components/packages-content"
import type { TPublicPackageQuery } from "@/lib/api/packages"

export const dynamic = "force-dynamic"

const PAGE_LIMIT = 12

async function getCategories() {
  try {
    const categories = await packagesApi.getCategories()
    return categories.map((category) => ({
      slug: category.slug,
      name: category.name,
    }))
  } catch {
    return []
  }
}

async function getPackages(params: TPublicPackageQuery) {
  try {
    const res = await packagesApi.getList({ ...params, limit: PAGE_LIMIT })
    return { data: res.data ?? [], totalPages: res.meta?.totalPages ?? 1 }
  } catch {
    return { data: [], totalPages: 1 }
  }
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const initialParams = parsePackageQuery(
    new URLSearchParams(
      Object.entries(sp).flatMap(([key, value]) =>
        typeof value === "string" ? [[key, value]] : [],
      ),
    ),
  )
  if (!initialParams.page) initialParams.page = 1

  const [initial, categories] = await Promise.all([
    getPackages(initialParams),
    getCategories(),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Browse Packages</h1>
        <p className="mt-2 text-muted-foreground">
          Find your perfect escape from our curated tours
        </p>
      </div>
      <PackagesContent
        initialParams={initialParams}
        initialData={initial.data}
        initialTotalPages={initial.totalPages}
        categories={categories}
      />
    </div>
  )
}