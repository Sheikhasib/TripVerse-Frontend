# Step 10 — Dashboards

## Routes
```
[MVP] /user-dashboard                    was customer-dashboard
[MVP] /agent-dashboard                    was provider-dashboard
[MVP] /admin-dashboard
[MVP] /admin-dashboard/users
[MVP] /admin-dashboard/analytics          charts fed via lib/api/dashboard.ts (see below)
[MVP] /agent-dashboard/my-posts           blog authoring — create/edit own posts
[MVP] /agent-dashboard/posts/[id]/edit
[MVP] /admin-dashboard/posts              all posts + publish/unpublish (DRAFT↔PUBLISHED)
[LATER→Step 13] /user-dashboard/payments   payment history from my-bookings — promoted in Step 13
[LATER] /admin-dashboard/messages          contact inbox UI (backend GET /api/contact + PATCH /:id already done)
[LATER] /admin-dashboard/categories        category is a real table (backend CRUD exists: GET/POST /api/categories, PATCH/DELETE /:id) — build only if time permits; not needed for MVP
```

## Blog authoring
Mirrors package management (Step 7): agent dialog only for own posts, admin for any. Post form uses the same `ImageUploader` for a single `coverImage`, and a rich/long-form textarea for `content`. Key detail: agent edit resets status to `DRAFT`; re-publish is admin-only via `PATCH /api/blog/:id/status`. Initial load from list row (same fallback strategy as packages); slug is server-generated and never edited by the client.

## Sidebar requirements (per requirements doc)
- **User** (≥4 items): Overview, My Bookings, Profile, Settings-lite (just profile fields)
- **Agent** (4 items): My Packages, New Package, Bookings, Overview — display label is **"Manager"** (rubric names the roles User/Admin/Manager; the backend maps AGENT→Manager), so sidebar headings and role badges read "Manager", while route prefixes stay `/agent-dashboard`.
- **Admin** (≥6 items): Overview, Manage Packages, Manage Users, Manage Bookings, Analytics, Settings
- Profile dropdown in dashboard navbar (Profile, Logout) — reuse GearUp's as-is.

## Charts & tables
- `lib/api/dashboard.ts` is the single source of stats (one typed function per role, e.g. `getOverview(role)`), so charts/tables render from one shape and never call endpoints directly.
- **Target contract** (backend Step 12, MVP): `GET /api/dashboard/admin` / `/agent` / `/user`, auth-scoped, returning aggregates (counts, bookings by status, packages by category, revenue-over-time trend, category breakdown). Point `dashboard.ts` at these directly.
- **Fallback while the dashboard module is still in progress:** derive the same shape client-side from the existing list endpoints (bookings via `/my-bookings` / `/agent-bookings` / admin `/bookings`; packages via `/internal/all`; users via `/api/users`), computing counts, per-status breakdowns, and revenue (`Σ totalPrice` of CONFIRMED/COMPLETED). Since the components only consume `dashboard.ts`'s return type, swapping the source later touches one file.
- Data tables reuse GearUp's existing filtering + pagination pattern.
