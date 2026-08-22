"use client"

import { useRef, useState } from "react"
import { PaperPlaneTilt } from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { blogCommentsApi } from "@/lib/api/blog-comments"
import { useMe } from "@/hooks/use-me"
import { Button } from "@/components/ui/button"

const MAX_CONTENT_LENGTH = 2000

interface CommentFormProps {
  slug: string
  parentId?: string
  onSubmitSuccess?: () => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

// Create a top-level comment or a reply (parentId set). The caller owns list
// refresh via onSubmitSuccess — this form only posts and clears itself.
export function CommentForm({
  slug,
  parentId,
  onSubmitSuccess,
  placeholder = "Share your thoughts...",
  autoFocus,
  className,
}: CommentFormProps) {
  const { user } = useMe()
  const [content, setContent] = useState("")
  const [pending, setPending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Anonymous visitors never reach this form (the section gates them), but a
  // stale session shouldn't render a dead form either.
  if (!user) return null

  const autoGrow = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || pending) return

    setPending(true)
    try {
      await blogCommentsApi.createComment(
        slug,
        parentId ? { content: trimmed, parentId } : { content: trimmed },
      )
      setContent("")
      if (textareaRef.current) textareaRef.current.style.height = "auto"
      onSubmitSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onInput={autoGrow}
        maxLength={MAX_CONTENT_LENGTH}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={parentId ? 2 : 3}
        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-primary/40"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs tabular-nums text-muted-foreground/70">
          {content.length}/{MAX_CONTENT_LENGTH}
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || pending}
          className="cursor-pointer"
        >
          <PaperPlaneTilt size={14} className="mr-1.5" />
          {parentId ? "Reply" : "Comment"}
          {pending && (
            <span className="ml-1 size-3 animate-spin rounded-full border border-current border-t-transparent" />
          )}
        </Button>
      </div>
    </form>
  )
}
