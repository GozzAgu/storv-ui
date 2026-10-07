# Paystack decisions for Payments V2

Status: draft

Live mode stays blocked until the line above reads exactly `Status: approved` and
`PAYMENTS_V2_ALLOW_LIVE=1` is set. Only change it once every answer below is recorded and signed off.

| Question                                                                                                                                       | Answer      | Source (email, ticket, doc link) | Date       |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------- | ---------- |
| How are refunds and chargebacks on subaccount transactions recovered? Does Storvv's main balance carry them if the merchant has been paid out? |             |                                  |            |
| Does Paystack need merchant KYC (BVN or CAC) collected by Storvv as the platform, and at what volume?                                          |             |                                  |            |
| Which field in the verify-transaction response carries the subaccount code and the amount after split?                                         |             |                                  |            |
| Current fees for cards and transfers with `bearer: 'subaccount'`                                                                               |             |                                  |            |
| Settlement schedule for subaccounts                                                                                                            |             |                                  |            |
| Storvv's `percentage_charge`                                                                                                                   | 0 (decided) | Payments approval, 7 Oct 2026    | 2026-10-07 |
| Webhook URLs set for test and live                                                                                                             |             |                                  |            |
| Storvv business account fully verified for live mode                                                                                           |             |                                  |            |

Approved by:
