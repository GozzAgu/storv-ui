# Payments V2 threat model

Status: draft for review, written before Step 1, updated at the end of Step 1. Update it at the end of every step.
Scope: secure payment links (A) and payment confirmation with maker and checker (B).
Method: STRIDE per component, then a map from each asset to its threats, controls and tests.

Wording rule: the audit log is **tamper evident**, never "tamper proof". Anyone with Admin SDK
access can still write to Firestore; the hash chain makes that detectable, not impossible.

## 1. System overview

```
Customer browser ──► /pay/{token} page ──► /api/pay/{token}[/initialize|/status] ──┐
                                                                                  │
Paystack hosted checkout ◄── authorization_url ◄──────────────────────────────────┤
        │                                                                         │
        └── charge.success webhook ──► /api/paystack/webhook ──► verify call ──► Paystack API
                                               │
Staff browser (app.storvv.com) ──► /api/payments/*, /api/payment-links/v2/* ──────┤
                                                                                  ▼
Vercel Cron ──► /api/cron/payments/* (CRON_SECRET)                  Firestore (Admin SDK only for
                                                                    payment state) + Storage
```

Trust boundaries:

| ID | Boundary | Crossing |
|---|---|---|
| TB1 | Internet ↔ public pay routes | Anonymous customer, token in path |
| TB2 | Internet ↔ webhook route | Paystack (or anyone pretending to be Paystack) |
| TB3 | Server ↔ Paystack API | Secret key, outbound HTTPS |
| TB4 | Staff browser ↔ authenticated routes | Firebase ID token, store membership |
| TB5 | Browser ↔ Firestore/Storage directly | Security rules are the only control |
| TB6 | Vercel Cron ↔ cron routes | `CRON_SECRET` bearer |
| TB7 | Server ↔ logs, Sentry, analytics | Data leaving our control |

Actors: customer (anonymous), cashier (store member, records payments), confirmer (owner or a
holder of `payments.confirm`), owner, Storvv admin, Paystack, external attacker, malicious insider
(staff), compromised staff account.

## 2. Assets

| ID | Asset | Why it matters |
|---|---|---|
| A1 | Money in flight (customer → merchant subaccount) | Must settle to the merchant only, never Storvv |
| A2 | Payment records and their status | Decide whether a sale counts as paid |
| A3 | Receipt `paymentSummary` and the fields that change what is owed | Total, items, discounts, tax, delivery, currency, customer |
| A4 | Payment link tokens | Bearer access to a pay page for a fixed amount |
| A5 | Paystack secret key, `CRON_SECRET`, Firebase Admin credential | Full control of payments or data |
| A6 | Merchant payout details (subaccount code, bank last 4, account name) | Redirecting payouts steals money |
| A7 | Audit log (`paymentEvents`, chain head, daily anchors) | Evidence of who did what |
| A8 | Proof files (transfer screenshots) | Contain names and account numbers |
| A9 | Stock holds and stock levels | Overselling, or items locked forever |
| A10 | Permissions (`payments.confirm`, `payments.view`, `payments.refund`) | Gate maker and checker |
| A11 | Customer personal data (name, phone, email) | Privacy; must not reach URLs or logs |
| A12 | Availability of pay and webhook routes | Lost sales; Paystack retries give up after a while |

## 3. STRIDE by component

Each row: threat → control → test ID (section 5). "Step" is where the control lands.

### 3.1 Public pay routes and `/pay/{token}` page (TB1)

| STRIDE | Threat | Control | Step | Tests |
|---|---|---|---|---|
| S | Guessing or brute-forcing tokens | 256-bit tokens from `crypto.randomBytes`; only SHA-256 hash stored; per-IP and per-token-hash rate limits via KV, fail closed in production (Step 0) | 3 | U-TOK-1, S-RL-1, S-RL-2 |
| T | Client changes the amount or currency at initialize | Amount and currency read from the link on the server; request body ignored for money | 3 | S-PAY-3 |
| T | Paying an expired, revoked or already-paid link | Status and `expiresAt` checked inside the initialize transaction; all token index docs die on paid, expired or revoked | 3 | S-PAY-4, S-PAY-5 |
| R | Customer denies paying | Paystack transaction ID, reference and verify response stored on the attempt; `paid` event in the chain | 4 | S-WH-1 |
| I | Token leaks through Referer, browser cache, framing, analytics, Vercel logs, Sentry | `callback_url = /pay/return?ref={stvp reference}` (no token); `/pay/**` headers: `Referrer-Policy: no-referrer`, strict CSP, `X-Frame-Options: DENY`, `Cache-Control: no-store`; `/pay/{token}` paths scrubbed or hashed before analytics, Sentry and server logs | 3 | S-HDR-1, L-LOG-1, L-LOG-2 |
| I | Public endpoint reveals customer data | Response is business name, invoice number, amount, currency, status only | 3 | S-PAY-1 |
| D | Flooding initialize to create attempts | Rate limits per IP and per token hash; cap on open attempts per link | 3 | S-RL-1, S-PAY-6 |
| E | Using a token to reach other links or stores | Token resolves to exactly one link; no IDs accepted from the client | 3 | S-PAY-2 |

