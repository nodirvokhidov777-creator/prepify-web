# PREPIFY Premium entitlement system

Server-side source of truth for who has PRO, built on Vercel serverless
functions + Upstash Redis. This document is the setup guide; the code itself
(`server/entitlement.js`, `server/handlers.js`) is the specification of the
actual rules — read those before assuming anything here is still accurate if
the two ever disagree.

## What changed from the old design

Previously `isPro` lived in `localStorage` and any user could set it to `true`
from the browser console. Now:

- The browser never stores `isPro`. It stores only a **customer ID**
  (`prepify.deviceRefId`) — an anonymous identifier, not a credential.
- `GET /api/entitlement?id=…` is the only way the app learns whether a
  customer has PRO, and Redis (via Upstash) is the only place that answer is
  stored.
- Granting or revoking access requires `POST /api/admin/grant` or
  `/api/admin/revoke` with `Authorization: Bearer <ADMIN_SECRET>` — a secret
  that lives only in Vercel's environment variables, never in the repo or the
  built JavaScript.

## Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and
optionally in a local `.env`, copied from `.env.example`, for `vercel dev`):

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_SECRET` | yes | Random string, **32+ characters**. Generate with `openssl rand -base64 48`. The admin endpoints refuse to run at all if this is missing or too short. |
| `UPSTASH_REDIS_REST_URL` | yes* | From your Upstash Redis database's REST API tab. |
| `UPSTASH_REDIS_REST_TOKEN` | yes* | Use the **read-write** token. |

\* If you use Vercel's own Upstash integration (Storage tab → Upstash), it
injects `KV_REST_API_URL` / `KV_REST_API_TOKEN` automatically — the code
accepts either pair of names, so you don't need to rename anything.

None of these should ever be prefixed `VITE_` — that prefix tells Vite to
inline a variable into the public bundle, which is the opposite of what a
secret needs.

## One-time Upstash setup

1. Create a free account at [upstash.com](https://upstash.com) if you don't
   have one.
2. Create a new Redis database (any region close to your Vercel deployment
   region is fine — this app does very little traffic).
3. Open the database → REST API tab → copy the URL and the **read-write**
   token into the two Vercel environment variables above.
4. Nothing else needs configuring. There is no schema to create; the app
   only ever reads/writes simple string keys.

## Deploying

1. Set the three environment variables above in Vercel.
2. Deploy as usual (`vercel.json`'s existing SPA rewrite is unchanged and
   still required for client-side routing — this phase only added the three
   `/api/*` functions alongside it).
3. Confirm the API is live:
   ```
   curl "https://<your-domain>/api/entitlement?id=PRP-00000000-000000"
   # -> {"isPro":false,"plan":null,"status":"none","expiresAt":null}
   ```
   A `503 {"error":"admin_not_configured"}` from the admin endpoints, or a
   `503 {"error":"service_unavailable"}` from `/api/entitlement`, means an
   environment variable is missing or Upstash isn't reachable yet — not a
   bug in the code.

## Granting / revoking access (the admin CLI)

`scripts/pro-admin.mjs` talks to your **deployed** API — it has no direct
database access of its own, so it only works once the above is deployed.

```bash
# Grant lifetime PRO
ADMIN_SECRET=... PREPIFY_URL=https://your-domain.vercel.app \
  node scripts/pro-admin.mjs grant --customer PRP-XXXXXXXX-XXXXXX --plan lifetime

# Grant 30 days of monthly PRO (default length)
ADMIN_SECRET=... PREPIFY_URL=https://your-domain.vercel.app \
  node scripts/pro-admin.mjs grant --customer PRP-XXXXXXXX-XXXXXX --plan monthly

# Extend an active monthly plan by another 30 days
ADMIN_SECRET=... PREPIFY_URL=https://your-domain.vercel.app \
  node scripts/pro-admin.mjs grant --customer PRP-XXXXXXXX-XXXXXX --plan monthly --extend

# Revoke access (the record is kept, marked revoked, for audit purposes)
ADMIN_SECRET=... PREPIFY_URL=https://your-domain.vercel.app \
  node scripts/pro-admin.mjs revoke --customer PRP-XXXXXXXX-XXXXXX

# Check status (no secret required — this is the same public lookup the app uses)
PREPIFY_URL=https://your-domain.vercel.app \
  node scripts/pro-admin.mjs status --customer PRP-XXXXXXXX-XXXXXX
```

Notes:
- `ADMIN_SECRET` is read only from the environment, never a `--flag` — a flag
  would land in your shell history.
- `PREPIFY_URL` must be `https://` (plain `http://` is refused, except
  `localhost`, so the secret is never sent in clear text).
- Granting `lifetime` on a customer who already has active `lifetime` is a
  safe no-op. Granting `monthly` on an active `lifetime` is refused
  (`already_lifetime`) rather than silently downgrading them. Granting
  `monthly` on an already-active `monthly` is refused unless you pass
  `--extend`.

## The customer PRP-MULCK4V0-UTAXS6

**Not granted yet, and cannot be from this environment.** This sandbox has no
deployed Vercel project and no real Upstash database — `pro-admin.mjs` needs
a live `PREPIFY_URL` to talk to, and none exists here. To actually grant this
customer lifetime access:

1. Deploy this project to Vercel with the three environment variables set.
2. Run:
   ```bash
   ADMIN_SECRET=<your real secret> PREPIFY_URL=https://<your real domain> \
     node scripts/pro-admin.mjs grant --customer PRP-MULCK4V0-UTAXS6 --plan lifetime
   ```
3. Verify with `status` (shown above), and confirm the app itself reflects
   PRO for that customer (e.g. by entering that ID in the app's "Restore
   access" screen on a device, or by checking `GET /api/entitlement?id=...`
   directly).

Only after that real `HTTP 200` and a verified `isPro: true` should this be
considered done. It is not done as of this document.

## What still isn't protected: bundled Premium content

This backend change secures the **entitlement check** — whether a request
believes a customer has PRO. It does **not** hide the Premium content itself.

As of this writing, `npm run build` still produces a JavaScript bundle that
contains every Premium session's real ID and real text in plain, readable
form (confirmed directly: `grep` for a known Premium listening session ID or
writing prompt against `dist/assets/*.js` finds it). Anyone who opens the
site's dev tools, or simply downloads the bundle, can read that content
without ever calling the entitlement API at all.

Fixing that is a separate, larger change: Premium content would need to be
served *from* the API (so it never ships to a browser that hasn't proven
entitlement) rather than bundled into the app at build time. That work has
not been done. Treat the current system as "students without PRO are guided
not to use this content, and paying customers are the only ones the UI
unlocks it for" — not as "this content is confidential."

## Failure behaviour (by design)

- If `/api/entitlement` is unreachable, times out, or returns anything the
  client can't parse, the app falls back to the free tier — it never treats
  an outage as proof of PRO.
- A verified `monthly` result is still re-checked against the local clock on
  every render, so a result cached in memory during an outage cannot outlive
  its own real expiry.
- The admin endpoints fail closed too: with a missing/weak `ADMIN_SECRET` or
  no reachable Redis, they return `503` rather than allowing an unauthenticated
  request through.
