# Step 8 — Booking Flow

## Component reuse
| GearUp component | TripVerse equivalent | Change needed |
|---|---|---|
| `RentalOrderTable` | `BookingTable` | swap date-range picker → single `travelDate` + `travelers` input |

## Create Booking form
React Hook Form + Zod (Step 3). Fields: `packageId` (from context, not user-entered), `travelDate`, `travelers`.

**Price preview** — the backend computes `totalPrice` authoritatively server-side (client can't set it). The form still shows a client-side estimate for UX: as `travelers` changes, display `price × travelers` live, labeled as an estimate. On submit, the real total from the response is what's shown on the confirmation state — the client-side number is a preview only, never sent as `totalPrice`.

## Routes
```
[MVP] /user-dashboard/bookings           was orders
[MVP] /user-dashboard/bookings/[id]      booking detail
[MVP] /agent-dashboard/bookings          was orders
[MVP] /admin-dashboard/bookings          was orders
```

`BookingTable` reflects the status state machine from the backend (PENDING/CONFIRMED/CANCELLED/COMPLETED). Action buttons per row depend on the viewer's role and the booking's current status:

| Current | Allowed next | Who can trigger | Client shows |
|---|---|---|---|
| `PENDING` | `CONFIRMED` | package agent / admin | agent+admin rows |
| `PENDING` | `CANCELLED` | owner, agent, admin | all roles |
| `CONFIRMED` | `COMPLETED` | agent / admin, **only after travelDate** | agent+admin rows (button disabled until date passes) |
| `CONFIRMED` | `CANCELLED` | owner, agent, admin | all roles |
| `CONFIRMED` | `PENDING` (revert) | agent / admin, only before travelDate | agent+admin rows |
| `CANCELLED` / `COMPLETED` | — | terminal | no action buttons |

All transitions go through a single `PATCH /api/bookings/:id/status` with `{ status }`; the server validates the transition and returns a human-readable 400 on illegal moves — display that message verbatim (e.g. "Booking can only be completed after the travel date has passed."). Note that the user-owning-a-booking can also cancel, so the user booking table includes a Cancel action too.

**Demo gotcha:** to exercise the COMPLETED → review path (Step 9), seed/book a booking whose `travelDate` is in the past — otherwise COMPLETE stays disabled and reviews can't be tested.
