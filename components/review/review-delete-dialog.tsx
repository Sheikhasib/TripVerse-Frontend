"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { reviewsApi, type TReview } from "@/lib/api/reviews";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReviewDeleteDialogProps {
  review: TReview | null;
  packageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Lets the list react to a successful delete (e.g. step back a page when
  // the removed row was its last).
  onDeleted?: () => void;
}

export function ReviewDeleteDialog({
  review,
  packageId,
  open,
  onOpenChange,
  onDeleted,
}: ReviewDeleteDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      onDeleted?.();
      queryClient.invalidateQueries({ queryKey: ["reviews", packageId] });
      toast.success("Review deleted.");
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete this review?</DialogTitle>
          <DialogDescription>
            Your rating and comment will be removed for everyone and stop
            counting toward the package average. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
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
            type="button"
            variant="destructive"
            className="cursor-pointer"
            disabled={pending || !review}
            onClick={() => review && mutation.mutate(review.id)}
          >
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
