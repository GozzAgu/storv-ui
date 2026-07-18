# Subscription plan features

Feature partition for **Storvv Micro**, **Storvv Medium**, and **Storvv Enterprise**.

This document is the source of truth for **marketing**, **Help center**, and **`types/subscription.ts`**. When you change a plan gate in code, update this file and `SUBSCRIPTION_FEATURE_SUMMARY` together.

---

## Plan strategy (why tiers are split this way)

| Plan           | Who it’s for                               | Captivation goal                                                            |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| **Micro**      | Single store, solo or tiny team            | Complete daily ops without paywalls on core selling                         |
| **Medium**     | Growing business, second branch, real team | Visibility (analytics), accountability (activity logs), scale (staff/depts) |
| **Enterprise** | Multi-location operators                   | Central control across branches (sync, template copy, stock loans)          |

**Principle:** Micro must feel **complete for one store**. Paid tiers unlock **scale, insight, and multi-location** — not receipts or inventory basics.

---

## Feature matrix

| Feature                          |   Micro    |  Medium   | Enterprise |
| -------------------------------- | :--------: | :-------: | :--------: |
| **Stores**                       |     1      |     2     | Unlimited  |
| **Departments per store**        |     1      |    10     | Unlimited  |
| **Staff per store**              |     2      |    25     | Unlimited  |
| Dashboard                        |     ✓      |     ✓     |     ✓      |
| Inventory & categories           |     ✓      |     ✓     |     ✓      |
| Receipts, returns, customers     |     ✓      |     ✓     |     ✓      |
| Notifications                    |     ✓      |     ✓     |     ✓      |
| Settings & profile               |     ✓      |     ✓     |     ✓      |
| Help center & onboarding         |     ✓      |     ✓     |     ✓      |
| WhatsApp receipts                | 10 / month | Unlimited | Unlimited  |
| Analytics & reports              |     —      |     ✓     |     ✓      |
| Activity logs                    |     —      |     ✓     |     ✓      |
| Departments (multi-dept teams)   |     —      |     ✓     |     ✓      |
| Customer balance / credit ledger |     —      |     ✓     |     ✓      |
| Duplicate category (same branch) |     —      |     ✓     |     ✓      |
| Multi-store sync & transfers     |     —      |     —     |     ✓      |
| Copy from branch (templates)     |     —      |     —     |     ✓      |
| Stock loans                      |     —      |     —     |     ✓      |
| Priority support                 |     —      |     —     |     ✓      |

---

## Storvv Micro

**Aimed at:** Single store, solo or very small team.

### Included

- **1 store**, **1 department**, **up to 2 staff**
- **Dashboard** — overview, inventory health, quick stats
- **Inventory** — categories (folders), products, serial or bulk modes
- **Receipts** — create & manage sales
- **Returns** — process refunds
- **Customers** — list & purchase history (Sales screen)
- **Notifications** — in-app alerts
- **Settings & profile** — account, theme, security
- **Help center** — searchable guides
- **WhatsApp** — share receipts ( **10 sends per calendar month** )

### Not included (upgrade triggers)

- Analytics & exports
- Activity logs
- Multiple departments (beyond the single included dept)
- Customer balance / credit ledger
- Duplicate category within a branch
- Multi-store sync, copy-from-branch, stock loans

---

## Storvv Medium

**Aimed at:** Growing business — second location, managers, and reporting.

Includes **everything in Micro**, plus:

| Area                   | What’s included                                         |
| ---------------------- | ------------------------------------------------------- |
| **Stores**             | Up to **2**                                             |
| **Departments**        | Up to **10** per store                                  |
| **Staff**              | Up to **25** per store                                  |
| **Analytics**          | Reports, charts, revenue trends, busiest times, exports |
| **Activity logs**      | Who changed what, dated audit trail                     |
| **Departments**        | Organize teams; folder access by department             |
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

**Aimed at:** Larger operations — many branches, central HQ, serial inventory on loan.

Includes **everything in Medium**, plus:

| Area                 | What’s included                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Stores**           | **Unlimited**                                                                                                     |
| **Departments**      | **Unlimited** per store                                                                                           |
| **Staff**            | **Unlimited** per store                                                                                           |
| **Multi-Store Sync** | Transfer items between stores, transfer history, consolidated reporting                                           |
| **Copy from branch** | Copy selected **category templates** from one branch to another (names, fields, serial mode — not live stock qty) |
| **Stock loans**      | Lend serial-tracked inventory to borrowers until sold or returned                                                 |
| **Support**          | Priority support                                                                                                  |

---

## Features on all plans (never paywall)

These build trust and word-of-mouth; keep them on every tier:

- Create receipts, returns, and customers
- Full inventory for the active branch
- Email receipt delivery (where configured)
- Dark mode, web + mobile (Capacitor) apps
- Security: sign-in, password change, 2FA (profile)
- Help center & onboarding

---

## Plan-specific gates (implementation notes)

| User action                           | Minimum plan        | Code / UI                                          |
| ------------------------------------- | ------------------- | -------------------------------------------------- |
| Open Analytics                        | Medium              | `canUse('analytics')`, route guard                 |
| View Activity logs                    | Medium              | `canUse('activity_logs')`                          |
| Add 2nd+ department (beyond cap)      | Medium              | `canUse('departments')`, `canAddDepartment()`      |
| Customer balance screens              | Medium              | `canUse('customer_balance')`                       |
| Duplicate category                    | Medium              | `canDuplicateByPlan` in inventory pages            |
| WhatsApp beyond cap                   | Medium              | `maxWhatsAppMessagesPerMonth` in limits            |
| Multi-Store Sync                      | Enterprise          | `canUse('multi_store_sync')`                       |
| Copy from branch                      | Enterprise          | `inventoryStore.copyFolderTemplates…`, super admin |
| Stock loans                           | Enterprise          | `canUse('seller_loans')`                           |
| Add 2nd store (Micro) / 3rd+ (Medium) | Medium / Enterprise | `getEligibleStoresForPlan`, store creation         |

---

## Upgrade moments (recommended UX)

Show upgrade prompts when users **hit a limit**, not at random:

| Moment                     | Suggested message                                     |
| -------------------------- | ----------------------------------------------------- |
| Analytics nav (Micro)      | “See revenue trends and busiest hours on Medium”      |
| 3rd staff invite (Micro)   | “Medium supports up to 25 staff per store”            |
| 2nd store creation (Micro) | “Add a second branch on Medium”                       |
| WhatsApp cap (Micro)       | “Unlimited WhatsApp receipts on Medium”               |
| Copy from branch           | “Enterprise: copy category templates across branches” |
| Stock loans nav            | “Enterprise: track inventory lent to resellers”       |

---

## Implementation

- **Feature flags:** `types/subscription.ts` — `FEATURES_BY_PLAN`, `LIMITS_BY_PLAN`, `SUBSCRIPTION_FEATURE_SUMMARY`
- **Usage:** `useSubscriptionFeatures()` — `canUse(feature)`, `limits`, `featureSummary`
- **Nav:** Sidebar hides Analytics (Micro), Activity logs (Micro), Multi-Store Sync & Stock loans (Micro & Medium)
- **Routes:** Analytics and Multi-Store Sync guard access by plan
- **Duplicate category:** Medium+ via plan check in `inventory/index.vue` and `inventory/[id].vue` (not a separate feature flag)
- **Copy from branch:** Enterprise only in `stores/inventory.ts`

Billing uses **Paystack** (NGN). Amounts: `server/utils/paystack-validation.ts`.
