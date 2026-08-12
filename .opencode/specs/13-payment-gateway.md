# Step 13 — Payment Gateway (SSLCommerz)

## Overview

Promotes payment out of "Explicitly Cut" (Step 12) into a real step, mirroring the server's Step 16
(payment module, `tripverse-server/.opencode/specs/16-payment-module.md`). Checkout uses **SSLCommerz**
in **BDT**. A `USER` books a package (Step 8), gets a `PENDING` booking with a server-computed
`totalPrice`, then hits **Pay now** on the booking detail page: the client calls `POST /api/payments/initiate`,
stores a small "active payment session" marker, and redirects the browser to the SSLCommerz gateway
(`gatewayPageUrl`). SSLCommerz bounces the user back to `/payment/{success|cancel|fail}`. The success
page calls `POST /api/payments/:id/verify`; on server-validated success the payment → `SUCCESS` and the
booking → `PAID`, and the page renders the receipt (from the `payment + booking` returned by verify).
Receipts and payment attempts are also visible on `/user-dashboard/bookings/[id]`, and a new
`/user-dashboard/payments` page lists them (promoted out of `[LATER]`). The seller flow is unchanged
(`PAID → CONFIRMED → COMPLETED`, Step 8/10); cancelling a `PAID` booking marks the payment `REFUNDED`
in the DB only.

## Depends on

- `lib/api/client.ts` — `apiClient<T>` / `apiClientFull<T>`, `TApiEnvelope<T>`, `ApiError`. Payment calls
  go through here and throw `ApiError(statusCode, message)` — the message is surfaced verbatim.
- `lib/api/bookings.ts` (Step 8) — `fetchMyBookings`, `fetchBookingById`, `createBooking`; its booking
  type must gain `payments: TPayment[]` and the status union must gain `"PAID"`.
