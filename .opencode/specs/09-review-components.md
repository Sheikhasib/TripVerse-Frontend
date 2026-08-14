# Step 9 — Review Components

## Status

**BUILT.** `ReviewForm`, `ReviewList`, and the public reviews page are implemented and committed
(the `feat: add review components` commit). This spec documents the as-built reality against the
server's `review` module (server Step 10). Only optional cleanups remain (see **Remaining work**).

## Overview

A `USER` who has a `COMPLETED` booking for an approved package may leave one review per package.
All the gates live server-side and return verbatim, human-readable errors the client surfaces via
toast. `POST /api/reviews` returns `{ review, rating }` — `rating` is the package's recomputed
average (rounded to 1 decimal), written in the same transaction — so the client can refresh the
package's displayed rating with one response. The public reviews page lives at
`/packages/[slug]/reviews`.

## Depends on

- `lib/api/reviews.ts` — `reviewsApi.getReviews(packageId, { page, limit })` and
  `reviewsApi.createReview({ packageId, rating, comment })`.
  - **Known duplication:** `lib/api/packages.ts` also exports `packagesApi.getReviews` (same
    endpoint) and `ReviewList` + the home page currently call that copy. The canonical owner is
    `reviews.ts`; consolidate callers whenever those files are touched.
- `lib/validations/review.ts` — `createReviewSchema`: `packageId` (non-empty), `rating`
  (int 1–5), `comment` (trimmed, 1–1000 chars).
- `hooks/use-me.ts` — gates the form by auth + role.
- `components/shared/review-list.tsx`, `rating.tsx`, `pagination.tsx`, `empty-state.tsx`,
  `avatar`, `skeleton` — reused as-is.
- `app/(publicGroup)/packages/[slug]/reviews/page.tsx` — public Server Component
  (`force-dynamic`, `generateMetadata`); no proxy guard.
- Server: `review` module (Step 10) — `GET /api/reviews/package/:packageId` (public, paginated
  envelope) and `POST /api/reviews` (USER).

## Routes

```
[public] /packages/[slug]/reviews   package reviews — ReviewForm + ReviewList, shows avg rating
```

## New API functions

```
lib/api/reviews.ts
  TReview = { id, rating, comment?, createdAt, updatedAt, user: { name, avatarUrl? } }
  TReviewQuery = { page?, limit? }
  reviewsApi.getReviews(packageId, params)  — GET /api/reviews/package/:packageId → { data, meta }
  reviewsApi.createReview(payload)          — POST /api/reviews → { review, rating }
```

## Server gates (verbatim errors, surfaced via toast)

| Condition | Status | Message |
|---|---|---|
| Package missing / not `APPROVED` / deleted | 404 | `Package not found.` |
| Reviewer is the package's own agent | 403 | `You cannot review your own package.` |
| No `COMPLETED` booking on that package | 403 | `You can only review a package after completing a booking.` |
| Already reviewed (or `@@unique` race → P2002) | 409 | `You have already reviewed this package.` |

`ReviewForm` does **not** duplicate these checks client-side today — it only gates on
authenticated + `role === "USER"` and lets the server errors surface verbatim. That is
acceptable for the MVP; an optional richer gate is listed under **Remaining work**.

## Components

**Create:**
- `components/review/review-form.tsx` — `{ packageId: string }`. `useMe` gates:
  logged out → "Sign in to review" card (`/login?redirectTo=/packages/[slug]`); role `!== "USER"`
  → "Only users can review" card. Fields: rating select (1–5) + comment textarea (plain state,
  not RHF+zod). Submit → `reviewsApi.createReview` → success toast → `router.push` back to the
  package page. Errors: `error.message` verbatim toast.
- `components/shared/review-list.tsx` — `{ packageId: string }`. Paginated
  (`PAGE_LIMIT = 10`, `placeholderData: prev`), avatar/initials, `Rating` stars, formatted date,
  comment blockquote, skeletons, `EmptyState` ("No reviews yet"), `PaginationPages`.

**Create/modify:**
- `app/(publicGroup)/packages/[slug]/reviews/page.tsx` — Server Component; fetches the package
  via `packagesApi.getBySlug` (try/catch → `notFound()`), renders heading + average rating +
  `ReviewForm` + `ReviewList`.

## Files

As-built: `lib/api/reviews.ts`, `lib/validations/review.ts`, `components/review/review-form.tsx`,
`components/shared/review-list.tsx`, `app/(publicGroup)/packages/[slug]/reviews/page.tsx`,
`app/(publicGroup)/packages/[slug]/page.tsx` (links to the reviews page).

## Remaining work

None functional. Optional cleanups:
- Consolidate the `packagesApi.getReviews` duplicate onto `reviewsApi.getReviews`.
- Consider a client-side pre-gate ("You've already reviewed this package" / "Complete a booking
  to review") using `useMe` + a lightweight check, and wiring `ReviewForm` through RHF+zod for
  field-level validation consistency with the other forms.

## Rules for implementation

### Data fetching
- All calls via `lib/api/reviews.ts` → `apiClient`/`apiClientFull`; never raw `fetch`.
- Mutations wire `onSuccess` invalidation (`["reviews", packageId, page]`) — the built form
  navigates away instead, so invalidate before navigating when that changes.
- Skeleton loading states; `EmptyState` for the list; error toasts surface `ApiError.message`
  verbatim (403/404/409).

### Auth & UX
- Server Component for the public page (`force-dynamic`); `useMe` for the client-side form gate.
- The reviews page is public — no `proxy.ts` entry needed.

### UI & animation
- Clickables `cursor-pointer` + `transition-colors duration-200`; icons from `@phosphor-icons/react`; shadcn/ui primitives only; Tailwind v4 tokens + `dark:`; `cn()`.

## Definition of done

- A user with a past-date `COMPLETED` booking (seed it per Step 8) can submit a 1–5 star +
  comment review; success toast fires, the page returns to the package, and the package's
  displayed rating reflects the new average.
- Gates verified: agent reviewing own package → 403 verbatim; user without a completed booking →
  403 verbatim; second review → 409 verbatim; package not found → 404.
- Logged-out visitor sees the sign-in card; an agent/admin sees the "Only users can review" card.
- `/packages/[slug]/reviews` lists reviews paginated with avatars, stars, dates, and an empty
  state.
- `npm run lint` and `npm run typecheck` pass. Committed + pushed (AGENTS.md workflow).
