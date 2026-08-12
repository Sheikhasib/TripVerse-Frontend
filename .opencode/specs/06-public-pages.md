# Step 6 — Public Pages

## `(publicGroup)`
```
[MVP]   /                         Home — hero + 8 sections, reuse GearUp's section components
[MVP]   /packages                 was /gears — explore/listing: search, filter, sort, pagination
[MVP]   /packages/[slug]          was /gears/[id] — details page
[MVP]   /packages/[slug]/reviews  was /gears/[id]/reviews
[MVP]   /about
[MVP]   /contact                  form only for MVP; persistence is [LATER] (needs ContactMessage backend)
[MVP]   /help                      static content page
[MVP]   /privacy
[MVP]   /profile                   view/edit own profile
[LATER] /categories                 fold into /packages filters instead — skip building separately
[LATER] /terms                     near-duplicate of /privacy for MVP purposes
[LATER] /settings                  not in requirements doc — skip for MVP
[LATER] /payment, /payment/success, /payment/cancel   — only needed once SSLCommerz backend module is built
```

## App Router conventions (per route segment where relevant)
- `loading.tsx` — skeleton loader, ties into the requirement-doc's skeleton-loader checkbox.
- `error.tsx` — per-segment error boundary.
- `not-found.tsx` — used by `/packages/[slug]` when a slug doesn't resolve; also the target `proxy.ts` (Step 4) redirects to on a role mismatch.

## SEO
`generateMetadata` on `/packages/[slug]` (dynamic title/description from the package's own fields) and the home page. Static pages (`/about`, `/help`, `/privacy`) get simple static metadata.
