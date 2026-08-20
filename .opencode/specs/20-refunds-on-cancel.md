# Step 20 — Real Refunds on Cancellation (payment polish)

## Status

**HARDEN + FIX MISMATCHES.** The backend upgraded cancellation (server Step 23): cancelling a
booking with settled money now runs a **live SSLCommerz refund** synchronously and returns the
outcome in the cancel response (`refund: { status: "SUCCESS" } | { status: "FAILED", message }`).
The client's cancel handler ignores this, and the payment types/display reference a field the
server never sends (`refundedAt` instead of `refundCompletedAt`). This step fixes the type
contract, surfaces the refund outcome to the user, and completes the payment display for the
REFUNDED state.

## Overview

Cancelling is a two-part server operation that already landed: the status transition commits
first (a `CANCELLED` booking always stays cancelled), then the gateway refund runs for every
`SUCCESS` payment. Successful refunds flip those payments to `REFUNDED` and record
`refundRefId`/`refundCompletedAt`; a failed refund leaves the payment `SUCCESS` with
`refundInitiatedAt` set so a retry/manual action can find it. The cancel response is
`{ ...booking, refund?: { status: "SUCCESS" } | { status: "FAILED", message } }` — `refund` is
absent when nothing was paid (PENDING bookings). The client must (a) type this correctly,
(b) tell the user whether their money is back, and (c) render refund metadata on the receipt and
attempts list. `PENDING → CANCELLED` cancels stale `INITIATED` payment sessions server-side
(they flip to `CANCELLED`) — that path carries no `refund`.

## Depends on

- `lib/api/bookings.ts` — `TPayment`, `TBooking`, `updateBookingStatus`; the type fixes land here.
- `components/payment/payment-receipt.tsx` — shows `REFUNDED` state; reads `payment.refundedAt`
  (wrong field today) and `payment.refundRefId` (correct).
