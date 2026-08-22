# Step 17 — Notifications (bell + page)

## Status

**DONE.** Promoted out of `12-explicitly-cut.md`. The backend ships the `notification` module
(server Step ~20): a per-user in-app notification ledger fed by booking and package lifecycle
events.

## Overview

A bell appears in the top nav for **any authenticated role** (USER, AGENT, ADMIN) with a live
unread-count badge. Clicking it opens a dropdown of the newest notifications; each item carries a
`title`, `message`, `link`, and timestamp, marks itself read on click, and navigates to the
resolved target. A "View all" entry leads to `/notifications`, a standalone protected page with
pagination, an unread filter, and mark-all-read. Unread state is refreshed on a short interval so
the badge stays current while the app is open. The server stores notification links with
backend-style prefixes (`/dashboard/agent/...`, `/dashboard/bookings/...`) that do **not** exist
on the frontend — a link-translation helper maps them to real client routes.

## Depends on

- `lib/api/client.ts` — `apiClient<T>`, `apiClientFull<T>` (paginated), `ApiError`.
- `hooks/use-me.ts` — `useMe()` gates the bell (anonymous → render nothing).
- `components/shared/navbar.tsx` — public header; gains the bell next to the user menu.
- `app/(dashboardGroup)/layout.tsx` — dashboard header; gains the bell next to `DashboardUserMenu`
  so it is available on dashboards too (the shared `Navbar` is not rendered there).
- `proxy.ts` (Step 4) — **must add `/notifications` to `PROTECTED_PREFIXES`** so the page is
  authenticated-only; it is not role-scoped (any logged-in role may read it).
- Server: `notification` module — `GET /api/notifications`, `GET /api/notifications/unread-count`,
  `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read`.

## Routes

- `GET /notifications` — any authenticated user — full list with unread filter + pagination.
- `GET /api/notifications?page&limit&unread=true|false` — auth() — newest first, default limit 20.
- `GET /api/notifications/unread-count` — auth() — `{ count }` for the bell badge.
- `PATCH /api/notifications/read-all` — auth() — marks all mine read, returns `{ count }`.
- `PATCH /api/notifications/:id/read` — auth() — marks one read (owner only; a foreign id is a
  uniform 404 `"Notification not found."`).

## Server contract (actual)

```
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      NotificationType   // BOOKING_CREATED | BOOKING_CONFIRMED | BOOKING_CANCELLED
                               // | PACKAGE_APPROVED | PACKAGE_REJECTED
  title     String
  message   String
  link      String?            // backend-prefixed: "/dashboard/agent/bookings/:id",
                               // "/dashboard/agent/packages/:id", "/dashboard/bookings/:id"
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

GET /api/notifications?page=&limit=&unread=   auth()
  → 200 envelope { data: [Notification...], meta }
  unread param is "true"/"false" ONLY (the server transforms the string; never a bare boolean).
  Default limit 20, capped at 50.

GET /api/notifications/unread-count          auth() → 200 { count }
PATCH /api/notifications/read-all            auth() → 200 { count }   (idempotent)
PATCH /api/notifications/:id/read            auth() → 200 { count }   (404 on foreign id)
```

`NotificationType` is an enum in the Prisma schema — the client mirrors it as a string union (no
server enum import). `BOOKING_CREATED` goes to the **agent**; `BOOKING_CONFIRMED`/`BOOKING_CANCELLED`
to the **customer** (cancellation may also hit the agent depending on who cancelled);
`PACKAGE_APPROVED`/`PACKAGE_REJECTED` to the **submitting agent**.

## New API functions (`lib/api/notifications.ts`)

```
export type TNotificationType =
  | "BOOKING_CREATED" | "BOOKING_CONFIRMED" | "BOOKING_CANCELLED"
  | "PACKAGE_APPROVED" | "PACKAGE_REJECTED"

export type TNotification = {
  id: string; userId: string; type: TNotificationType
  title: string; message: string; link: string | null
  isRead: boolean; createdAt: string
}

notificationsApi.getMyNotifications({ page, limit, unread })  — GET  (apiClientFull) → { data, meta }
notificationsApi.getUnreadCount()                             — GET  /unread-count → { count }
notificationsApi.markAllAsRead()                              — PATCH /read-all → { count }
notificationsApi.markAsRead(id)                               — PATCH /:id/read → { count }
```

Types declared at the top of the same file, per project convention.

## New Hooks

Reused in the bell dropdown, the navbar badge, and the /notifications page → one wrapper file:

