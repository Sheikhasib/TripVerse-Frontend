"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowBendUpLeft,
  ChatCircle,
  SignIn,
  Trash,
  X,
} from "@phosphor-icons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/client"
import {
  blogCommentsApi,
  type TBlogComment,
  type TBlogReply,
} from "@/lib/api/blog-comments"
import { formatRelativeTime } from "@/lib/format"
import { useMe } from "@/hooks/use-me"
import { CommentForm } from "./comment-form"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const PAGE_SIZE = 10

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "Something went wrong."

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()

const CommentAvatar = ({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl?: string | null
}) => (
  <Avatar className="size-8 shrink-0">
    {avatarUrl ? (
      <AvatarImage src={avatarUrl} alt={name} />
    ) : (
      <AvatarFallback className="text-xs text-primary">
        {getInitials(name || "?")}
      </AvatarFallback>
    )}
  </Avatar>
)

function ReplyRow({ reply }: { reply: TBlogReply }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <CommentAvatar name={reply.user.name} avatarUrl={reply.user.avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{reply.user.name}</span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
            {formatRelativeTime(reply.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {reply.content}
        </p>
      </div>
    </li>
  )
}

function CommentRow({
  comment,
  slug,
  canModerate,
  onRequestDelete,
}: {
  comment: TBlogComment
  slug: string
  canModerate: (userId: string) => boolean
  onRequestDelete: (comment: TBlogComment) => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)

  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <CommentAvatar
          name={comment.user.name}
          avatarUrl={comment.user.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium">{comment.user.name}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            {canModerate(comment.user.id) && (
              <button
                type="button"
                onClick={() => onRequestDelete(comment)}
                aria-label={`Delete comment by ${comment.user.name}`}
                title="Delete comment"
                className="cursor-pointer rounded p-1 text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash size={14} />
              </button>
            )}
          </div>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {comment.content}
          </p>

          <button
            type="button"
            onClick={() => setReplyOpen((open) => !open)}
            className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors duration-200 hover:text-primary/80"
          >
            {replyOpen ? <X size={12} /> : <ArrowBendUpLeft size={13} />}
            {replyOpen ? "Cancel" : "Reply"}
          </button>

          {comment.replies.length > 0 && (
            <ul className="ml-4 mt-2 space-y-0 divide-y divide-border/60 border-l border-border pl-4">
              {comment.replies.map((reply) => (
                <ReplyRow key={reply.id} reply={reply} />
              ))}
            </ul>
          )}

          {replyOpen && (
            <CommentForm
              slug={slug}
              parentId={comment.id}
              autoFocus
              placeholder={`Reply to ${comment.user.name}...`}
              className="mt-3"
              onSubmitSuccess={() => setReplyOpen(false)}
            />
          )}
        </div>
      </div>
    </li>
  )
}

const ListSkeleton = () => (
  <div className="divide-y divide-border">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex animate-pulse items-start gap-3 py-5">
        <div className="size-8 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      </div>
    ))}
  </div>
)

export function CommentSection({ slug }: { slug: string }) {
  const { user } = useMe()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<TBlogComment | null>(null)

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blog-comments", slug, page],
    queryFn: () => blogCommentsApi.getComments(slug, { page, limit: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
  })

  const deleteComment = useMutation({
    mutationFn: blogCommentsApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", slug] })
      toast.success("Comment deleted.")
    },
    onError: (caught) => toast.error(errorMessage(caught)),
    onSettled: () => setPendingDelete(null),
  })

  if (!user) {
    return (
      <EmptyState
        icon={<ChatCircle size={40} />}
        title="Join the conversation"
        description="Sign in to share your thoughts on this story."
        action={
          <Button asChild className="cursor-pointer">
            <Link href={`/login?redirectTo=${encodeURIComponent(`/blog/${slug}`)}`}>
              <SignIn size={16} className="mr-2" />
              Sign in to comment
            </Link>
          </Button>
        }
      />
    )
  }

  const comments = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  // Mirrors the server rule: the comment author or an ADMIN may soft-delete.
  const canModerate = (commentUserId: string) =>
    user.id === commentUserId || user.role === "ADMIN"

  const confirmDelete = () => {
    if (!pendingDelete || deleteComment.isPending) return
    deleteComment.mutate(pendingDelete.id)
  }

  return (
    <section aria-label="Comments" className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Comments</h2>

      <CommentForm
        slug={slug}
        placeholder="Share your thoughts on this story..."
        onSubmitSuccess={() => {
          // Newest-first list: jump back to page 1 so the fresh comment is
          // visible immediately instead of hiding behind pagination.
          setPage(1)
          queryClient.invalidateQueries({ queryKey: ["blog-comments", slug] })
        }}
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState
          icon={<ChatCircle size={40} />}
          title="Couldn't load comments"
          description={errorMessage(error)}
          action={
            <Button
              type="button"
              onClick={() => refetch()}
              className="cursor-pointer"
            >
              Try again
            </Button>
          }
        />
      ) : comments.length === 0 ? (
        <EmptyState
          icon={<ChatCircle size={40} />}
          title="No comments yet"
          description="Start the conversation — be the first to share what you think."
        />
      ) : (
        <>
          <ul className="divide-y divide-border">
            {comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                slug={slug}
                canModerate={canModerate}
                onRequestDelete={setPendingDelete}
              />
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this comment?</DialogTitle>
            <DialogDescription>
              This removes it for everyone. The action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleteComment.isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteComment.isPending}
              className="cursor-pointer"
            >
              {deleteComment.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
