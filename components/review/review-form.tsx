"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";
import { useMe } from "@/hooks/use-me";
import { reviewsApi } from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createReviewSchema,
  type TCreateReviewSchema,
} from "@/lib/validations/review";

interface ReviewFormProps {
  packageId: string;
  slug: string;
}

export const RATING_LABELS = [
  "1 star - Poor",
  "2 stars - Fair",
  "3 stars - Average",
  "4 stars - Good",
  "5 stars - Excellent",
];

export function ReviewForm({ packageId, slug }: ReviewFormProps) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useMe();

  const form = useForm<TCreateReviewSchema>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { packageId, rating: 1, comment: "" },
  });

  const onSubmit = async (values: TCreateReviewSchema) => {
    try {
      await reviewsApi.createReview(values);
      toast.success("Review submitted.");
      router.push(`/packages/${slug}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      );
    }
  };

  if (userLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h3 className="text-lg font-semibold">Sign in to review</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to leave a review for this package.
        </p>
        <Button asChild className="mt-4 cursor-pointer">
          <Link href={`/login?redirectTo=/packages/${slug}`}>Sign in</Link>
        </Button>
      </div>
    );
  }

  if (user?.role !== "USER") {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h3 className="text-lg font-semibold">Only users can review</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Reviews are written by travellers who completed the trip.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/5">
      <h3 className="text-lg font-semibold">Leave a review</h3>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="mt-4 space-y-4"
        >
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <Select
                    value={String(field.value)}
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push(`/packages/${slug}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Spinner className="size-4 animate-spin" />
              ) : null}
              Submit review
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
