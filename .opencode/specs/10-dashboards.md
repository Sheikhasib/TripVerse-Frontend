# Step 10 — Dashboards

## Routes
```
[MVP] /user-dashboard                    was customer-dashboard
[MVP] /agent-dashboard                    was provider-dashboard
[MVP] /admin-dashboard
[MVP] /admin-dashboard/users
[MVP] /admin-dashboard/analytics          charts wired to /api/dashboard/admin
[LATER] /user-dashboard/payments          needs payment module
[LATER] /admin-dashboard/messages          needs ContactMessage backend
[LATER] /admin-dashboard/categories        categories are a plain string field, no manager needed
```

## Sidebar requirements (per requirements doc)
- **User** (≥4 items): Overview, My Bookings, Profile, Settings-lite (just profile fields)
- **Agent** (4 items): My Packages, New Package, Bookings, Overview
- **Admin** (≥6 items): Overview, Manage Packages, Manage Users, Manage Bookings, Analytics, Settings
- Profile dropdown in dashboard navbar (Profile, Logout) — reuse GearUp's as-is.

## Charts & tables
- `components/charts/*` reused from GearUp — repoint data source to `/api/dashboard/admin` (and `/agent`, `/user`) response shape.
- Data tables reuse GearUp's existing filtering + pagination pattern.
