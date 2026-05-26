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
- Modals and side panels render in `#dashboard-native-overlay-host` (between top bar and bottom tab bar)

No separate iOS-only staff UI branch is required.
