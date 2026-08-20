# Step 18 — Blog Comments (one-level replies)

## Status

**NEW.** Promoted out of `12-explicitly-cut.md`. The backend ships blog comments (server
Step ~24): public threaded comments on published posts with **one-level replies** — top-level
comments may be replied to, replies may not. Any authenticated user can comment; the author or
an ADMIN can soft-delete. The blog detail page today renders content with no comment section.

## Overview

Comments render beneath the blog post on `/blog/[slug]`. Any signed-in visitor can post a
top-level comment or reply to one; replies are indented under their parent and are always
returned oldest-first (conversation order) while top-level comments are newest-first. The
author of a comment (or an admin) sees a delete control. There is no edit — the backend ships
create/list/delete only, matching the module's API surface. Comments only ever appear under a
PUBLISHED, non-deleted post (the server enforces this on every endpoint).

## Depends on

- `lib/api/client.ts` — `apiClient<T>`, `apiClientFull<T>` (paginated), `ApiError`.
- `lib/api/blog.ts` — `TBlogAuthor` shape reused for comment authors.
- `hooks/use-me.ts` — `useMe()` for the sign-in gate and for owner/admin delete detection.
- `app/(publicGroup)/blog/[slug]/page.tsx` — server component; mounts the client comment section.
- `components/shared/` — `empty-state.tsx`, `route-loading.tsx` (skeleton), `pagination.tsx`.
- `components/ui/` — `button`, `textarea`, `avatar`, `form`, `skeleton`, `dialog` (delete confirm).
- Server: `blog` module — `GET /api/blog/:slug/comments`, `POST /api/blog/:slug/comments`,
  `DELETE /api/blog/comments/:id`.

## Routes

- `GET /api/blog/:slug/comments?page&limit` — public — top-level + `replies[]` per comment.
- `POST /api/blog/:slug/comments { content, parentId? }` — auth() — create a comment/reply.
- `DELETE /api/blog/comments/:id` — auth() — soft delete (owner or ADMIN only).

## Server contract (actual)

```
GET /api/blog/:slug/comments?page=1&limit=10      public
  → 200 envelope { data: [{
        id, content, createdAt, updatedAt,
        user: { id, name, avatarUrl },
        replies: [{ id, content, createdAt, updatedAt, user: { id, name, avatarUrl } }]
      }], meta }
  Top-level newest-first; replies oldest-first (nested inside each top-level row).
  404 "Post not found." when the slug is not PUBLISHED + non-deleted.

POST /api/blog/:slug/comments { content, parentId? }   auth()
  content: trim, 1..2000 chars.
  → 201 { id, content, createdAt, updatedAt, user: { id, name, avatarUrl } }
  Errors (verbatim): 404 "Post not found." ·
    400 "Parent comment not found on this post." · 400 "Replies to replies are not allowed."

DELETE /api/blog/comments/:id                        auth()
  → 200 { data: null }   (owner or ADMIN; a foreign/already-deleted id is a uniform
  404 "Comment not found." — never a leak)
```

The comment `user` select includes `id` — the client can determine ownership directly.

## New API functions (`lib/api/blogComments.ts`)

```
export type TBlogCommentAuthor = { id: string; name: string; avatarUrl?: string | null }

export type TBlogReply = {
  id: string; content: string; createdAt: string; updatedAt: string
  user: TBlogCommentAuthor
}

export type TBlogComment = TBlogReply & { replies: TBlogReply[] }

blogCommentsApi.getComments(slug, { page, limit })   — GET (apiClientFull) → { data, meta }
blogCommentsApi.createComment(slug, { content, parentId? }) — POST → TBlogReply
blogCommentsApi.deleteComment(id)                    — DELETE → null
```

Types declared at the top of the same file, per project convention.

## New Hooks

Used only on the blog detail page (one consumer) → **inline** `useQuery`/`useMutation` in the
component, no wrapper hook (per the project rule: a `hooks/useX.ts` wrapper only when reused 3+
places).

## Components