- `components/payment/payment-attempts.tsx` — shows the "Refunded at" line via `payment.refundedAt`
  (wrong field today).
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx` — the cancel mutation; ignores the
  `refund` field today.
- `app/(dashboardGroup)/user-dashboard/payments/page.tsx` — the user payments history (latest
  payment status per booking); REFUNDED rows already badge blue — verify, don't rebuild.
- Server: `booking` module (Step 23) — `issueRefunds`, `IRefundOutcome`, and
  `bookingPaymentSelect` now returning `valId, refundRefId, refundInitiatedAt, refundCompletedAt`.

## Routes

- `PATCH /api/bookings/:id/status { status: "CANCELLED" }` — the only route touched; the response
  shape changes (adds `refund`).

## Server contract (actual, Step 23)

```
PATCH /api/bookings/:id/status { status: "CANCELLED" }     auth(), canManage
  → 200 { ...booking, refund?: { status: "SUCCESS" } | { status: "FAILED", message: string } }
  refund is absent when there was no settled money (e.g. PENDING → CANCELLED).
  Side effects (order matters — a gateway failure never rolls back the cancellation):
    1. CAS transition PENDING/PAID/CONFIRMED → CANCELLED (409 "Booking status changed
       concurrently. Please try again." on a stale state).
    2. Any INITIATED payments for the booking are flipped to CANCELLED (nothing was charged).
    3. Synchronous gateway refund for each SUCCESS payment:
       - success → payment SUCCESS → REFUNDED (+ refundRefId, refundCompletedAt), refund.total
         accumulates, refund email sent → refund: { status: "SUCCESS" }
       - failure → payment stays SUCCESS, refundInitiatedAt set (retry/manual findable),
         first error message captured → refund: { status: "FAILED", message }
    4. Best-effort booking-cancelled email + in-app notification.

Payment row fields now returned by bookings:
  id, tranId, amount(Number), currency, status, cardType, bankTranId, valId, paidAt,
  refundRefId, refundInitiatedAt, refundCompletedAt
```

## Client changes

**Types (`lib/api/bookings.ts`):**
```
TPayment:
  ...existing,
  refundRefId?: string | null
  refundInitiatedAt?: string | null
  refundCompletedAt?: string | null      // replaces the old (wrong) `refundedAt`

TBooking:
  refund?: { status: "SUCCESS" } | { status: "FAILED"; message: string }
```

**Components:**
- `payment-receipt.tsx` — replace `payment.refundedAt` with `payment.refundCompletedAt` in the
  "Refunded at" `DetailRow`; add an optional `DetailRow` for `refundRefId` (already present) and
  `refundInitiatedAt` when the payment is `SUCCESS` but a refund was attempted
  (`refundInitiatedAt` set, no `refundCompletedAt`) — render a muted "Refund pending/queued —
  support will follow up." line instead of silence.
- `payment-attempts.tsx` — replace `payment.refundedAt` with `payment.refundCompletedAt` in the
  "Refunded …" timestamp line.
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx` — the cancel mutation's `onSuccess`
  must read the response: `refund` undefined → "Booking cancelled." (nothing was charged);
  `refund.status === "SUCCESS"` → "Booking cancelled. Refund of {formatBDT(booking.totalPrice)}
  is on its way."; `refund.status === "FAILED"` → warning toast with `refund.message` verbatim
  plus "The cancellation is complete; we'll follow up on the refund." Then invalidate
  `["booking", id]` + `["my-bookings"]` as today so the REFUNDED payment badge/receipt appear.
  Keep the cancel button disabled while pending (double-submit guard).

## Files to change

- `lib/api/bookings.ts` — TPayment `refundedAt` → `refundCompletedAt` + add `refundInitiatedAt`;
  add `TBooking.refund`
- `components/payment/payment-receipt.tsx`
- `components/payment/payment-attempts.tsx`
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx`
- `.opencode/specs/00-overview.md` — Step 20 line (done with this step)

## New dependencies

No new dependencies.

## Rules for implementation

### Data fetching
- All calls through `lib/api/bookings.ts` → `apiClient`; never raw `fetch`.
- The cancel mutation already invalidates `["booking", id]` and `["my-bookings"]` — keep that;
  read `refund` from the mutation's returned payload (the server returns the updated booking
  with `refund`; do not re-fetch to learn the refund outcome).
- Payment rows come from the booking payloads (`["booking", id]`, `["my-bookings"]`) — there is
  no payment-list endpoint, so no new query keys.

### Auth & routing
- Cancellation permissions are unchanged (owner / package agent / admin) — this step only
  surfaces the refund result to the actor. Any other cancel surface (agent/admin tables, if they
  gain a detail page later) should render the same `refund` result — note it, don't build it now.

### Money & display
- Always format refunded amounts from `payment.amount` (or `booking.totalPrice`) via `formatBDT`
  — never recompute client-side.
- A `SUCCESS` payment with `refundInitiatedAt` and no `refundCompletedAt` is **not** refunded —
  show the pending state; do not show a REFUNDED badge for it.

### UI & animation
- Clickable elements: `cursor-pointer` + `transition-colors duration-200`; buttons
  `whileTap={{ scale: 0.97 }}`; icons from `@phosphor-icons/react` (ArrowClockwise, CheckCircle,
  XCircle). shadcn/ui from `components/ui/` only; Tailwind v4 tokens; dark via `dark:`;
  `cn()` from `@/lib/utils`.

## Definition of done

Runnable via `npm run dev` with the server running the Step 23 refund module and sandbox store
creds (a real sandbox payment must be settled before cancelling):

- A PAID booking's detail page cancel → success toast naming the refunded amount; the payment
  row flips to REFUNDED (blue badge) in attempts/receipt, and the receipt shows the refund
  reference + "Refunded at" timestamp.
- Cancelling a PENDING booking → "Booking cancelled." with no refund mention; any stale
  INITIATED payment shows as CANCELLED (grey) in attempts.
- With the gateway simulating a failure (bad store creds / no bank_tran_id), the cancel succeeds,
  the toast shows the server's failure message verbatim, and the payment stays SUCCESS with a
  "refund pending" note in the receipt.
- `/user-dashboard/payments` shows REFUNDED as the latest status for the cancelled booking.
- `npm run typecheck` passes with the corrected `TPayment` (`refundedAt` is gone everywhere —
  grep for it and confirm zero references).
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).