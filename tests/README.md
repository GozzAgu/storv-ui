# Tests

## Commands

| Script               | What runs                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run test:unit`  | Vitest: `tests/server/**` + `tests/integration/**` + `tests/unit/**` (Vue SFC tests use `happy-dom`) |
| `npm test`           | Playwright E2E: only root `tests/*.spec.ts` (see `playwright.config.ts` `testIgnore`)                |
| `npm run test:rules` | Firebase emulators (Firestore + Storage) + Vitest on `tests/rules/**`                                |

`@firebase/rules-unit-testing` v5 expects emulator host/port (set automatically when using `firebase emulators:exec`). Use `test:rules` for rule tests; ensure **Java** is installed for the emulators.

## Layout

- **`tests/server/`**: pure server/unit helpers (e.g. Paystack validation, receipt delete).
- **`tests/integration/`**: client-side modules with injectable mocks (serial check, Paystack upgrade, inventory display helpers, **pagination + viewport clamp** pure functions).
- **`tests/unit/`**: Vue component tests (e.g. `Pagination.vue` mounting + a11y).
- **`tests/rules/`**: Firestore + Storage security rules (requires emulators).
- **Root `tests/*.spec.ts`**: Playwright browser tests. Vitest-only specs must live under `tests/integration`, `tests/server`, `tests/unit`, or `tests/rules`.

## Auth in Playwright

Many E2E specs **skip** when the login form is visible (no stored session). Configure `storageState` in `playwright.config.ts` or use a logged-in profile for full coverage.
