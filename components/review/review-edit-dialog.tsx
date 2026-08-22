"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@phosphor-icons/react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { reviewsApi, type TReview } from "@/lib/api/reviews";
import {
  updateReviewSchema,
  type TUpdateReviewSchema,
} from "@/lib/validations/review";
import { RATING_LABELS } from "./review-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReviewEditDialogProps {
  // Null while the dialog is closed (kept mounted so exit animations play);
  // the list always sets a fresh target before reopening.
  review: TReview | null;
  packageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewEditDialog({
  review,
  packageId,
  open,
  onOpenChange,
}: ReviewEditDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<TUpdateReviewSchema>({
    resolver: zodResolver(updateReviewSchema),
    defaultValues: { rating: undefined, comment: "" },
  });

  useEffect(() => {
    if (open && review) {
      form.reset({ rating: review.rating, comment: review.comment ?? "" });
    }
  }, [open, review, form]);

  const mutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TUpdateReviewSchema }) =>
      reviewsApi.updateReview(id, values),
    onSuccess: () => {
      // Prefix match refreshes whichever page of the list is open; the SSR
      // header average comes back via router.refresh().
      queryClient.invalidateQueries({ queryKey: ["reviews", packageId] });
      toast.success("Review updated.");
      router.refresh();
      onOpenChange(false);
    },
    onError: (caught) =>
      toast.error(
        caught instanceof ApiError ? caught.message : "Something went wrong.",
      ),
  });

  const pending = mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
          <DialogDescription>
            Update your rating or comment for this package.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              if (!review) return;
              mutation.mutate({ id: review.id, values });
            })}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <Select
                      value={String(field.value ?? "")}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {RATING_LABELS.map((label, index) => (
                          <SelectItem key={index + 1} value={String(index + 1)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell others about your experience"
                      maxLength={1000}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={pending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={pending}
              >
                {pending ? <Spinner className="size-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
