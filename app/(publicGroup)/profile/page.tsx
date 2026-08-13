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
import { roleDashboard } from "@/utils/role"
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import Link from "next/link"

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()

export default function ProfilePage() {
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
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
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
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account details
      </p>

      <div className="mt-8 flex items-center gap-4 rounded-lg bg-card p-6 ring-1 ring-foreground/5">
        <Avatar className="size-14">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          ) : (
            <AvatarFallback className="text-lg text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs font-semibold tracking-widest uppercase text-primary">
            {user.role}
          </p>
        </div>
        <Button variant="outline" asChild className="ml-auto">
          <Link href={roleDashboard(user.role)}>Go to dashboard</Link>
        </Button>
      </div>

      <div className="mt-6 rounded-lg bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
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
      </div>
    </div>
  )
}