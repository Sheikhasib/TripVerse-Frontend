# Step 4 — Route Protection (`proxy.ts`)

Next.js's root-level middleware convention (named `proxy.ts` as of the Next.js version GearUp uses — not `middleware.ts`). Runs before any page renders, so an unauthorized dashboard view never flashes on screen.

## Responsibilities
1. **Silent refresh** — if the access token is expired/invalid but the refresh token is valid, call `getNewAccessToken()` (Step 3) and persist both the httpOnly `accessToken` cookie and the client-readable `accessTokenClient` cookie on the response before continuing.
2. **Clear stale cookies** — only when *both* access and refresh tokens are invalid (a transient refresh failure with a still-valid refresh token should not log the user out).
3. **Auth-route redirect** — an already-authenticated user hitting `/login` or `/register` gets redirected to their role's dashboard instead.
4. **Protected-route redirect** — an unauthenticated user hitting anything outside the public/auth route lists gets redirected to `/login?redirectTo=<original path>`.
5. **Role-based dashboard guard**:

| Path prefix | Required role | Mismatch behavior |
|---|---|---|
| `/user-dashboard/*` | `USER` | redirect to `/not-found` |
| `/agent-dashboard/*` | `AGENT` | redirect to `/not-found` |
| `/admin-dashboard/*` | `ADMIN` | redirect to `/not-found` |

## Public routes (no auth required)
`/`, `/packages`, `/packages/[slug]`, `/about`, `/contact`, `/help`, `/privacy`.

## Matcher
`config.matcher` excludes `/api`, `/_next/static`, `/_next/image`, `favicon.ico` — so static assets and the API rewrite proxy (Step 1) aren't touched by this logic.
