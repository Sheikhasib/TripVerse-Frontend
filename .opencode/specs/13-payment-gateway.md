# Step 13 — Payment Gateway (SSLCommerz)

## Status

**PARTIAL.** `lib/api/payments.ts` (the `/create` client) is written but the pages are not —
`app/(publicGroup)/payment/page.tsx` is a broken placeholder (it has three `default` exports and
reads a localStorage "active payment" marker) and must be replaced. Remaining work: the
pay-now button, payment components, the three gateway-return pages, the user payments history
page, and the `proxy.ts` public-path entry.

## Overview

A `USER` books a package (Step 8) and gets a `PENDING` booking with a server-computed
`totalPrice`. On the booking detail page they hit **Pay now**: the client calls
`POST /api/payments/create { bookingId }`, receives `{ paymentId, tranId, paymentUrl }`, and
redirects the browser to `paymentUrl` (the SSLCommerz-hosted checkout). SSLCommerz then POSTs the
outcome **server-to-server** to the backend's `POST /api/payments/confirm?bookingId&tranId&status`
(or `/ipn`); the backend settles the payment ledger and — on success — flips the booking
`PENDING → PAID`, then 302-redirects the browser to
`{frontend}/payment/{success|cancel|fail}?bookingId=<id>`. The result pages read `bookingId` from
the query string, fetch the booking (`GET /api/bookings/:id` includes `payments`), and render the
receipt or a status card.

**Key divergence from the earlier draft spec:** there is **no client-side `verify` call** and
**no localStorage session** — identification travels in the redirect query, and the settlement
already happened server-side before the browser lands on the result page. Receipts and attempts
are also visible on `/user-dashboard/bookings/[id]`; `/user-dashboard/payments` (promoted out of
`[LATER]`) lists the user's bookings with their latest payment status. The seller flow is
unchanged (`PAID → CONFIRMED → COMPLETED`, Step 8/10); cancelling a `PAID` booking marks its
`SUCCESS` payments `REFUNDED` in the DB only.

## Depends on

- `lib/api/client.ts` — `apiClient<T>`, `ApiError(statusCode, message)` (surfaced verbatim).
- `lib/api/bookings.ts` (Step 8) — `getBookingById` (booking detail includes `payments`),
  `getMyBookings` (payments on list rows); `TPayment`/`TPaymentStatus` already co-located here.
