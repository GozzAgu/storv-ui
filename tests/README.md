# Tests

## Commands

| Script | What runs |
|--------|-----------|
| `npm run test:unit` | Vitest: `tests/unit/**` + `tests/server/**` |
| `npm run test:integration` | Vitest: `tests/integration/**` |
| `npm run test:rules` | Firebase emulators + Vitest `tests/rules/**` (requires Java 21+) |
| `npm run test:e2e` | Playwright: root `tests/*.spec.ts` (see `playwright.config.ts`) |

CI runs all of the above on every PR (see `.github/workflows/ci.yml`).

## Authenticated E2E

```bash
E2E_TEST_EMAIL=you@example.com E2E_TEST_PASSWORD=secret npx playwright test tests/auth.setup.ts
npx playwright test --project=authenticated
```

Saved session: `tests/.auth/user.json` (gitignored).

Without credentials, dashboard specs still run in **skip-if-login** mode; landing smoke always runs.

## Layout

- **`tests/unit/`** — pure helpers, composables, components (happy-dom)
- **`tests/server/`** — Paystack validation, subscription helpers
- **`tests/integration/`** — modules with injectable mocks
- **`tests/rules/`** — Firestore + Storage security rules (emulators)
- **Root `tests/*.spec.ts`** — Playwright browser tests only

Vitest specs must live under `tests/{unit,server,integration,rules}/`, not the Playwright root.
