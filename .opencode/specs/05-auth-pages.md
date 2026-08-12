# Step 5 — Auth Pages

## `(authGroup)`
```
[MVP] /login      + demo login buttons (one per role) + [LATER] Google OAuth button
[MVP] /register
```

Both forms use React Hook Form + Zod (Step 3). On success, the backend sets the auth cookies; the page redirects to `redirectTo` (from the query string, set by `proxy.ts` in Step 4) or the role's dashboard if there isn't one.

Demo login: three buttons (one per role) that call `/api/auth/demo-login` with `{ role }` — no typed credentials needed, satisfies the requirement-doc's "demo login button (auto-fill credentials)" checkbox without needing to hardcode/display demo passwords in the UI.
