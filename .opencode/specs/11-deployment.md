# Step 11 — Deployment (for the live link)

- Vercel — ideal fit for Next.js, one-command deploy.
- Env vars on Vercel dashboard: `BACKEND_API_URL`, `NEXT_PUBLIC_BACKEND_API_URL` (both pointed at the deployed backend), `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (must match the backend exactly), `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- `next.config.ts`'s `images.remotePatterns` (Step 1) must include `res.cloudinary.com` before deploying, or package photos break in production.
- Update the backend's CORS `origin` allow-list to the Vercel domain once known.
