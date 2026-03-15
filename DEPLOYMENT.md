# Deployment and staff sign-in

Staff get **Firebase Auth accounts** so they can sign in. There are **no invite links and no email invites** – when you add staff, the server creates their account and returns a one-time password that is shown in the modal for you to copy and share manually.

To create staff with sign-in accounts, the app must run as a **Node server** (so the `/api/staff/invite` route is available):

1. **Build with the server**
   ```bash
   npm run build:server
   ```

2. **Run the server**
   ```bash
   node .output/server/index.mjs
   ```

3. Point your host (Railway, Render, Fly.io, VPS, etc.) at this process.

If you deploy only the output of `nuxt generate` (static site), those API routes do not exist. Add Staff will fail with a message that you need to run the app as a server. No fallback to creating staff without auth.

**Optional: static frontend + separate API**  
You can keep a static frontend and run the same app as an API on another URL (e.g. `api.storvv.com`). When building the static site, set:
```bash
NUXT_PUBLIC_API_BASE=https://api.storvv.com
```
Then staff creation will call that server. Ensure CORS allows your frontend origin. Password changes are done by staff in Profile (no server API for regenerating another user's password).
