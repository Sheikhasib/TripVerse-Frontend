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

Finish and test one file before opening the next.
