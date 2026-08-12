# TripVerse Client

This is **Step 1 — Project Setup** and **Step 2 — App Shell** from the frontend spec, built and working. Read the spec files alongside this repo (`01-project-setup.md` through `12-explicitly-cut.md`) and implement each remaining step in order, in this same repo.

## What's already built

- **Step 1**: `package.json`, `tsconfig.json`, `next.config.ts` (Cloudinary `remotePatterns` + `/api` rewrite proxy to the backend), `.env.example`, `components.json` (shadcn config), full folder skeleton (`app/`, `components/`, `lib/`, `service/`, `utils/`, `hooks/`, `store/`)
- **Step 2**: `app/globals.css` (theme tokens — 3 primary colors + neutral, light/dark via oklch), `components/theme-provider.tsx` (dark mode + `Cmd/Ctrl+D`-free `D` hotkey toggle, matches GearUp), `app/providers/query-provider.tsx` (TanStack Query), `app/layout.tsx` (wires both providers + `Toaster` + site metadata), `lib/utils.ts` (`cn()` helper shadcn components need), a placeholder `app/page.tsx` so the dev server renders something

## What's NOT built yet

Everything from `03-auth-infra.md` onward: API client, JWT utils, refresh-token service, `proxy.ts` route protection, auth pages, real public pages, package management, booking flow, reviews, dashboards, deployment.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

`http://localhost:3000` should show a placeholder TripVerse heading with dark mode working (press `D` to toggle, or it follows system theme). This confirms Steps 1–2 are wired correctly before moving on.

## Next step

Open `03-auth-infra.md` and build `lib/api/client.ts`, `utils/jwt.ts`, and `service/refreshToken.ts` — these unblock `proxy.ts` (Step 4) and every data-fetching hook after it.
