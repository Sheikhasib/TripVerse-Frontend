# Step 5 — Auth Pages

## `(authGroup)`
```
[MVP] /login      + demo login buttons (one per role) + Google OAuth button
[MVP] /register   role select limited to USER / AGENT (ADMIN self-register is a 400)
```

Both forms use React Hook Form + Zod (Step 3). On success, the backend sets the auth cookies; the page redirects to `redirectTo` (from the query string, set by `proxy.ts` in Step 4) or the role's dashboard if there isn't one.

## Google OAuth (backend MVP — `POST /api/auth/google` with `{ idToken }`)
Add a Google button on `/login` using Google Identity Services (GIS):
- Load GIS (`https://accounts.google.com/gsi/client`) guarded by `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — the button is hidden when that env is missing so the app still runs without it.
- On credential success, take the returned JWT `credential` as the `idToken` and `POST /api/auth/google` with `{ idToken }`. The server verifies it, creates/links the account, and sets the auth cookies — same redirect flow as login.
- Handle the server's error cases verbatim: 400 unverified email / not configured, 409 "email already linked to another Google account".
- Google accounts are passwordless — the login error "This account uses Google login" means the credential-login path is not shown for them.

## Demo login
Three buttons (one per role: USER / AGENT / ADMIN) that call `/api/auth/demo-login` with `{ role }` — no typed credentials needed, satisfies the requirement-doc's "demo login button (auto-fill credentials)" checkbox without hardcoding demo passwords in the UI. The server upserts `demo-<role>@tripverse.com`.

## Rate limiting
`/login`, `/register`, `/demo-login` are throttled server-side (5 req / 15 min per IP — Step 3 backbone). Surface the 429 message verbatim ("Too many attempts…") instead of a generic error, and avoid hammering the endpoints during demos.