- `lib/api/payments.ts` — `paymentsApi.createPayment` (already written; see below).
- `hooks/use-me.ts` — none needed for the payment pages themselves (booking fetch is
  cookie-authenticated via the same-origin rewrite).
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx` (Step 8) — gains Pay-now,
  payment attempts, and the receipt section. `proxy.ts` guards `/user-dashboard` to `USER`.
- `app/(publicGroup)/` — the three gateway-return pages live here.
- `proxy.ts` (Step 4) — **must add `/payment` to `PUBLIC_PREFIXES`**; it is currently absent, so
  an unauthenticated browser bouncing back from the gateway would be redirected to `/login`.
- `components/ui/` — `button`, `card`, `badge`, `skeleton`, `sonner` only.
- Server: `payment` module (Step 16) — `POST /api/payments/create`, `POST /api/payments/confirm`,
  `POST /api/payments/ipn`; plus `GET /api/bookings/:id` and `/my-bookings` already including
  `payments`.
- `next.config.ts` — the `/api/:path*` rewrite already proxies payment calls; no change, no new
  client env (all `SSLCOMMERZ_*` stays server-side).

## Routes

```
[public] /payment/success?bookingId=   post-gateway return — shows the receipt when the booking is PAID with a SUCCESS payment
[public] /payment/cancel?bookingId=    user cancelled at the gateway — booking stays PENDING, retry link
[public] /payment/fail?bookingId=      gateway failure — booking stays PENDING, retry link
[USER]   /user-dashboard/bookings/[id]   modify — Pay-now + payment attempts + receipt section
[USER]   /user-dashboard/bookings       modify — rows already show the PAID badge; add a "Pay" affordance on PENDING rows (optional)
[USER]   /user-dashboard/payments        promoted from [LATER] — payment history derived from my-bookings
```

Note: `/payment/*` renders in `(publicGroup)` without the dashboard shell. The booking fetch needs
the user's cookies; if they expired during checkout the page shows a "sign in to continue" prompt
linking to `/login?redirectTo=<current>` — the browser still has the `bookingId`, so re-login then
returning re-renders the receipt.

## Server contract (actual, Step 16)

```
POST /api/payments/create            auth(USER)  body { bookingId }
  → 201 { paymentId, tranId, paymentUrl }
  Errors (verbatim): 404 "Booking not found." · 403 "You are not authorized to pay for this
  booking." · 409 "This booking is already paid." · 409 "Cannot pay for a booking in <status>
  status." · 502 SSLCommerz init failures.
  Side effects: any prior INITIATED payment for the booking is flipped to CANCELLED and a new
  INITIATED ledger row is created before the gateway is asked; if init throws, the fresh row is
  flipped to FAILED (the ledger always tells the truth). paymentUrl is the gateway page URL.

POST /api/payments/confirm?bookingId=&tranId=&status=success|fail|cancel   public callback
  Settles (idempotent) then 302-redirects to {frontend}/payment/{status}?bookingId=
POST /api/payments/ipn?bookingId=&tranId=                                 public callback
  Same idempotent settle; answers 200 OK (no redirect).

Settle rules (processGatewayResult):
  - unknown session          → no-op (responds FAILED/no-change, nothing persisted)
  - already SUCCESS          → idempotent 200, no double-charge
  - cancel callback          → payment CANCELLED
  - no val_id (fail_url)     → payment FAILED
  - val_id present           → server-side validate; VALID/VALIDATED + amount matches the frozen
                               booking.totalPrice → payment SUCCESS (stores valId, cardType,
                               bankTranId, paidAt) + booking PENDING → PAID (compare-and-set: a
                               concurrently-confirmed/cancelled booking stays put) + "payment
                               received" email; anything else → payment FAILED.
```

## New API functions

```
lib/api/payments.ts   (already written — keep as-is except type tidy-up)
  TPaymentStatus = "INITIATED" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED"
  TPayment        — mirrors the server payment row returned in bookings (id, tranId, amount,
                    currency, status, cardType?, bankTranId?, paidAt?) — re-import from
                    ./bookings instead of redeclaring (today it is duplicated; single-source it).
  TPaymentCreateResult = { paymentId: string; tranId: string; paymentUrl: string }
  paymentsApi.createPayment({ bookingId }) — POST /api/payments/create → TPaymentCreateResult
```

Type locations follow the project convention (co-located with the owning API file). Note the
server's booking payment select does **not** return `valId` today, but the draft receipt page
reads `payment.valId`. Decide: add `valId` to the server's `bookingPaymentSelect` (small backend
change, gives the receipt the SSLCommerz authorization code) or drop the Authorization ID line.
Also drop the redundant `TPaymentStatusBadge` alias (dup of `TPaymentStatus`).

## New Hooks

No `useQuery` hooks — there is no payment-list endpoint; history and receipts come from the
bookings data (`["booking", id]`, `["my-bookings"]`).

```
hooks/usePayments.ts
  useCreatePayment()  — useMutation(paymentsApi.createPayment)
      onSuccess(data): window.location.assign(data.paymentUrl)   // hard redirect to the gateway
      onError:          surfaces 400/403/409/502 ApiError.message verbatim (sonner toast)
      (No queryClient invalidation needed pre-redirect.)
```

## Components

**Create (`components/payment/`):**
- `pay-now-button.tsx` — props `{ booking: TBooking, className? }`. Rendered only when
  `booking.status === "PENDING"` and no `SUCCESS` payment exists. Shows the amount in BDT
  (`booking.totalPrice`, 2-dp) and a busy/`disabled` state while initiating (prevents
  double-submit; the server's 409 "already paid"/ledger supersede guards the race). On success
  the browser leaves for the gateway. Uses `useCreatePayment`.
- `payment-status-badge.tsx` — maps `TPaymentStatus` → colors: INITIATED=yellow, SUCCESS=green,
  FAILED=red, CANCELLED=gray, REFUNDED=blue (same `STATUS_CONFIG` pattern as
  `booking-status-badge.tsx`, not a parallel badge system).
- `payment-attempts.tsx` — props `{ payments: TPayment[] }`. Rows with the status badge, amount,
  `tranId`, and timestamp; empty state ("No payments yet"); skeletons while the booking loads.
- `payment-receipt.tsx` — props `{ payment: TPayment, booking: TBooking }`. Receipt card: amount
  BDT, `tranId`, `valId`/`cardType`/`bankTranId`/`paidAt` when present, booking ref + summary
  line, and the PAID message ("Payment received — the agent will confirm shortly"). Used on
  `/payment/success` and on the booking detail page when a `SUCCESS`/`REFUNDED` payment exists.

**Create (`app/(publicGroup)/payment/`), all `"use client"`:**
- `success/page.tsx` — `useParams().bookingId` (query param passed through the 302); no param →
  "no booking reference" card with a link to `/user-dashboard/bookings`. Fetch the booking via
  `bookingsApi.getBookingById` (`useQuery`, key `["booking", id]`); loading → skeleton. If
  `booking.status === "PAID"` and a `SUCCESS` payment exists → `PaymentReceipt`; otherwise a
  status card ("Not paid yet" / pending) with links back. Handle a 401 from the booking fetch by
  showing a sign-in prompt (`/login?redirectTo=<current>`), since `/payment/*` is public and the
  cookies may not have survived.
- `cancel/page.tsx` — fetch the booking, show "Payment cancelled" card ("Your booking remains
  PENDING") with a link back to the booking detail to retry.
- `fail/page.tsx` — fetch the booking, show "Payment failed" card + retry link back to the booking
  detail.

**Delete:** the current `app/(publicGroup)/payment/page.tsx` placeholder — it has three `default`
exports (invalid) and reads a nonexistent localStorage session.

**Create (`app/(dashboardGroup)`):**
- `user-dashboard/payments/page.tsx` — table of the user's bookings (`useMyBookings` query key
  `["my-bookings"]`) with their latest payment status: booking id, package, amount BDT,
  `PaymentStatusBadge`, `paidAt`, link to the booking detail for the receipt. Empty + error +
  retry states.

**Modify:**
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx` — add `PayNowButton` (PENDING
  only), a `PaymentAttempts` section, and a `PaymentReceipt` when a terminal payment exists.
- Booking table/badge (Step 8) — the `PAID` booking status is already wired (purple badge) and is
  driven by the payment module, so **no** new `PATCH /:id/status` transitions and no new table
  action buttons.

## Files to change

- `proxy.ts` — add `/payment` to `PUBLIC_PREFIXES`
- `lib/api/payments.ts` — single-source `TPayment`/`TPaymentStatus` from `./bookings`; drop the
  `TPaymentStatusBadge` alias; add `valId` to the receipt type if the server change lands
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx`
- `.opencode/specs/00-overview.md` — Step 13 line already present
- `.opencode/specs/10-dashboards.md` — `/user-dashboard/payments` promoted into this step (done)

## Files to create

- `lib/api/payments.ts` (exists) — tidy per above
- `hooks/usePayments.ts`
- `components/payment/pay-now-button.tsx`
- `components/payment/payment-status-badge.tsx`
- `components/payment/payment-attempts.tsx`
- `components/payment/payment-receipt.tsx`
- `app/(publicGroup)/payment/success/page.tsx`
- `app/(publicGroup)/payment/cancel/page.tsx`
- `app/(publicGroup)/payment/fail/page.tsx`
- `app/(dashboardGroup)/user-dashboard/payments/page.tsx`
- (Optional) `lib/format.ts` — `formatBDT` shared by payment + booking money fields

## New dependencies

No new dependencies. The client uses the existing `apiClient` + TanStack Query; the gateway form
is SSLCommerz-hosted so no SDK is needed, and `SSLCOMMERZ_*` env stays server-side.

## Rules for implementation

### Data fetching
- All payment calls go through `lib/api/payments.ts` → `apiClient`; never raw `fetch`.
- `useMutation` (create) redirects the browser on success; there is no verify mutation — the
  result pages just fetch the booking. If any future mutation is added it must wire
  `onSuccess` with `queryClient.invalidateQueries` (`["my-bookings"]`, `["booking", id]`).
- Mutation buttons show loading + `disabled`; prevent double-submit client-side in addition to the
  server's ledger guard.
- Skeleton states while bookings load; `EmptyState` for every list; error states with a retry
  button surfacing `ApiError.message` verbatim (400/403/409/502).

### SSR & the public pages
- All `/payment/*` pages are `"use client"`. No localStorage anywhere — the `bookingId` comes from
  the redirect query, so there is no hydration/session concern.
- Handle a 401/expired session on the booking fetch with a login prompt; `/payment/*` is public
  so the cookies may not have survived the gateway bounce.
- `proxy.ts` must whitelist `/payment` or the auth guard intercepts the gateway return.

### UI & animation
- All clickable elements: `cursor-pointer` + `transition-colors duration-200`; buttons
  `whileTap={{ scale: 0.97 }}`; cards `whileHover={{ y: -4 }}`; lists `motion.div` with
  `staggerChildren: 0.08`; icons from `@phosphor-icons/react` (CreditCard for Pay now,
  CheckCircle/XCircle/Bank for success/cancel/fail).
- Payment badges: INITIATED=yellow, SUCCESS=green, FAILED=red, CANCELLED=gray, REFUNDED=blue.
- shadcn/ui from `components/ui/` (button, card, badge, skeleton, sonner) — never new primitives.
- Tailwind v4 tokens (`bg-primary`, `text-muted-foreground`…), dark via `dark:`, `cn()` from
  `@/lib/utils`.

### Money
- Amounts display in BDT with 2-dp formatting via a single shared helper; the charged amount
  always reads from `booking.totalPrice` (or the frozen `payment.amount`) — never computed
  client-side, never sent to the API. Existing booking tables/detail pages currently format USD —
  switch them to the BDT helper so the receipt and table agree.

## Definition of done

Runnable via `npm run dev` with the server running the Step 16 payment module and sandbox store
creds (`BACKEND_PUBLIC_URL` set to a publicly reachable URL for the gateway callbacks):

- A fresh `PENDING` booking on `/user-dashboard/bookings/[id]` shows **Pay now** with the correct
  BDT total; clicking it redirects to the SSLCommerz sandbox checkout.
- Double-submit is blocked client-side, and a second `/create` on a live session surfaces the
  server's 409 verbatim.
- Paying on the sandbox returns to `/payment/success?bookingId=` → the receipt renders (tranId,
  cardType, amount), the booking flips to `PAID` (purple badge), and re-visiting the URL
  idempotently shows the receipt or a "not paid" card.
- Clicking Cancel at the gateway lands on `/payment/cancel?bookingId=` → booking stays `PENDING`,
  retry from the booking detail works (stale `INITIATED` sessions are superseded by a fresh
  `/create`).
- Gateway failure path lands on `/payment/fail?bookingId=` → booking stays `PENDING`, retry link
  works.
- `/user-dashboard/bookings` shows the `PAID` badge; `/user-dashboard/bookings/[id]` shows the
  attempt list and (for PAID/REFUNDED) the receipt; `/user-dashboard/payments` lists bookings
  with payment status.
- Cancelling a `PAID` booking (Step 10) shows its payment as `REFUNDED` in attempts/receipt.
- `proxy.ts` lets an unauthenticated (but cookie-less) browser reach `/payment/*` without a
  `/login` redirect.
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).