# Step 2 — App Shell

## Root layout (`app/layout.tsx`)
- Wraps children in `QueryProvider` (TanStack Query) then `ThemeProvider` (next-themes, `attribute="class"`, `defaultTheme="system"`).
- `Toaster` (sonner) mounted once at root for success/error toasts app-wide.
- `metadata` export — site-wide title template + description (baseline for Step 6's per-page `generateMetadata`).

## Providers (`app/providers/`)
- `query-provider.tsx` — `QueryClientProvider` with a `useState`-created `QueryClient` (`staleTime: 60s`, `refetchOnWindowFocus: false`).

## Theming
- Max 3 primary colors + neutral (requirement doc constraint) — defined as CSS variables in `globals.css` (oklch color space), consumed via Tailwind + shadcn's `cssVariables: true` config.
- Light/dark mode via `next-themes`, toggled by class on `<html>`.
- `components.json` (shadcn config) — `rsc: true`, `tailwind.cssVariables: true`, base color and icon library chosen once here, then every `shadcn add` respects it automatically.
