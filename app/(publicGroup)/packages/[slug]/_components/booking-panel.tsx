"use client"

import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarBlank, Clock, MapPin, Minus, Plus, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Rating } from "@/components/shared/rating"
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
  createBookingSchema,
  type TCreateBookingSchema,
} from "@/lib/validations/booking"
import { bookingsApi } from "@/lib/api/bookings"
import { ApiError } from "@/lib/api/client"
import { useMe } from "@/hooks/use-me"
import type { TPublicPackage } from "@/lib/api/packages"
import { formatBDT } from "@/lib/format"

interface BookingPanelProps {
  pkg: TPublicPackage
}

const todayInputValue = () => {
  const now = new Date()
  const utc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  )
  return utc.toISOString().slice(0, 10)
}

export function BookingPanel({ pkg }: BookingPanelProps) {
  const router = useRouter()
  const { user, isLoading: userLoading } = useMe()

  const form = useForm<TCreateBookingSchema>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      packageId: pkg.id,
      travelDate: "",
      travelers: 1,
    },
  })

  const travelers = useWatch({ control: form.control, name: "travelers" })
  const estimate = pkg.price * (travelers || 0)

  const setTravelers = (next: number) => {
    form.setValue("travelers", Math.min(20, Math.max(1, next)), {
      shouldValidate: true,
    })
  }

  const onSubmit = async (values: TCreateBookingSchema) => {
    try {
      const booking = await bookingsApi.createBooking(values)
      toast.success("Booking placed.")
      router.push(`/user-dashboard/bookings/${booking.id}`)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  return (
    <div className="space-y-5 rounded-lg bg-card p-6 ring-1 ring-foreground/5 lg:sticky lg:top-24">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-3xl font-medium tabular-nums text-primary">
          {formatBDT(pkg.price)}
        </span>
        <span className="text-sm text-muted-foreground">/ person</span>
      </div>

      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2 text-muted-foreground">
          <MapPin size={15} className="text-primary" />
          {pkg.location}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Clock size={15} className="text-primary" />
          {pkg.duration} days
        </p>
      </div>

      {typeof pkg.rating === "number" && pkg.rating > 0 && (
        <div className="flex items-center gap-2 border-t border-border/60 pt-4">
          <Rating value={pkg.rating} />
          <span className="text-sm font-semibold tabular-nums">
            {pkg.rating.toFixed(1)}
          </span>
        </div>
      )}

      {userLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : user ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 border-t border-border/60 pt-4"
          >
            <FormField
              control={form.control}
              name="travelDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={todayInputValue()}
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="travelers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travelers</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-between rounded-md border border-input bg-background">
                      <button
                        type="button"
                        onClick={() => setTravelers((travelers || 1) - 1)}
                        disabled={field.value === undefined || field.value <= 1}
                        aria-label="Decrease travelers"
                        className="grid size-10 shrink-0 cursor-pointer place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Minus size={15} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        step={1}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                        className="w-16 bg-transparent text-center text-sm font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTravelers((travelers || 0) + 1)}
                        disabled={field.value !== undefined && field.value >= 20}
                        aria-label="Increase travelers"
                        className="grid size-10 shrink-0 cursor-pointer place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Estimated total</span>
              <span className="font-semibold tabular-nums">
                {formatBDT(estimate)}
              </span>
            </div>
            <FormDescription className="-mt-2 text-xs">
              Estimate only — the exact total is confirmed at checkout.
            </FormDescription>

            <Button
              size="lg"
              className="w-full"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Spinner className="size-4 animate-spin" />
              ) : (
                <CalendarBlank size={17} />
              )}
              Book Now
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-3 border-t border-border/60 pt-4">
          <Button size="lg" className="w-full" asChild>
            <Link href={`/login?redirectTo=/packages/${pkg.slug}`}>
              Sign in to book
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You&apos;ll be asked to sign in or create an account.
          </p>
        </div>
      )}
    </div>
  )
}
