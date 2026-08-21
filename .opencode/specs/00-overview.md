# TripVerse — Frontend Spec (Build Order)

Base: clone of GearUp frontend (Next.js App Router). Status legend: **[MVP]** building now · **[LATER]** deferred.

Files are numbered in the order you build them — each depends on the one before it:

1. `01-project-setup.md` — Next.js scaffold, tech stack, folder shape, env vars
2. `02-app-shell.md` — root layout, providers, theming, global styles
3. `03-auth-infra.md` — API client, JWT utils, refresh-token service, form validation library
4. `04-route-protection.md` — `proxy.ts` (Next.js middleware) — role-based dashboard guarding
5. `05-auth-pages.md` — login, register, demo login
6. `06-public-pages.md` — home, packages listing/details, about/contact/help/privacy/profile
7. `07-package-management.md` — PackageForm, ImageUploader (agent create/edit flow)
8. `08-booking-flow.md` — Create Booking form, price preview, BookingTable
9. `09-review-components.md` — ReviewList, ReviewForm
10. `10-dashboards.md` — user/agent/admin dashboard routes, sidebars, charts, tables
11. `11-deployment.md` — Vercel, env vars, image domains, CORS
12. `12-explicitly-cut.md` — everything deferred, for later
13. `13-payment-gateway.md` — SSLCommerz payment gateway (`POST /api/payments/create` → gateway, server `confirm`/`ipn` settle, `/payment/{success|cancel|fail}` return pages, receipt, user payments history) — builds on 8 and 10; server side shipped as backend Step 16
14. `14-email-verification-password-reset.md` — OTP email verification (register is now two-phase: stage + verify, verify auto-logs-in) and OTP password reset (forgot → reset) — backend Step 21
15. `15-refresh-token-rotation.md` — verify + harden the client for rotating refresh tokens & reuse detection (backend Step 22); adds an in-flight refresh dedupe in `proxy.ts`
16. `16-wishlist.md` — **DONE** — save/list/remove packages for USERs — heart button + `/user-dashboard/wishlist` (backend wishlist module)
17. `17-notifications.md` — **DONE** — in-app notification bell (any role) + standalone `/notifications` page with link translation (backend notification module)
18. `18-blog-comments.md` — one-level threaded comments on public blog posts with owner/admin delete (backend blog-comments module)
19. `19-review-edit-delete.md` — author edit + author/admin soft-delete of reviews, live package-rating recompute (backend review edit/delete) — requires a one-field `user.id` addition to the server's review list select
20. `20-refunds-on-cancel.md` — surface the live SSLCommerz refund outcome from booking cancellation; fix the `TPayment` refund fields (`refundedAt` → `refundCompletedAt`/`refundInitiatedAt`) — backend Step 23

Steps 14–15 both sit on backend auth steps 21–22 and should be built back-to-back (register
won't work at all until 14 lands). Steps 16–20 are independent of each other and can be built in
any order after 14. Finish and test one file before opening the next.
