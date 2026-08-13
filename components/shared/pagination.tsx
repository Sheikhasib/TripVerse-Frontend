"use client"

import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

// Compact pagination matching the dashboard table pattern — prev/next + a
// current/total readout. Enough for the MVP where lists are short.
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4"
    >
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <CaretLeft size={14} />
        Previous
      </button>
      <span className="text-sm tabular-nums text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        Next
        <CaretRight size={14} />
      </button>
    </nav>
  )
}

export function PaginationPages({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    }
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className="flex size-9 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <CaretLeft size={14} />
      </button>
      {pages.map((p, i) => {
        const gap = p - (pages[i - 1] ?? 0)
        return (
          <span key={p} className="flex items-center">
            {gap > 1 && (
              <span className="px-1 text-sm text-muted-foreground">&hellip;</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted",
              )}
            >
              {p}
            </button>
          </span>
        )
      })}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className="flex size-9 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <CaretRight size={14} />
      </button>
    </nav>
  )
}