"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type Control } from "react-hook-form"
import { z } from "zod"
import { Eye, EyeSlash, Key, Moon, Sun } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useMe } from "@/hooks/use-me"
import { roleDashboard } from "@/utils/role"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const passwordSchema = z
  .object({
    currentPassword: z
      .string({ message: "Current password is required" })
      .min(1),
    newPassword: z
      .string({ message: "New password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z
      .string({ message: "Please confirm your new password" })
      .min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type TPasswordSchema = z.infer<typeof passwordSchema>

function PasswordField({
  name,
  label,
  placeholder,
  control,
}: {
  name: "currentPassword" | "newPassword" | "confirmPassword"
  label: string
  placeholder: string
  control: Control<TPasswordSchema>
}) {
  const [show, setShow] = useState(false)
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                type={show ? "text" : "password"}
                placeholder={placeholder}
                autoComplete={
                  name === "currentPassword" ? "current-password" : "new-password"
                }
                className="pr-10"
                {...field}
              />
            </FormControl>
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? (
                <EyeSlash className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function AccountSettingsForm() {
  const { user, isLoading } = useMe()
  const { resolvedTheme, setTheme } = useTheme()

  const form = useForm<TPasswordSchema>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        Please log in to view your settings.
      </p>
    )
  }

  // Frontend-only demo for now — wired to a future Redis-backed change-password
  // endpoint. Nothing is sent to the server yet.
  const onSubmit = () => {
    form.reset()
    toast.info(
      "Password change is coming soon — the endpoint is on our roadmap.",
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
            <Key size={20} />
          </span>
          <div>
            <h2 className="font-semibold">Change password</h2>
            <p className="text-sm text-muted-foreground">
              Keep your account secure with a strong password.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="mt-6 space-y-4"
          >
            <PasswordField
              name="currentPassword"
              label="Current password"
              placeholder="Your current password"
              control={form.control}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PasswordField
                name="newPassword"
                label="New password"
                placeholder="At least 6 characters"
                control={form.control}
              />
              <PasswordField
                name="confirmPassword"
                label="Confirm new password"
                placeholder="Repeat the new password"
                control={form.control}
              />
            </div>
            <Button type="submit" disabled={!form.formState.isValid}>
              Update password
            </Button>
          </form>
        </Form>
      </div>

      <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Choose how TripVerse looks to you.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border p-1">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-label="Light mode"
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded transition-colors",
                resolvedTheme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sun size={16} />
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-label="Dark mode"
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded transition-colors",
                resolvedTheme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Moon size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details are managed from your profile.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Email
            </dt>
            <dd className="mt-1 break-all font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Role
            </dt>
            <dd className="mt-1 font-medium capitalize">{user.role.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Member since
            </dt>
            <dd className="mt-1 font-medium">
              {user.createdAt
                ? new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(user.createdAt))
                : "—"}
            </dd>
          </div>
        </dl>
        <a
          href={roleDashboard(user.role)}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Open your dashboard
        </a>
      </div>
    </div>
  )
}