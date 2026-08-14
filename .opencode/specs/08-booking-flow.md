# Step 8 — Booking Flow

## Status

**BUILT.** Create-booking form, user/agent/admin booking tables, and the booking detail page
are implemented and committed (see the `feat: add booking flow …` and `feat: add booking flow
(create form, booking tables, user/agent/admin pages)` commits). This spec documents the
as-built reality against the server's `booking` module (server Step 9). Nothing left to build
except the optional money-formatting cleanup noted under **Remaining work**.

## Overview

A `USER` books an approved package from the package detail page. The backend computes
`totalPrice` authoritatively (`package.price × travelers`) server-side — the client never sends
it. A booking lives in a five-state machine (`PENDING → PAID → CONFIRMED → COMPLETED`, plus
`CANCELLED` from `PENDING`/`PAID`/`CONFIRMED`). `PAID` is **not** reachable through the status
`PATCH` — it is driven exclusively by the payment module (Step 13, server Step 16). All
transitions go through a single `PATCH /api/bookings/:id/status`; the server validates the
transition (actor, state, travel-date gates) and returns a human-readable 400/403/409 that the
client surfaces verbatim.

## Depends on

- `lib/api/client.ts` — `apiClient<T>` / `apiClientFull<T>` (`{ data, meta }` for paginated
  lists), `ApiError(statusCode, message)`.
- `lib/api/packages.ts` — `TPublicPackage` (has `price`) for the booking form's estimate preview.
- `lib/validations/booking.ts` — `createBookingSchema` (zod, used via `@hookform/resolvers/zod`).
- `hooks/use-me.ts` — gates the booking form (`user` / `userLoading`).
- `app/(dashboardGroup)/` — booking list pages live here; guarded by `proxy.ts` to
  `USER`/`AGENT`/`ADMIN` (Step 4).
- Server: `booking` module (Step 9) — `POST /api/bookings`, `GET /api/bookings/my-bookings`,
  `/agent-bookings`, `/:id`, `GET /api/bookings`, `PATCH /api/bookings/:id/status`. List/detail
  responses include `payments` and map money to `Number`.

## Routes

```
[public] /packages/[slug]                        booking-panel (create form) on the package page
[USER]   /user-dashboard/bookings                my bookings — status filter chips + table
[USER]   /user-dashboard/bookings/[id]           booking detail — cancel action, payment slots (Step 13)
[AGENT]  /agent-dashboard/bookings               bookings for the agent's own packages
[ADMIN]  /admin-dashboard/bookings               all bookings (customer column)
```

`proxy.ts` already guards all three dashboard prefixes; no new proxy entries.

## New API functions

```
lib/api/bookings.ts
  TBookingStatus = "PENDING" | "PAID" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  TPayment       — mirrors the server payment row in booking responses: id, tranId, amount,
                   currency, status (TPaymentStatus), cardType?, bankTranId?, paidAt?
  TBookingPackage / TBookingUser / TBooking / TBookingQuery — co-located, per project convention
  bookingsApi.getMyBookings(params)   — GET /api/bookings/my-bookings?page&limit&status → { data, meta }
  bookingsApi.getAgentBookings(params)— GET /api/bookings/agent-bookings (adds ?search) → { data, meta }
  bookingsApi.getAllBookings(params)  — GET /api/bookings (ADMIN) → { data, meta }
  bookingsApi.getBookingById(id)      — GET /api/bookings/:id → TBooking (includes payments)
  bookingsApi.createBooking(payload)  — POST /api/bookings { packageId, travelDate, travelers } → TBooking
  bookingsApi.updateBookingStatus(id, status) — PATCH /api/bookings/:id/status { status } → TBooking
```

`lib/validations/booking.ts` — `createBookingSchema`: `packageId` (non-empty), `travelDate`
(must be today or later — UTC-midnight comparison mirrors the server), `travelers` (int, 1–20).

## State machine (server-authoritative)

Mirrors `booking.service.ts` on the server. `BookingTable` renders actions only for the
transitions the actor may trigger, and pre-disables the two time-gated ones client-side (with a
tooltip) while the server is still the final judge:

| Current   | Allowed next | Who can trigger               | Client shows |
|-----------|--------------|-------------------------------|--------------|
| `PENDING` | `CONFIRMED`  | package agent / admin         | agent+admin rows |
| `PENDING` | `CANCELLED`  | owner, agent, admin           | all roles |
| `PAID`    | `CONFIRMED`  | package agent / admin         | agent+admin rows |
| `PAID`    | `CANCELLED`  | owner, agent, admin           | all roles |
| `CONFIRMED` | `COMPLETED` | agent / admin, **only after travelDate** | agent+admin rows, disabled until date passes |
| `CONFIRMED` | `CANCELLED` | owner, agent, admin         | all roles |
| `CONFIRMED` | `PENDING` (revert) | agent / admin, only before travelDate | agent+admin rows, disabled once date passes |
| `CANCELLED` / `COMPLETED` | —       | terminal                      | no action buttons |

Server error copy surfaced verbatim (toast): e.g. `Cannot transition booking from CONFIRMED to
CONFIRMED.`, `Booking can only be completed after the travel date has passed.`,
`Booking can only be reverted before the travel date.`, `Booking status changed concurrently.
Please try again.` (409). Cancelling a `PAID` booking also flips its `SUCCESS` payments to
`REFUNDED` and its `INITIATED` ones to `CANCELLED` server-side — the client just refetches.

