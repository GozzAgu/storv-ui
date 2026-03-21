# Tests

## Commands

| Script | What runs |
|--------|-----------|
| `npm run test:unit` | Vitest: `tests/server/**` + `tests/integration/**` (no Firebase emulator) |
| `npm run test:rules` | Firebase emulators (Firestore + Storage) + Vitest on `tests/rules/**` |

`@firebase/rules-unit-testing` v5 expects emulator host/port (set automatically when using `firebase emulators:exec`). Use `test:rules` for rule tests; ensure **Java** is installed for the emulators.

## Layout

- **`tests/server/`** — pure server/unit helpers (e.g. Paystack validation, receipt delete).
- **`tests/integration/`** — client-side modules with injectable mocks (serial check, Paystack upgrade, inventory display helpers).
- **`tests/rules/`** — Firestore + Storage security rules (requires emulators).
