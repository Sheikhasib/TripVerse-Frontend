# Step 12 — Explicitly Cut for MVP (tracked so nothing is silently forgotten)

Settings page (distinct from profile — the sidebar's "Settings-lite" just reuses profile fields), Categories manager page, Terms page (real content), contact/admin inbox UI, blog comments, review edit/delete, email verification, password reset, Google OAuth extra flows (server handles linking). All are additive later — none require touching MVP code to bolt on.

Payment was in this cut list; it's been promoted to `13-payment-gateway.md` (SSLCommerz, backend Step 16), along with `/user-dashboard/payments`. The wishlist has been built from `16-wishlist.md`, and notifications from `17-notifications.md`.

Note: blog (public pages + agent/admin authoring) and Google OAuth button are **in** the MVP because the backend specs build both (Steps 11 and 4).

## Promoted out of the cut list (backend now ships these — build order in `00-overview.md`)

| Feature | Spec | Backend |
|---|---|---|
| Email verification + password reset | `14-email-verification-password-reset.md` | auth Step 21 |
| Refresh-token rotation / reuse detection | `15-refresh-token-rotation.md` | auth Step 22 |
| Wishlist | `16-wishlist.md` | wishlist module |
| Notifications | `17-notifications.md` | notification module |
| Blog comments | `18-blog-comments.md` | blog-comments module |
| Review edit & delete | `19-review-edit-delete.md` | review edit/delete |
| Real SSLCommerz refunds on cancel | `20-refunds-on-cancel.md` | booking Step 23 |

## Still cut (genuinely deferred — no backend module, or deliberately out of scope)

- Categories manager page (categories are seeded + consumed read-only; no admin CRUD UI)
- Terms page (real content)
- Contact/admin inbox UI (backend persists `ContactMessage` rows; an admin reader page is not built)
- Settings page as a distinct surface (the dashboard "Settings" is a demo password form + theme toggle only)
- Google OAuth extra flows beyond the button (server handles linking on login; account-linking UI is not built)