```
hooks/useNotifications.ts
  useUnreadCount()       — useQuery(["notifications","unread-count"], () => getUnreadCount(),
                             refetchInterval: 30_000, enabled only when logged in)
  useNotifications({ page, unread }) — useQuery(["notifications", page, unread], ...)
  useMarkAsRead()        — useMutation(markAsRead); onSuccess invalidates
                             ["notifications","unread-count"] and the active ["notifications", ...] keys
  useMarkAllAsRead()     — useMutation(markAllAsRead); onSuccess invalidates the same keys
```

**Link resolution** — a small pure helper, `lib/notifications.ts` (or `lib/utils.ts`), no hooks:

```
resolveNotificationLink(link: string | null, role: TRole): string
  null / "/dashboard/..." with no recognizable prefix → roleDashboard(role)
  "/dashboard/agent/bookings/:id"  → "/agent-dashboard/bookings/:id"
  "/dashboard/agent/packages/:id"  → "/agent-dashboard/packages/:id/edit"
  "/dashboard/agent/..."           → "/agent-dashboard" + rest
  "/dashboard/admin/..."           → "/admin-dashboard" + rest
  "/dashboard/bookings/:id"        → role-scoped: USER → "/user-dashboard/bookings/:id",
                                     AGENT → "/agent-dashboard/bookings" (no agent detail page today),
                                     ADMIN → "/admin-dashboard/bookings"
```

The backend emits `/dashboard/agent/...` and `/dashboard/bookings/...` only. Unknown/foreign
prefixes fall back to the role dashboard so a link can never 404 or bounce to login.

## Components

**Create (`components/notifications/`):**
- `notification-bell.tsx` — props `{ className? }`. Renders nothing when anonymous (`useMe`).
  Bell icon (`Bell` / `BellRinging` from `@phosphor-icons/react`) with a count badge (unread
  count, capped at "9+" / 99+) using `useUnreadCount`. Dropdown (shadcn `DropdownMenu`,
  `@radix-ui/react-dropdown-menu` is already a dependency) listing the ~10 newest via
  `useNotifications({ limit: 10 })`, each row rendered by `NotificationItem`, a "Mark all as
  read" action, and a "View all notifications" link to `/notifications`.
- `notification-item.tsx` — props `{ notification, onNavigate }`. Icon per `type`
  (BOOKING_* → `Ticket`/`CalendarCheck`/`X`; PACKAGE_* → `Package`/`CheckCircle`/`XCircle`),
  title (medium), message (muted, 2-line clamp), relative time, unread dot. Clicking calls
  `markAsRead` then `onNavigate(resolveNotificationLink(notification.link, role))`.
- `notifications-page.tsx` — `"use client"` list body for `/notifications` (header + pagination
  live in the page file below).

**Create (`app/(publicGroup)/notifications/`):**
- `page.tsx` — `"use client"`. `useMe` gate (if somehow unauthenticated, redirect to `/login`);
  unread/All tabs (`Tabs` from `components/ui/tabs.tsx`), `useNotifications({ page, unread })`,
  `PaginationPages`, mark-all-read button, `EmptyState` ("You're all caught up" / "No
  notifications yet"), skeletons, error + retry. Each row is a `NotificationItem` navigating via
  `resolveNotificationLink`.

**Modify:**
- `components/shared/navbar.tsx` — render `<NotificationBell />` next to the theme toggle (desktop
  and mobile sheet) when logged in.
- `app/(dashboardGroup)/layout.tsx` — render `<NotificationBell />` beside `DashboardUserMenu`.
- `proxy.ts` — add `"/notifications"` to `PROTECTED_PREFIXES`.

## Files to change

- `components/shared/navbar.tsx`
- `app/(dashboardGroup)/layout.tsx`
- `proxy.ts` — `/notifications` → `PROTECTED_PREFIXES`
- `lib/utils.ts` (or new `lib/notifications.ts`) — `resolveNotificationLink`
- `.opencode/specs/00-overview.md` — Step 17 line (done with this step)
- `.opencode/specs/12-explicitly-cut.md` — remove "notifications" from the cut list (done with this step)

## Files to create

- `lib/api/notifications.ts`
- `hooks/useNotifications.ts`
- `components/notifications/notification-bell.tsx`
- `components/notifications/notification-item.tsx`
- `app/(publicGroup)/notifications/page.tsx`

## New dependencies

No new dependencies (`@radix-ui/react-dropdown-menu` is already present via `ui/dropdown-menu.tsx`).

## Rules for implementation

### Data fetching
- All calls through `lib/api/notifications.ts` → `apiClient`/`apiClientFull`; never raw `fetch`.
- Every mutation invalidates `["notifications","unread-count"]` **and** the active notification
  list keys so the badge and dropdown agree instantly after mark-read/mark-all.
- `useUnreadCount` polls every 30 s while logged in; it must be a no-op when logged out
  (`enabled: !!user`).
- The unread query param is sent as the literal strings `"true"`/`"false"` (server contract) —
  never `Boolean(...)` which would serialize wrong.

### Auth & routing
- `/notifications` must be in `PROTECTED_PREFIXES` or an anonymous visitor is redirected to
  `/login` **without** `redirectTo` being preserved by the generic protected branch — verify the
  login return flow works.
- The bell renders only for authenticated users; anonymous visitors get no bell, no fetch, no
  polling.
- Notification links are translated with `resolveNotificationLink` — never used raw.

### UI & animation
- Clickable elements: `cursor-pointer` + `transition-colors duration-200`; buttons
  `whileTap={{ scale: 0.97 }}`; lists `motion.div` `staggerChildren: 0.08`; icons from
  `@phosphor-icons/react` (Bell, BellRinging, Ticket, Package, CheckCircle, XCircle, Check, ArrowsClockwise).
- Unread rows: subtle `bg-primary/5`; unread dot (size-2 rounded-full bg-primary).
- shadcn/ui from `components/ui/` only (`DropdownMenu`, `Tabs`, `Skeleton`, `EmptyState` is
  `components/shared`); Tailwind v4 tokens; dark via `dark:`; `cn()` from `@/lib/utils`.

## Definition of done

Runnable via `npm run dev` with the server running the notification module and seed data:

- As an AGENT, placing a USER booking (or seeding one) creates a `BOOKING_CREATED` notification;
  the agent's bell shows a badge with the correct count.
- Confirming/cancelling a booking, and approving/rejecting a package, each produce the right
  `type`/title/message for the right recipient (see the event table above).
- Clicking a notification marks it read (badge decrements immediately via invalidation) and
  navigates to the translated link — agent booking links reach the agent bookings list, package
  links reach the package edit page, user booking links reach the user booking detail.
- "Mark all as read" zeroes the badge; the unread tab on `/notifications` empties.
- `/notifications` paginates and filters by unread; anonymous access redirects to `/login` and
  returns to `/notifications` after sign-in.
- The badge refreshes without a reload (30 s poll) and while browsing public pages.
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).

