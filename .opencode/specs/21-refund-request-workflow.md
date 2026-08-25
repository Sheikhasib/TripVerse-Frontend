# Step 21 — Refund Request Workflow (Apply → Admin Review → Policy-Based Payout)

## Overview

Implements the client half of backend Step 26. Once a booking is PAID/CONFIRMED the customer
can no longer cancel it themselves (the server's TRANSITIONS map now 403s that path) — instead
they **apply for a refund** from the booking detail page: a reason category, a free-text
explanation (min 20 chars), and an evidence image (required for docs-backed categories). The
applicable policy tier is **snapshotted server-side at submission** (`daysBeforeTravel` +
`suggestedPercentage`) and shown read-only everywhere after. An **ADMIN** reviews applications
in a queue (`/admin-dashboard/refunds`): approve with a final percentage (booking flips
CANCELLED, gateway pays out per tier — partial refunds are first-class) or reject with a
mandatory note. An APPROVED request whose gateway payout failed stays surfaced in the queue
with a **Retry payout** action. Users track their own applications under
`/user-dashboard/refunds` and on each booking's detail page. Agency/admin direct cancel keeps
today's behavior (100% auto-refund through the spec-20 path) and needs no client change here.

Policy tiers (display only — the server computes and freezes them): docs-backed categories
(MEDICAL_EMERGENCY, BEREAVEMENT, VISA_REJECTION, FORCE_MAJEURE) suggest 100%; CHANGE_OF_PLANS
suggests 90% ≥30 days before travel, 50% at 15–29d, 25% at 7–14d, 0% at ≤6d (negative counts
allowed post-travel — no-show claims; admin decides).

## Depends on

- `lib/api/client.ts` — `apiClient<T>` / `apiClientFull<T>`, `TApiEnvelope`, `TMeta`,
  `ApiError(statusCode, message)`; same-origin `/api/:path*` rewrite, so no CORS handling
- `lib/api/bookings.ts` — `bookingsApi.getBookingById` already returns the booking with
  `payments`; the server's booking detail now also returns `refundRequests[]` — this spec adds
  that optional field to `TBooking` (types stay co-located per resource; `refunds.ts` defines
  its own narrow embedded-booking shape and must not import from `bookings.ts`)
- `lib/api/uploads.ts` — `uploadsApi.uploadImage(file)` → `{ url, publicId }` for the evidence
  image (backend widened to USER by server Step 26; jpg/png/webp ≤5MB, field `"image"`)
- `lib/validations/` convention — new `refund.ts` Zod schemas mirroring the server's
  `refund.validation.ts` exactly (same trims, mins, superRefine rules), consumed via
  `@hookform/resolvers/zod`
- Data fetching pattern: **inline `useQuery`/`useMutation` in Client Components** — every
  refunds query/mutation below is used on exactly one page, so no `hooks/use-refunds.ts`
  wrapper (the `useMe` bar: reused across 3+ components)
- Badge pattern: `components/dashboard/status-badge.tsx` / `components/payment/payment-status-badge.tsx`
  `STATUS_CONFIG` map — new statuses extend the *pattern*, not a parallel design
- Shared components: `empty-state.tsx`, `pagination.tsx`, `route-loading.tsx`, `go-back.tsx`
- UI primitives: `components/ui/{dialog,select,textarea,input,table,badge,button,card,form,skeleton}.tsx`
- Route groups: `app/(dashboardGroup)/user-dashboard/` + `admin-dashboard/`
- `proxy.ts` — **no change needed**: `/user-dashboard` is already role-guarded to USER and
  `/admin-dashboard` to ADMIN; both new pages live inside those prefixes
- Notification links: the server notifies `/dashboard/bookings/:id`, which
  `lib/notifications.ts` `resolveNotificationLink` already maps to
  `/user-dashboard/bookings/:id` for USERs — nothing to add
- Server contract: `tripverse-server/src/modules/refund/*` (route/controller/service/validation)
  is the source of truth; this spec mirrors it verbatim

## Routes

- `GET /user-dashboard/refunds` — my refund applications, paginated, status filter chips.
  Auth: USER (via `proxy.ts` prefix guard).
- `GET /admin-dashboard/refunds` — all applications, status filter, review dialogs, retry
  payout. Auth: ADMIN (via `proxy.ts` prefix guard).
- `GET /user-dashboard/bookings/[id]` — modified: "Apply for refund" entry point + application
  status card. Auth: USER.
- Agents deliberately get **nothing** — refund decisions are customer ↔ admin; agents act on
  paid bookings only through direct cancel (existing BookingTable flow, unchanged).

## New API functions

```
lib/api/refunds.ts        (types co-located at top, per project convention)

Types:
TRefundReasonCategory = "MEDICAL_EMERGENCY" | "BEREAVEMENT" | "VISA_REJECTION"
                      | "FORCE_MAJEURE" | "CHANGE_OF_PLANS"
TRefundRequestStatus  = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED"

TRefundBookingRef = {                       // narrow shape the refund endpoints return
  id: string; status: TBookingStatus; travelDate: string; travelers: number;
  totalPrice: number;
  package: { id: string; title: string; slug: string; location: string; images: string[] }
}
// TBookingStatus imported (type-only) from "./bookings" — one-directional, no cycle

TRefundRequest = {
  id: string
  bookingId: string
  userId: string
  category: TRefundReasonCategory
  reason: string
  evidenceUrl?: string | null
  daysBeforeTravel: number                  // policy snapshot — immutable after create
  suggestedPercentage: number               // policy snapshot — immutable after create
  status: TRefundRequestStatus
  approvedPercentage?: number | null        // admin-decided pct (0–100)
  refundAmount?: number | null              // Decimal serialized → number by the server mapper
  reviewNote?: string | null                // mandatory on REJECT
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  booking: TRefundBookingRef
  user?: { id: string; name: string; email: string }
  reviewer?: { id: string; name: string; email: string } | null
}

TRefundQuery = { page?: number; limit?: number; status?: TRefundRequestStatus }

TRefundDecisionResult = {
  refundRequest: TRefundRequest
  payout?: { status: "SUCCESS"; refundedTotal: number } | { status: "FAILED"; message: string }
}

Functions (all via apiClient / apiClientFull — envelope unwrapping identical to bookings.ts):
createRefundRequest(payload: TCreateRefundSchema)          POST   /api/refunds            → TRefundRequest
getMyRefundRequests(params?: TRefundQuery)                 GET    /api/refunds/mine       → { data: TRefundRequest[], meta }
getAllRefundRequests(params?: TRefundQuery)                GET    /api/refunds            → { data: TRefundRequest[], meta }   // ADMIN
decideRefundRequest(id, payload: TRefundDecisionSchema)    PATCH  /api/refunds/:id/decision → TRefundDecisionResult             // ADMIN
retryRefundPayout(id: string)                              POST   /api/refunds/:id/retry-payout → TRefundDecisionResult         // ADMIN

Display-only helper (non-authoritative, mirrors the server's pure function so forms/tooltips
can preview the tier without an API call — the server's snapshot always wins):
suggestRefundPercentage(category, daysBeforeTravel): number
// docs-backed → 100; else days >= 30 → 90, 15–29 → 50, 7–14 → 25, <= 6 → 0
```

No `getRefundRequestById` client function: list rows return full objects (reason, evidence,
decision fields included) and the booking detail page carries `refundRequests[]`, so a detail
endpoint has no consumer.

## New Hooks (only if the query/mutation is reused 3+ places — otherwise inline useQuery/useMutation in the component)

None. Each refunds endpoint feeds exactly one page/dialog; use inline
`useQuery`/`useMutation` with `refundsApi.*` as the fn, per the established dashboard pattern.

## Components

**Create:**

- `components/refund/refund-status-badge.tsx` — `STATUS_CONFIG` map badge for
  `TRefundRequestStatus`: PENDING=amber ("Pending"), APPROVED=blue ("Approved"), REJECTED=red
  ("Rejected"), REFUNDED=emerald ("Refunded") — same outline style as
  `payment-status-badge.tsx`. Props: `{ status: TRefundRequestStatus }`.
- `components/refund/refund-request-form.tsx` — the apply form rendered inside a shadcn
  `Dialog` on the booking detail page. Props: `{ bookingId: string; travelDate: string;
  totalPrice: number; onSuccess: () => void }`. Fields: category (`Select`, five options),
  reason (`Textarea`, char counter `n/2000`, min-20 hint), evidence (single-image picker —
  hidden file input → `uploadsApi.uploadImage`, thumbnail preview + remove; required marker
  appears only for docs-backed categories, enforced by the Zod `superRefine`). Below the
  category field show a muted helper line: "Suggested refund: ~{pct}% ({tierLabel}) based on
  your travel date" computed via `suggestRefundPercentage(category,
  daysUntilTravel(travelDate))`, labeled "estimate only — finalized at review".
  Submit button shows pending state ("Submitting…") + disabled; success toast
  "Refund application submitted." then `onSuccess()` closes the dialog.
- `components/refund/refund-request-card.tsx` — read-only view of one application for the
  booking detail page. Props: `{ request: TRefundRequest }`. Shows: status badge, category,
  full reason, evidence image (`next/image`, `fill`, `sizes`, Cloudinary domain already
  allowed), snapshot rows ("Days before travel: n", "Suggested refund: n%"), decision block
  when reviewed (approvedPercentage / formatted `formatBDT(refundAmount)` / reviewer name /
  `formatDateTime(reviewedAt)` / reviewNote quoted). For APPROVED without a terminal state,
  muted note: "Payout in progress — refunded amounts appear here once confirmed."
- `components/refund/refund-review-dialog.tsx` — ADMIN decision dialog. Props:
  `{ request: TRefundRequest; open: boolean; onOpenChange: (open: boolean) => void }`.
  Displays applicant (name/email), package title, category, reason, evidence image, snapshot
  (days-before-travel + suggested %), booking total. Decision controls: segmented choice
  Approve / Reject; on Approve a percentage `Input type="number"` (0–100, defaults to
  `request.suggestedPercentage`) with live `formatBDT(round(totalPrice × pct / 100))` preview;
  on Reject a mandatory `reviewNote` `Textarea` (max 1000). Submits
  `refundsApi.decideRefundRequest`; on success: toast per outcome — payout SUCCESS →
  "Refund approved. {formatBDT(refundedTotal)} paid out."; payout FAILED → `toast.warning`
  with `payout.message` verbatim + description "The approval stands — retry the payout from
  the queue."; invalidate `["admin-refunds"]` + `["booking", request.bookingId]`.
- `app/(dashboardGroup)/user-dashboard/refunds/page.tsx` — "My refund requests": status filter
  chips (All/Pending/Approved/Rejected/Refunded, same chip styling as admin bookings page),
  paginated table (Applied, Package, Category, Status badge, Requested %, Amount, link to
  booking detail). `RouteLoading` while loading; `EmptyState` ("No refund requests yet") with
  CTA to My Bookings; error `EmptyState` surfacing `ApiError.message` + Try again.
  Query key: `["my-refunds", status, page]`, `placeholderData` keep-previous, `staleTime: 30_000`.
- `app/(dashboardGroup)/admin-dashboard/refunds/page.tsx` — "Refund requests" review queue.
  Status filter chips incl. a default-emphasized **Pending** tab count feel (plain chips, no
  new primitives); table rows: Applied date, Package title, Applicant, Category, Snapshot %
  ("{days}d · {pct}%"), Status badge, Decision amount, row actions — PENDING → "Review"
  (opens dialog), APPROVED → "Retry payout" button (visible whenever status === "APPROVED";
  the server no-ops safely when nothing is owed) calling `refundsApi.retryRefundPayout` with
  pending/disabled state and the same SUCCESS/FAILED toast pair as the dialog. Query key:
  `["admin-refunds", status, page]`, `placeholderData` keep-previous,
  `staleTime: 30_000`, `retry: false` (admin list fetches are not retried automatically).

**Modify:**

- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx` — the core behavioral flip:
  `cancellable` becomes **`status === "PENDING"` only** (PAID/CONFIRMED self-cancel now 403s
  server-side). For PAID/CONFIRMED bookings replace the Cancel button with "Apply for refund"
  (`HandCoins` icon) which opens the `RefundRequestForm` dialog — hidden entirely when
  `booking.refundRequests?.some(r => r.status !== "REJECTED")` (one live application per
  booking; re-apply allowed only after a rejection, and the server caps lifetime applications
  at 2 — surface its 409 message verbatim on error either way). Render a
  "Refund requests" section listing `booking.refundRequests ?? []` via
  `RefundRequestCard`s. Keep the existing PENDING cancel flow and its refund-outcome toasts
  untouched.
- `components/dashboard/dashboard-nav-items.ts` — USER "Trips" section: add
  `{ label: "Refunds", href: "/user-dashboard/refunds", icon: ArrowsCounterClockwise }`;
  ADMIN "System" section: add `{ label: "Refunds", href: "/admin-dashboard/refunds",
  icon: ArrowsCounterClockwise }`.
- `lib/api/bookings.ts` — `TBooking` gains `refundRequests?: TRefundRequest[]`
  (`import type { TRefundRequest } from "./refunds"`); no other change.
- `.opencode/specs/00-overview.md` — append item 21 to the build-order list (this spec,
  not DONE yet).

## Files to change

- `lib/api/bookings.ts`
- `components/dashboard/dashboard-nav-items.ts`
- `app/(dashboardGroup)/user-dashboard/bookings/[id]/page.tsx`
- `.opencode/specs/00-overview.md`

## Files to create

- `lib/api/refunds.ts`
- `lib/validations/refund.ts`
- `components/refund/refund-status-badge.tsx`
- `components/refund/refund-request-form.tsx`
- `components/refund/refund-request-card.tsx`
- `components/refund/refund-review-dialog.tsx`
- `app/(dashboardGroup)/user-dashboard/refunds/page.tsx`
- `app/(dashboardGroup)/admin-dashboard/refunds/page.tsx`

