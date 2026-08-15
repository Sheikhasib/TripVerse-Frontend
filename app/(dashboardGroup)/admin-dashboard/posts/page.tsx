"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { blogApi, type TBlogPostStatus } from "@/lib/api/blog"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { PaginationPages } from "@/components/shared/pagination"
import { Package, Check, X } from "@phosphor-icons/react"
import { toast } from "sonner"

const PAGE_SIZE = 9

const FILTERS: { value: TBlogPostStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
]

export default function AdminPostsPage() {
  const [status, setStatus] = useState<TBlogPostStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-posts", status, page],
    queryFn: () =>
      blogApi.getAllPosts({
        status: status === "ALL" ? undefined : status,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] })

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: TBlogPostStatus }) =>
      blogApi.updatePostStatus(id, next),
    onSuccess: (_, variables) => {
      toast.success(`Post ${variables.next.toLowerCase()}ed.`)
      invalidate()
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update post status.",
      ),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogApi.deletePost(id),
    onSuccess: () => {
      toast.success("Post deleted.")
      invalidate()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Failed to delete post."),
  })

  const posts = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Manage Posts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All blog posts. Publish or unpublish as needed.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setStatus(filter.value)
              setPage(1)
            }}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              status === filter.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title={status === "ALL" ? "No posts found" : `No ${status.toLowerCase()} posts`}
          description={
            status === "ALL"
              ? "Agents haven't created any posts yet."
              : `No ${status.toLowerCase()} posts right now.`
          }
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
              <h3 className="line-clamp-2 font-medium">{post.title}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {post.excerpt || "No excerpt"}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span className="ml-2 font-semibold uppercase text-primary">
                    {post.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  {post.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        statusMutation.mutate({ id: post.id, next: "PUBLISHED" })
                      }
                      disabled={statusMutation.isPending}
                    >
                      <Check /> Publish
                    </Button>
                  )}
                  {post.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        statusMutation.mutate({ id: post.id, next: "DRAFT" })
                      }
                      disabled={statusMutation.isPending}
                    >
                      <X /> Unpublish
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/agent-dashboard/posts/${post.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(post.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationPages
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  )
}