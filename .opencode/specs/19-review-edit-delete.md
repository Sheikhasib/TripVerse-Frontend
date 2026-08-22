# Step 19 — Review Edit & Delete

## Status

**DONE.** Promoted out of `12-explicitly-cut.md`. The backend ships review edit and soft-delete
(server Step ~23): the author can `PATCH` their own review; the author or an ADMIN can `DELETE`
it. Both recompute the package's average rating in the same transaction.

**Required backend tweak (landed):** the list select in `review.service.ts`
(`listPackageReviews`) gained `user.id` (server commit `a1e48bc`) so the client can tell
"this is my review" directly instead of guessing from the name — the same one-field pattern
as the `valId` addition in Step 13.

## Overview

On `/packages/[slug]/reviews`, the current user's own reviews (or any review, for an ADMIN)
gain Edit and Delete controls. Edit opens a small dialog pre-filled with the review's rating and
comment; save runs `PATCH /api/reviews/:id` and the list refreshes. Delete asks for confirmation
in a dialog, then runs `DELETE /api/reviews/:id` and removes the row. Both endpoints return the
recomputed package `rating`, so the package-average shown on the reviews page header and the
package detail page is invalidated/refreshed alongside the list. Server-side, delete is a soft
delete (`isDeleted`), the row stays for the `@@unique([userId, packageId])` duplicate guard, and
the removed rating stops counting.

## Depends on

- `lib/api/client.ts` — `apiClient<T>`, `ApiError`.
- `lib/api/reviews.ts` — existing `TReview`, `getReviews`, `createReview`; extend it.
- `hooks/use-me.ts` — `useMe()` for ownership (`user.id`, `user.role`) detection.
- `components/shared/review-list.tsx` — the list + `ReviewItem` gain the edit/delete controls.
- `components/review/review-form.tsx` — reuse `RATING_LABELS` (export it) for the edit dialog.
- `components/ui/dialog.tsx`, `select.tsx`, `textarea.tsx`, `button.tsx` — edit/delete dialogs.
- `app/(publicGroup)/packages/[slug]/reviews/page.tsx` — the page that hosts the list; its
  header rating is server-rendered (`pkg.rating`) and must refresh after mutations.
- Server: `review` module (Step ~23) — `PATCH /api/reviews/:id`, `DELETE /api/reviews/:id`;
  plus the one-field `id` addition to the list `user` select.

## Routes

- `PATCH /api/reviews/:id { rating?, comment? }` — auth(USER), author only.
- `DELETE /api/reviews/:id` — auth(), author or ADMIN.

## Server contract (actual)

```
PATCH /api/reviews/:id { rating?, comment? }     auth(USER), author only
  → 200 { review: { id, rating, comment, createdAt, updatedAt }, rating }   // rating = fresh
       package average after recompute
  Errors (verbatim): 404 "Review not found." · 400 "At least one of rating or comment must be
  provided" (validation) · rating 1..5 int · comment 1..1000 chars.

DELETE /api/reviews/:id                           auth(), author or ADMIN
  → 200 { reviewId, rating }                      // rating = fresh package average
  Errors (verbatim): 404 "Review not found."      // uniform for foreign id / repeat delete
```

Both are soft-delete/recompute aware: `recomputePackageRating` filters `isDeleted: false`, so a
deleted review's rating never counts.

## New API functions (`lib/api/reviews.ts`)

```
// TReview.user gains id after the backend tweak:
TReview.user = { id: string; name: string; avatarUrl?: string | null }

export type TUpdateReviewSchema = { rating?: number; comment?: string }   // at least one
export type TUpdateReviewResponse = { review: TReviewCreated; rating: number }
export type TDeleteReviewResponse = { reviewId: string; rating: number }

reviewsApi.updateReview(id, payload)  — PATCH /api/reviews/:id → TUpdateReviewResponse
reviewsApi.deleteReview(id)           — DELETE /api/reviews/:id → TDeleteReviewResponse
```

Types declared at the top of the same file; export `RATING_LABELS` from `review-form.tsx`.

## New Hooks

Used only on the reviews page (one consumer) → **inline** `useQuery`/`useMutation` in
`review-list.tsx`, no wrapper hook.

## Components

**Create (`components/review/`):**
- `review-edit-dialog.tsx` — props `{ review: TReview, open, onOpenChange }`. Pre-filled rating
  `Select` (reuses `RATING_LABELS`) + comment `Textarea` (`maxLength={1000}`); Save runs
  `updateReview`; on success toast + close + invalidate; surfaces 404/400 verbatim; loading +
  disabled on save.
- `review-delete-dialog.tsx` — props `{ review: TReview, open, onOpenChange }`. Confirm copy
  ("Delete this review? This can't be undone."), destructive button; on success toast + close +
  invalidate; surfaces 404 verbatim.

