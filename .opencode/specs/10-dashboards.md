# Step 10 — Dashboards

## Status

**PARTIAL.** Dashboard shell, role-aware nav, the three overview pages, booking tables, and the
users/posts management pages are implemented and committed (dashboards build in progress). The
remaining MVP work — **profile/settings (user), analytics/settings (admin), and fixing the
dashboard data layer to consume the real server contract** — is listed under **Remaining work**.

## Overview

Three role-scoped dashboards under `proxy.ts`-guarded prefixes (`/user-dashboard`,
`/agent-dashboard`, `/admin-dashboard`). The `AGENT` role displays as **"Manager"** in UI copy
(sidebar heading + page title), while the route prefix and stored role value stay
`AGENT`/`agent-dashboard`. `lib/api/dashboard.ts` is the single source of stats so components
render from one shape and never call endpoints directly. Charts render from the server's
aggregates.

## Depends on

- `lib/api/dashboard.ts` — `dashboardApi.getOverview(role)`; **current client type
  (`TOverview`) does not match the real server responses — see Remaining work.**
- `lib/api/bookings.ts` (Step 8) — `BookingTable` + `getMyBookings`/`getAgentBookings`/`getAllBookings`.
- `lib/api/packages.ts`, `lib/api/users.ts` (profile PATCH), `hooks/use-me.ts`.
- `components/dashboard/dashboard-nav.tsx`, `dashboard-mobile-nav.tsx`, `dashboard-user-menu.tsx`,
  `overview-cards.tsx`, `booking-table.tsx`, `status-badge.tsx`, `package-form.tsx`.
- `app/(dashboardGroup)/layout.tsx` — shared shell (navbar, role nav, user menu).
- Server: `dashboard` module (Step 12) — `GET /api/dashboard/admin|agent|user`.
- `proxy.ts` (Step 4) — all three prefixes already guarded by role.

## Routes

```
[USER]  /user-dashboard                    overview — OverviewCards + bookings table     ✓ built
[USER]  /user-dashboard/bookings           my bookings (Step 8)                         ✓ built
[USER]  /user-dashboard/bookings/[id]      booking detail (Step 8/13)                   ✓ built
[USER]  /user-dashboard/payments           payment history (promoted → Step 13)         ✗ step 13
[USER]  /user-dashboard/profile            profile fields via usersApi.updateProfile    ✗ remaining
[USER]  /user-dashboard/settings           settings-lite (same profile fields)          ✗ remaining
[AGENT] /agent-dashboard                   "Manager" overview                            ✓ built
[AGENT] /agent-dashboard/my-packages       package CRUD (Step 7)                         ✓ built
[AGENT] /agent-dashboard/packages/new      create (Step 7)                               ✓ built
[AGENT] /agent-dashboard/bookings          scoped bookings (Step 8)                      ✓ built
[AGENT] /agent-dashboard/my-posts          blog authoring (Step 11 server)               ✓ built
[AGENT] /agent-dashboard/posts/[id]/edit   edit own post                                 ✓ built
[ADMIN] /admin-dashboard                   overview + revenue line + lists               ✓ built
[ADMIN] /admin-dashboard/packages          moderation (Step 7)                           ✓ built
[ADMIN] /admin-dashboard/users             user management                               ✓ built
[ADMIN] /admin-dashboard/bookings          all bookings (Step 8)                         ✓ built
[ADMIN] /admin-dashboard/posts             publish/unpublish posts                       ✓ built
[ADMIN] /admin-dashboard/analytics         recharts from admin overview                  ✗ remaining
[ADMIN] /admin-dashboard/settings          settings page                                 ✗ remaining
[LATER] /admin-dashboard/messages           contact inbox (backend API exists) — deferred
[LATER] /admin-dashboard/categories         category CRUD (backend API exists) — deferred
```

`DashboardNav` already links the four unbuilt pages (`/user-dashboard/profile`,
`/user-dashboard/settings`, `/admin-dashboard/analytics`, `/admin-dashboard/settings`) — they
currently 404 until built.

## Server contract (actual, Step 12)

`GET /api/dashboard/:role` — auth-scoped. `days` query (int 1–365, default 30) applies to
admin/agent. Money returns as `Number`.

```
GET /api/dashboard/admin?days=30
  { totalUsers, totalPackages, totalBookings, totalRevenue,
    usersByRole: { role, count }[],
    bookingsByStatus: { status, count }[],
    packagesByCategory: { category, count }[],
    revenueOverTime: { date: "YYYY-MM-DD", revenue }[] }      // daily, zero-filled

GET /api/dashboard/agent?days=30
  { totalPackages, totalBookings, totalRevenue, averageRating,   // 1dp; zeros when no packages
    bookingsByStatus: { status, count }[],
    revenueOverTime: { date, revenue }[] }

GET /api/dashboard/user
  { totalBookings, totalSpend,
    upcomingCount, upcoming: { id, travelDate, travelers, totalPrice, status,
                               package: { id, title, slug } }[] }  // take 5, soonest first
```

`revenueOverTime` buckets **COMPLETED** bookings by their `updatedAt` (the transition
timestamp), not `createdAt`.

## Components

