# Stage 11 brief: one UI on every platform

Repo: /Users/user/storv-ui (Nuxt 3, SSR off, Vue 3 `<script setup>`, Pinia, Firebase, Capacitor iOS/Android shell).

The app is mid-redesign. Every screen already has a design-system (DS) "web" version. Many files ALSO still
contain a legacy iOS-only version selected by `isCapacitorIos` (from `useIsCapacitorIos()`, auto-imported).
Stage 11 makes the native app use exactly the same DS UI as the web. The layout shell, `SidePanel`, `Modal`,
`IosForm*` primitives and `IosDrawerActions` are already DS-only on every platform. `useIsCapacitorIos`,
`useNativeTableLayout`, `useIosPageNav`, `useIosDesignSystem`, `useIosTypography`, `useIosLayoutSize`,
`IosPageNavBar` and most of `components/ios/*` are being DELETED after you finish, so nothing may reference them.

## What to do in each file you own

1. Remove every use of `isCapacitorIos` / `useIsCapacitorIos()`:
   - `v-if="isCapacitorIos"` block → delete the block. Its paired `v-else` / `v-else-if` → keep, drop the `v-else` (turn `v-else-if="x"` into `v-if="x"`).
   - `v-if="!isCapacitorIos"` → remove the attribute (keep the element). A paired `v-else` iOS block → delete.
   - `isCapacitorIos ? A : B` → `B`. `isCapacitorIos && X` → remove. `!isCapacitorIos` → `true` then simplify.
   - Root class patterns like `:class="isCapacitorIos ? 'legacy…' : 'ds-root s-c s-page'"` → `class="ds-root s-c s-page"`.
2. Remove imports/uses of: `useNativeTableLayout`, `useIosPageNav`, `IosPageNavBar`, `useIosDesignSystem`,
   `useIosTypography` (`buildIosTextClass`), `useIosLayoutSize`, and any `components/ios/*` component EXCEPT
   `components/ios/forms/*` (IosForm, IosFormSection, IosFormField, IosFormInput, IosFormSelect, IosFormTextarea,
   IosFormToggle) and `components/ios/IosDrawerActions.vue`, which stay (they are DS-only now).
   - If an iOS-only component (IosHomeDashboard, IosInventoryItemDetail, IosAnalyticsActions, IosFilterPills,
     IosSearchBar, IosEmptyState, IosStatCard, IosNativeListRow, IosSegmentedControl, IosFab, IosSwipeActions, …)
     was only rendered in an iOS branch, it simply goes away with that branch. If it is rendered on ALL platforms
     (no iOS guard), replace it with the DS equivalent from `components/s/*` (SEmptyState, SSearch, STabs, SButton,
     SStat, SCard, SBadge…) using DS classes, keeping the same data/behaviour.
3. `useIosPullToRefreshRegister(handler)` → `useDashboardPageRefreshRegister(handler)` imported from
   `~/composables/useDashboardPageRefresh` (same signature; keeps the top-bar refresh + native pull-to-refresh).
4. `useIosHaptics` may stay (it is a native capability, not UI).
5. `isNativeApp` / `useCapacitorNativeApp()` / `isCapacitorNative()`: keep ONLY where it gates a genuine native
   capability (Capacitor plugins: share sheet, filesystem/download, camera, biometrics, API base URL, keyboard).
   Remove it where it only switches layout/styling (use the DS version for everyone).
6. Delete code that only served removed branches: computeds, refs, functions, watchers, imports, and scoped CSS
   rules / class names that target `ios-*`, `capacitor-ios`, `capacitor-native` chrome, `native-*` layout.
   Remove now-unused props passed to children ONLY if you also own the child.
7. Do NOT change business logic, Firestore reads/writes, store actions, API calls, permissions, routing, emitted
   events or props contracts used by files you don't own. Do NOT restyle the DS (web) branches beyond what is
   needed to make them the only branch. Do not add comments explaining the change.
8. Only edit the files in your list. If a file outside your list must change, say so in your report instead.

## Verify (required)

- `node .cursor/tools/sfc-check.mjs <each .vue file you changed>` → every file must print `OK`
  (`FAIL` = compile error, `UNRESOLVED` = component used in the template but not imported/global — import it explicitly).
- `rg -n "isCapacitorIos|useIsCapacitorIos|useNativeTableLayout|useIosPageNav|IosPageNavBar|useIosDesignSystem|useIosTypography|buildIosTextClass|useIosLayoutSize|useIosPullToRefresh" <your files>` → no matches.
- Do NOT run `nuxt build`, `npm run dev`, or the unit tests (other agents are editing in parallel).

## Report back (concise)

Per file: what was removed, and any user-visible behaviour change on native (e.g. "iOS swipe actions gone; row
menu is the only way to delete"). List anything you were unsure about or that needs a change outside your files.
