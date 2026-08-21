# Step 15 — Refresh Token Rotation & Reuse Detection (auth hardening)

## Status

**DONE.** Backend auth was hardened (server Step 22): every refresh now **rotates**
the refresh token (the presented token is revoked in a DB ledger and a fresh pair is issued), and
reusing a revoked token — the theft signature — **nukes the whole token family** via a
`tokenVersion` bump. `logout` and `reset-password` also bump `tokenVersion`, so all outstanding
sessions die at once. This step added two module-scoped guards in `proxy.ts` (in-flight refresh
dedupe + a short-TTL rotation grace cache) and verified the full lifecycle end-to-end against
`next start` plus the running backend: rotation, concurrent dedupe, tombstone replay,
family-alive, genuine-reuse nuke, logout kill, reset-password kill.

## Overview

The client never stores the refresh token in JS-accessible state — `proxy.ts` holds it in an
httpOnly cookie and calls `POST /api/auth/refresh` server-side, persisting the **rotated** pair
back to the browser cookies. Because rotation makes each refresh token single-use, the client
must always persist the *latest* pair and must never race two refreshes with the same token. The
middleware path is already rotation-safe in the happy case; the realistic risk is **two
concurrent proxy invocations presenting the same still-valid refresh token** (e.g. parallel
server-rendered requests during one load). The first rotation revokes the shared token; the
second then trips reuse detection and the family is nuked — logging the user out. This step adds
an in-flight dedupe guard in `proxy.ts` and verifies every auth surface end-to-end.

## Depends on

- `service/refreshToken.ts` — `getNewAccessToken(refreshToken)` → `{ status: "ok"|"invalid"|"error", tokenPair? }`; already returns the rotated pair from the response body.
- `proxy.ts` — holds `accessToken`/`refreshToken`/`accessTokenClient` cookies; refreshes when the access token is expired; clears cookies on definitive rejection (`clearStaleCookies`), keeps them on transient failure (`refreshFailedTransiently`).
- `lib/api/auth.ts` — `authApi.logout` (revokes the family server-side via `tokenVersion`).
- Server: `auth` module (Step 22) — `refreshToken` ledger (`RefreshToken` rows keyed by SHA-256 hash), CAS rotation, `revokeFamily` on reuse, `auth.service.ts` `refreshToken`/`logout`/`resetPassword`.

## Server contract (actual, Step 22)

```
POST /api/auth/refresh   auth-adjacent (httpOnly cookie OR body { refreshToken })
  → 200 { accessToken, refreshToken } + httpOnly cookies — the pair is ROTATED; the presented
    token is revoked in the ledger before the new one is issued.
  Errors (verbatim):
    401 "Refresh token is required"
    401 "Refresh token reuse detected. Please login again."   ← replay of a rotated token;
       the whole family is revoked (tokenVersion++) — every session dies, not just this one.
    401 "Invalid refresh token. Please login again."          ← never issued / pruned
    401 "Refresh token has expired. Please login again."
    401 "Token is no longer valid. Please login again."       ← tokenVersion changed (logout
       / password reset); the presented token is now stale
    403 "Account has been deleted" · 403 "Account is suspended"

POST /api/auth/logout    auth()  → revokes all ledger rows + tokenVersion++ (family nuke)
POST /api/auth/reset-password (Step 14) → tokenVersion++ (family nuke)
```

Ledger housekeeping runs opportunistically on refresh (expired rows + rows revoked > 7 days are
pruned), so the table never grows unbounded without a cron.

## Client changes (as built)

**`proxy.ts` — two module-scoped guards protect the single-use refresh token:**

1. **In-flight dedupe** — `Map<string, Promise<TRefreshResult>>` keyed by the presented
   refresh token. Concurrent invocations share one pending `getNewAccessToken` promise; the
   entry is deleted once it settles. All callers resolve to the identical rotated pair, so
   parallel server-rendered requests perform exactly one rotation.
2. **Rotation grace cache** — `Map<string, { pair, expiresAt }>` (old token → rotated pair,
   `REFRESH_GRACE_MS = 10_000`), written by whichever caller performed the real backend call,
   on success. A request landing after a rotation settled but before the browser applied the
   new cookie would otherwise present the just-revoked token and trip reuse detection; the
   cache serves it instead. Expired entries are swept opportunistically on insert.

