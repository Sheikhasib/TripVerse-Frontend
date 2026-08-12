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

`BookingTable` reflects the status state machine from the backend spec (PENDING/CONFIRMED/CANCELLED/COMPLETED) — action buttons shown per row depend on the viewer's role and the booking's current status.
