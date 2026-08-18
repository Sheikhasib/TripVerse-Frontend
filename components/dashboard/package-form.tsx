"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CheckCircle, Compass, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  packageFormSchema,
  type TPackageFormSchema,
} from "@/lib/validations/package"
import { packagesApi } from "@/lib/api/packages"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ImageUploader } from "./image-uploader"
import type { TInternalPackage } from "@/lib/api/packages"

interface PackageFormProps {
  mode: "create" | "edit"
  // Row used to initialize the edit form. The form is only rendered once the
  // row is in hand (from the my-packages / admin list), per the spec's edit
  // initialization strategy.
  packageRow?: TInternalPackage
  isAdmin?: boolean
}

const DEFAULT_VALUES: TPackageFormSchema = {
  title: "",
  description: "",
  location: "",
  price: 0,
  duration: 1,
  categoryId: "",
  images: [],
}

export function PackageForm({
  mode,
  packageRow,
  isAdmin = false,
}: PackageFormProps) {
  const router = useRouter()
  const isEdit = mode === "edit"

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => packagesApi.getCategories(),
    staleTime: 60 * 1000,
  })

  const form = useForm<TPackageFormSchema>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: packageRow
      ? {
          title: packageRow.title,
          description: packageRow.description,
          location: packageRow.location,
          price: Number(packageRow.price),
          duration: packageRow.duration,
          categoryId: packageRow.categoryId,
          images: packageRow.images ?? [],
        }
      : DEFAULT_VALUES,
  })

  const setImages = (urls: string[]) =>
    form.setValue("images", urls, { shouldDirty: true, shouldValidate: true })

  const cancelHref = useMemo(
    () =>
      isAdmin ? "/admin-dashboard/packages" : "/agent-dashboard/my-packages",
    [isAdmin],
  )

  // Keep the form in sync when the row arrives async (edit page passes the
  // resolved row down, so this only guards against a late prop change).
  useEffect(() => {
    if (packageRow) {
      form.reset({
        title: packageRow.title,
        description: packageRow.description,
        location: packageRow.location,
        price: Number(packageRow.price),
        duration: packageRow.duration,
        categoryId: packageRow.categoryId,
        images: packageRow.images ?? [],
      })
    }
  }, [packageRow, form])

  const onSubmit = async (values: TPackageFormSchema) => {
    try {
      if (isEdit && packageRow) {
        // Partial update — send only the fields the user actually changed
        // (the backend PATCH accepts any subset).
        const dirty = form.formState.dirtyFields
        const payload: Record<string, unknown> = {}
        if (dirty.title) payload.title = values.title
        if (dirty.description) payload.description = values.description
        if (dirty.location) payload.location = values.location
        if (dirty.price) payload.price = values.price
        if (dirty.duration) payload.duration = values.duration
        if (dirty.categoryId) payload.categoryId = values.categoryId
        if (dirty.images) payload.images = values.images

        await packagesApi.updatePackage(packageRow.id, payload)
        toast.success(
          isAdmin
            ? "Package updated."
            : "Package updated — it's pending re-approval.",
        )
      } else {
        await packagesApi.createPackage(values)
        toast.success("Package created — it's pending approval.")
      }
      router.push(cancelHref)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  const canSubmit =
    !categoriesLoading &&
    (categories?.length ?? 0) > 0 &&
    (!isEdit || form.formState.isDirty) &&
    !form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {isEdit ? "Edit package" : "Create a package"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? isAdmin
                  ? "Changes are applied immediately without a re-approval."
                  : "Changes are submitted for review before going live."
                : "Fill in the details below — your package goes live once an admin approves it."}
            </p>
          </div>
          {isEdit && packageRow && (
            <span
              className={cn(
                "rounded border px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
                packageRow.status === "APPROVED"
                  ? "border-emerald-500/30 text-emerald-600"
                  : packageRow.status === "REJECTED"
                    ? "border-red-500/30 text-red-600"
                    : "border-amber-500/30 text-amber-600",
              )}
            >
              {packageRow.status.toLowerCase()}
            </span>
          )}
        </div>

        {isEdit && packageRow && !isAdmin && (
          <div className="mb-6 flex items-start gap-3 rounded-md bg-amber-500/10 p-4 text-sm text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
            <CheckCircle className="mt-0.5 size-4 shrink-0" />
            <p>
              Submitting this form sets the package back to{" "}
              <span className="font-semibold">pending</span> for re-approval.
            </p>
          </div>
        )}

        <div className="space-y-6 rounded-lg bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Sundarbans Wildlife Expedition" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the itinerary, highlights and what travellers can expect..."
                    className="min-h-40 resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Khulna, Bangladesh" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (BDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="149.99"
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  {categoriesLoading ? (
                    <div className="flex h-9 w-full items-center gap-2 rounded-md bg-muted/40 px-3 text-sm text-muted-foreground">
                      <Compass className="size-4 animate-[spin_2s_linear_infinite]" />
                      Loading categories…
                    </div>
                  ) : (
                    <>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(categories ?? []).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!categories || categories.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No categories yet — an admin needs to create one before
                          you can submit a package.
                        </p>
                      ) : null}
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Images</FormLabel>
                <FormControl>
                  <ImageUploader value={field.value} onChange={setImages} />
                </FormControl>
                <FormDescription>
                  Up to 6 photos (JPG, PNG or WebP, 5MB each). Uploads happen
                  instantly — remove or reorder before saving.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
            <ArrowLeft />
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {form.formState.isSubmitting ? (
              <Spinner className="size-4 animate-spin" />
            ) : null}
            {isEdit ? "Save changes" : "Create package"}
          </Button>
        </div>
      </form>
    </Form>
  )
}