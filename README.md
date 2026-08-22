# TripVerse — Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

> Book curated travel packages — built by agents, approved by admins, loved by travelers.

TripVerse is a travel-package booking platform where **travelers** discover trips,
book seats, pay through SSLCommerz and review their journeys; **agents** create and
manage their own package listings and travel blog posts; and **admins** moderate all
content, manage users and watch platform-wide analytics. One app, three role-based
experiences — each with its own dedicated dashboard.

This repository is the frontend. It talks to a separate Express + Prisma + Postgres
backend ([TripVerse-Backend](https://github.com/Sheikhasib/TripVerse-Backend)) through a
same-origin `/api` proxy, so the browser never makes cross-origin calls.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Authentication & Route Guarding](#authentication--route-guarding)
- [Booking & Payment Flow](#booking--payment-flow)
- [Dashboards](#dashboards)
- [Demo Accounts](#demo-accounts)
- [Documentation](#documentation)

## Key Features

| Role         | Capabilities                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Traveler** | Browse & filter packages, wishlist trips, book with live price estimate, pay via SSLCommerz, track payments & receipts, cancel with automatic refund handling, edit/delete own reviews, in-app notifications |
| **Agent**    | Create/edit/delete own packages (Cloudinary image uploads), manage incoming bookings through the full status lifecycle, write & edit travel blog posts                                                      |
| **Admin**    | Approve/reject packages, moderate posts & bookings, manage users, platform-wide analytics charts, full booking oversight                                                                                     |

### Beyond the basics

These are the capabilities that go past a standard CRUD marketplace:

- **Two-phase registration with OTP email verification** — sign-up stages the account,
  a 6-digit code lands in your inbox, and verifying it **logs you straight in**.
- **OTP password reset** — forgot-password sends a one-time code before a new password
  can be set.
- **Google Sign-In** — one-tap Google Identity Services button that exchanges an
  `idToken` with the backend (hidden automatically when not configured).
- **One-click demo login** — buttons on the login page drop you into any of the three
  seeded roles instantly.
- **Rotating refresh tokens with reuse detection** — every refresh revokes the old token;
  replaying a revoked token nukes the whole token family. The middleware collapses
  concurrent refreshes into a single in-flight request and keeps a short grace cache so
  honest race conditions don't trip reuse detection.
- **Wishlist** — heart any package from cards or detail pages and find it later under
  the traveler dashboard.
- **In-app notifications** — a bell with unread counts plus a standalone notifications
  page; backend links are translated to internal routes automatically.
- **Threaded blog comments** — one-level reply threads on public posts, with author/admin
  deletion.
- **Review management** — authors edit their reviews; authors or admins soft-delete them.
  Package ratings recompute live.
- **Refund transparency** — cancelling a paid booking surfaces the real refund outcome
  from the payment gateway (initiated/completed timestamps), not just a status string.

## Tech Stack

| Layer                 | Technology                                                                        |
| --------------------- | --------------------------------------------------------------------------------- |
| Framework             | Next.js 16 (App Router) with React 19 and TypeScript                              |
| Styling               | Tailwind CSS v4 (oklch design tokens), shadcn/ui, Radix UI, Phosphor icons        |
| Theming               | `next-themes` — light/dark mode driven by CSS variables                           |
| Data fetching / state | TanStack React Query (server state) + Zustand (client state)                      |
| Forms                 | React Hook Form + Zod schemas via `@hookform/resolvers`                           |
| Charts                | Recharts (admin analytics)                                                        |
| Animation             | Framer Motion                                                                     |
| Authentication        | httpOnly cookie JWTs verified in middleware (`proxy.ts`) with `jsonwebtoken`      |
| Images                | Cloudinary (`next-cloudinary`) for uploads and optimized `<Image>` delivery       |
| Payments              | SSLCommerz gateway redirect                                                       |
| Tooling               | ESLint 9, Prettier (+ tailwindcss plugin), TypeScript strict                      |

## Architecture

```
┌────────────────────────── Browser ──────────────────────────┐
│  React 19 client components (TanStack Query, Zustand)       │
│  fetch("/api/...")  ← always same-origin                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   Next.js server (Vercel)                   │
│                                                             │
│  proxy.ts (middleware)                                      │
│   • verifies access-token JWT locally                       │
│   • rotates expired tokens via backend refresh endpoint     │
│   • guards routes by authentication AND role                │
│                                                             │
│  next.config.ts rewrite                                     │
│   /api/:path*  →  ${BACKEND_API_URL}/api/:path*             │
│   (no CORS, no third-party cookies in browser requests)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│      TripVerse-Backend (Express + Prisma + Postgres)        │
│      auth · packages · bookings · payments (SSLCommerz)     │
│      reviews · wishlist · notifications · blog · users      │
└─────────────────────────────────────────────────────────────┘
```

Three principles shape the codebase:

1. **Same-origin API calls.** Every request — client or server side — goes to `/api/*`
   on this app's own domain. A Next.js rewrite forwards it to the backend, so cookies
   stay first-party and CORS is a non-issue.
2. **Auth is decided at the edge, not in pages.** `proxy.ts` verifies JWTs with shared
   secrets *before* a page renders, so protected UI never flashes for logged-out users.
3. **One API module per resource.** `lib/api/*.ts` wraps every backend resource behind
   a typed client; components consume hooks, never raw endpoints.

## Project Structure

```text
tripverse-client
├── app/
│   ├── (authGroup)/                  # /login, /register, /verify-email,
│   │                                 # /forgot-password, /reset-password
│   ├── (publicGroup)/                # Everything visitors see without logging in
│   │   ├── page.tsx                  # Landing page (hero, marquee, categories,
│   │   │                             # featured packages, stats, testimonials, FAQ…)
│   │   ├── packages/                 # Listing with filters + [slug] detail
│   │   │   └── [slug]/               # gallery, sticky booking panel, reviews page
│   │   ├── blog/                     # Blog listing + [slug] posts with comments
│   │   ├── payment/                  # success / cancel / fail return pages
│   │   ├── notifications/            # standalone notification center
│   │   └── about|contact|help|privacy|profile/
│   ├── (dashboardGroup)/             # Role-scoped dashboards (guarded by proxy.ts)
│   │   ├── user-dashboard/           # overview, bookings (+detail), wishlist,
│   │   │                             # payments, profile, settings
│   │   ├── agent-dashboard/          # manager overview, my-packages, package
│   │   │                             # create/edit, bookings, my-posts
│   │   └── admin-dashboard/          # overview, packages, posts, users,
│   │                                 # bookings, analytics, settings
│   ├── providers/                    # TanStack Query provider
│   └── globals.css                   # Tailwind 4 theme tokens (light/dark, oklch)
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── sections/                     # landing-page sections (hero, faq, cta…)
│   ├── dashboard/                    # sidebar, tables, forms, trip-journey timeline
│   ├── charts/                       # Recharts wrappers (revenue, status, roles…)
│   ├── auth/                         # login/register/reset forms, OTP input,
│   │                                 # Google button, demo-login buttons
│   ├── blog|review|payment|wishlist|notifications/  # feature components
│   └── shared/                       # navbar, footer, cards, pagination, rating…
├── hooks/                            # TanStack Query hooks per domain
├── lib/
│   ├── api/                          # typed API layer (one file per resource)
│   ├── validations/                  # Zod schemas (auth, booking, package, review…)
│   ├── format.ts                     # currency/date formatting (BDT)
│   └── utils.ts                      # cn() helper
├── service/                          # Server-only refresh-token call
├── store/                            # Zustand stores
├── utils/                            # jwt verify, cookie helpers, role helpers
├── proxy.ts                          # Next.js middleware — JWT + rotation + guarding
├── next.config.ts                    # /api rewrite, remote image patterns
└── .env.example                      # environment template
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A running TripVerse backend — local or deployed (see the
  [Backend repository](https://github.com/Sheikhasib/TripVerse-Backend)). Its seed script
  creates demo accounts you can log in with (see [Demo Accounts](#demo-accounts)).

### Installation

```bash
git clone https://github.com/Sheikhasib/TripVerse-Frontend.git
cd TripVerse-Frontend
npm install
```

### Configuration

Create your local environment file from the template:

```bash
cp .env.example .env
```

> **JWT secrets must match the backend's** `JWT_ACCESS_SECRET` /
> `JWT_REFRESH_SECRET` exactly. They differ → the middleware cannot verify any token →
> every dashboard route redirects to `/login`. This is the single most common setup
> mistake; the app even logs a hint to the console when it detects it.

### Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. Press `D` anywhere to toggle dark mode.

## Environment Variables

| Variable                              | Scope            | Description                                                                       |
| ------------------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `BACKEND_API_URL`                     | Server-only      | Base URL of the backend API — used by the `/api` rewrite and server-side calls    |
| `NEXT_PUBLIC_BACKEND_API_URL`         | Client + server  | Same base URL, exposed to the browser for public data fetching                    |
| `JWT_ACCESS_SECRET`                   | Server-only      | Verifies access tokens in middleware — **must match backend**                     |
| `JWT_REFRESH_SECRET`                  | Server-only      | Verifies refresh tokens during rotation — **must match backend**                  |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`   | Client           | Cloudinary cloud name for package image uploads/display                           |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`        | Client           | Google OAuth (GIS) client ID; optional — Google button is hidden when unset       |

## Available Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the development server                 |
| `npm run build`      | Create a production build                    |
| `npm run start`      | Serve the production build                   |
| `npm run lint`       | Run ESLint                                   |
| `npm run typecheck`  | Run the TypeScript compiler check (`tsc`)    |
| `npm run format`     | Format code with Prettier                    |

## Authentication & Route Guarding

All auth decisions happen server-side in `proxy.ts` (Next.js middleware):

1. Reads the `accessToken` / `refreshToken` httpOnly cookies.
2. If the access token is valid → request proceeds, enriched with the user's role.
3. If the access token is expired but the refresh token is valid → the middleware calls
   the backend's refresh endpoint and re-sets both cookies on the way through. Under
   rotation, concurrent refreshes are collapsed into one in-flight promise and freshly
   rotated tokens are briefly cached, so parallel requests never invalidate each other.
4. Guards routes:
   - Logged-in users visiting `/login` or `/register` → redirected to their role dashboard.
   - Unauthenticated users on protected routes → `/login?redirectTo=<target>`.
   - Role mismatch (a Traveler opening `/admin-dashboard`) → styled `/not-found`.
   - Unknown paths → styled `/not-found`.
5. Transient refresh failures (network errors, backend 5xx) do **not** clear cookies —
   a temporary outage never logs users out.

A second, client-readable `accessTokenClient` cookie carries the token for
`Authorization` headers on browser-side fetches.

## Booking & Payment Flow

1. On a package detail page, the traveler picks a **travel date** and **number of
   travelers** (1–20); a live estimate updates as `price × travelers` (BDT).
2. Submitting creates the booking and navigates to its detail page, which shows a
   **trip journey timeline**, status badge and payment attempts.
3. **Pay now** hands off to **SSLCommerz**; the backend settles the result via confirm/IPN
   callbacks.
4. The gateway returns to `/payment/success`, `/payment/cancel` or `/payment/fail`,
   which re-verify the real payment status server-side before rendering anything.
5. Cancelling a paid booking triggers the backend's refund flow, and the booking detail
   page surfaces the actual refund outcome.

## Dashboards

Each role gets a sidebar-driven dashboard with its own navigation sections:

| Dashboard | Sections                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Traveler  | Overview (stats cards & charts), Wishlist, My Bookings (+ booking detail), Payments history, Profile, Settings |
| Agent     | Manager overview, My Packages, New Package (form + Cloudinary uploader), Bookings, My Posts                  |
| Admin     | Overview, Packages moderation, Posts moderation, Users, All Bookings, Analytics (revenue over time, bookings by status, packages by category, users by role), Settings |

## Demo Accounts

The backend seed creates three ready-to-use accounts (shared password `demo123`):

| Role     | Email                        | Password   |
| -------- | ---------------------------- | ---------- |
| Admin    | `demo-admin@tripverse.com`   | `demo123`  |
| Agent    | `demo-agent@tripverse.com`   | `demo123`  |
| Traveler | `demo-user@tripverse.com`    | `demo123`  |

> Prefer clicking? The login page has **demo login buttons** that sign you straight
> into any role. New travelers self-register via the two-phase OTP flow.

## Documentation

Development follows numbered spec files in `.opencode/specs/`
(`00-overview.md` → `20-refunds-on-cancel.md`) that document every step of the build
in order. Notably cut from the MVP: `/terms`, wishlist sharing, custom payment pages,
categories manager and the admin contact inbox.

---

Built with Next.js, TypeScript, and Tailwind CSS.