## New dependencies

No new dependencies.

## Rules for implementation

### Workflow correctness (server contract)

- The policy snapshot (`daysBeforeTravel`, `suggestedPercentage`) is **immutable** — never
  recompute or re-render it as if current; label it "at time of application".
- One live application per booking; after a REJECT exactly one more application is allowed
  (max 2 lifetime). Drive UI visibility off `booking.refundRequests` but still surface server
  409 messages verbatim — the server is authoritative.
- Reject requires a note (Zod `superRefine`); approve percentage is clamped 0–100 client-side
  but never silently altered — if the admin lowers a docs-backed suggestion, just submit and
  let the server enforce its own override rules.
- A FAILED payout must never undo the approval: keep the row APPROVED, show the warning toast
  with the gateway message, leave Retry payout available.
- Evidence is required (client-side too) for MEDICAL_EMERGENCY, BEREAVEMENT, VISA_REJECTION,
  FORCE_MAJEURE; optional for CHANGE_OF_PLANS.

### Data fetching

- Client Components use inline `useQuery`/`useMutation` with `refundsApi.*` fns — no wrapper
  hook unless something gets reused across 3+ components.
- Every mutation `onSuccess` invalidates what it touched: apply → `["booking", id]`,
  `["my-bookings"]`, `["my-refunds"]`; decide/retry → `["admin-refunds"]`,
  `["booking", bookingId]`.
