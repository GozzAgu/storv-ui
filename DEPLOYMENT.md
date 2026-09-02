# Deployment

## Web (Vercel)

1. Connect the repo to Vercel.
2. Set environment variables from [`.env.example`](.env.example) (Firebase public keys, Paystack, Resend, optional Sentry DSN).
3. For server routes (`/api/*`), ensure **Firebase Admin** credentials are set:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (recommended on Vercel), or
   - `FIREBASE_SERVICE_ACCOUNT_PATH` locally.
4. Deploy. Nuxt uses the Vercel serverless preset when `VERCEL=1`.

Marketing (`www`) vs app subdomain routing is handled by [`middleware/00-subdomain.global.ts`](middleware/00-subdomain.global.ts).

## Firebase

```bash
firebase deploy --only firestore:rules,storage
```

Rules tests before deploy:

```bash
npm run test:rules
```

## Capacitor (iOS / Android)

```bash
# Set hosted API for server features (assistant, email, 2FA, Paystack)
export NUXT_PUBLIC_API_BASE=https://app.storvv.com

npm run cap:build:ios    # or cap:build:android
```

Open the native project:

```bash
npm run cap:open:ios
```

See [docs/ios-capacitor.md](docs/ios-capacitor.md) for Xcode signing and API base details.

## Staff sign-in model

Staff accounts are created by the store owner (super admin). The owner shares initial credentials; staff should change password on first login. Invite email API: `/api/staff/send-invite-email`.

## Quality gate before release

```bash
npm run format:check
npm run test:unit
npm run test:integration
npm run test:rules
npm run test:e2e -- --project=chromium tests/landing-page.spec.ts
```

CI runs the same checks in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