**Create (`components/blog/`):**
- `comment-section.tsx` — `"use client"`, props `{ slug: string }`. Everything below lives in
  this one file or small siblings; it mounts at the bottom of the blog detail page.
  - `useQuery(["blog-comments", slug, page], () => blogCommentsApi.getComments(slug, { page, limit: 10 }))`
    with local page state + `PaginationPages`.
  - Sign-in gate: anonymous → `EmptyState`-style card with a "Sign in to comment" button to
    `/login?redirectTo=/blog/<slug>`.
  - Top-level `CommentForm` (auto-expanding `Textarea`, `maxLength={2000}`) — post on submit
    (mutation with loading/disabled); on success invalidate the active list key.
  - Each top-level comment: avatar + name + relative date + content; indented `replies[]`; a
    "Reply" toggle that reveals an inline reply form (sets `parentId`, disallowed for replies —
    the UI never offers reply-on-reply); a **Delete** control (trash icon) shown only when
    `comment.user.id === me.id` or `me.role === "ADMIN"`, with a `Dialog` confirm; delete
    invalidates the list.
  - Loading → `RouteLoading`-style skeletons; empty → `EmptyState` ("No comments yet — start the
    conversation."); error → message + retry.
- `comment-form.tsx` — props `{ slug, parentId?, onSubmitSuccess, placeholder?, autoFocus? }`.
  Uses `useMe`; on submit calls `createComment`, clears the field, invokes `onSubmitSuccess`.

**Modify:**
- `app/(publicGroup)/blog/[slug]/page.tsx` — after the content block, render
  `<CommentSection slug={slug} />` inside a bordered, max-w-3xl container. The page stays a
  server component; `CommentSection` is the client island (it does its own data fetching and
  requires no props beyond `slug`).

## Files to change

- `app/(publicGroup)/blog/[slug]/page.tsx`
- `.opencode/specs/00-overview.md` — Step 18 line (done with this step)
- `.opencode/specs/12-explicitly-cut.md` — remove "blog comments" from the cut list (done with this step)

## Files to create

- `lib/api/blogComments.ts`
- `components/blog/comment-section.tsx`
- `components/blog/comment-form.tsx`

## New dependencies

No new dependencies.

## Rules for implementation

### Data fetching
- All calls through `lib/api/blogComments.ts` → `apiClient`/`apiClientFull`; never raw `fetch`.
- The comment list query and the create/delete mutations are inline in the client component
  (single consumer — no wrapper hook). Every mutation `onSuccess` invalidates
  `["blog-comments", slug, ...]`.
- Mutation buttons: loading + `disabled`; skeleton for the list; `EmptyState` for empty;
  error state with retry surfacing `ApiError.message` verbatim (400 "Replies to replies are not
  allowed." surfaces when the server rejects a nested reply).

### Auth & routing
- Anonymous visitors see a login CTA, never a dead form.
- Delete is offered only to `comment.user.id === me.id` **or** `me.role === "ADMIN"`; hide it for
  everyone else (the server enforces the same rule with a 404).
- The blog detail page stays public (`/blog` is already in `PUBLIC_PREFIXES`) — no proxy change.

### UI & animation
- Clickable elements: `cursor-pointer` + `transition-colors duration-200`; buttons
  `whileTap={{ scale: 0.97 }}`; lists `motion.div` `staggerChildren: 0.08`; icons from
  `@phosphor-icons/react` (ChatCircle, PaperPlaneTilt, Reply, Trash, X).
- Replies indented with a left border (`border-l border-border pl-4 ml-?`) so the one-level
  structure is visually obvious.
- shadcn/ui from `components/ui/` only; Tailwind v4 tokens; dark via `dark:`; `cn()` from
  `@/lib/utils`.

## Definition of done

Runnable via `npm run dev` with the server running the blog-comments module and a published
seed post:

- The blog detail page shows the comment section with a working sign-in gate for anonymous
  visitors.
- A signed-in user posts a comment → it appears immediately (top of the list, newest-first) and
  the form clears.
- Replying to a top-level comment nests the reply beneath it in oldest-first order; the UI never
  offers a reply action on a reply.
- The comment author (or an admin) sees a delete control; confirming it removes the comment
  (soft-delete) without reloading the page. A non-author sees no delete control.
- Posting on a DRAFT/deleted post slug is impossible (the public list hides it and the server
  404s) — the section simply shows the empty state.
- Pagination works past 10 top-level comments; the empty state ("No comments yet") shows on a
  fresh post.
- `npm run lint` and `npm run typecheck` pass. Commit + push this step (AGENTS.md workflow).