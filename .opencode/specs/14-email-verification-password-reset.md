# Step 14 — Email Verification & Password Reset (OTP flows)

## Status

**NEW.** The backend's auth module (server Step 21) changed registration fundamentally:
`POST /api/auth/register` no longer creates a user row. It stages the payload in Redis,
emails a 6-digit OTP, and the account is only materialised by
`POST /api/auth/verify-email` (which also auto-logs-in). Password recovery is OTP-based too
(`forgot-password` → email OTP → `reset-password`). The current client register form routes
straight to `/login` on success — it must now transition to an OTP verification step, and the
client is missing the verify/resend/forgot/reset API functions and pages entirely.

## Overview

Every credential signup is now **two-phase**: phase 1 sends the OTP, phase 2 verifies it.
Because the verify endpoint issues tokens + cookies (`data: { accessToken, refreshToken,
user }`), a successful verify **logs the user in** — the client must reuse `useAfterAuth`
exactly like login/demo/Google. Password reset is also two-phase (forgot → OTP → reset) but
**does not log in**; the user signs in with the new password afterwards.

Both the OTP and the staged registration live in Redis for 5 minutes (`OTP_EXPIRATION_SECONDS`).
`resend-verification` re-mints a fresh OTP for a still-staged registration (uniform 200, no-op
when nothing is staged). `forgot-password` is a deliberate uniform 200 — **never** reveal whether
an email exists. `reset-password` bumps `tokenVersion`, so every existing session dies the moment
the password changes (TripVerse logout semantics).

**Rate limits:** all five endpoints sit behind `authLimiter` (5 requests / 15 min) in the
backend `app.ts`. The client must surface the 429 verbatim and never auto-fire resend in a loop.

**Mismatches fixed by this step (today):**
- `lib/api/auth.ts` — `register` declares `apiClient<TAuthUser>` but the server now returns
  `data: null`; there are no `verifyEmail`/`resendVerification`/`forgotPassword`/`resetPassword`
  functions at all.
- `components/auth/register-form.tsx` — toast "Account created. Please log in." + redirect to
  `/login` is now false; the account does not exist until the OTP is verified.
- `proxy.ts` — `/verify-email`, `/forgot-password`, `/reset-password` are absent from
  `PUBLIC_EXACT_PATHS`, so an unauthenticated visitor would be bounced.

## Depends on

- `lib/api/client.ts` — `apiClient<T>`, `ApiError(statusCode, message)` (surfaced verbatim).
- `lib/api/auth.ts` — existing `login`, `demoLogin`, `googleLogin`, `setAccessTokenClient`.
- `components/auth/use-after-auth.ts` — `useAfterAuth(accessToken, role, message)`; reused by
  the verify step for the auto-login redirect (it also persists the `accessTokenClient` cookie).
- `utils/token.ts` — `decodeJwtPayload` (already used by the login form to read `role`).
- `components/auth/auth-card.tsx` — the shared auth shell for the two new public pages.
- `proxy.ts` (Step 4) — must add the three new public paths.
- Server: `auth` module (Step 21) — `POST /api/auth/verify-email`, `/resend-verification`,
  `/forgot-password`, `/reset-password`; `authLimiter` on all five auth endpoints.
- `next.config.ts` — the `/api/:path*` rewrite already proxies these; no change.

## Routes

```
[public] /register          modify — phase 1 (details) then phase 2 (OTP) in one page
[public] /verify-email      create — OTP entry, resend, auto-login on success; email from ?email=
[public] /forgot-password   create — email entry, uniform-success info card
[public] /reset-password    create — OTP + new password; ?email= from the forgot step
```

All four render inside `(authGroup)` with the existing `AuthCard`. `/register` keeps a single
route but manages two internal steps so a mid-flow refresh doesn't lose the email (phase 2
re-derives `email` from the submitted value and survives refresh by reading `?email=`).

## Server contract (actual, Step 21)

```
POST /api/auth/register { name, email, password, phone?, role? }    public (authLimiter)
  → 201 { data: null } "Verification OTP sent to your email."   (no user row yet)
  Errors (verbatim): 400 "Role must be either USER or AGENT" · 409 "User with this email
  already exists" · 409 "Registration is pending verification. Check your email or resend
  the OTP." · 503 "Email verification is not configured."
  Side effects: hashes the password, stages it + the OTP in Redis for 5 min, emails the OTP.

POST /api/auth/verify-email { email, otp }                       public (authLimiter)
  → 200 { accessToken, refreshToken, user } + httpOnly cookies set — AUTO-LOGIN
  Errors (verbatim): 409 "Email is already verified" · 400 "Invalid or expired OTP." ·
  503 "Email verification is not configured."
  Side effects: creates the user row (emailVerified: true), deletes the Redis keys
  (OTP is single-use), sends the welcome email, issues tokens.

POST /api/auth/resend-verification { email }                     public (authLimiter)
  → 200 { data: null } "Verification OTP sent to your email."  — uniform, no-op if not staged
  Errors: 503 "Email verification is not configured."

POST /api/auth/forgot-password { email }                         public (authLimiter)
  → 200 { data: null } "If an account with that email exists, a password reset OTP has been
  sent."  — always this message; no enumeration. Skips deleted / SUSPENDED / GOOGLE accounts.

POST /api/auth/reset-password { email, otp, newPassword }        public (authLimiter)
  → 200 { data: null } "Password reset successfully. Please login again."
  Errors (verbatim): 400 "Invalid or expired OTP." · 400 "New password ..." validation.
  Side effects: replaces the password hash, increments tokenVersion (kills every session),
  deletes the OTP, emails a reset-success notice. Does NOT log in.
```

