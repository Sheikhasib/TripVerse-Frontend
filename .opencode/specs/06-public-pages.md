# Step 6 — Public Pages

## `(publicGroup)`
```
[MVP]   /                         Home — hero + 8 sections (incl. Categories + Blogs), reuse GearUp's section components
[MVP]   /packages                 was /gears — explore/listing: search, filter, sort, pagination
[MVP]   /packages/[slug]          was /gears/[id] — details page
[MVP]   /packages/[slug]/reviews  was /gears/[id]/reviews
[MVP]   /blog                     blog listing — PUBLISHED posts only, search/sort/pagination
[MVP]   /blog/[slug]              blog detail — server-rendered long-form content
[MVP]   /about
[MVP]   /contact                  form POSTs to /api/contact (public) — backend persists ContactMessage + sends a Resend email; admin inbox UI is [LATER]
[MVP]   /help                      static content page
[MVP]   /privacy
[MVP]   /profile                   view/edit own profile
[LATER] /categories                 fold into /packages filters instead — skip building separately
[LATER] /terms                     near-duplicate of /privacy for MVP purposes
[LATER] /settings                  not in requirements doc — skip for MVP
[LATER→Step 13] /payment, /payment/success, /payment/cancel, /payment/fail — SSLCommerz gateway return pages, promoted in Step 13
```

Blog is MVP because the backend module is MVP (Step 11): public listing/detail hit `GET /api/blog` / `GET /api/blog/:slug` (PUBLISHED + not-deleted only), and the landing Blogs section renders the 3-4 seeded posts. **Dependency note:** the blog module (and dashboard module) are in the backend spec but not built yet — if `/api/blog` isn't live by Step 6, render the Blogs section from a graceful empty state and finish the wiring once the endpoint lands.

## App Router conventions (per route segment where relevant)
- `loading.tsx` — skeleton loader, ties into the requirement-doc's skeleton-loader checkbox.
- `error.tsx` — per-segment error boundary.
- `not-found.tsx` — used by `/packages/[slug]` when a slug doesn't resolve; also the target `proxy.ts` (Step 4) redirects to on a role mismatch.

## SEO
`generateMetadata` on `/packages/[slug]` (dynamic title/description from the package's own fields) and the home page. Static pages (`/about`, `/help`, `/privacy`) get simple static metadata.
