import { blogApi } from "@/lib/api/blog"
import { BlogContent } from "./_components/blog-content"
import type { TBlogQuery } from "@/lib/api/blog"

export const dynamic = "force-dynamic"

const PAGE_LIMIT = 9

async function getPosts(params: TBlogQuery) {
  try {
    const res = await blogApi.getList({ ...params, limit: PAGE_LIMIT })
    return { data: res.data ?? [], totalPages: res.meta?.totalPages ?? 1 }
  } catch {
    return { data: [], totalPages: 1 }
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const initialParams: TBlogQuery = {
    search: typeof sp.search === "string" ? sp.search : undefined,
    sortBy:
      sp.sortBy === "oldest" || sp.sortBy === "title" ? sp.sortBy : "newest",
    page: Math.max(1, Number(sp.page) || 1),
  }

  const initial = await getPosts(initialParams)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Travel Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Stories, guides, and tips from our agents and admins
        </p>
      </div>
      <BlogContent
        initialParams={initialParams}
        initialData={initial.data}
        initialTotalPages={initial.totalPages}
      />
    </div>
  )
}