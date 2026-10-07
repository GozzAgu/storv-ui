# Payments V2: privacy notes

Status: approved; the wording below is in `pages/privacy.vue` section 8.

## What is collected

- **Payment records** (per sale): amount, method label (e.g. "Bank Transfer"), who recorded,
  confirmed or rejected it, when, and any rejection or refund reason. No card or bank account
  numbers are stored.
- **Proof of payment** (optional): a screenshot or PDF a staff member attaches to a payment they
  recorded (for example a transfer receipt). It may show the payer's name, bank and account
  details.

## Who can see it

- Payment records: the store owner, staff granted "See all payments" or "Confirm payments", and
  the staff member who recorded the payment (their own entries only).
- Proofs: the same people, through a link that expires after 5 minutes. Proof files are never
  publicly readable; uploads are limited to the recorder, one file per payment, 5 MB, JPEG, PNG,
  WebP or PDF.

## Retention

- Proofs are deleted automatically 12 months after the payment is confirmed or rejected
  (daily job `proof-retention`). The payment record keeps a note that a proof existed and when it
  was deleted.
- Payment records and their tamper-evident audit log are kept with the sale for the life of the
  store account, because they are financial records.

## Wording in `pages/privacy.vue` section 8 (Data Retention)

> **Payment proofs.** If your staff attach a proof of payment (such as a transfer screenshot) to a
> sale, it is visible only to the store owner and staff allowed to view or confirm payments, and is
> deleted automatically 12 months after the payment is confirmed or rejected. Payment records
> themselves (amount, method, who recorded and confirmed them) are kept with the sale as financial
> records.
