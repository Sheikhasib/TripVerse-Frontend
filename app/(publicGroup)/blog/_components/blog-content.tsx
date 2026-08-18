"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { blogApi } from "@/lib/api/blog"
import { BlogCard } from "@/components/shared/blog-card"
import { EmptyState } from "@/components/shared/empty-state"
import { RouteLoading } from "@/components/shared/route-loading"
import { PaginationPages } from "@/components/shared/pagination"
import { Input } from "@/components/ui/input"
import { Newspaper } from "@phosphor-icons/react"
import type { TBlogQuery } from "@/lib/api/blog"

interface BlogContentProps {
  initialParams: TBlogQuery
  initialData: import("@/lib/api/blog").TBlogPostListItem[]
  initialTotalPages: number
}

const PAGE_LIMIT = 9

export function BlogContent({
  initialParams,
  initialData,
  initialTotalPages,
}: BlogContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const params: TBlogQuery = {
    ...initialParams,
    search: searchParams.get("search") || initialParams.search || undefined,
    sortBy:
      (searchParams.get("sortBy") as TBlogQuery["sortBy"]) ||
      initialParams.sortBy ||
      "newest",
    page: Math.max(
      1,
      Number(searchParams.get("page")) || initialParams.page || 1,
    ),
  }

  const { data, isLoading } = useQuery({
    queryKey: ["blog", params],
    queryFn: () => blogApi.getList({ ...params, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  })

  const posts = data?.data ?? initialData
  const totalPages = Math.max(1, data?.meta?.totalPages ?? initialTotalPages)

  const updateParams = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString())
      Object.entries(patch).forEach(([key, value]) => {
        if (value) {
          next.set(key, value)
        } else {
          next.delete(key)
        }
      })
      next.delete("page")
      const qs = next.toString()
      router.push(`/blog${qs ? `?${qs}` : ""}`, { scroll: false })
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
      router.push(`/blog${qs ? `?${qs}` : ""}`, { scroll: true })
    },
    [router, searchParams],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Search
          </label>
          <Input
            placeholder="Search posts..."
            defaultValue={params.search ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParams({ search: (e.target as HTMLInputElement).value })
              }
            }}
            onBlur={(e) => updateParams({ search: e.target.value })}
          />
        </div>
        <div className="w-40 shrink-0">
          <label className="mb-1.5 block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Sort By
          </label>
          <select
            value={params.sortBy}
            onChange={(e) => updateParams({ sortBy: e.target.value })}
            className="h-10 w-full cursor-pointer border-0 border-b border-b-input bg-transparent px-0 py-1 text-sm outline-none transition-colors focus-visible:border-b-ring"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title A&ndash;Z</option>
          </select>
        </div>
      </div>

      {isLoading && posts.length === 0 ? (
        <RouteLoading />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={40} />}
          title="No posts found"
          description="Try a different search term, or check back soon for new stories."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <PaginationPages
        page={params.page ?? 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}