### 3.2 Webhook (TB2, TB3)

| STRIDE | Threat | Control | Step | Tests |
|---|---|---|---|---|
| S | Forged webhook | HMAC SHA-512 of the raw body with the secret key, timing-safe compare; missing key → 500. Paystack source IPs from config as a second layer only; client IP read only from `x-vercel-forwarded-for` | 4 | S-WH-2, S-WH-3 |
| S | Genuine signature, but a payment that never went to this merchant | Server-side verify call; require reference, `status === 'success'`, amount in kobo, `currency === 'NGN'` and the subaccount all to match what we stored. The verify field carrying subaccount and split amount is confirmed from Paystack's current docs before Step 4 is written; missing or ambiguous → fail closed | 4 | S-WH-4..7 |
| T | Replay or out-of-order delivery | `paystackEvents` keyed on event type + reference with state `received`, `processed`, `failed_retryable`, `failed_permanent`; only `processed` is skipped; apply is idempotent in one transaction | 4 | S-WH-8, C-WH-1 |
| R | "We never got it" | Every delivery recorded with outcome; webhook 5xx count over threshold alerts Storvv admins | 4, 6 | S-WH-9, S-ALERT-5 |
| I | Webhook logs leak tokens or customer data | Structured logs with allowlisted fields only | 4 | L-LOG-1 |
| D | Flood of fake webhooks | HMAC check before any Firestore read or write; webhook-specific rate limit | 4 | S-WH-2 |
| E | Webhook path triggers subscription code with merchant data, or the reverse | Branch on `stvp_` reference prefix before any subscription logic; subscription tests pinned before the file is touched and run every step | 4 | S-SUB-1..n |

### 3.3 Authenticated payment routes (TB4)

| STRIDE | Threat | Control | Step | Tests |
|---|---|---|---|---|
| S | Using another user's session | Firebase ID token verified server-side; two-factor enforced where the account has it (claim OR server doc, Step 0) | 1 | S-AUTH-1 |
| T | Cashier confirms their own payment | Server refuses when `confirmedBy === recordedBy` (owner-recorded payments auto-confirm, labelled "Recorded by owner", shown separately, audited) | 2 | S-MC-1, S-MC-2 |
| T | Confirm and reject race | Status check and transition inside one transaction; the loser gets 409 | 2 | C-MC-1 |
| T | Two balance payments at once overwrite each other | Payment records are separate docs; `paymentSummary` recomputed from all records inside the transaction | 1, 2 | C-SUM-1 |
| T | Over-collection through several links | Create-link transaction enforces: active link amounts + confirmed + awaiting ≤ receipt total | 3 | S-LINK-3, C-LINK-1 |
| T | Changing what is owed after a payment exists | Rules lock total, items, discounts, tax, delivery, currency and customer once any payment exists | 1 | R-RCPT-3 |
| R | Confirmer denies confirming | `confirmed` and `rejected` events in the chain with actor uid; rejection needs a reason | 1, 2 | S-AUD-1 |
| I | Reading payments of another store (IDOR) | Store membership checked on the server for every route; cross-store IDs return 404 with no writes | 1–5 | S-IDOR-1..n |
| D | Mass revoke or mass record by a compromised account | Per-uid rate limits; audit trail; owner alerts | 2, 3 | S-RL-3 |
| E | Granting yourself `payments.confirm` | Only the owner can change permissions; grant and removal are audit-logged | 2 | R-PERM-1, S-AUD-2 |

### 3.4 Firestore and Storage rules (TB5)

