# Step 16 — Wishlist

## Status

**NEW.** Promoted out of `12-explicitly-cut.md`. The backend ships the `wishlist` module
(server Step ~19): save/list/remove packages for a USER, idempotent, no "clear all". The client
has no wishlist API, no heart button, and no page.

## Overview

A signed-in `USER` saves packages by hearting them from the package detail page or a package
card. Saved packages appear on `/user-dashboard/wishlist` (user dashboard shell, already
role-guarded by `proxy.ts`). The wishlist is **idempotent** on both save and remove, and the
server filters rows whose package was later demoted out of `APPROVED` or soft-deleted — so the
page never lists a package whose detail route would 404. There is **no "is this saved?" single
endpoint**: membership is derived by fetching the wishlist (page 1, limit 50) and checking for
the package id client-side.

## Depends on

- `lib/api/client.ts` — `apiClient<T>`, `apiClientFull<T>` (paginated), `ApiError`.
- `lib/api/packages.ts` — `TPublicPackage` (the embedded package shape).
- `hooks/use-me.ts` — `useMe()` for the USER gate on the heart button (anonymous → link to login).
- `components/shared/package-card.tsx` — reused on the wishlist page; gains an optional save
  control (see Modify).
- `app/(dashboardGroup)/user-dashboard/` — the wishlist page lives here; `proxy.ts` already
  guards `/user-dashboard` to `USER` (no proxy change).
- `components/dashboard/dashboard-nav-items.ts` — add the Wishlist item to the USER nav.
- Server: `wishlist` module — `POST /api/wishlist`, `GET /api/wishlist`, `DELETE /api/wishlist/:packageId`.

## Routes

- `GET /user-dashboard/wishlist` — USER only (proxy-guarded) — saved packages grid with remove.
- `POST /api/wishlist { packageId }` — USER — save (idempotent upsert).
- `GET /api/wishlist?page&limit` — USER — paginated list, newest first, `limit` capped at 50.
- `DELETE /api/wishlist/:packageId` — USER — remove (idempotent, missing row is a no-op).

## Server contract (actual)

```
POST /api/wishlist { packageId }            auth(USER)
  → 201 { id, userId, packageId, createdAt }   (upsert — repeats return the existing row)
  Errors (verbatim): 404 "Package not found."  (package must be APPROVED + not deleted)

GET /api/wishlist?page=1&limit=10            auth(USER)
  → 200 envelope { data: [{ id, userId, packageId, createdAt, package: <publicPackage> }], meta }
  (publicPackage = the package module's public include — id, title, slug, description,
   location, price Number, duration, images, rating, category, agent)

DELETE /api/wishlist/:packageId              auth(USER)
  → 200 { data: null }   (idempotent — removing a non-saved package is a no-op, never an error)
```

## New API functions (`lib/api/wishlist.ts`)

```
export type TWishlistItem = {
  id: string
  userId: string
  packageId: string
  createdAt: string
  package: TPublicPackage
}

wishlistApi.addToWishlist(packageId)       — POST /api/wishlist  { packageId } → TWishlistItem
wishlistApi.getMyWishlist({ page, limit }) — GET /api/wishlist   (apiClientFull) → { data, meta }
wishlistApi.removeFromWishlist(packageId)  — DELETE /api/wishlist/:packageId → null
```

Types declared at the top of the same file, per project convention (`TPublicPackage` re-imported
from `./packages`).

## New Hooks

Reused in three places (package detail page, package card, wishlist page) → one wrapper file:

```
hooks/useWishlist.ts
  useWishlist({ page })            — useQuery(["wishlist", page], () => wishlistApi.getMyWishlist(...))
  useWishlistSaved(packageId)       — useQuery(["wishlist-saved", packageId], fetch page 1 limit 50,
                                       derive boolean from the page). Enabled only when logged in.
                                       (No per-id endpoint exists; membership comes from the list.)
  useAddToWishlist()                — useMutation(wishlistApi.addToWishlist); onSuccess invalidates
                                       ["wishlist"] and ["wishlist-saved"]
  useRemoveFromWishlist()           — useMutation(wishlistApi.removeFromWishlist); onSuccess invalidates
                                       ["wishlist"] and ["wishlist-saved"]
```

The two mutations must also `queryClient.invalidateQueries` any active `["wishlist-saved", ...]`
keys so a heart on the detail page and the card stay in sync after a toggle elsewhere.

## Components