**Modify:**
- `components/shared/review-list.tsx` — `ReviewItem` gains a small actions cluster (top-right or
  footer) rendered only when `review.user.id === me.id || me.role === "ADMIN"`: Edit (opens
  `ReviewEditDialog`) and Delete (opens `ReviewDeleteDialog`). Wire the inline mutations in the
  list: `onSuccess` invalidates `["reviews", packageId, page]` (or `setPage(1)` when the deleted
  item was the only one on the page) **and** calls `router.refresh()` so the server-rendered
  package rating on the reviews header and package detail stays correct. `me` comes from
  `useMe()`.
- `components/review/review-form.tsx` — export `RATING_LABELS` (currently module-private) for the
  edit dialog.

## Files to change

- `lib/api/reviews.ts`
- `components/shared/review-list.tsx`
- `components/review/review-form.tsx` (export `RATING_LABELS`)
- `.opencode/specs/00-overview.md` — Step 19 line (done with this step)
- `.opencode/specs/12-explicitly-cut.md` — remove "review edit/delete" from the cut list (done with this step)

## Files to create

- `components/review/review-edit-dialog.tsx`
- `components/review/review-delete-dialog.tsx`

## New dependencies

No new dependencies.

## Rules for implementation

### Data fetching
- All calls through `lib/api/reviews.ts` → `apiClient`; never raw `fetch`.
- Inline `useMutation` for edit and delete; both `onSuccess` invalidate the active
  `["reviews", packageId, page]` key and `router.refresh()` for the SSR rating. Use
  `queryClient.invalidateQueries({ queryKey: ["reviews", packageId] })` (prefix match) so any
  open page cache is refreshed together.
- Mutation buttons: loading + `disabled`; never close the dialog mid-flight; error states
  surface `ApiError.message` verbatim (404/400).

### Auth & routing
- Ownership controls only when `review.user.id === me.id` (USER) or `me.role === "ADMIN"` —
  matching the server's `deleteReview` rule. The server still enforces PATCH author-only; the
  client hides the buttons rather than relying on that.
- The reviews page stays public (`/packages` is in `PUBLIC_PREFIXES`); anonymous visitors see
  the existing login-gated review form and no edit/delete controls.

### UI & animation
- Clickable elements: `cursor-pointer` + `transition-colors duration-200`; icon buttons
  `whileTap={{ scale: 0.97 }}`; icons from `@phosphor-icons/react` (PencilSimple, Trash).
- Dialogs from `components/ui/dialog.tsx` — never a new modal primitive.
- shadcn/ui from `components/ui/` only; Tailwind v4 tokens; dark via `dark:`; `cn()` from
  `@/lib/utils`.

## Definition of done

Runnable via `npm run dev` with the server running review edit/delete (and the `id` select fix):

- A USER who reviewed a package sees Edit + Delete on their own review on `/packages/[slug]/reviews`.
- Editing the rating/comment updates the row in place and the package average on the header
  reflects the new value after `router.refresh()`.
- Deleting removes the row; the header average drops accordingly; re-reviewing the same package
  still returns the server's 409 "You have already reviewed this package." (soft-delete keeps
  the duplicate guard).
- A non-author sees no controls on another user's review; an ADMIN sees controls on every review.
- Anonymous visitors see no controls and no delete/edit affordances.
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).

## As built (implementation notes)

- **Spec bug corrected — Edit is author-only.** The Components section offered Edit under
  `(own || ADMIN)`, but `updateReview` matches `{ id, userId }` and its route runs
  `auth(Role.USER)` (ADMINs are rejected at the middleware), so an admin editing someone
  else's review was a guaranteed 404/403. Shipped rule mirrors each endpoint exactly:
  Edit = author only; Delete = author or ADMIN (matching `deleteReview`).
- **The flagged backend tweak landed first** as its own commit + push on the server repo
  (`a1e48bc`: `id: true` in the list user select), so `TReview.user.id` could be typed
  required from day one.
- **Validation lives in `lib/validations/review.ts`, not inline types:** `updateReviewSchema`
  mirrors the server verbatim (rating int 1..5 optional · comment trim 1..1000 optional ·
  refine "at least one of rating or comment") and drives the dialog via rhf + zodResolver,
  matching every other form in the repo (AGENTS.md architecture rule).
- **Empty-page guard is event-driven, not an effect:** deleting the last row of page N > 1
  steps back via an `onDeleted` callback from `ReviewDeleteDialog`; the planned `useEffect`
  was rejected by the new `react-hooks/set-state-in-effect` lint rule. Sibling pattern:
  the comment-section jump-to-page-1-after-posting fix (`9a2f563`).
- Dialogs own their mutations and stay mounted while closed so Radix exit animations play;
  the list swaps the target row before reopening. Shared success flow: prefix-invalidate
  `["reviews", packageId]` → toast → `router.refresh()` (SSR header average) → close;
  Esc/overlay close is suppressed mid-flight; errors surface `ApiError.message` verbatim.
- `12-explicitly-cut.md` left untouched: the feature already sat in the "Promoted out" table
  and line 3 stays as the historical record (precedent from blog comments / email verification).
- Verified mechanically: client `npm run typecheck`, `npm run lint`, `npm run build` green;
  server `tsc --noEmit` green after the select change. Live authed click-through (edit as
  author, admin delete of foreign review, header average refresh, 409 re-review after
  delete) still to exercise against running servers.