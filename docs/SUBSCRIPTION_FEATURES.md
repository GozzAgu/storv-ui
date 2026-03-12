# Subscription plan features

Feature partition for **Storvv Micro**, **Storvv Medium**, and **Storvv Enterprise**.

---

## Storvv Micro

**Aimed at:** Single store, solo or very small team.

| Area | What’s included |
|------|------------------|
| **Stores** | 1 store |
| **Departments** | 1 department per store |
| **Staff** | Up to 2 staff per store |
| **Dashboard** | Overview, quick stats |
| **Inventory** | Full inventory & folders |
| **Receipts** | Create & manage receipts |
| **Returns** | Process returns |
| **Customers** | Customer list & history |
| **Settings & profile** | Account and app settings |
| **Notifications** | In-app notifications |

**Not included:** Analytics, multiple departments, Multi-Store Sync.

---

## Storvv Medium

**Aimed at:** Growing business, multiple locations or teams.

Includes **everything in Micro**, plus:

| Area | What’s included |
|------|------------------|
| **Stores** | Up to 5 stores |
| **Departments** | Up to 10 departments per store |
| **Staff** | Up to 25 staff per store |
| **Analytics** | Reports, charts, revenue trends, busiest time, heatmaps, exports |

**Not included:** Multi-Store Sync (transfers between stores).

---

## Storvv Enterprise

**Aimed at:** Larger operations, central management across many stores.

Includes **everything in Medium**, plus:

| Area | What’s included |
|------|------------------|
| **Stores** | Unlimited |
| **Departments** | Unlimited per store |
| **Staff** | Unlimited per store |
| **Multi-Store Sync** | Transfer items between stores, consolidated reports, transfer history |
| **Support** | Priority support |

---

## Implementation

- **Feature flags:** `types/subscription.ts` (`FEATURES_BY_PLAN`, `LIMITS_BY_PLAN`).
- **Usage:** `useSubscriptionFeatures()` composable (`canUse(feature)`, `limits`).
- **Nav:** Sidebar hides Analytics (Micro) and Multi-Store Sync (Micro & Medium).
- **Routes:** Analytics and Multi-Store Sync pages guard access by plan; Analytics redirects to Settings if no access.

Limits (e.g. max stores, departments, staff) can be enforced in Settings and store-creation flows using `limits` from `useSubscriptionFeatures()`.