**Create (`components/wishlist/`):**
- `wishlist-button.tsx` — props `{ packageId, className?, size? }`. Uses `useMe` + `useWishlistSaved`.
  - Anonymous → renders a heart button that links to `/login?redirectTo=<current pathname>`
    (`Link`-wrapped, labelled "Save to wishlist").
  - Logged in → toggling heart (filled when saved). Uses `useAddToWishlist`/`useRemoveFromWishlist`;
    disabled + spinner while pending. Icons: `Heart` (outline) / `Heart` (`weight="fill"`) from
    `@phosphor-icons/react`.
  - Optimistic update optional; on error the toast surfaces `ApiError.message` verbatim (404).

**Create (`app/(dashboardGroup)/user-dashboard/`):**
- `wishlist/page.tsx` — `"use client"`. `useWishlist({ page })` + local page state + `PaginationPages`.
  Grid of `PackageCard`s (with the wishlist variant — see Modify) each showing a filled heart
  that removes on click. Empty state (`EmptyState`, Heart icon, "No saved packages yet" +
  "Browse trips" CTA), loading skeletons, error + retry. Header mirrors the other user-dashboard
  pages (title + description).

**Modify:**
- `components/shared/package-card.tsx` — add an optional `wishlist?: boolean` prop. When true,
  overlay the filled-heart remove control (top-right corner) wired to `useRemoveFromWishlist`.
  Default rendering unchanged — the public packages grid must not change.
- `components/dashboard/dashboard-nav-items.ts` — add `{ label: "Wishlist", href:
  "/user-dashboard/wishlist", icon: Heart }` under the USER "Trips" section.

## Files to change

- `components/shared/package-card.tsx`
- `components/dashboard/dashboard-nav-items.ts`
- `.opencode/specs/00-overview.md` — Step 16 line (done with this step)
- `.opencode/specs/12-explicitly-cut.md` — remove "wishlist" from the cut list (done with this step)

## Files to create

- `lib/api/wishlist.ts`
- `hooks/useWishlist.ts`
- `components/wishlist/wishlist-button.tsx`
- `app/(dashboardGroup)/user-dashboard/wishlist/page.tsx`

## New dependencies

No new dependencies.

## Rules for implementation

### Data fetching
- All calls through `lib/api/wishlist.ts` → `apiClient`/`apiClientFull`; never raw `fetch`.
- The save/remove mutations are shared hooks because the same logic runs on the detail page, the
  card, and the wishlist page; every `onSuccess` invalidates both the page list and the saved
  membership keys.
- The membership query (`useWishlistSaved`) is **best-effort**: it reads page 1 limit 50, so a
  package saved on page 2+ of a >50-item list is reported as unsaved on the heart until the user
  opens the wishlist. Document this in the hook; it is acceptable for the MVP (wishlists that
  large are rare) and there is no server endpoint to check a single id.
- Mutation buttons: loading + `disabled`; skeleton for the wishlist page list; `EmptyState` for
  the empty list; error state with retry surfacing `ApiError.message` verbatim.

### Auth & routing
- The heart on anonymous visitors is a login CTA (`/login?redirectTo=<current>`), never a
  disabled control.
- `/user-dashboard/wishlist` needs no proxy change — the existing `/user-dashboard` USER guard
  covers it.

### UI & animation
- Clickable elements: `cursor-pointer` + `transition-colors duration-200`; buttons
  `whileTap={{ scale: 0.97 }}`; cards `whileHover={{ y: -4 }}`; lists `motion.div`
  `staggerChildren: 0.08`; icons from `@phosphor-icons/react` (Heart, HeartStraight).
- shadcn/ui from `components/ui/` only; Tailwind v4 tokens; dark via `dark:`; `cn()` from
  `@/lib/utils`.

## Definition of done

Runnable via `npm run dev` with the server running the wishlist module:

- Anonymous visitor sees a heart on a package detail page; clicking it goes to login and returns
  to the same package after signing in.
- Signed-in USER hearts a package on the detail page → the heart fills; the package appears on
  `/user-dashboard/wishlist`.
- Removing from the wishlist page (heart on the card) empties the row and unfills the detail-page
  heart on the next visit (invalidation keeps them in sync).
- Save/remove are idempotent: double-clicking never errors and the list never shows duplicates.
- A package demoted to PENDING/REJECTED or soft-deleted by an admin disappears from the wishlist
  (server-side filter) without the page crashing.
- Wishlist page shows skeleton → grid → empty state with a "Browse trips" CTA when nothing is saved;
  pagination works past 50 items; error state surfaces the `ApiError` message with a retry.
- The public `/packages` grid is visually unchanged (card default rendering untouched).
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).