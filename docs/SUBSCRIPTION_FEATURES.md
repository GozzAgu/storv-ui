# Subscription plan features

Feature partition for **Storvv Micro**, **Storvv Medium**, and **Storvv Enterprise**.

This document is the source of truth for **marketing**, **Help center**, and **`types/subscription.ts`**. When you change a plan gate in code, update this file and `SUBSCRIPTION_FEATURE_SUMMARY` together.

---

## Plan strategy (why tiers are split this way)

| Plan           | Who it's for                               | Captivation goal                                                            |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| **Micro**      | Single store, solo or tiny team            | Complete daily ops without paywalls on core selling                         |
| **Medium**     | Growing business, second branch, real team | Visibility (analytics), accountability (activity logs), scale (staff/depts) |
| **Enterprise** | Multi-location operators                   | Central control across branches (sync, template copy, stock loans)          |

**Principle:** Micro must feel **complete for one store**. Paid tiers unlock **scale, insight, and multi-location** - not receipts or inventory basics.

---

## Feature matrix

| Feature                          |   Micro    |  Medium   | Enterprise |
| -------------------------------- | :--------: | :-------: | :--------: |
| **Stores**                       |     1      |     2     | Unlimited  |
| **Departments per store**        |     1      |    10     | Unlimited  |
| **Staff per store**              |     2      |    25     | Unlimited  |
| Dashboard                        |     ✓      |     ✓     |     ✓      |
| Inventory & categories           |     ✓      |     ✓     |     ✓      |
| Subcategories (one level)        |     ✓      |     ✓     |     ✓      |
| Receipts, returns, customers     |     ✓      |     ✓     |     ✓      |
| Quick Sale & Create New Sale     |     ✓      |     ✓     |     ✓      |
| Notifications                    |     ✓      |     ✓     |     ✓      |
| Settings & profile               |     ✓      |     ✓     |     ✓      |
| Departments (nav & management)   |     ✓      |     ✓     |     ✓      |
| Help center & Storvv Assistant   |     ✓      |     ✓     |     ✓      |
| Web dashboard & iOS app          |     ✓      |     ✓     |     ✓      |
| **Payment links** (Paystack)     |     ✓      |     ✓     |     ✓      |
| WhatsApp receipts                | 10 / month | Unlimited | Unlimited  |
| Analytics & reports              |     -      |     ✓     |     ✓      |
| Activity logs                    |     -      |     ✓     |     ✓      |
| **Sales leads**                  |     -      |     ✓     |     ✓      |
| Customer balance / credit ledger |     -      |     ✓     |     ✓      |
| Duplicate category (same branch) |     -      |     ✓     |     ✓      |
| Multi-store sync & transfers     |     -      |     -     |     ✓      |
| Copy from branch (templates)     |     -      |     -     |     ✓      |
| Stock loans                      |     -      |     -     |     ✓      |
| Priority support                 |     -      |     -     |     ✓      |

**Role-based (all plans):** Customer buybacks are **super admin only**, not plan-gated.

---

## Storvv Micro

**Aimed at:** Single store, solo or very small team.

### Included

- **1 store**, **1 department**, **up to 2 staff**
- **Dashboard** - overview, inventory health, quick stats
- **Inventory** - categories, optional subcategories, serial or bulk modes
- **Sales** - Create New Sale, Quick Sale, receipts, returns, customers
- **Payment links** - Paystack checkout links (all plans)
- **Notifications** - in-app alerts
- **Settings & profile** - account, theme, security, 2FA
- **Help center & Storvv Assistant**
- **Web + iOS** - same account on browser and native app
- **WhatsApp** - share receipts (**10 sends per calendar month**)

### Not included (upgrade triggers)

- Analytics & PDF/Excel exports
- Activity logs
- Sales leads
- Customer balance / credit ledger
- Duplicate category within a branch
- Multi-store sync, copy-from-branch, stock loans

---

## Storvv Medium

**Aimed at:** Growing business - second location, managers, and reporting.

Includes **everything in Micro**, plus:

| Area                   | What's included                                         |
| ---------------------- | ------------------------------------------------------- |
| **Stores**             | Up to **2**                                             |
| **Departments**        | Up to **10** per store                                  |
| **Staff**              | Up to **25** per store                                  |
| **Analytics**          | Feature insights, charts, peak hours, PDF/Excel export    |
| **Activity logs**      | Who changed what, dated audit trail                     |
| **Sales leads**        | Enquiry pipeline with convert-to-sale                   |
| **Customer balance**   | Credit ledger & payment reminders tied to balance       |
| **WhatsApp**           | **Unlimited** receipt sharing & payment nudges          |
| **Duplicate category** | Clone folder templates **within the same branch**       |

### Not included

- Multi-store sync (stock transfers between branches)
- Copy category templates **from another branch**
- Stock loans
- Priority support

---

## Storvv Enterprise

**Aimed at:** Larger operations - many branches, central HQ, serial inventory on loan.

