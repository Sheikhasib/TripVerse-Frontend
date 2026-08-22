import { apiClient, apiClientFull } from "./client"

export type TBlogCommentAuthor = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type TBlogReply = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: TBlogCommentAuthor
}

export type TBlogComment = TBlogReply & { replies: TBlogReply[] }

export type TBlogCommentsQuery = {
  page?: number
  limit?: number
}

// ── Blog comment API ──────────────────────────────────────────────────────
// GET is public; POST/DELETE need the browser's auth cookies through the
// same-origin /api rewrite. Comments only exist under PUBLISHED, non-deleted
// posts (server-enforced on every endpoint).

const buildQuery = ({ page, limit }: TBlogCommentsQuery = {}) => {
  const query = new URLSearchParams()
  if (page) query.set("page", String(page))
  if (limit) query.set("limit", String(limit))
  return query.toString()
}

const getComments = async (
  slug: string,
  params: TBlogCommentsQuery = {},
) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TBlogComment[]>(
    `/api/blog/${slug}/comments${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const createComment = (
  slug: string,
  payload: { content: string; parentId?: string },
) =>
  apiClient<TBlogReply>(`/api/blog/${slug}/comments`, {
    method: "POST",
    body: payload,
  })

const deleteComment = (id: string) =>
  apiClient<null>(`/api/blog/comments/${id}`, { method: "DELETE" })

export const blogCommentsApi = {
  getComments,
  createComment,
  deleteComment,
}
