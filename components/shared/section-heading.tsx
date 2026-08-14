import Link from "next/link"
import type { ReactNode } from "react"

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  align?: "left" | "center"
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = "View All",
  align = "left",
}: SectionHeadingProps) {
  const heading: ReactNode = (
    <div className={align === "center" ? "text-center" : undefined}>
      {eyebrow && (
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )

  return (
    <div
      className={`mb-10 flex gap-4 ${
        align === "center" ? "flex-col items-center" : "items-end justify-between"
      }`}
    >
      {heading}
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold tracking-widest uppercase text-primary transition-colors hover:text-primary/80"
        >
          {linkLabel} &rarr;
        </Link>
      )}
    </div>
  )
}