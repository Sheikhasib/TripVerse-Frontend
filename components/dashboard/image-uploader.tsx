"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Spinner,
  Trash,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { uploadsApi } from "@/lib/api/uploads"

const MAX_IMAGES = 6
const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]

type PreviewItem = {
  // object URL for local files, or the Cloudinary URL for uploaded images
  url: string
  status: "uploading" | "done"
}

interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  // Local previews (object URLs) are tracked separately from the committed
  // images array so a file mid-upload isn't lost on re-render.
  const [previews, setPreviews] = useState<PreviewItem[]>(
    value.map((url) => ({ url, status: "done" })),
  )
  // Mirrors `previews` so async upload callbacks always read the latest list —
  // the `previews`/`value` state is stale inside their closures.
  const previewsRef = useRef<PreviewItem[]>(previews)

  // Applies the next preview list and commits the ordered, fully-uploaded URLs
  // to the form. Deriving from the current list (not the initial `value`)
  // keeps concurrent uploads from overwriting each other. onChange only fires
  // when the committed URLs actually change (e.g. adding a file that is still
  // uploading shouldn't re-validate the field).
  const applyPreviews = useCallback(
    (next: PreviewItem[]) => {
      const prev = previewsRef.current
      previewsRef.current = next
      setPreviews(next)
      const urls = next
        .filter((p) => p.status === "done")
        .map((p) => p.url)
        .slice(0, MAX_IMAGES)
      const prevUrls = prev
        .filter((p) => p.status === "done")
        .map((p) => p.url)
        .slice(0, MAX_IMAGES)
      if (
        urls.length !== prevUrls.length ||
        urls.some((url, index) => url !== prevUrls[index])
      ) {
        onChange(urls)
      }
    },
    [onChange],
  )

  const addFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Only JPG, PNG or WebP images are allowed.")
        return
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error("Image must be 5MB or smaller.")
        return
      }
      if (previewsRef.current.length >= MAX_IMAGES) {
        toast.error(`You can add up to ${MAX_IMAGES} images.`)
        return
      }

      const objectUrl = URL.createObjectURL(file)
      const item: PreviewItem = { url: objectUrl, status: "uploading" }
      applyPreviews([...previewsRef.current, item])

      uploadsApi
        .uploadImage(file)
        .then((result) => {
          // Replace the object URL in place so a reorder made while the file
          // was uploading keeps that position.
          applyPreviews(
            previewsRef.current.map((p) =>
              p.url === objectUrl ? { url: result.url, status: "done" } : p,
            ),
          )
          URL.revokeObjectURL(objectUrl)
        })
        .catch((error) => {
          applyPreviews(previewsRef.current.filter((p) => p.url !== objectUrl))
          URL.revokeObjectURL(objectUrl)
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Failed to upload image. Please try again.",
          )
        })
    },
    [applyPreviews],
  )

  const removeAt = useCallback(
    (index: number) => {
      const item = previewsRef.current[index]
      if (!item) return
      if (item.status === "uploading") {
        // Can't cancel an in-flight request, but dropping the preview keeps
        // the user in control; the resolved URL is ignored via the url match.
        applyPreviews(previewsRef.current.filter((p) => p.url !== item.url))
        URL.revokeObjectURL(item.url)
        return
      }
      applyPreviews(previewsRef.current.filter((p) => p.url !== item.url))
    },
    [applyPreviews],
  )

  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      const next = [...previewsRef.current]
      const target = index + direction
      if (target < 0 || target >= next.length) return
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      // Commits the reordered, already-uploaded URLs; in-flight files keep
      // their (possibly new) position and commit themselves on completion.
      applyPreviews(next)
    },
    [applyPreviews],
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {previews.map((item, index) => (
          <div
            key={item.url}
            className="group relative aspect-[4/3] overflow-hidden rounded-md ring-1 ring-foreground/10"
          >
            <Image
              src={item.url}
              alt={`Package image ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 200px"
              className="object-cover"
            />
            {item.status === "uploading" && (
              <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                <Spinner className="size-6 animate-spin text-primary" />
              </div>
            )}
            <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0 || item.status === "uploading"}
                aria-label="Move image left"
                className="grid size-7 cursor-pointer place-items-center rounded bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === previews.length - 1 || item.status === "uploading"}
                aria-label="Move image right"
                className="grid size-7 cursor-pointer place-items-center rounded bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Remove image"
                className="grid size-7 cursor-pointer place-items-center rounded bg-destructive/90 text-white shadow-sm transition-colors hover:bg-destructive"
              >
                <Trash className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {previews.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary",
            )}
          >
            <ImageIcon className="size-6" />
            <span className="text-xs font-medium">Add image</span>
            <span className="text-[10px]">
              {previews.length}/{MAX_IMAGES}
            </span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) addFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}