| STRIDE | Threat | Control | Step | Tests |
|---|---|---|---|---|
| T | Client writes payment status, amounts or summary | `payments`, `paymentLinksV2`, token index, `paystackEvents`, `paymentEvents`, chain head, anchors: no client writes. Receipts: no client writes to `paymentSummary`; with the flag on, the old balance-payment carve-out is removed | 1 | R-PAY-1..5, R-RCPT-1..2 |
| T | Adding or removing a field the allowlist doesn't list | All allowlists use `diff().affectedKeys()` (Step 0) | 0 | R-S0-* |
| E | Staff edits their own staff record to change workspace or permissions | Staff self-update limited to photo and clearing `mustChangePassword` (Step 0) | 0 | R-S0-1..4 |
| E | Self-granting a paid plan | User create limited to owner on the free plan; updates check affected keys (Step 0) | 0 | R-S0-6..9 |
| I | Reading other stores' payments or proof files | Read only for owner and `payments.view`; proof reads only through short-lived signed URLs issued by the server | 1, 2 | R-READ-1..4 |
| T | Uploading oversized or executable files | Storage rules: size and type limits on every path (Step 0); proofs JPEG, PNG, WebP or PDF up to 5 MB, recorder only, no overwrite | 0, 2 | R-ST-1..4 |

### 3.5 Merchant payout setup

| STRIDE | Threat | Control | Step | Tests |
|---|---|---|---|---|
| S/T | Insider changes the payout bank to their own account | Owner only, two-factor required, account name resolved by Paystack server-side, existing subaccount updated (not recreated), change audit-logged and alerted to the owner by email | 3 | S-PAYOUT-1..3 |
| I | Full account numbers stored | Last 4 only | 3 | S-PAYOUT-4 |

### 3.6 Cron jobs (TB6)

| STRIDE | Threat | Control | Step | Tests |
|---|---|---|---|---|
| S | Anyone calls the cron route | `CRON_SECRET` compared timing-safe; 401 with no detail | 3 | S-CRON-1 |
| T | Expiry job releases a hold that was just paid | Expiry runs in a transaction that rechecks link status; a late payment after release is still confirmed and flagged `oversold` if the item has sold, with an owner alert | 3, 4 | S-CRON-2, C-LATE-1 |
| D | Job fails silently, holds never release | Job writes a heartbeat; missing heartbeat alerts | 3, 6 | S-ALERT-6 |

### 3.7 Audit log (A7)

| STRIDE | Threat | Control | Step | Tests |
|---|---|---|---|---|
| T | Editing or deleting past events | No client writes; server only creates; each event stores `prevHash` and `hash`; chain head doc per store updated in the same transaction as each event | 1 | U-AUD-1, S-AUD-3 |
| T | Rewriting the whole chain with Admin access | Daily anchors to a separate append-only collection and to server logs; verify script reports the first broken link; verification failures alert Storvv admins | 1, 6 | S-AUD-4, S-AUD-5 |
| I | Events contain personal data | Events store IDs, amounts and actors; no names, phones, account numbers or tokens | 1 | L-LOG-3 |

### 3.8 Secrets and configuration (A5)

| STRIDE | Threat | Control | Step | Tests |
|---|---|---|---|---|
| I | Secret in the client bundle | Server-only runtime config; bundle scan for `sk_test_`, `sk_live_`, private keys and `CRON_SECRET` in every step (Step 0 baseline: clean) | 0+ | S-SEC-1 |
| E | Live key used before Paystack decisions are made | `PAYMENTS_V2_ALLOW_LIVE` only takes effect if `docs/payments/paystack-decisions.md` exists and is marked approved; otherwise a `sk_live_` key disables Payments V2 | 1 | S-LIVE-1 |
| E | Dev plan switcher in production | Refuses whenever a live key is set (Step 0) | 0 | S-S0-DEV |
| R | Feature flag flip loses data | `PAYMENTS_V2_ENABLED` off restores today's behaviour without deleting records (rollback doc) | 1 | S-FLAG-1 |

## 4. Asset → threat → control → test map

