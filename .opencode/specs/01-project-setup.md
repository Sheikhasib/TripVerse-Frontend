# Step 1 — Project Setup

## Tech Stack
Next.js (App Router) + TypeScript, Tailwind, shadcn/ui, Zustand, TanStack Query — same as GearUp, no changes. Also: `react-hook-form` + `@hookform/resolvers/zod` + `zod` for form validation (see Step 3), `next-cloudinary` for image handling, `sonner` for toasts, `next-themes` for dark mode.

## Folder Structure
```
client/
├── app/
│   ├── (publicGroup)/
│   ├── (authGroup)/
│   ├── (dashboardGroup)/
│   ├── providers/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/          # shadcn primitives
│   ├── shared/
│   ├── sections/
│   └── charts/
├── lib/
│   ├── api/         # one file per resource, all through client.ts
│   ├── validations/ # Zod schemas
│   └── utils.ts
├── service/
│   └── refreshToken.ts
├── utils/
│   └── jwt.ts
├── hooks/
├── store/           # Zustand
├── proxy.ts         # Step 4 — route protection
├── next.config.ts
└── .env.example
```

## Env Vars
```
BACKEND_API_URL=http://localhost:4000                 # server-side only
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4000      # client-side, must match
JWT_ACCESS_SECRET=...                                   # MUST match backend exactly
JWT_REFRESH_SECRET=...                                  # MUST match backend exactly
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...                        # optional; Google button hidden when unset (Step 5)
```
`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are used by `proxy.ts` (Step 4) to verify tokens without calling the backend on every request. If these don't match the backend's secrets exactly, every token is rejected and all dashboard routes redirect to `/login`.
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` must be the same Google OAuth client as the backend's `GOOGLE_CLIENT_ID` (it's the audience the backend verifies against) when Google login is enabled.

## `next.config.ts`
- `images.remotePatterns` — must include `res.cloudinary.com`, or package photos break.
- `rewrites()` — proxies `/api/:path*` to `BACKEND_API_URL` so client-side calls stay same-origin (avoids CORS/cookie complications entirely for browser requests).
