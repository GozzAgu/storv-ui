# Payments V2 rollback

Status: Step 2b version (server routes and screens for maker and checker). Extend it at every
step that adds routes, UI or jobs.

## Switch it off

1. In Vercel, set `PAYMENTS_V2_ENABLED` to anything other than `1` (or delete it) for the
   affected environment, then redeploy. Env changes only apply to new deployments.
2. Also unset `NUXT_PUBLIC_PAYMENTS_V2` so the UI hides V2 controls. Either flag alone is safe:
   with only the public flag off, screens hide; with only the server flag off, `/api/payments/access`
   404s and the client treats V2 as off (same screens as before V2).

Nothing else is needed. No data is deleted or rewritten by switching off.

## What happens when it is off

| Area                                                              | Behaviour with the flag off                                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payments V2 server routes (`/api/payments/*`)                     | 404 for everyone, checked before auth (`definePaymentsRoute` → `requirePaymentsV2`)                                                                                        |
| Audit anchor and proof retention crons                            | Return `{ skipped: true }`; no reads or writes                                                                                                                             |
| Payments awaiting confirmation                                    | Stay awaiting. Nobody can confirm or reject them until V2 is back on; nothing is lost.                                                                                     |
| Till counts, payment settings, permission grants                  | Kept as they are (server-only documents); they apply again when V2 is back on                                                                                              |
| Proof files                                                       | Kept, unreadable from clients. Retention is paused; if V2 stays off for months, run the retention job by hand on re-enable                                                 |
| In-store sales, receipts, refunds on receipts with no V2 payments | Exactly as before V2                                                                                                                                                       |
| Receipts that already have V2 payments (`paymentSummary` present) | Stay readable. Money fields stay locked by rules, so a half-paid sale cannot be silently re-priced. Notes stay editable.                                                   |
| Payment, event and audit documents                                | Kept, read-only to the owner (and `payments.view` holders)                                                                                                                 |
| Paystack subaccount money already settled                         | Unaffected: it sits in the merchant's bank account                                                                                                                         |
| Legacy payment links                                              | Still 410 unless `LEGACY_PAYMENT_LINKS_ENABLED=1` (separate decision)                                                                                                      |
| Subscription billing                                              | Unaffected (separate code path; pinned tests run every step)                                                                                                               |
| New sales while off                                               | Recorded the pre-V2 way (amounts on the receipt); no `paymentsV2` marker, so they never show V2 controls later                                                             |
| V2 sales (`paymentsV2` marker or `paymentSummary`) while off      | Sale drawer shows the plain total. Refund and cancel on a sale with `paymentSummary` are refused up front (before any stock moves); wait for V2 or edit with the Admin SDK |

## If a V2 receipt must be edited while off

Do not loosen rules. Ask engineering to apply a one-off server-side correction that writes an
audit event, or turn V2 back on and use the server routes.

## Live mode

Even with the flag on, live Paystack keys are refused unless `PAYMENTS_V2_ALLOW_LIVE=1` and
`docs/payments/paystack-decisions.md` contains `Status: approved`. To force test-only, unset
`PAYMENTS_V2_ALLOW_LIVE`.

## After rollback

- Run `node scripts/payments/verify-audit-chain.mjs` (read-only) to confirm every chain is intact.
- Keep the anchor collection and logs; they are the external evidence for the chain.
