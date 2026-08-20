"use client"

import Link from "next/link"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Eye, EyeSlash, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { loginSchema, type TLoginSchema } from "@/lib/validations/auth"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { decodeJwtPayload } from "@/utils/token"
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
import { AuthCard } from "./auth-card"
import { DemoLoginButtons } from "./demo-login-buttons"
import { GoogleButton } from "./google-button"
import { useAfterAuth } from "./use-after-auth"

const LoginForm = () => {
  const afterAuth = useAfterAuth()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<TLoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: TLoginSchema) => {
    try {
      const data = await authApi.login(values)
      const role = (decodeJwtPayload(data.accessToken)?.role as string) ?? "USER"
      afterAuth(data.accessToken, role)
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to your TripVerse account"
      footer={
        <>
          New to TripVerse?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      autoComplete="current-password"
                      className="pr-10"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
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
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Spinner className="size-4 animate-spin" />
            ) : null}
            Log in
          </Button>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </Form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <GoogleButton />
        <DemoLoginButtons />
      </div>
    </AuthCard>
  )
}

export { LoginForm }
