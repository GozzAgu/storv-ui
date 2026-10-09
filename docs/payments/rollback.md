# Payments V2 rollback

Status: Step 5 version (adds payer receipts, "Payment received" notifications and ops alerts).
Extend it at every step that adds routes, UI or jobs.

## Switch it off

1. In Vercel, set `PAYMENTS_V2_ENABLED` to anything other than `1` (or delete it) for the
   affected environment, then redeploy. Env changes only apply to new deployments.
2. Also unset `NUXT_PUBLIC_PAYMENTS_V2` so the UI hides V2 controls. Either flag alone is safe:
   with only the public flag off, screens hide; with only the server flag off, `/api/payments/access`
   404s and the client treats V2 as off (same screens as before V2).

Nothing else is needed. No data is deleted or rewritten by switching off.

## What happens when it is off

| Area                                                              | Behaviour with the flag off                                                                                                                                                                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payments V2 server routes (`/api/payments/*`)                     | 404 for everyone, checked before auth (`definePaymentsRoute` → `requirePaymentsV2`)                                                                                                                                                       |
| Audit anchor and proof retention crons                            | Return `{ skipped: true }`; no reads or writes                                                                                                                                                                                            |
| Public pay routes (`/api/paylink/*`) and V2 `/pay/{token}` links  | 404 ("Link not found" on the page). Links already sent stop working until V2 is back on; any payer who already paid at Paystack is handled by the Step 4 webhook                                                                          |
| Link expiry cron                                                  | Returns `{ skipped: true }`. Links past expiry stay `active` in Firestore but checkout refuses them; the cron expires them and releases held stock once V2 is back on                                                                     |
| Payout account routes (`/api/payment-links/connect-bank` etc.)    | Not behind the V2 flag. With a live key they return 503 until `PAYMENTS_V2_ALLOW_LIVE=1` and the decisions doc is approved; test keys work                                                                                                |
| Paystack webhook for link payments (`stvp_` references)           | Returns 500 so Paystack keeps retrying (72 hours live, 10 hours test); the event is kept as `failed_retryable`. Turn V2 back on within that window, or replay from the Paystack dashboard; the payer's money is already with the merchant |
| Payments awaiting confirmation                                    | Stay awaiting. Nobody can confirm or reject them until V2 is back on; nothing is lost.                                                                                                                                                    |
| Till counts, payment settings, permission grants                  | Kept as they are (server-only documents); they apply again when V2 is back on                                                                                                                                                             |
| Proof files                                                       | Kept, unreadable from clients. Retention is paused; if V2 stays off for months, run the retention job by hand on re-enable                                                                                                                |
| In-store sales, receipts, refunds on receipts with no V2 payments | Exactly as before V2                                                                                                                                                                                                                      |
| Receipts that already have V2 payments (`paymentSummary` present) | Stay readable. Money fields stay locked by rules, so a half-paid sale cannot be silently re-priced. Notes stay editable.                                                                                                                  |
| Payment, event and audit documents                                | Kept, read-only to the owner (and `payments.view` holders)                                                                                                                                                                                |
| Paystack subaccount money already settled                         | Unaffected: it sits in the merchant's bank account                                                                                                                                                                                        |
| Legacy payment links                                              | Still 410 unless `LEGACY_PAYMENT_LINKS_ENABLED=1` (separate decision). Their webhook settlement also only runs with that flag; otherwise it logs `legacy-link-charge-ignored`                                                             |
| Receipt email and WhatsApp sending                                | Not behind the flag: always built from the stored receipt with checked attachments (Step 5 security fix). V2 sales keep showing their server payment lines                                                                                |
| Payer receipt emails and ops alert emails                         | Only sent by the link webhook and audit cron, which do nothing while off                                                                                                                                                                  |
| Subscription billing                                              | Unaffected (separate code path; pinned tests run every step)                                                                                                                                                                              |
| New sales while off                                               | Recorded the pre-V2 way (amounts on the receipt); no `paymentsV2` marker, so they never show V2 controls later                                                                                                                            |
| V2 sales (`paymentsV2` marker or `paymentSummary`) while off      | Sale drawer shows the plain total. Refund and cancel on a sale with `paymentSummary` are refused up front (before any stock moves); wait for V2 or edit with the Admin SDK                                                                |

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
- After re-enabling, list `paystackEvents` with state `failed_retryable` and replay any whose
  Paystack retries ran out (resend from the Paystack dashboard); replays are safe because only
  `processed` events are skipped and apply is idempotent.
