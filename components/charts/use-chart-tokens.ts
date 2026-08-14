"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"

const TOKENS = [
  "--color-primary",
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
] as const

export type ChartToken = (typeof TOKENS)[number]

const CHART_TOKEN_ORDER: ChartToken[] = [
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
]

function readToken(token: ChartToken): string {
  if (typeof document === "undefined") return ""
  const el = document.createElement("div")
  el.style.color = `var(${token})`
  document.body.appendChild(el)
  const color = getComputedStyle(el).color
  el.remove()
  return color
}

// Resolves design-system tokens to concrete colors the SVG can render,
// recalculated when the theme switches so charts follow light/dark mode.
export function useChartTokens() {
  const { resolvedTheme } = useTheme()
  return useMemo(() => {
    if (typeof document === "undefined") return {} as Record<ChartToken, string>
    return Object.fromEntries(TOKENS.map((t) => [t, readToken(t)])) as Record<
      ChartToken,
      string
    >
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme])
}

// Chart colors in a stable order, falling back to a default blue so charts
// never render with empty fills.
export function useChartColors(): string[] {
  const tokens = useChartTokens()
  return useMemo(
    () =>
      CHART_TOKEN_ORDER.map((t) => tokens[t] || "var(--color-primary, #0e7490)"),
    [tokens],
  )
}