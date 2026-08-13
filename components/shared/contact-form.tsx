"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { PaperPlaneTilt, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import { contactSchema, type TContactSchema } from "@/lib/validations/public"
import { contactApi } from "@/lib/api/contact"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function ContactForm() {
  const [sent, setSent] = useState(false)

  const form = useForm<TContactSchema>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  })

  const onSubmit = async (values: TContactSchema) => {
    try {
      await contactApi.send(values)
      setSent(true)
      toast.success("Message sent — we'll get back to you soon.")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-card p-10 text-center ring-1 ring-foreground/5">
        <div className="flex size-14 items-center justify-center rounded-md bg-primary/10 text-primary">
          <PaperPlaneTilt size={28} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Message sent</h2>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
          Thanks for reaching out. Our team will reply to your email within a
          couple of working days.
        </p>
        <Button variant="outline" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="space-y-4 rounded-lg bg-card p-6 ring-1 ring-foreground/5 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="How can we help?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a bit more..."
                  className="min-h-32 resize-y"
                  {...field}
                />
              </FormControl>
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
          ) : (
            <PaperPlaneTilt />
          )}
          Send message
        </Button>
      </form>
    </Form>
  )
}