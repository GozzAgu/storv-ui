# Storvv UI

Multi-branch retail operations platform (Nuxt 4 SPA + Capacitor + Firebase + Paystack).

## Quick start

```bash
npm ci
cp .env.example .env   # fill Firebase, Paystack, etc.
npm run dev
```

App: `http://localhost:3000` · Dashboard: `/dashboard`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development server |
| `npm run build` | Production build (Vercel/server) |
| `npm run generate` | Static export (Capacitor shell) |
| `npm run test:unit` | Vitest unit + server helper tests |
| `npm run test:integration` | Vitest integration tests |
| `npm run test:rules` | Firestore rules (requires Java 21+) |
| `npm run test:e2e` | Playwright E2E |
| `npm run format:check` | Prettier check |
| `npm run cap:build:ios` | Static build + Capacitor iOS sync |

## Testing

```bash
npm run test:unit
npm run test:integration
npm run test:rules          # needs: brew install openjdk@21
npm run test:e2e            # starts dev server on :3001 automatically
```

Optional authenticated E2E (dashboard flows):

```bash
E2E_TEST_EMAIL=you@example.com E2E_TEST_PASSWORD=secret npx playwright test tests/auth.setup.ts
npx playwright test --project=authenticated
```

Auth state is saved to `tests/.auth/user.json` (gitignored).

## Observability

Set optional client error reporting:

```env
NUXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

Product analytics uses Firebase Analytics on web (`plugins/03.product-analytics.client.ts`). Track events via `useProductAnalytics()`.

## Documentation

- [Product state](docs/STORVV_PRODUCT_STATE.md)
- [Subscription features](docs/SUBSCRIPTION_FEATURES.md)
- [Deployment](DEPLOYMENT.md)
- [iOS Capacitor](docs/ios-capacitor.md)
- [Tests](tests/README.md)

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR:

- Prettier check
- Vitest unit + integration
- Playwright landing smoke
- Firestore rules tests (Java emulator)
