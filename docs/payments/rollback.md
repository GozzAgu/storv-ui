# Payments V2 rollback

Status: Step 1 version. Extend it at every step that adds routes, UI or jobs.

## Switch it off

1. In Vercel, set `PAYMENTS_V2_ENABLED` to anything other than `1` (or delete it) for the
   affected environment, then redeploy. Env changes only apply to new deployments.
2. From Step 2: also unset `NUXT_PUBLIC_PAYMENTS_V2` so the UI hides V2 controls.

Nothing else is needed. No data is deleted or rewritten by switching off.

## What happens when it is off

| Area                                                              | Behaviour with the flag off                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Payments V2 server routes                                         | 404, as if they did not exist (`requirePaymentsV2`)                                                                      |
| Audit anchor cron                                                 | Returns `{ skipped: true }`; no reads or writes                                                                          |
| In-store sales, receipts, refunds on receipts with no V2 payments | Exactly as before V2                                                                                                     |
| Receipts that already have V2 payments (`paymentSummary` present) | Stay readable. Money fields stay locked by rules, so a half-paid sale cannot be silently re-priced. Notes stay editable. |
| Payment, event and audit documents                                | Kept, read-only to the owner (and `payments.view` holders)                                                               |
| Paystack subaccount money already settled                         | Unaffected: it sits in the merchant's bank account                                                                       |
| Legacy payment links                                              | Still 410 unless `LEGACY_PAYMENT_LINKS_ENABLED=1` (separate decision)                                                    |
| Subscription billing                                              | Unaffected (separate code path; pinned tests run every step)                                                             |

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
