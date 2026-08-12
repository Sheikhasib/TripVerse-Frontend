# Step 9 — Review Components

## Component reuse
| GearUp component | TripVerse equivalent | Change needed |
|---|---|---|
| `ReviewList` / `ReviewForm` | same, minor field rename | reuse near-verbatim |

## Behavior
- `ReviewForm` only renders for a user with a `COMPLETED` booking on that package who hasn't already reviewed it (mirrors the backend's gate + unique constraint) — otherwise show why (e.g. "complete a booking to leave a review").
- `ReviewList` on `/packages/[slug]/reviews`, public.
