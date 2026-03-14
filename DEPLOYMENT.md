# Deployment and API routes

## Why `POST /api/staff/invite` returns 404 on the deployed app

The app’s **build** script runs `nuxt generate`, which produces a **static** site (HTML/JS/CSS only).  
Static deployment does **not** include Nitro server API routes, so endpoints like `/api/staff/invite` do not exist on the deployed host and return **404**.

## Options to fix it

### Option A: Run the Nuxt server (recommended)

Deploy the app as a **Node server** so the same process serves both the app and the API:

1. Build with the server:
   ```bash
   npm run build:server
   ```
   (This runs `nuxt build` and outputs to `.output/`.)

2. Run the server:
   ```bash
   node .output/server/index.mjs
   ```

3. Point your host at this process (e.g. Railway, Render, Fly.io, or a VPS).  
   Do **not** deploy only the output of `nuxt generate` if you need API routes.

### Option B: Static site + separate API server

If you must keep a static frontend (e.g. from `nuxt generate`):

1. Deploy the **same app** again somewhere that runs the Node server (e.g. a subdomain like `api.storvv.com`), using `nuxt build` and `node .output/server/index.mjs` as in Option A.

2. In the **static** deployment, set the API base URL so the frontend calls that server:
   ```bash
   NUXT_PUBLIC_API_BASE=https://api.storvv.com
   ```
   (Use your real API URL; no trailing slash.)

3. Ensure the API server allows CORS from your frontend origin.

The staff invite (and any other `/api/*` usage) will then go to `https://api.storvv.com/api/staff/invite` instead of the static site origin.