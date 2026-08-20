# Step 15 — Refresh Token Rotation & Reuse Detection (auth hardening)

## Status

**VERIFY + HARDEN.** Backend auth was hardened (server Step 22): every refresh now **rotates**
the refresh token (the presented token is revoked in a DB ledger and a fresh pair is issued), and
reusing a revoked token — the theft signature — **nukes the whole token family** via a
`tokenVersion` bump. `logout` and `reset-password` also bump `tokenVersion`, so all outstanding
sessions die at once. The client's `service/refreshToken.ts` + `proxy.ts` were built before this
change; this step verifies they still behave correctly under rotation, documents the contract,
and adds one small hardening for the concurrency edge rotation introduces.

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

## Client changes

**`proxy.ts` — add a module-scoped in-flight dedupe for refreshes.** Two middleware invocations
sharing one still-valid refresh token must not present it twice. Key a short-lived in-flight
map by the refresh token value (or its hash) and reuse the same pending promise:

```
const inFlightRefresh = new Map<string, Promise<TRefreshResult>>()

if (!auth && refreshToken) {
  const existing = inFlightRefresh.get(refreshToken)
  const pending = existing ?? getNewAccessToken(refreshToken)
  if (!existing) inFlightRefresh.set(refreshToken, pending)
  const result = await pending
  inFlightRefresh.delete(refreshToken)   // runs for the winner; losers resolve the same promise
  ...
}
```

Concurrent invocations with the same token then perform a single rotation; the losers receive
the same fresh pair. This preserves rotation's security (each token still used once) while
removing the self-inflicted logout. A reuse-detection 401 that genuinely reaches the client
(e.g. a real stolen token replay) still clears cookies via the existing `clearStaleCookies`
path and sends the user to login — correct behaviour.

**No other code changes are expected.** The remaining surfaces already conform:
- `service/refreshToken.ts` `getNewAccessToken` sends the refresh token in the body and reads
  the rotated pair from `envelope.data`; it treats 5xx as transient (`status: "error"`, cookies
  kept) and every 4xx as definitive (`status: "invalid"`, cookies cleared). This maps exactly to
  the rotation failure modes above.
- `proxy.ts` attaches the rotated pair to the `NextResponse` (all three cookies), so the
  browser always holds the latest refresh token after any navigation that refreshed.
- `useMe` swallows a `/api/auth/me` 401 → `null` → navbar renders logged-out; a family nuke
  surfaces as a graceful session end, not a crash.

## Files to change

- `proxy.ts` — in-flight refresh dedupe (small; ~8 lines)
- `service/refreshToken.ts` — no change expected; re-read and confirm the `invalid`/`error`
  mapping in the DoD verification
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

## Definition of done

Runnable via `npm run dev` with the server running the Step 22 auth module:

- Login → wait for the access token to expire (or shorten `JWT_ACCESS_EXPIRES_IN` locally) →
  navigate → the browser now holds a **new** refresh cookie; the old refresh token fails with
  "Invalid refresh token. Please login again." if replayed manually.
- **Concurrency:** load a page that triggers the proxy with a just-expired access token twice
  in the same instant (e.g. two simultaneous navigations) → the user stays logged in (dedupe
  collapses the two refreshes into one rotation). Without the dedupe this step previously
  logged the user out.
- Log out → the refresh token is dead (`/api/auth/me` and refresh both 401); the user lands on
  `/login` and the cookies are cleared.
- Reset the password in another tab (Step 14) → this tab's next navigation bounces to `/login`
  (tokenVersion bump killed the session).
- A backend restart with a cleared DB drops the ledger rows → refresh returns "Invalid refresh
  token" → clean logout, no crash, no spinner loop.
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).