Refresh-branch lookup order: in-flight pending → unexpired grace entry → live
`getNewAccessToken` call. A cache hit is verified locally like any fresh pair and attached as
`refreshedPair`, so cookies are re-set idempotently. A reuse-detection 401 that genuinely
reaches the client (a replay after the grace window — the theft signature) still clears
cookies via the existing `clearStaleCookies` path and sends the user to login — intended.

**Per-process caveat (verified during this step):** these caches live in module scope, so
they work reliably under `next start`, where the middleware module stays alive. `next dev`
recycles the middleware sandbox between non-overlapping requests — sequential-request testing
of the grace cache only behaves against a production build. Multi-instance deployments get
best-effort coverage (the same limitation as any in-memory dedupe).

**No other code changes were needed.** The remaining surfaces already conform:
- `service/refreshToken.ts` `getNewAccessToken` sends the refresh token in the body and reads
  the rotated pair from `envelope.data`; it treats 5xx as transient (`status: "error"`, cookies
  kept) and every 4xx as definitive (`status: "invalid"`, cookies cleared). This maps exactly to
  the rotation failure modes above.
- `proxy.ts` attaches the rotated pair to the `NextResponse` (all three cookies), so the
  browser always holds the latest refresh token after any navigation that refreshed.
- `useMe` swallows a `/api/auth/me` 401 → `null` → navbar renders logged-out; a family nuke
  surfaces as a graceful session end, not a crash.

## Files changed

- `proxy.ts` — in-flight dedupe + rotation grace cache (as built, ~50 lines incl. comments)
- `service/refreshToken.ts` — unchanged; the `invalid`/`error` mapping was re-confirmed
  against the rotation failure modes during verification
- `.opencode/specs/15-refresh-token-rotation.md` — this file

## New dependencies

No new dependencies.

## Rules for implementation

### Data fetching
- Refresh is only ever called from `proxy.ts` (server side) via `service/refreshToken.ts`;
  client components never call `/api/auth/refresh` directly.
- The in-flight dedupe must resolve all concurrent callers to the **same** result object; never
  spawn a second backend call for an already-pending refresh token.

### Auth & routing
- Do not change cookie names, cookie options, or the `clearStaleCookies` /
  `refreshFailedTransiently` semantics — those already encode the rotation contract.
- A reuse-detection logout is **intended** behaviour (stolen-token response). The dedupe only
  removes *self-inflicted* reuse from concurrent same-flight refreshes.

## Definition of done — verified

Verified via raw HTTP against `npm run start` (production build; see per-process caveat) with
the server running the Step 22 auth module:

- ✅ Rotation happy path: navigating with only a valid refresh cookie returns 200 and the
  response carries a **new** rotated pair; the session survives.
- ✅ Concurrency: two simultaneous navigations presenting the same still-valid refresh token
  both return 200 with the **identical** rotated pair (dedupe collapsed them into one
  rotation).
- ✅ Grace cache: an immediate replay of the just-rotated token is served the cached pair (no
  backend hit) and the family stays alive — the next navigation rotates normally.
- ✅ Genuine replay after the grace window: 307 to `/login?redirectTo=…` with all cookies
  cleared. Correction to the original wording: a rotated token replayed past the grace window
  trips **reuse detection** ("Refresh token reuse detected. Please login again." + family
  nuke), not "Invalid refresh token" — that message is reserved for never-issued/pruned
  tokens. Because the server checks `tokenVersion` before the ledger, every other token of
  the nuked family then fails with "Token is no longer valid. Please login again." (verified
  directly against the backend).
- ✅ Log out → the refresh token is dead (`/api/auth/me` and refresh both 401); the next proxy
  navigation lands on `/login` with the cookies cleared.
- ✅ Reset the password (Step 14 flow, throwaway user) → the pre-reset session's next
  navigation bounces to `/login` (tokenVersion bump killed it).
- ✅ A backend DB without the ledger row (never-issued token) → "Invalid refresh token" →
  clean logout, no crash, no spinner loop (covered by the `invalid` mapping).
- ✅ `npm run lint` and `npm run typecheck` pass. Committed + pushed (AGENTS.md workflow).