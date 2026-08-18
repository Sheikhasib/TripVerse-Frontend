"use client"

import { useEffect, useState } from "react"
import { SlidersHorizontal } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import type { TPublicPackageQuery } from "@/lib/api/packages"

interface PackageFiltersProps {
  params: TPublicPackageQuery
  categories: { slug: string; name: string }[]
  onParamsChange: (patch: Partial<TPublicPackageQuery>) => void
}

// Filter bar for the /packages listing — the destination/price/duration trio
// that the home TripFinder also drives, plus category, location, rating, and
// sort. Debounced inputs keep URL churn low.
export function PackageFilters({
  params,
  categories,
  onParamsChange,
}: PackageFiltersProps) {
  const [search, setSearch] = useState(params.search ?? "")
  const [minPrice, setMinPrice] = useState(params.minPrice?.toString() ?? "")
  const [maxPrice, setMaxPrice] = useState(params.maxPrice?.toString() ?? "")
  const [location, setLocation] = useState(params.location ?? "")
  const [maxDuration, setMaxDuration] = useState(
    params.maxDuration?.toString() ?? "",
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.search ?? "")) {
        onParamsChange({ search: search || undefined })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [search, params.search, onParamsChange])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (minPrice !== (params.minPrice?.toString() ?? "")) {
        onParamsChange({
          minPrice: minPrice ? Number(minPrice) : undefined,
        })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [minPrice, params.minPrice, onParamsChange])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (maxPrice !== (params.maxPrice?.toString() ?? "")) {
        onParamsChange({
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
        })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [maxPrice, params.maxPrice, onParamsChange])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (location !== (params.location ?? "")) {
        onParamsChange({ location: location || undefined })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [location, params.location, onParamsChange])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (maxDuration !== (params.maxDuration?.toString() ?? "")) {
        onParamsChange({
          maxDuration: maxDuration ? Number(maxDuration) : undefined,
        })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [maxDuration, params.maxDuration, onParamsChange])

  const setParam = (key: keyof TPublicPackageQuery, value: string) => {
    onParamsChange({ [key]: value || undefined } as Partial<TPublicPackageQuery>)
  }

  const hasActiveFilters = Boolean(
    search ||
      minPrice ||
      maxPrice ||
      params.category ||
      location ||
      params.minRating ||
      maxDuration,
  )

  const activeFilterCount = [
    search,
    minPrice,
    maxPrice,
    params.category,
    location,
    params.minRating,
    maxDuration,
  ].filter(Boolean).length

  const handleClearAll = () => {
    setSearch("")
    setMinPrice("")
    setMaxPrice("")
    setLocation("")
    setMaxDuration("")
    onParamsChange({
      search: undefined,
      category: undefined,
      location: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      maxDuration: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    })
  }

  const sortValue = `${params.sortBy ?? "newest"}:${params.sortOrder ?? "desc"}`

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Search
          </label>
          <Input
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-36 shrink-0">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Category
          </label>
          <select
            value={params.category ?? ""}
            onChange={(e) => setParam("category", e.target.value)}
            className="h-10 w-full cursor-pointer border-0 border-b border-b-input bg-transparent px-0 py-1 text-sm outline-none transition-colors focus-visible:border-b-ring"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-36 shrink-0">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Location
          </label>
          <Input
            placeholder="e.g. Khulna"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="w-36 shrink-0">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Min Rating
          </label>
          <select
            value={params.minRating?.toString() ?? ""}
            onChange={(e) => setParam("minRating", e.target.value)}
            className="h-10 w-full cursor-pointer border-0 border-b border-b-input bg-transparent px-0 py-1 text-sm outline-none transition-colors focus-visible:border-b-ring"
          >
            <option value="">Any</option>
            <option value="4.5">4.5 &amp; up</option>
            <option value="4">4 &amp; up</option>
            <option value="3">3 &amp; up</option>
          </select>
        </div>

        <div className="w-40 shrink-0">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Sort By
          </label>
          <select
            value={sortValue}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(":")
              onParamsChange({
                sortBy: sortBy as TPublicPackageQuery["sortBy"],
                sortOrder: sortOrder as TPublicPackageQuery["sortOrder"],
              })
            }}
            className="h-10 w-full cursor-pointer border-0 border-b border-b-input bg-transparent px-0 py-1 text-sm outline-none transition-colors focus-visible:border-b-ring"
          >
            <option value="newest:desc">Newest</option>
            <option value="price:asc">Price: Low to High</option>
            <option value="price:desc">Price: High to Low</option>
            <option value="rating:desc">Top Rated</option>
            <option value="title:asc">Name: A to Z</option>
          </select>
        </div>

        <div className="w-20 shrink-0">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Min Price
          </label>
          <Input
            type="number"
            min={0}
            placeholder="$0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>

        <div className="w-20 shrink-0">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Max Price
          </label>
          <Input
            type="number"
            min={0}
            placeholder="$999"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="w-24 shrink-0">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Max Days
          </label>
          <Input
            type="number"
            min={1}
            placeholder="Any"
            value={maxDuration}
            onChange={(e) => setMaxDuration(e.target.value)}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-end gap-3">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-primary">
            {activeFilterCount} active{" "}
            {activeFilterCount === 1 ? "filter" : "filters"}
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex cursor-pointer items-center gap-1 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            <SlidersHorizontal size={13} />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}