Includes **everything in Medium**, plus:

| Area                 | What's included                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Stores**           | **Unlimited**                                                                                                     |
| **Departments**      | **Unlimited** per store                                                                                           |
| **Staff**            | **Unlimited** per store                                                                                           |
| **Multi-Store Sync** | Transfer items between stores, transfer history, consolidated reporting                                           |
| **Copy from branch** | Copy selected **category templates** from one branch to another (names, fields, serial mode - not live stock qty) |
| **Stock loans**      | Lend serial-tracked inventory to borrowers until sold or returned                                                 |
| **Support**          | Priority support                                                                                                  |

---

## Features on all plans (never paywall)

These build trust and word-of-mouth; keep them on every tier:

- Create receipts, returns, and customers
- Full inventory for the active branch (within store/dept/staff caps)
- Quick Sale and Create New Sale
- Paystack payment links
- Email receipt delivery (where configured)
- Dark mode, web + mobile (Capacitor) apps
- Security: sign-in, password change, 2FA (profile)
- Help center, onboarding tour, and Storvv Assistant

---

## Plan-specific gates (implementation notes)

| User action                           | Minimum plan        | Code / UI                                          |
| ------------------------------------- | ------------------- | -------------------------------------------------- |
| Open Analytics                        | Medium              | `canUse('analytics')`, route guard                 |
| View Activity logs                    | Medium              | `canUse('activity_logs')`                          |
| Open Sales leads                      | Medium              | `canUse('sales_leads')`                            |
| Add 2nd+ department (beyond cap)      | Medium              | `canAddDepartment()`, `maxDepartmentsPerStore`     |
| Customer balance screens              | Medium              | `canUse('customer_balance')`                       |
| Duplicate category                    | Medium              | `canDuplicateByPlan` in inventory pages            |
| WhatsApp beyond cap                   | Medium              | `maxWhatsAppMessagesPerMonth` in limits            |
| Multi-Store Sync                      | Enterprise          | `canUse('multi_store_sync')`                       |
| Copy from branch                      | Enterprise          | `canCopyFolderTemplatesFromBranchByPlan`, super admin |
| Stock loans                           | Enterprise          | `canUse('seller_loans')`                           |
| Add 2nd store (Micro) / 3rd+ (Medium) | Medium / Enterprise | `getEligibleStoresForPlan`, store creation         |
| Payment links                         | All plans           | `canUse('payment_links')`                          |

---

## Upgrade moments (recommended UX)

Show upgrade prompts when users **hit a limit**, not at random:

| Moment                     | Suggested message                                     |
| -------------------------- | ----------------------------------------------------- |
| Analytics nav (Micro)      | "See revenue trends and busiest hours on Medium"      |
| Sales leads nav (Micro)    | "Track enquiries before they become receipts on Medium" |
| 3rd staff invite (Micro)   | "Medium supports up to 25 staff per store"            |
| 2nd store creation (Micro) | "Add a second branch on Medium"                       |
| WhatsApp cap (Micro)       | "Unlimited WhatsApp receipts on Medium"               |
| Copy from branch           | "Enterprise: copy category templates across branches" |
| Stock loans nav            | "Enterprise: track inventory lent to borrowers"       |

---

## Implementation

- **Feature flags:** `types/subscription.ts` - `FEATURES_BY_PLAN`, `LIMITS_BY_PLAN`, `SUBSCRIPTION_FEATURE_SUMMARY`, `SUBSCRIPTION_PLAN_NOT_INCLUDED`
- **Usage:** `useSubscriptionFeatures()` - `canUse(feature)`, `limits`, `featureSummary`
- **Billing:** Paystack **Subscriptions** (auto-renew). Checkout passes a Paystack plan code (`PLN_xxx`) per tier and billing cycle (monthly, quarterly, yearly). Renewals are applied via the Paystack webhook (`charge.success`); failed renewals set `subscriptionStatus: past_due`; `subscription.disable` stops auto-renew. Super admins can **Cancel auto-renew** in Settings (keeps plan until `subscriptionCurrentPeriodEnd`, then reverts to Micro).
- **Env:** `PAYSTACK_PLAN_CODE_MEDIUM_MONTHLY`, `_QUARTERLY`, `_YEARLY`, and the same for Enterprise. Amount env vars must match the Paystack plan amounts.
- **Nav:** Sidebar hides Analytics (Micro), Activity logs (Micro), Sales leads (Micro), Multi-Store Sync & Stock loans (Micro & Medium)
- **Firestore rules:** `firestore.rules` - `planAtLeastMedium()` / `planIsEnterprise()` on sales leads, customer accounts, activity logs, stock loans, and multi-store sync collections
- **Duplicate category:** Medium+ via plan check in `inventory/index.vue` and `inventory/[id].vue` (not a separate feature flag)
- **Copy from branch:** Enterprise only in inventory pages

Billing uses **Paystack** (NGN). Amounts: `server/utils/paystack-validation.ts`.
