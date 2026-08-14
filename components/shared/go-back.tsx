"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface GoBackProps {
  href: string
  label?: string
  variant?: "link" | "default" | "outline" | "secondary" | "ghost"
  className?: string
}

export function GoBack({
  href,
  label = "Go back",
  variant = "link",
  className,
}: GoBackProps) {
  const router = useRouter()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(href)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50",
        variant === "link"
          ? "text-muted-foreground hover:text-primary focus-visible:text-primary"
          : buttonVariants({ variant, size: "default" }),
        className,
      )}
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  )
}
