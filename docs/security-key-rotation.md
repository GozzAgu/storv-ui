# Key rotation and secrets hygiene

If a secret may have been exposed (chat, screenshot, committed file, shared `.env`, former teammate), **rotate it immediately**. Never commit live keys to git.

## What to rotate

| Secret | Where to rotate | Update in |
|--------|-----------------|----------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | Vercel env, local `.env` |
| `PAYSTACK_SECRET_KEY` | [Paystack Dashboard](https://dashboard.paystack.com) | Vercel env, local `.env` |
| `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Dashboard | Vercel env, local `.env`, rebuild iOS if bundled |
| `RESEND_API_KEY` | [Resend](https://resend.com/api-keys) | Vercel env, local `.env` |
| Firebase service account | Firebase Console → Project settings → Service accounts | Vercel `FIREBASE_SERVICE_ACCOUNT_JSON`, local JSON file |
| `NUXT_PUBLIC_FIREBASE_*` | Firebase Console (rare; only if project compromised) | Vercel + `.env` + app rebuild |
| Cloudinary | Cloudinary console | Vercel + `.env` |

## After rotating

1. Update **Vercel Production** (and Preview if used) environment variables.
2. Update local **`.env`** (never commit).
3. **Redeploy** Vercel (Production redeploy required for server vars).
4. For iOS/Android: run `npm run cap:build:ios` if public env vars changed.
5. Revoke the **old** key in the provider dashboard once the new key works.

## Verify

- Assistant: `https://app.storvv.com/api/assistant/status` → `{ "configured": true }`
- Sign in, billing, staff actions, and 2FA still work on web and iOS.

## Prevention

- `.env` is in `.gitignore` — keep it that way.
- Do not paste live keys in Slack, email, or support tickets.
- Use Vercel env for production; local `.env` for dev only.
