"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import { Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { profileSchema, type TProfileSchema } from "@/lib/validations/public"
import { usersApi } from "@/lib/api/users"
import { ApiError } from "@/lib/api/client"
import { useMe } from "@/hooks/use-me"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function ProfileForm() {
  const { user, isLoading } = useMe()
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState(false)

  const form = useForm<TProfileSchema>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      avatarUrl: user?.avatarUrl ?? "",
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        Please log in to view your profile.
      </p>
    )
  }

  const onSubmit = async (values: TProfileSchema) => {
    setUpdating(true)
    try {
      const updated = await usersApi.updateProfile({
        ...values,
        phone: values.phone || undefined,
        avatarUrl: values.avatarUrl || undefined,
      })
      queryClient.setQueryData(["me"], updated)
      toast.success("Profile updated")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input placeholder="+880..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updating || !form.formState.isDirty}>
          {updating ? <Spinner className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
      </form>
    </Form>
  )
}