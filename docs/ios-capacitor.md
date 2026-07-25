# iOS app (Capacitor)

The iOS app loads the same Nuxt dashboard from `dist/` (via `nuxt generate`). Web changes are included after you regenerate and open Xcode.

## Ship dashboard updates to iOS

1. Ensure `.env` has Firebase public keys and, for staff remove/reactivate:

   ```bash
   NUXT_PUBLIC_API_BASE=https://app.storvv.com
   ```

   (`updateStaff` / move department use Firestore on-device; deactivate/reactivate call this API.)

2. Build and sync:

   ```bash
   npm run cap:build:ios
   ```

3. Open and run in Xcode:

   ```bash
   npm run cap:open:ios
   ```

   Product → Clean Build Folder if the simulator still shows an old UI.

`ios/App/App/public` is symlinked to `.output/public`, so `nuxt generate` updates what Capacitor serves.

## Features in the native shell

- Staff **Active / Removed** tabs, **⋮** actions menu, move/remove/reactivate modals
- **Teams** bottom tab (departments list for current store; managers and owners)
- Round profile avatars in top nav and sidebar
- Modals and side panels render in `#dashboard-native-overlay-host` (teleported to `body` on iOS so they are not clipped by `overflow-hidden` shells)
- **Storvv Assistant** (sparkle FAB above bottom nav, header shortcut, Help center “Ask assistant”) — calls hosted `/api/assistant/*` on `NUXT_PUBLIC_API_BASE`

## Storvv Assistant on iOS

The iOS app does **not** bundle Gemini. Assistant chat goes to your hosted API (same as staff deactivate/reactivate).

1. **Build-time** (`.env` before `npm run cap:build:ios`):

   ```bash
   NUXT_PUBLIC_API_BASE=https://app.storvv.com
   ```

2. **Server** (Vercel env for `app.storvv.com`):

   ```bash
   GEMINI_API_KEY=your_key_from_aistudio.google.com
   GEMINI_MODEL=gemini-3.1-flash-lite
   ```

   Redeploy Vercel after adding vars. New Google API keys often require `gemini-3.1-flash-lite` or `gemini-3.5-flash` (2.x / 2.5 models may be blocked).

3. Rebuild and run in Xcode:

   ```bash
   npm run cap:build:ios
   npm run cap:open:ios
   ```

No separate iOS-only assistant UI branch is required.