| Asset | Main threats | Key controls | Tests |
|---|---|---|---|
| A1 Money | Forged webhook, wrong subaccount, amount or currency tampering, late or duplicate payment | HMAC + verify + full match, fail closed, flags + owner alerts, overpayment cap | S-WH-2..8, S-LINK-3, C-WH-1, E2E-1..3 |
| A2 Payment records | Client writes, self-confirm, races | Rules deny, maker and checker, transactions | R-PAY-*, S-MC-*, C-MC-1 |
| A3 Receipt money fields | Edits after payment, concurrent payments | Field lock, summary recompute in transaction, property tests | R-RCPT-3, C-SUM-1, P-SUM-* |
| A4 Tokens | Guessing, leaks, reuse | 256-bit, hash only, no-referrer, scrubbed logs, multiple revocable tokens per link | U-TOK-*, S-HDR-1, L-LOG-*, S-PAY-4..5 |
| A5 Secrets | Bundle or log leak, live misuse | Server-only config, bundle scan, live gate | S-SEC-1, S-LIVE-1 |
| A6 Payout details | Insider redirect | Owner + two-factor, Paystack name check, audit + alert | S-PAYOUT-* |
| A7 Audit log | Edit, delete, rewrite | Hash chain, chain head, daily anchors, verify script | U-AUD-1, S-AUD-* |
| A8 Proof files | Wrong reader, oversize, retention | Signed short-lived URLs, rules, 12-month deletion cron, privacy notes | R-ST-*, S-PROOF-* |
| A9 Stock | Holds stuck, oversell | Hold with expiry, release in transaction, `oversold` flag + alert | S-CRON-2, C-LATE-1 |
| A10 Permissions | Self-grant | Owner only, audited | R-PERM-1, S-AUD-2 |
| A11 Customer data | URLs, logs, public endpoint | Not in URLs or references; log allowlist; minimal public DTO | S-PAY-1, L-LOG-* |
| A12 Availability | Floods, KV missing, Paystack outage | KV rate limits fail closed; verify outage → 500 so Paystack retries; 5xx alert | S-RL-*, S-WH-9 |

## 5. Test catalogue

| Prefix | Kind | Where |
|---|---|---|
| U- | Unit (pure functions: state machine, kobo helper, token, hash chain) | `tests/unit` |
| P- | Property-based (`paymentSummary`) | `tests/unit` |
| S- | Server routes with mocked Paystack and emulator Firestore | `tests/server` |
| C- | Concurrency (parallel requests against the emulator) | `tests/server` |
| R- | Firestore and Storage rules (emulator) | `tests/rules` |
| L- | Logging: no tokens, account numbers or customer names in captured logs | `tests/server` |
| E2E- | Playwright in Paystack test mode through a tunnel | `tests/e2e` |

Required cases from the brief, each mapped:

| Case | Test |
|---|---|
| Forged webhook signature | S-WH-2 |
| Replayed webhook | S-WH-8 |
| Webhook before redirect | S-WH-10 |
| Amount or currency tampering | S-WH-5, S-WH-6, S-PAY-3 |
| Expired and revoked links | S-PAY-4, S-PAY-5 |
| Double payment of one link | S-WH-11 (confirmed + `duplicate_payment` flag) |
| Cashier confirming own payment | S-MC-1 |
| Client writing payment status | R-PAY-1..5, R-RCPT-1..2 |
| 10 parallel webhooks → one confirmation | C-WH-1 |
| Two balance payments at once | C-SUM-1 |
| Confirm and reject at once | C-MC-1 |
| Cross-store IDOR → 404, no writes | S-IDOR-* |
| Subscription billing regression | S-SUB-* (pinned before the webhook file changes; run every step) |

Money helper (correction H), U-KOBO-1: `nairaToKobo` uses a decimal-safe path then
`Math.round(naira * 100)`; tested with 0.1, 0.29, 19.99, 1234567.89 and negatives (rejected).
NGN stores only.

## 6. Already closed in Step 0

| Issue | Severity | Control | Tests |
|---|---|---|---|
| Staff re-points `createdBy` → workspace takeover | Critical | Staff self-update allowlist; owner from path only | R-S0-1..5 |
| Self-granted paid plan at signup | High | Create limited to owner + free plan | R-S0-6..8 |
| Added or removed fields bypass allowlists (paid plan, add-ons, two-factor flags, inventory and receipt carve-outs) | High | `affectedKeys()` everywhere | R-S0-9..10, R-CARVE-* |
| Client-editable two-factor flag used as server fallback | High | Fields server-only; enabled if claim OR doc | R-S0-11, S-S0-TFA |
| No upload limits | Medium | 5 MB image-only on every client path | R-ST-1..4 |
| Spoofable rate-limit IP; memory fallback in production | Medium | Vercel platform header only; payments fail closed without KV | S-S0-RL |
| Dev plan switcher could run with a live key | Medium | Refuses on `sk_live_` | S-S0-DEV |
| Legacy payment links (plain tokens, no verify, stuck holds) | High | 410 Gone unless `LEGACY_PAYMENT_LINKS_ENABLED=1` (0 live links found) | S-S0-410 |