- Mutation buttons: loading label + `disabled` while pending; error toasts surface
  `ApiError.message` verbatim.
- Lists: skeleton-free `RouteLoading` for initial loads (project pattern), keep-previous
  `placeholderData` for filter/pagination switches, `EmptyState` for zero rows, error state
  with retry button.

### Auth & routing

- `proxy.ts` needs **no edits** — both new routes sit under already-guarded prefixes.
- AGENT sees neither page nor nav item (intentional; don't "fix" the asymmetry).
- Role copy follows project convention: stored value `AGENT`, displayed "Manager".

### UI & animation

- All clickable elements: `cursor-pointer` + `transition-colors duration-200`.
- Buttons: framer-motion `whileTap={{ scale: 0.97 }}` on all action buttons;
  `whileHover={{ y: -4 }}` on cards where the surrounding pages already use it (not applied on
  `RefundRequestCard` or `RefundReviewDialog` — static info cards).
- Icons from `@phosphor-icons/react` (e.g. `ArrowsCounterClockwise`, `HandCoins`) — never emoji.
- Evidence images: `next/image` with `fill` + `sizes` + `onError` fallback (res.cloudinary.com
  already whitelisted in `next.config.ts`).
- Badges: extend the `STATUS_CONFIG` map pattern in a dedicated `RefundStatusBadge` — colors
  listed above, matching the existing border/bg/text token triplets.
- Money via `formatBDT`, dates via `formatDate`/`formatDateTime` from `lib/format.ts`.
- shadcn/ui primitives from `components/ui/` only — no new primitives.

### Styling

- Tailwind v4 `@theme` tokens (`bg-primary`, `text-muted-foreground`, …) — 3 primary colors +
  neutral only; dark mode via `dark:` variant; `cn()` from `@/lib/utils` for merges.

### Validation

- `lib/validations/refund.ts` mirrors the server schema field-for-field: `category` enum,
  `reason` trim min 20 / max 2000, `evidenceUrl` URL + docs-backed superRefine, decision
  schema with `approvedPercentage` int 0–100 and `reviewNote` max 1000 required-on-reject.

## Definition of done

Runnable via `npm run dev` with the server running the Step 26 refund module:

- Booking detail (PAID booking, owner USER): Cancel button gone; "Apply for refund" opens the
  dialog; submitting without evidence on a docs-backed category shows the inline Zod error;
  short reasons blocked at <20 chars; successful submit closes the dialog, toasts, and the
  application card appears immediately with Pending badge + snapshot rows.
- Applying twice on the same booking hides the button after a live submission; a rejected
  application re-enables it; a second rejection makes the server 409 visible verbatim.
- PENDING bookings keep the old free-cancel button and toasts; cancelling a PAID booking
  directly is impossible from this UI.
- `/user-dashboard/refunds`: filter chips + pagination work against seeded data; empty state
  shows for fresh accounts; rows deep-link to booking detail.
- Admin `/admin-dashboard/refunds`: Pending queue lists the new application with applicant,
  snapshot "{n}d · {pct}%", Review opens the dialog; approving with the suggested pct flips
  the row toward Approved/Refunded, the user's booking becomes CANCELLED with the
  application card showing pct + amount; rejecting demands a note and leaves the booking
  untouched; double-opening decisions can't double-fire (dialog closes on success).
- Forced gateway failure path: approval yields the FAILED warning toast with the server
  message, row stays APPROVED with Retry payout enabled; retry succeeds → Refunded badge +
  success toast.
- USER nav shows "Refunds"; ADMIN nav shows "Refunds"; AGENT nav shows neither; visiting the
  wrong dashboard redirects to not-found via `proxy.ts` (unchanged behavior).
- Standing items: `npm run lint` and `npm run typecheck` pass.
