"use client"

import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartCardProps {
  title: string
  description?: string
  action?: ReactNode
  loading?: boolean
  error?: boolean
  empty?: boolean
  emptyText?: string
  className?: string
  children: ReactNode
}

export function ChartCard({
  title,
  description,
  action,
  loading,
  error,
  empty,
  emptyText = "Not enough data yet.",
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs">{description}</CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-60 w-full" />
        ) : error ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
            Failed to load data.
          </div>
        ) : empty ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div className="h-60">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}