**Built:**
- `components/dashboard/dashboard-nav.tsx` — `NAV_BY_ROLE` (USER: Overview/My Bookings/Profile/
  Settings; AGENT: Manager/My Packages/New Package/Bookings; ADMIN: Overview/Manage Packages/
  Manage Users/Manage Bookings/Analytics/Settings); active state by pathname prefix.
- `components/dashboard/overview-cards.tsx` — stat cards grid. **Currently typed against the
  synthetic client shape (`users.total`, `bookings.byStatus`, `packages.byCategory`) which the
  server does not return — must be re-mapped (see Remaining work).**
- `app/(dashboardGroup)/user-dashboard/page.tsx`, `agent-dashboard/page.tsx`,
  `admin-dashboard/page.tsx` — each: `dashboardApi.getOverview(role)` + `BookingTable` (and the
  admin page a `recharts` `LineChart` of `revenueOverTime`).
- `app/(dashboardGroup)/admin-dashboard/users/page.tsx`, `posts/page.tsx` — user management and
  blog moderation lists.

## Remaining work

1. **Fix the dashboard data layer (highest priority).** The client `TOverview` and `OverviewCards`
   assume a unified shape (`users.total`, `bookings.byStatus`, `packages.revenue`) the server does
   not produce, so overview cards currently read zeros, and `getOverview` sends a pointless
   `?page=&limit=` (the server accepts `days`, not paging). Rework `lib/api/dashboard.ts` to:
   - type each role's response against the real contracts above (`TAdminOverview`, `TAgentOverview`,
     `TUserOverview`), and
   - map them into a single typed view-model consumed by `OverviewCards`/charts (counts,
     revenue, trend), swapping the source later touches one file. Support `days`.
2. **Build `/user-dashboard/profile` and `/user-dashboard/settings`** — profile fields via
   `usersApi.updateProfile` (`TProfileSchema` in `lib/validations/public.ts`); per the
   requirements "Settings-lite" is just the profile fields, so share one form component.
3. **Build `/admin-dashboard/analytics`** — `recharts` (already a dependency) from the admin
   overview: `revenueOverTime` line, `bookingsByStatus` bar, `packagesByCategory`,
   `usersByRole`; empty + loading states.
4. **Build `/admin-dashboard/settings`** — admin profile/settings fields.
5. **Money formatting** — dashboard revenue/`totalPrice` displays are hardcoded `USD` today; the
   platform charges BDT (Step 13). Use the shared BDT formatter once it exists.

## Files to change

- `lib/api/dashboard.ts` — per-role types + view-model mapping, `days` support
- `components/dashboard/overview-cards.tsx` — consume the mapped view-model
- `components/dashboard/dashboard-nav.tsx` — unchanged (links already present)

## Files to create

- `app/(dashboardGroup)/user-dashboard/profile/page.tsx`
- `app/(dashboardGroup)/user-dashboard/settings/page.tsx`
- `app/(dashboardGroup)/admin-dashboard/analytics/page.tsx`
- `app/(dashboardGroup)/admin-dashboard/settings/page.tsx`
- `components/dashboard/profile-form.tsx` (shared by user profile + settings)
- (Optional) `lib/format.ts` — `formatBDT` used by dashboard money fields

## New dependencies

No new dependencies (`recharts` is already installed and used by the admin overview page).

## Rules for implementation

### Data fetching
- Server Components call `xxxApi.method()` directly (try/catch, safe fallback); Client Components
  use inline `useQuery`/`useMutation` with `xxxApi.method` — no wrapper hook unless reused 3+
  places (the dashboard overview query is reused across the three overview pages; a small
  `useDashboardOverview(role)` hook is justified).
- Mutations always invalidate relevant queries; buttons show loading + `disabled`.
- Skeleton loading states; `EmptyState` for empty lists; error states with a retry button
  surfacing `ApiError.message` verbatim.

### Auth & routing
- All three prefixes are already role-guarded in `proxy.ts`; new sub-routes inherit the guard.
- `AGENT` displays as **"Manager"** in UI copy; route prefix and stored role stay `AGENT`.

### UI & animation
- Clickables `cursor-pointer` + `transition-colors duration-200`; buttons `whileTap={{ scale: 0.97 }}`;
  cards `whileHover={{ y: -4 }}`; lists `motion.div` stagger `0.08`; icons from
  `@phosphor-icons/react`; shadcn/ui primitives only; Tailwind v4 tokens + `dark:`; `cn()`.

### Money
- Revenue/`totalPrice` display uses the shared BDT formatter (never USD), reading amounts from the
  API — never computed client-side.

## Definition of done

- `/user-dashboard`, `/agent-dashboard`, `/admin-dashboard` show real aggregates (users,
  packages, bookings, revenue, status breakdowns) from the server contract — no synthetic zeros.
- Agent dashboard ("Manager" heading) is scoped to the agent's own packages and shows the average
  rating; a package-less agent sees zeros, not other agents' data.
- Admin analytics page renders the four charts with empty/loading states.
- User Profile and Settings pages load and save profile fields via `usersApi.updateProfile`.
- Nav links for all four previously-missing pages resolve (no 404s).
- `npm run lint` and `npm run typecheck` pass. Committed + pushed (AGENTS.md workflow).