- `hooks/useBookings.ts` (Step 8) — query keys to invalidate after initiate/verify so the booking UI
  (PAID badge, attempts) refreshes.
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx` (Step 10) — booking detail page that gets
  the Pay-now button, the attempt list, and the receipt section. Proxy-guarded to `USER` (Step 4).
- `app/(publicGroup)/` — the three gateway-return pages live here (public layout, no proxy guard), because
  `proxy.ts` (Step 4) lists these as public routes; auth for the verify call comes from the token cookies
  still present in the returning browser.
- `components/ui/` — `button`, `card`, `badge`, `skeleton`, `dialog`, `sonner` only; no new primitives.
- Server: `POST /api/payments/initiate` / `POST /api/payments/:id/verify` (Step 16) plus
  `GET /api/bookings/:id` and `GET /api/bookings/my-bookings` now including `payments` and `?status=PAID`.
- `next.config.ts` — the `/api/:path*` rewrite already proxies payment calls; no change, no new client env.

## Routes

```
[public] /payment/success          post-gateway return — verifies the active session, renders the receipt
[public] /payment/cancel           user clicked Cancel on the gateway — clears session, booking stays PENDING
[public] /payment/fail             gateway failure — clears session, retry state
[public] /payment                  thin status page — shows an in-flight payment with a resume link, else empty state
[USER]   /user-dashboard/bookings/[id]   modify — Pay now + payment attempts + receipt section
[USER]   /user-dashboard/bookings       modify — rows gain a PAID badge and, on PENDING/abandoned, "Pay"
[USER]   /user-dashboard/payments        promoted from [LATER] — payment history derived from my-bookings
```

Note: `/payment/*` pages are rendered by `(publicGroup)` without a dashboard shell; the `verify` post
needs auth, so the success page handles a 401 gracefully ("session expired — log in", linking to
`/login?redirectTo=/payment/success`) instead of assuming the cookies survived.

## Identification problem & the active-payment session

`s/ssl`'s return URLs are static per the server (`<frontend>/payment/success` etc.) — they carry no
per-payment id, and there is no client-visible `GET /payment/:id`. So the client must remember which
payment it started before redirecting away.

- `lib/payment-session.ts` — localStorage key `tv-active-payment`, value
  `{ paymentId, bookingId, tranId, initiatedAt }`.
- Written on `initiate` success (right before redirect), cleared on every terminal state
  (`success` → after successful verify; `cancel`/`fail` → on mount). Never cleared on a failed verify —
  the receipt flow still owes the user a resolution.
- Guarded: client-only ("use client"), try/catch around `JSON.parse`, tolerate a missing
  localStorage (privacy mode) by falling back to "no active session".

## New API functions

```
lib/api/payments.ts
  paymentsApi.initiate(bookingId) — POST /api/payments/initiate — body { bookingId }
      → TInitiateResult { gatewayPageUrl, tranId }
      Errors surface verbatim: 400 "not payable" (CANCELLED booking), 409 "already paid" /
      "a payment session is already active", 502 (gateway init failed).
  paymentsApi.verify(paymentId) — POST /api/payments/:id/verify
      → TVerifyResult { payment, booking }   // receipt data — payment + booking in one shot
      Idempotent 200 on double-submit/IPN-race; 403/404 if not owned; 400 "payment could not be verified".
```

Type locations follow the project convention (types co-located with the API file, e.g. `TAuthUser` in
`auth.ts`):

```
lib/api/payments.ts
  TPaymentStatus = "INITIATED" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED"
  TPayment — mirrors the server Payment model: id, bookingId, tranId, valId?, amount (number), currency,
             status, gatewayPageUrl?, sslSessionKey?, cardType?, bankTranId?, paidAt?, createdAt
  TInitiateResult = { gatewayPageUrl: string; tranId: string }
  TVerifyResult = { payment: TPayment; booking: TBooking }
```

`lib/api/bookings.ts` (modify, Step 8): extend `TBookingStatus` with `"PAID"` and add
`payments?: TPayment[]` to the booking detail type (import `TPayment` from `./payments`).

## Session helper

```
lib/payment-session.ts
  setActivePayment(session: TActivePayment) / getActivePayment(): TActivePayment | null
  clearActivePayment() — localStorage-synced, safe on server / when JSON is corrupt
```

## New Hooks

```
hooks/usePayments.ts
  usePaymentsApi-level hooks only — no cached GETs exist for payments.
  useInitiatePayment()   — useMutation(paymentsApi.initiate)
      onSuccess: setActivePayment(...) then window.location.assign(gatewayPageUrl)
      onSuccess invalidates: ['bookings', 'my-bookings'] and booking-detail key ['booking', id]
  useVerifyPayment()     — useMutation(paymentsApi.verify)
      onSuccess: clearActivePayment(); invalidates my-bookings + booking detail
```

No `useQuery` hooks — there is no payment list endpoint; history and receipts come from the bookings data.

## Components

**Create (`components/payment/`):**
- `pay-now-button.tsx` — props `{ booking, className? }`. Rendered only when the booking is `PENDING`
  and has no `SUCCESS` payment. Shows the amount in BDT (from `booking.totalPrice`, 2-dp formatted), a
  busy/loading state while initiating (disabled), and surfaces 400/409/502 `ApiError` messages verbatim
  via sonner. Uses `useInitiatePayment`.
- `payment-status-badge.tsx` — maps `TPaymentStatus` → badge colors: INITIATED=yellow, SUCCESS=green,
  FAILED=red, CANCELLED=gray, REFUNDED=blue.
- `payment-attempts.tsx` — props `{ payments: TPayment[] }` — rows with `PaymentStatusBadge`, amount,
  `tranId`, timestamp; empty state ("No payments yet"); skeletons while bookings load.
- `payment-receipt.tsx` — props `{ payment, booking }` — the receipt card: amount BDT, `tranId`,
  `valId`, `cardType`, `bankTranId`, `paidAt`, booking ref + summary line, and the PAID booking message
  ("Payment received — the agent will confirm shortly"). Used on `/payment/success` and on the booking
  detail page when a `SUCCESS`/`REFUNDED` payment exists.

**Create (`app/(publicGroup)/payment/`), all `"use client"`:**
- `success/page.tsx` — reads `getActivePayment()`; none → friendly "no active payment session" card with
  links (back to `/user-dashboard/bookings`); one present → `useVerifyPayment`, single-shot per mount
  (ref-guarded); success → replace session UI with `PaymentReceipt`; 401 → login prompt; 400 → verify-
  failed message + retry button; loading → skeleton.
- `cancel/page.tsx` — on mount: `clearActivePayment()`, show "Payment cancelled" card from query
  `tran_id` if any + link back to the booking. Booking remains PENDING — the user can retry from there.
- `fail/page.tsx` — on mount: `clearActivePayment()`, show "Payment failed" card + retry link.
- `page.tsx` — `/payment`: `getActivePayment()` present → "Continue your payment" card with a link back
  to the booking (the booking detail's Pay-now re-runs initiate if the TTL session lapsed); none → empty
  state pointing to `/user-dashboard/bookings`.

**Create (`app/(dashboardGroup)`):**
- `user-dashboard/payments/page.tsx` — table of the user's bookings with their latest payment status
  (from `useMyBookings`): booking id, package, amount, `PaymentStatusBadge`, `paidAt`, link to booking
  detail for the receipt. Empty + error + retry states.

**Modify:**
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx` — add `PayNowButton` (PENDING), a
  `PaymentAttempts` section, and a `PaymentReceipt` when a terminal payment exists.
- Booking tables/`StatusBadge` (Steps 8/10) — add the `PAID` booking status: **purple** badge (matches
  the GearUp palette the codebase was cloned from: PENDING=yellow, PAID=purple, CONFIRMED=blue,
  COMPLETED=green, CANCELLED=red). No new transitions are offered via `PATCH /:id/status` — `PAID` is
  driven by the payment module, so no new table action buttons.

## Files to change

- `lib/api/bookings.ts`
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx`
- Booking table + status badge components from Steps 8/10
- `.opencode/specs/00-overview.md` — add step 13 to the build order
- `.opencode/specs/06-public-pages.md` — move the 3 payment routes out of `[LATER]`
- `.opencode/specs/10-dashboards.md` — move `/user-dashboard/payments` out of `[LATER]` into this step
- `.opencode/specs/12-explicitly-cut.md` — drop "Payment pages (3)" / payment history from the cut list

## Files to create

- `.opencode/specs/13-payment-gateway.md`
- `lib/api/payments.ts`
- `lib/payment-session.ts`
- `hooks/usePayments.ts`
- `app/(publicGroup)/payment/page.tsx`
- `app/(publicGroup)/payment/success/page.tsx`
- `app/(publicGroup)/payment/cancel/page.tsx`
- `app/(publicGroup)/payment/fail/page.tsx`
- `app/(dashboardGroup)/user-dashboard/payments/page.tsx`
- `components/payment/pay-now-button.tsx`
- `components/payment/payment-status-badge.tsx`
- `components/payment/payment-attempts.tsx`
- `components/payment/payment-receipt.tsx`

## New dependencies

No new dependencies. Client uses the existing `apiClient` + TanStack Query; payment pages need no
gateway SDK (SSLCommerz hosts the form). No new client env vars — `SSLCOMMERZ_*` stays server-side.

## Rules for implementation

### Data fetching
- All payment calls go through `lib/api/payments.ts` → `apiClient`; never raw `fetch` in components.
- `useMutation` always wires `onSuccess` with `queryClient.invalidateQueries` (my-bookings + booking detail).
- Mutation buttons must show loading state + `disabled`; prevent double-submit client-side in addition to
  the server's TTL/409 guard.
- Skeleton states while payments/bookings load; empty state for every payment list; error state with a
  retry button that surfaces the `ApiError.message` verbatim (400/409/502).

### Session & SSR
- The payment pages are `"use client"`; `lib/payment-session.ts` reads/writes localStorage only on the
  client, never during render-hydration mismatch (guard `typeof window`), and tolerates a missing/corrupt
  JSON value.
- Verify runs at most once per mount (ref guard) — a re-render from the verify mutation must not re-fire.
- Handle 401 on verify by showing a login prompt, since `/payment/*` is public and cookies may not have
  survived; never discard the active session marker until a real terminal state.

### UI & animation
- All clickable elements: `cursor-pointer` + `transition-colors duration-200`; buttons `whileTap={{ scale: 0.97 }}`.
- Cards `whileHover={{ y: -4 }}`; lists `motion.div` with `staggerChildren: 0.08`; icons from
  `@phosphor-icons/react` (HTTP icon for Pay now, CheckCircle/XCircle/Bank for success/cancel/fail).
- StatusBadge additions: booking `PAID`=purple; payments INITIATED=yellow, SUCCESS=green, FAILED=red,
  CANCELLED=gray, REFUNDED=blue.
- shadcn/ui from `components/ui/` (button, card, badge, skeleton, dialog, sonner) — never new primitives.
- Tailwind v4 tokens (`bg-primary`, `text-muted-foreground`…), dark via `dark:`, `cn()` from `@/lib/utils`.

### Money
- Amounts display in BDT with 2-dp formatting; the charged amount always reads from `booking.totalPrice`
  (or the frozen `payment.amount`) — never compute client-side, never send to the API.

## Definition of done

Runnable via `npm run dev` with the server running the Step 16 payment module and sandbox store creds:

- Booking detail of a fresh `PENDING` booking shows **Pay now** with the correct BDT total.
- Pay now redirects to the SSLCommerz sandbox gateway; with an active session another `/initiate` →
  409 shown verbatim (and the button is disabled client-side too).
- Paying on the sandbox returns to `/payment/success`, which verifies and renders the `PaymentReceipt`
  (tranId, cardType, amount); the booking flips to `PAID`, the badge is purple, and re-visiting the
  success URL idempotently shows the receipt or "already paid".
- Clicking Cancel on the sandbox gateway lands on `/payment/cancel` → session cleared, booking still
  PENDING, and re-initiate from the booking works (stale INITIATED sessions are auto-cancelled by the
  server TTL).
- Gateway failure path lands on `/payment/fail` → session cleared, retry link works.
- `/user-dashboard/bookings` shows the PAID badge; `/user-dashboard/bookings/[id]` shows the attempt
  list and (for PAID/REFUNDED) the receipt; `/user-dashboard/payments` lists bookings with payment status.
- Cancelling a PAID booking (Step 10) shows the payment as REFUNDED in the attempts/receipt.
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).