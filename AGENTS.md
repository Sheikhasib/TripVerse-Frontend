# TripVerse Client

Frontend for TripVerse (travel packages, bookings, reviews). Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui. Built from the numbered spec files in `.opencode/specs/` (`01-project-setup.md` → `12-explicitly-cut.md`); the requirements in `.opencode/specs/requirements.md` are the acceptance checklist.

> **Workflow rule:** commit to git continuously as the work progresses — at minimum once per spec step, and more often for substantial milestones within a step. Push after each commit. Never leave uncommitted work at the end of a session. Use conventional message prefixes (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

## Quick start

```bash
npm install
cp .env.example .env.local   # real values: BACKEND_API_URL, JWT secrets (must match server), Cloudinary cloud name
npm run dev                  # http://localhost:3000
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |

## Architecture

- **Next.js App Router** route groups: `(publicGroup)`, `(authGroup)`, `(dashboardGroup)`
- **State**: TanStack Query for server state, Zustand for client state
- **Forms**: react-hook-form + zod via `@hookform/resolvers`, schemas in `lib/validations/`
- **API**: `lib/api/client.ts` — one file per resource, all calls same-origin through `next.config.ts` rewrites (`/api/:path*` → `BACKEND_API_URL`), so no CORS/cookies in browser requests
- **Auth**: `proxy.ts` (Next middleware) verifies JWTs with `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` and guards dashboard routes by role. These secrets MUST match the backend's exactly, or every token is rejected.
- **Styling**: Tailwind 4 CSS variables in `app/globals.css` (3 primary colors + neutral, light/dark via oklch), `next-themes` for dark mode, `sonner` for toasts

## Env vars

All in `.env.local` (gitignored — never commit secrets). See `.env.example` for the full list. `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must match `tripverse-server/.env` exactly.

## Data sources

- Server repo: `C:\Projects\Level-2\tripverse-server` — Express + Prisma + Postgres API.
- Demo data comes from the server's `prisma/seed.ts`.

## Notable absences

- No test framework, no CI yet.
- `/terms`, wishlist, payment pages, categories manager, and the admin contact inbox are explicitly cut from the MVP (see `12-explicitly-cut.md`). Blog pages and contact-message persistence are **in** the MVP — the backend ships those modules (blog and contact), and the seed provides demo posts.