## Components

**Create:**
- `app/(publicGroup)/packages/[slug]/_components/booking-panel.tsx` — `{ pkg: TPublicPackage }`.
  RHF + zod (`createBookingSchema`), `packageId` from context, `travelDate` (native date input,
  `min = today`), `travelers` (1–20). Live estimate `pkg.price × travelers` labeled
  "Estimated total — the exact total is confirmed at checkout" (never sent to the API). Submit →
  `bookingsApi.createBooking` → success toast → `router.push('/user-dashboard/bookings/' + booking.id)`.
  Logged-out state: "Sign in to book" button (`/login?redirectTo=/packages/[slug]`).
- `components/dashboard/booking-table.tsx` — `{ bookings, isLoading, viewer: "user"|"agent"|"admin", invalidateKeys: QueryKey[] }`. Renders the state-machine actions per viewer (Confirm/Cancel/Complete/Revert), the two time gates (`canComplete`/`canRevert`), `BookingStatusBadge`, customer column for admin, skeletons + `EmptyState`, one `useMutation` per page instance with `onSuccess` invalidating the passed keys and `ApiError.message` toasts.
- `components/dashboard/booking-status-badge.tsx` — `STATUS_CONFIG` map extended with the `PAID` state (see palette below), same pattern as the package `status-badge.tsx`.
- `app/(dashboardGroup)/user-dashboard/bookings/page.tsx` — status filter chips (All/Pending/Paid/Confirmed/Completed/Cancelled) → `getMyBookings({ status, limit: 50 })` → `BookingTable viewer="user"`.
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx` — `getBookingById`, package card, travel-date/travelers/total, `BookingStatusBadge`, and a Cancel action for `PENDING`/`PAID`/`CONFIRMED` via `updateBookingStatus(id, "CANCELLED")`. Payments section lands here in Step 13.
- `app/(dashboardGroup)/agent-dashboard/bookings/page.tsx` and `admin-dashboard/bookings/page.tsx` — same pattern, `viewer="agent"` / `viewer="admin"` with their own query keys.

## Files

As-built: `lib/api/bookings.ts`, `lib/validations/booking.ts`,
`components/dashboard/booking-table.tsx`, `components/dashboard/booking-status-badge.tsx`,
`app/(publicGroup)/packages/[slug]/_components/booking-panel.tsx`,
`app/(publicGroup)/packages/[slug]/page.tsx` (renders the panel),
`app/(dashboardGroup)/user-dashboard/bookings/page.tsx`,
`app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx`,
`app/(dashboardGroup)/agent-dashboard/bookings/page.tsx`,
`app/(dashboardGroup)/admin-dashboard/bookings/page.tsx`.

## Remaining work

None functional. Optional cleanup: money formatting is duplicated per-file and currently
`USD` (`Intl.NumberFormat("en-US", { currency: "USD" })`) in `booking-table.tsx`,
booking detail, and `booking-panel.tsx` — but the server charges **BDT** (Step 13). Introduce a
single `formatBDT` helper (e.g. `lib/format.ts`) and switch booking money fields to it so the
booking total matches the payment receipt.

## Rules for implementation

### Data fetching
- All calls via `lib/api/bookings.ts` → `apiClient`/`apiClientFull`; never raw `fetch`.
- `useMutation` always wires `onSuccess` with `queryClient.invalidateQueries` (the page passes its
  keys via `invalidateKeys` — `["my-bookings"]`, `["agent-bookings"]`, `["admin-bookings"]`,
  `["booking", id]`).
- Mutation buttons show loading state + `disabled`; prevent double-submit.
- Skeletons while loading; `EmptyState` per list; error toasts surface `ApiError.message` verbatim.

### UI & animation
- Clickables: `cursor-pointer` + `transition-colors duration-200`; buttons `whileTap={{ scale: 0.97 }}`; cards `whileHover={{ y: -4 }}`; lists `motion.div` stagger `0.08`; icons from `@phosphor-icons/react` (never emoji).
- `BookingStatusBadge` palette: `PENDING`=amber, `PAID`=purple, `CONFIRMED`=blue, `COMPLETED`=emerald, `CANCELLED`=red — extend the `STATUS_CONFIG` map, never a parallel badge.
- shadcn/ui from `components/ui/`; Tailwind v4 tokens + `dark:`; `cn()` from `@/lib/utils`.

### Money
- Never compute or send `totalPrice` — display only `booking.totalPrice` from the API; the
  client-side estimate in the form is a labeled preview.

## Definition of done

- A `USER` on `/packages/[slug]` books with a valid date and traveler count; the estimate shows
  `price × travelers`; on submit the app lands on the booking detail with the server-computed
  total and a `PENDING` badge.
- Duplicate `PENDING` booking for the same package+date (fresh) → server 409 verbatim;
  abandoned (>24 h) rows are auto-cancelled and rebooked server-side.
- Agent/admin booking tables offer Confirm/Complete (date-gated) /Revert (date-gated)/Cancel per
  the matrix; user table offers Cancel; terminal rows have no buttons; illegal transitions show
  the server's message verbatim.
- Completing a `CONFIRMED` booking after the travel date works (seed a past-date booking to
  exercise the Step 9 review path).
- `npm run lint` and `npm run typecheck` pass. Committed + pushed (AGENTS.md workflow).
