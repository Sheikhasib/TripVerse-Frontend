# Step 7 — Package Management

## Component reuse
| GearUp component | TripVerse equivalent | Change needed |
|---|---|---|
| `GearCard` | `PackageCard` | swap `dailyRate`→`price`, add `duration`/`location` fields |
| `GearForm` | `PackageForm` | drop rental-specific fields, add `duration`, `location`, `category` select, and a new `ImageUploader` sub-component (not a straight port) |

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

## Ownership & approval (reflected in UI)
Agent only sees/edits their own packages. Any edit shows a "pending re-approval" state after submit (backend resets status to `PENDING`). Admin's package list has approve/reject actions per row.
