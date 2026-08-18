"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { blogApi, type TBlogPost } from "@/lib/api/blog"
import { ApiError } from "@/lib/api/client"
import { ImageUploader } from "@/components/dashboard/image-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RouteLoading } from "@/components/shared/route-loading"
import { EmptyState } from "@/components/shared/empty-state"
import { GoBack } from "@/components/shared/go-back"
import { useMe } from "@/hooks/use-me"
import { Package, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"

type TEditablePost = Pick<
  TBlogPost,
  "title" | "excerpt" | "content" | "coverImage"
>

export default function AgentPostEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useMe()

  const { data: post, isLoading } = useQuery<TEditablePost | null>({
    queryKey: ["blog-post", id],
    queryFn: async () => {
      if (user?.role === "ADMIN") {
        const result = await blogApi.getAllPosts({ limit: 50 })
        const found = result.data.find((p) => p.id === id)
        if (!found) return null
        return {
          title: found.title,
          excerpt: found.excerpt,
          content: found.content,
          coverImage: found.coverImage,
        }
      }
      const result = await blogApi.getList({ limit: 50 })
      const found = result.data.find((p) => p.id === id)
      if (!found) return null
      const full = await blogApi.getBySlug(found.slug)
      return {
        title: full.title,
        excerpt: full.excerpt,
        content: full.content,
        coverImage: full.coverImage,
      }
    },
    enabled: Boolean(id && user),
  })

  const [form, setForm] = useState<TEditablePost>({
    title: "",
    excerpt: "",
    content: "",
    coverImage: undefined,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      blogApi.updatePost(id, {
        title: form.title,
        excerpt: form.excerpt || form.title,
        content: form.content,
        coverImage: form.coverImage || undefined,
      }),
    onSuccess: () => {
      toast.success("Post updated. Status reset to draft.")
      router.replace("/agent-dashboard/my-posts")
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Failed to update post."),
  })

  if (isLoading) {
    return <RouteLoading />
  }

  if (!post) {
    return (
      <EmptyState
        icon={<Package size={40} />}
        title="Post not found"
        description="This post doesn't exist or you don't have access to it."
        action={
          <GoBack
            href="/agent-dashboard/my-posts"
            label="Go back"
            variant="outline"
          />
        }
      />
    )
  }

  const isDirty =
    form.title !== post.title ||
    form.excerpt !== post.excerpt ||
    form.content !== post.content ||
    form.coverImage !== post.coverImage

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Edit Post
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Editing: {post.title}. Status will reset to draft on save.
        </p>
      </div>

      <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/5">
        <ImageUploader
          value={form.coverImage ? [form.coverImage] : []}
          onChange={(urls) =>
            setForm((prev) => ({ ...prev, coverImage: urls[0] ?? undefined }))
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
            onClick={() => saveMutation.mutate()}
            disabled={
              saveMutation.isPending ||
              !isDirty ||
              !form.title.trim() ||
              form.content.trim().length === 0
            }
          >
            {saveMutation.isPending ? (
              <Spinner className="size-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
          <Button
            variant="outline"
            onClick={() => router.replace("/agent-dashboard/my-posts")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}