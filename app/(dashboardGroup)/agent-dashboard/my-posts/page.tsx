"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { blogApi } from "@/lib/api/blog"
import { ApiError } from "@/lib/api/client"
import { ImageUploader } from "@/components/dashboard/image-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RouteLoading } from "@/components/shared/route-loading"
import { EmptyState } from "@/components/shared/empty-state"
import { PaginationPages } from "@/components/shared/pagination"
import { useMe } from "@/hooks/use-me"
import { Package, Spinner, PencilLine, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"

const EMPTY_FORM = { title: "", excerpt: "", content: "", coverImage: "" }
const PAGE_SIZE = 9

export default function AgentMyPostsPage() {
  const { user } = useMe()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<"new" | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ["agent-blog-posts", page],
    queryFn: () => blogApi.getMyPosts({ page, limit: PAGE_SIZE }),
    enabled: Boolean(user),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

  const totalPages = data?.meta?.totalPages ?? 1
  const posts = data?.data ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["agent-blog-posts"] })

  const createMutation = useMutation({
    mutationFn: () =>
      blogApi.createPost({
        title: form.title,
        excerpt: form.excerpt || form.title,
        content: form.content,
        coverImage: form.coverImage || undefined,
      }),
    onSuccess: () => {
      toast.success("Post created and pending admin review.")
      setEditing(null)
      setForm(EMPTY_FORM)
      invalidate()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Failed to create post."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogApi.deletePost(id),
    onSuccess: () => {
      if (posts.length === 1 && page > 1) {
        setPage(page - 1)
      }
      toast.success("Post deleted.")
      invalidate()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Failed to delete post."),
  })

  if (isLoading) {
    return <RouteLoading />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My Posts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your blog posts. Create, edit, and manage your own content.
        </p>
      </div>

      <Button
        onClick={() => {
          setEditing(editing ? null : "new")
          setForm(EMPTY_FORM)
        }}
      >
        {editing ? "Cancel" : "New Post"}
      </Button>

      {editing === "new" && (
        <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/5">
          <h2 className="mb-4 font-medium">New Post</h2>
          <ImageUploader
            value={form.coverImage ? [form.coverImage] : []}
            onChange={(urls) =>
              setForm((prev) => ({ ...prev, coverImage: urls[0] ?? "" }))
            }
          />
          <Input
            placeholder="Post title..."
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            className="mt-2 w-full"
          />
          <Input
            placeholder="Excerpt (optional)"
            value={form.excerpt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, excerpt: e.target.value }))
            }
            className="mt-2 w-full"
          />
          <Textarea
            placeholder="Write your post content here..."
            value={form.content}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, content: e.target.value }))
            }
            className="mt-2 h-64 w-full resize-y"
          />
          <div className="mt-6 flex gap-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending ||
                !form.title.trim() ||
                form.content.trim().length === 0
              }
            >
              {createMutation.isPending ? (
                <Spinner className="size-4 animate-spin" />
              ) : null}
              Create
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="No posts yet"
          description="Create your first post to share with your audience."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg bg-card p-4 ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
            >
              <div className="relative mb-3 h-24 w-32">
                {post.coverImage && (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="rounded object-cover"
                  />
                )}
              </div>
              <h3 className="truncate font-medium">{post.title}</h3>
              <p className="truncate text-sm text-muted-foreground">
                {post.excerpt || "No excerpt"}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <small className="text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </small>
                  <span className="text-xs font-semibold uppercase text-primary">
                    {post.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/agent-dashboard/posts/${post.id}/edit`}>
                      <PencilLine /> Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(post.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {posts.length > 0 && (
        <PaginationPages
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}