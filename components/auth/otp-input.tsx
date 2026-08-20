import * as React from "react"

import { cn } from "@/lib/utils"

type TOtpInputProps = React.ComponentProps<"input">

const OtpInput = ({ className, ...props }: TOtpInputProps) => {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      autoComplete="one-time-code"
      autoFocus
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-center font-mono text-xl tracking-[0.5em] shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-2xl dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  )
}

export { OtpInput }