All five are **public**; the 429 body is `{ success: false, message: "Too many attempts.
Please try again in 15 minutes." }` (authLimiter) — surface verbatim.

## New API functions (`lib/api/auth.ts`)

```
  verifyEmail(payload: TVerifyEmailSchema)      → POST /api/auth/verify-email → TLoginResult
  resendVerification(payload: { email })        → POST /api/auth/resend-verification → null
  forgotPassword(payload: { email })            → POST /api/auth/forgot-password → null
  resetPassword(payload: TResetPasswordSchema)  → POST /api/auth/reset-password → null
```

Fix the existing `register` signature: it returns `null` now, **not** `TAuthUser`. Keep
`TLoginResult = TTokenPair & { user?: TAuthUser }` (already correct for verify/login).

## New validation schemas (`lib/validations/auth.ts`)

```
otpSchema = z.string().length(6).regex(/^\d{6}$/)            // exactly 6 digits
verifyEmailSchema    = { email: z.email().trim(), otp: otpSchema }
resendSchema         = { email: z.email().trim() }
forgotPasswordSchema = { email: z.email().trim() }
resetPasswordSchema  = { email, otp: otpSchema, newPassword: z.string().min(6).max(72) }
```

## Components

**Create (`components/auth/`):**
- `otp-input.tsx` — a 6-digit single-field input (`inputMode="numeric"`, `maxLength=6`,
  `autoComplete="one-time-code"`); used by both the verify step and reset. No split-box
  over-engineering — one controlled field with a digit pattern.
- `verify-email-card.tsx` — props `{ email: string }`. Reads OTP, calls `verifyEmail`, on
  success `useAfterAuth(data.accessToken, decodeJwtPayload(...).role, "Email verified —
  welcome to TripVerse")`. Shows a **Resend** link (disabled 60 s countdown; then
  `resendVerification`). Surfaces 400/409/503/429 verbatim. `AuthCard` shell + sonner toasts.
- `forgot-password-form.tsx` — email form → `forgotPassword` → always the uniform-success
  info card ("If an account with that email exists…") with a button to
  `/reset-password?email=<encoded>`; link back to `/login`.
- `reset-password-form.tsx` — props `{ email: string }`. OTP + new password + confirm.
  `resetPassword` → toast "Password reset — please log in with your new password" →
  `router.replace("/login")`. Resend link (countdown) calls `forgotPassword(email)` again.

**Modify:**
- `register-form.tsx` — two-phase. Phase 1 (current form): on success store `email` and switch
  to phase 2 (OTP) rendered by `verify-email-card` **without navigating away** — a mid-flow
  refresh survives because phase 2 also reads `?email=` (set via `router.replace("/register?email=…")`).
  Keep the "already have an account?" footer on both phases.
- `components/auth/login-form.tsx` — add a "Forgot password?" link under the submit button to
  `/forgot-password` (small, non-intrusive).
- `proxy.ts` — add `"/verify-email"`, `"/forgot-password"`, `"/reset-password"` to
  `PUBLIC_EXACT_PATHS`.

## New dependencies

None. Existing `apiClient`, TanStack Query (not needed — these are form-submit flows), zod,
`react-hook-form`, sonner. OTP delivery is email (server-side); no SMS client.

## Rules for implementation

### Data fetching
- All four new calls go through `lib/api/auth.ts` → `apiClient`; never raw `fetch`.
- These are submit-once forms, not `useQuery` — a mutation-hook wrapper is unnecessary (the
  auth forms already call the API directly with `formState.isSubmitting` guards).
- Every error path surfaces `ApiError.message` verbatim (400/409/429/503).

### Rate-limit & resend UX
- Resend buttons are **always** disabled for a 60 s countdown after the first send.
- Never auto-resend on interval — only on user click. A 429 toast tells the user to wait 15 min.

### SSR & routing
- All three pages are `"use client"`. `email` travels via `?email=` (encodeURIComponent) so a
  refresh never loses it; there is no localStorage or session storage anywhere.
- `/verify-email`, `/forgot-password`, `/reset-password` are public (proxy whitelist) but
  render inside `(authGroup)`. `proxy.ts`'s auth-route redirect (step 1 in the middleware)
  already sends logged-in users to their dashboard, so these paths must be in
  `PUBLIC_EXACT_PATHS` (not `AUTH_PATHS`) — otherwise an anonymous visitor gets bounced to
  `/login` by the generic public check.

### UI & animation
- Reuse `AuthCard`, `Input`, `Button`, `Form` components; `Spinner` while submitting.
- OTP field: centered, `font-mono`, `text-center`, `tracking-[0.5em]`; a hint line
  "Enter the 6-digit code sent to {email}".

## Definition of done

Runnable via `npm run dev` with the server running the Step 21 auth module, Redis up, and
Nodemailer pointing at a mail catcher (Mailpit/ethereal):

- Registering a new email shows "Verification OTP sent to your email" and the OTP step; **no
  user row exists** before verify (check via server/DB).
- Typing the OTP from the mail catcher verifies, auto-logs-in (lands on the USER dashboard),
  and the account exists with `emailVerified: true`.
- Wrong OTP → "Invalid or expired OTP." verbatim; the email can be resent after the 60 s
  countdown.
- Resubmitting the same register form mid-flow → the server's 409 "Registration is pending
  verification…" surfaces verbatim.
- `/forgot-password` always shows the uniform success message (test with an unknown email too).
- `/reset-password?email=` with the emailed OTP + new password succeeds; the user is taken to
  `/login`; the old password no longer works and all prior sessions are killed (open a second
  tab first — it must bounce to login).
- Any 429 from rapid resending shows "Too many attempts. Please try again in 15 minutes.".
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).