## As built (implementation notes)

- **Agent booking links land on the bookings LIST**, not `/agent-dashboard/bookings/:id`
  as this spec's resolver table first said — that detail route does not exist on the client
  (`agent-dashboard/bookings/` has no `[id]` segment). `resolveNotificationLink` drops the id
  for agent booking links; user booking links keep theirs (`user-dashboard/bookings/[id]`
  exists); package links map to `/agent-dashboard/packages/:id/edit` (exists).
- **`unread=false` is NOT "read rows only"** — the server's ternary
  (`...(query.unread ? { isRead: false } : {})`) treats false as *no filter at all* and
  returns every row. Only `unread=true` filters. The client therefore sends `undefined` for
  the All tab and `"true"` for Unread, never `"false"`.
- **`limit>50` is rejected with 400** ("Number must be less than or equal to 50"), not
  silently capped as this spec first said. The client never exceeds 50.
- The stale `redirectTo` worry above was disproven live: adding `/notifications` to
  `PROTECTED_PREFIXES` alone yields `307 → /login?redirectTo=%2Fnotifications`, and the
  generic post-auth redirect returns the visitor to the page.
- Mobile treatment: Radix dropdowns misbehave inside the navbar Sheet, so mobile gets a
  compact "Notifications" link in the sheet nav; desktop gets the full bell dropdown beside
  the theme toggle; dashboards render the same bell beside `DashboardUserMenu`.
- **Naming follows repo convention, not this spec's first draft:** hooks live in
  `hooks/use-notifications.ts` (kebab-case like `use-me.ts`), and pagination reuses the
  shared `Pagination` component (`PaginationPages` doesn't exist).
- **List query keys include `limit`.** The bell (10 newest) and the `/notifications` page
  (20 per page) co-mount under the publicGroup Navbar and would otherwise share one cache
  entry for key `["notifications", 1, "all"]` — whichever fetched first fed both surfaces
  mismatched rows/pagination until staleTime expired.
- `formatRelativeTime` initially lived in `lib/notifications.ts`; Step 18 relocated it to
  `lib/format.ts` (its proper home — blog comments reuse it). Only the import in
  `notification-item.tsx` changed.
- Verified live against :4000: USER books → AGENT unread 24→25 with BOOKING_CREATED +
  `/dashboard/agent/bookings/:id`; ADMIN confirms → USER notified (BOOKING_CONFIRMED +
  `/dashboard/bookings/:id`); foreign-id mark-read → 404 "Notification not found." verbatim;
  read-all idempotent ×2; `unread=true/false` semantics confirmed with real data; anonymous
  401 on all four routes. Test booking + its two notifications deleted afterwards; per-role
  unread baselines restored exactly.