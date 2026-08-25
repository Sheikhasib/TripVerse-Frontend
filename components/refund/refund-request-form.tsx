"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  HandCoins,
  Image as ImageIcon,
  Spinner,
  Trash,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { refundsApi } from "@/lib/api/refunds"
import { ApiError } from "@/lib/api/client"
import { uploadsApi } from "@/lib/api/uploads"
import {
  createRefundSchema,
  DOCS_BACKED_CATEGORIES,
  type TCreateRefundSchema,
} from "@/lib/validations/refund"
import {
  REFUND_CATEGORY_LABELS,
  daysUntilTravel,
  suggestRefundPercentage,
} from "@/lib/api/refunds"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MAX_SIZE_MB = 5
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]

interface RefundRequestDialogProps {
  bookingId: string
  travelDate: string
  totalPrice: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Estimate-only tier hint mirroring the server's snapshot math — the real
// percentages are frozen server-side at submission.
const tierLabel = (days: number) => {
  if (days < 0) return "after the travel date"
  if (days >= 30) return "30+ days before travel"
  if (days >= 15) return "15–29 days before travel"
  if (days >= 7) return "7–14 days before travel"
  return "less than 7 days before travel"
}

export function RefundRequestDialog({
  bookingId,
  travelDate,
  totalPrice,
  open,
  onOpenChange,
}: RefundRequestDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<TCreateRefundSchema>({
    resolver: zodResolver(createRefundSchema),
    defaultValues: {
      bookingId,
      reason: "",
      evidenceUrl: undefined,
      category: undefined,
    },
  })

  // Mirrored outside the form so the evidence field can react to the chosen
  // category without react-hook-form's `watch()` (incompatible with the
  // React Compiler lint rule).
  const [category, setCategory] =
    useState<TCreateRefundSchema["category"] | undefined>(undefined)
  const requiresEvidence =
    category != null &&
    (DOCS_BACKED_CATEGORIES as readonly string[]).includes(category)

  const days = daysUntilTravel(travelDate)
  const estimatedPct =
    category != null ? suggestRefundPercentage(category, days) : null

  const resetForm = () => {
    setCategory(undefined)
    form.reset({
      bookingId,
      reason: "",
      evidenceUrl: undefined,
      category: undefined,
    })
  }

  const mutation = useMutation({
    mutationFn: refundsApi.createRefundRequest,
    onSuccess: () => {
      toast.success("Refund application submitted.")
      resetForm()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    },
  })

  const addFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed.")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller.")
      return
    }

    setUploading(true)
    uploadsApi
      .uploadImage(file)
      .then((result) =>
        form.setValue("evidenceUrl", result.url, { shouldValidate: true }),
      )
      .catch((error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Failed to upload image. Please try again.",
        )
      })
      .finally(() => setUploading(false))
  }

  const pending = mutation.isPending || uploading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for a refund</DialogTitle>
          <DialogDescription>
            Paid bookings can&apos;t be cancelled directly — tell us what
            happened and our team will review your case.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason category</FormLabel>
                  <FormControl>
                    <Select
                      value={category ?? ""}
                      onValueChange={(value) => {
                        setCategory(value as TCreateRefundSchema["category"])
                        field.onChange(value)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(REFUND_CATEGORY_LABELS) as Array<
                            keyof typeof REFUND_CATEGORY_LABELS
                          >
                        ).map((key) => (
                          <SelectItem key={key} value={key}>
                            {REFUND_CATEGORY_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {estimatedPct !== null && (
                    <FormDescription>
                      Estimated refund: ~{estimatedPct}% of{" "}
                      {totalPrice.toLocaleString()} BDT ({tierLabel(days)}) —
                      estimate only, finalized at review.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What happened?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your situation in detail"
                      rows={5}
                      maxLength={2000}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription>At least 20 characters.</FormDescription>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {(field.value ?? "").length}/2000
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evidenceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Supporting documents
                    {requiresEvidence && (
                      <span className="text-destructive"> *</span>
                    )}
                    {!requiresEvidence && (
                      <span className="text-muted-foreground"> (optional)</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <input type="hidden" {...field} value={field.value ?? ""} />
                  </FormControl>
                  {field.value ? (
                    <div className="group relative aspect-video overflow-hidden rounded-md ring-1 ring-foreground/10">
                      <Image
                        src={field.value}
                        alt="Supporting document"
                        fill
                        sizes="(max-width: 640px) 100vw, 480px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => form.setValue("evidenceUrl", undefined)}
                        className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded bg-destructive/90 text-white shadow-sm transition-colors hover:bg-destructive"
                      >
                        <Trash className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label="Add supporting document"
                      onClick={() => inputRef.current?.click()}
                      disabled={uploading}
                      className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <Spinner className="size-6 animate-spin" />
                          <span className="text-xs font-medium">
                            Uploading…
                          </span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="size-6" />
                          <span className="text-xs font-medium">
                            Add an image (JPG, PNG or WebP, max 5MB)
                          </span>
                        </>
                      )}
                    </button>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Input
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

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button type="submit" disabled={pending}>
                  {mutation.isPending ? (
                    <Spinner className="size-4 animate-spin" />
                  ) : (
                    <HandCoins size={16} />
                  )}
                  {mutation.isPending ? "Submitting…" : "Submit application"}
                </Button>
              </motion.div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
