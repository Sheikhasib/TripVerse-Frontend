# Step 9 — Review Components

## Component reuse
| GearUp component | TripVerse equivalent | Change needed |
|---|---|---|
| `ReviewList` / `ReviewForm` | same, minor field rename | reuse near-verbatim |

## Behavior
- `ReviewForm` only renders for a user with a `COMPLETED` booking on that package who hasn't already reviewed it (mirrors the backend's gate + unique constraint) — otherwise show why (e.g. "complete a booking to leave a review").
- `ReviewList` on `/packages/[slug]/reviews`, public.
- **Create response:** `POST /api/reviews` returns `data: { review, rating }` — the `rating` is the package's recomputed average; read `data.review` for the new row and `data.rating` to refresh the package's displayed rating. Errors mirror the gates: 403 (own package / no completed booking), 409 (already reviewed), 404 (package not found).
- **Fields:** `{ packageId, rating: 1-5 int, comment: ≤1000 chars }` — zod mirror in `lib/validations/review.ts`.
