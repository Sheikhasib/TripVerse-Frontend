import { apiClient, apiClientFull } from "./client"

export type TBlogAuthor = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type TBlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string | null
  createdAt: string
  updatedAt: string
  author: TBlogAuthor
}

export type TBlogPostListItem = Omit<TBlogPost, "content">

export type TBlogQuery = {
  search?: string
  sortBy?: "newest" | "oldest" | "title"
  sortOrder?: "asc" | "desc"
  page?: number
  limit?: number
}

const getList = async (params: TBlogQuery = {}) => {
  const query = new URLSearchParams()
  if (params.search) query.set("search", params.search)
  if (params.sortBy) query.set("sortBy", params.sortBy)
  if (params.sortOrder) query.set("sortOrder", params.sortOrder)
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))

  const qs = query.toString()
  const envelope = await apiClientFull<TBlogPostListItem[]>(
    `/api/blog${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const getBySlug = (slug: string) => apiClient<TBlogPost>(`/api/blog/${slug}`)

export const blogApi = {
  getList,
  getBySlug,
}