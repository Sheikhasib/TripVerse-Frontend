# Step 3 — Auth Infrastructure

## API client (`lib/api/client.ts`)
Single `apiClient<T>(endpoint, options)` used everywhere instead of ad-hoc `fetch` per component:
- Base URL resolves to the backend directly on the server (`BACKEND_API_URL`) and to `""` on the client (so client requests hit the Next.js `rewrites()` proxy from Step 1, staying same-origin).
- Reads the client-readable access token cookie and sends it as `Authorization: Bearer <token>`, plus `credentials: "include"` for the httpOnly cookies.
- Throws a typed `ApiError(statusCode, message)` on any non-`success` response so callers can branch on status without parsing the body themselves.
- `apiClientFull<T>` variant returns the full envelope (including `meta`) for paginated list endpoints; plain `apiClient<T>` returns just `data` for everything else.

## JWT utils (`utils/jwt.ts`)
`createToken` / `verifyToken` — thin wrapper over `jsonwebtoken`, mirrors the backend's `utils/jwt.ts` exactly. Used only in `proxy.ts` (Step 4) and the refresh-token service below — never in client components.

## Refresh-token service (`service/refreshToken.ts`)
Server-only (`"use server"`):
- `getNewAccessToken()` — calls the backend's refresh endpoint with the refresh token cookie, returns the new access token.
- `getAccessToken()` — returns a valid access token for the current request, refreshing it if the access token expired but the refresh token is still valid; returns `null` if the user can't be authenticated. Does **not** write cookies itself (Next.js forbids cookie writes outside Server Actions/Route Handlers/middleware) — `proxy.ts` (Step 4) is what persists a refreshed token to the browser.

## Form validation
React Hook Form + Zod resolver on every form (Steps 5, 7, 8). Schemas live in `lib/validations/`, one file per form, mirroring the backend's Zod schemas field-for-field so client-side errors match what the server would reject.