## 6a. Delivered in Step 1 (records, no routes yet)

| Control | Where | Tests |
|---|---|---|
| One kobo helper, NGN only (H) | `utils/money-kobo.ts` | U-KOBO-1 |
| Pure state machine: maker ≠ checker, reject and manual refund need a reason, late money confirmed and flagged (M) | `server/utils/payments/state-machine.ts` | U-SM-* (exhaustive edge table) |
| `paymentSummary` derived only from payment docs; partial refunds via `refundedKobo` (F) | `utils/payment-summary.ts` | P-SUM-* (fast-check) |
| Overpayment cap in the receipt transaction; late overpayment confirmed + `overpaid` (E) | `server/utils/payments/records.ts` | C-CAP-1, C-LATE-1 |
| Hash chain with per-store head in the same transaction; daily anchors to an append-only collection and to logs; verifier names the first broken link (B) | `audit-hash.ts`, `audit-log.ts`, `scripts/payments/verify-audit-chain.mjs`, cron `anchor-audit` | U-HASH-*, C-TAMPER-1, C-ANCHOR-1 |
| Money fields locked once `paymentSummary` exists; clients can never write `paymentSummary`; V2 receipts cannot be deleted (G) | `firestore.rules` | R-RCPT-* |
| Payment, event, audit and top-level link/token/webhook/anchor collections are server-write-only | `firestore.rules` | R-PAY-* |
| `permissions.payments` grants are server-only, so granting confirm can be audit-logged (Step 2 route) | `firestore.rules` | R-PERM-* |
| Feature gate: off by default; live keys refused unless `PAYMENTS_V2_ALLOW_LIVE=1` and the decisions doc says approved | `server/utils/payments/config.ts` | U-GATE-* |
| Cron secret compared timing-safe, 401 with no detail (K) | `server/utils/cron-auth.ts` | U-CRON-* |
| Concurrency | emulator | C-WH-1 (10 parallel confirms → 1), C-SUM-1, C-MC-1 |

Behaviour change to note: once a receipt has V2 payments, the existing client refund and
edit flows are blocked by rules for that receipt. Refunds of V2 money go through the server
(Step 2/5). Legacy receipts are unchanged.

## 7. Residual risks and open items

| Risk | Status | Owner |
|---|---|---|
| Refund and chargeback liability on subaccount transactions falls on Storvv's integration | Open: ask Paystack; record in `paystack-decisions.md` | Product |
| Paystack may need merchant KYC (BVN or CAC) from Storvv at volume | Open: ask Paystack | Product |
| Which verify-response field carries subaccount and split amount | Open: confirm from current Paystack docs before Step 4; fail closed meanwhile | Eng |
| Sales are created in the browser; a malicious cashier can create a sale with a low total | Accepted for now; locked once a payment exists | Eng (follow-up) |
| In-store stock decrement is not in a server transaction | Accepted; follow-up after Step 5 | Eng |
| Direct Firestore access never requires two-factor | Accepted; follow-up | Eng |
| Every active member can fully edit stock loans on Enterprise | Accepted (by design today); review later | Product |
| npm audit: high and critical advisories in `nuxt`/`nitropack`/`h3`, `@capacitor/*`, `jspdf`, `xlsx` | Open: separate dependency PR | Eng |
| Late payment after expiry, revoke or hold release | Mitigated: confirm, flag, alert | Eng |
| Admin SDK can still rewrite Firestore | Mitigated: tamper-evident chain + external anchors, not prevented | Eng |

## 8. Per-step security checklist

Run at the end of every step and record the result in the PR:

1. No client can write any payment state.
2. Every new route checks auth and store membership on the server.
3. No secret or token reaches the client or the logs.
4. Every money change runs inside a transaction and writes an audit event.
5. Every failure path either fails closed or alerts.
