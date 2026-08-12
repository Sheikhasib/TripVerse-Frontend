# Step 7 — Package Management

## Component reuse
| GearUp component | TripVerse equivalent | Change needed |
|---|---|---|
| `GearCard` | `PackageCard` | swap `dailyRate`→`price`, add `duration`/`location` fields |
| `GearForm` | `PackageForm` | drop rental-specific fields, add `duration`, `location`, a `categoryId` select, and a new `ImageUploader` sub-component (not a straight port) |

## Routes
```
[MVP] /agent-dashboard/my-packages        was my-gear
[MVP] /agent-dashboard/packages/new       was gear/new
[MVP] /agent-dashboard/packages/[id]/edit
[MVP] /admin-dashboard/packages           includes approve/reject actions
```

## New component: `ImageUploader` (no GearUp equivalent — build fresh)
Used inside `PackageForm`:
- Accepts up to 6 images, client-side preview before upload (object URLs).
- On submit of each file: `POST` to backend `/api/uploads/image` (multipart), show per-file progress/spinner, collect the returned `url` into the form's `images` array field.
- Client-side pre-check before upload: file type (jpg/png/webp) and size (≤5MB) — mirrors the backend's multer validation for instant feedback.
- Remove/reorder already-uploaded images before final form submit.

## Category select
`categoryId` is a required field on create/update — the client never sends a free-text category name. The select is populated from `GET /api/categories` (public, returns `{ id, name, slug }[]`), with a loading skeleton and empty-state ("no categories yet" → agent can't submit until admin seeds one). Store the chosen `id`; the listing/detail endpoints return the category object on the package (`id`/`name`/`slug`).

## Editing an existing package
The public `GET /packages/:slug` only resolves `APPROVED` packages, and there is no guaranteed per-id endpoint for a package the owner still edits (PENDING/REJECTED). So the **edit route initializes the form from the package row already in hand** (navigation state / server-component props from the my-packages or admin list) rather than refetching by id:
- Route: `/agent-dashboard/packages/[id]/edit`, `/admin-dashboard/packages/[id]/edit`.
- If the row is missing (direct URL hit / refresh), fall back to: for agents, refetch `GET /api/packages/internal/my-packages` and pick the matching id; for admins, refetch `GET /api/packages/internal/all` and pick the matching id. Both list endpoints exist and include every status.
- No form values are submitted for fields the user didn't touch — `PATCH /api/packages/:id` is a partial update (the client sends only changed fields).

## Ownership & approval (reflected in UI)
Agent only sees/edits their own packages. Any edit shows a "pending re-approval" state after submit (backend resets status to `PENDING`). Admin's package list has approve/reject actions per row.
