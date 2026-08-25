# Mobile app (Capacitor — iOS & Android)

The native apps load the same Nuxt dashboard from `dist/` (via `nuxt generate`). Web changes are included after you regenerate and open Xcode or Android Studio.

## Ship dashboard updates to mobile

1. Ensure `.env` has Firebase public keys. For server-backed features (staff email, deactivate/reactivate, assistant), set:

   ```bash
   NUXT_PUBLIC_API_BASE=https://app.storvv.com
   NUXT_PUBLIC_APP_ORIGIN=https://app.storvv.com
   ```

   If `NUXT_PUBLIC_API_BASE` is omitted, the app falls back to `NUXT_PUBLIC_APP_ORIGIN` (default `https://app.storvv.com`) at runtime — explicit `NUXT_PUBLIC_API_BASE` is still recommended for production builds.

   **Note:** On web in the browser, API calls stay same-origin (`localhost` or `app.storvv.com`). Only the Capacitor shell uses the hosted API base above.

2. Build and sync:

   ```bash
   npm run cap:build          # iOS + Android
   npm run cap:build:ios      # iOS only
   npm run cap:build:android  # Android only
   ```

3. Open and run:

   ```bash
   npm run cap:open:ios       # Xcode
   npm run cap:open:android   # Android Studio
   ```

   Product → Clean Build Folder (Xcode) if the simulator still shows an old UI.

`ios/App/App/public` and `android/app/src/main/assets/public` are symlinked to `.output/public`, so `nuxt generate` updates what Capacitor serves.

## Staff invite email on mobile

Creating staff and **Email sign-in details** uses the same flow as web:

1. App calls `POST /api/staff/send-invite-email` on your **hosted** API (`app.storvv.com`).
2. Server sends via Resend — keys live on **Vercel**, not in the mobile bundle.

**Vercel env (required for staff email on device):**

```bash
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=support@storvv.com   # after storvv.com is verified in Resend
FIREBASE_SERVICE_ACCOUNT_JSON=...      # staff invite marks email verified
NUXT_PUBLIC_APP_ORIGIN=https://app.storvv.com
```

Verify `storvv.com` at [resend.com/domains](https://resend.com/domains) before using `support@storvv.com`. Until then, Resend rejects custom `@storvv.com` senders.

After changing `.env` client vars or pulling code with staff/email fixes, rebuild:

```bash
npm run cap:build
```

## Features in the native shell

- Staff **Active / Removed** tabs, **⋮** actions menu, move/remove/reactivate modals
- **Email sign-in details** when adding staff (Resend via hosted API)
- **Teams** bottom tab (departments list for current store; super admin only)
- **Customer buybacks** and **Stock loans** in the **More** menu (same role rules as web: all staff can record buybacks; stock loans require manager or super admin on Enterprise)
- Round profile avatars in top nav and sidebar
- Modals and side panels render as **right-edge drawers** in `#dashboard-native-overlay-host`
- **Storvv Assistant** — calls hosted `/api/assistant/*` via `NUXT_PUBLIC_API_BASE` or `NUXT_PUBLIC_APP_ORIGIN` fallback

## Storvv Assistant on mobile

The app does **not** bundle Gemini. Assistant chat goes to your hosted API (same as staff email and deactivate/reactivate).

1. **Build-time** (`.env` before `npm run cap:build`):

   ```bash
   NUXT_PUBLIC_API_BASE=https://app.storvv.com
   ```

2. **Server** (Vercel env for `app.storvv.com`):

   ```bash
   GEMINI_API_KEY=your_key_from_aistudio.google.com
   GEMINI_MODEL=gemini-3.1-flash-lite
   ```

   Redeploy Vercel after adding vars.

3. Rebuild and run on device.

   The hosted API must allow Capacitor WebView origins (CORS). That ships with the app server code — **redeploy Vercel** after pulling updates if assistant or staff email fails on device but works in Safari on `app.storvv.com`.

4. **Keyboard:** The app uses `@capacitor/keyboard` with `resize: none`. Rebuild after keyboard/drawer updates.

No separate mobile-only assistant or staff UI branch is required.
