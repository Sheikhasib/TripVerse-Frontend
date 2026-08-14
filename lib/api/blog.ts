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

export type TBlogPostStatus = "DRAFT" | "PUBLISHED"

export type TBlogInternalPost = Omit<TBlogPost, "author"> & {
  status: TBlogPostStatus
  authorId: string
  isDeleted: boolean
  author: { id: string; name: string; email: string }
}

export type TBlogMutationPayload = {
  title: string
  excerpt: string
  content: string
  coverImage?: string
}

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

const getAllPosts = async (
  params: { status?: TBlogPostStatus; page?: number; limit?: number } = {},
) => {
  const query = new URLSearchParams()
  if (params.status) query.set("status", params.status)
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  const qs = query.toString()
  const envelope = await apiClientFull<TBlogInternalPost[]>(
    `/api/blog/internal/all${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const createPost = (payload: TBlogMutationPayload) =>
  apiClient<TBlogInternalPost>("/api/blog", {
    method: "POST",
    body: payload,
  })

const updatePost = (id: string, payload: Partial<TBlogMutationPayload>) =>
  apiClient<TBlogInternalPost>(`/api/blog/${id}`, {
    method: "PATCH",
    body: payload,
  })

const updatePostStatus = (id: string, status: TBlogPostStatus) =>
  apiClient<TBlogInternalPost>(`/api/blog/${id}/status`, {
    method: "PATCH",
    body: { status },
  })

const deletePost = (id: string) =>
  apiClient<TBlogInternalPost>(`/api/blog/${id}`, { method: "DELETE" })

export const blogApi = {
  getList,
  getBySlug,
  getAllPosts,
  createPost,
  updatePost,
  updatePostStatus,
  deletePost,
}