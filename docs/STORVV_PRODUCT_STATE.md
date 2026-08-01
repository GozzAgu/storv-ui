# Storvv — Product & Engineering State (Snapshot)

**Purpose:** Feed this document to GPT (or any LLM) for accurate context on what Storvv is, what is built, what is partial, and how the app is structured.

**Last updated:** June 2026  
**Codebase:** `storv-ui` (Nuxt 4 SPA + Capacitor iOS)  
**Companion (deeper reference):** [STORVV_COMPLETE_GUIDE.md](./STORVV_COMPLETE_GUIDE.md)

---

## 1. Executive summary

**Storvv** is a multi-branch retail operations platform for inventory, sales (receipts), customers, staff, and reporting. It targets Nigerian and international retailers (NGN-first pricing, region-based branch naming).

**Maturity:** Production-capable web app with Firebase backend, Paystack billing, iOS Capacitor shell, demo mode, in-app help center, and Gemini-powered assistant (demo uses rule-based replies). Core retail loops (inventory → sale → receipt → analytics) are implemented end-to-end. Enterprise features (multi-store sync, stock loans, copy-from-branch) are built. Payment links UI exists but is flagged **coming soon** on dashboard/native.

**What “done” means here:** Feature has UI, store/API wiring, plan/role gates, and help/assistant coverage unless marked partial.

---

## 2. Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Nuxt 4, Vue 3, Pinia, Tailwind CSS 4, @nuxt/ui |
| Rendering | SPA (`ssr: false`) — static export for Capacitor |
| Mobile | Capacitor 8 (iOS primary), biometric auth, secure storage, keyboard handling |
| Backend | Nitro server routes (`server/api/*`) |
| Database | Firebase Firestore |
| Auth | Firebase Auth (email, OAuth), TOTP 2FA |
| Storage | Firebase Storage + Cloudinary (logos/images) |
| Payments | Paystack (subscriptions + payment links infrastructure) |
| Messaging | WhatsApp Cloud API, Resend (email receipts) |
| AI assistant | Google Gemini (`/api/assistant/chat`) |
| Charts / export | ApexCharts, jsPDF, xlsx, JSZip |
| Testing | Playwright (E2E), Vitest (unit), Firebase rules tests |

---

## 3. Subscription plans

Three plans: **Storvv Micro**, **Storvv Medium**, **Storvv Enterprise**.

| Capability | Micro | Medium | Enterprise |
|------------|:-----:|:------:|:------------:|
| Dashboard, inventory, sales, customers | ✓ | ✓ | ✓ |
| Settings, profile, notifications | ✓ | ✓ | ✓ |
| WhatsApp messaging | ✓ (10/mo) | ✓ unlimited | ✓ unlimited |
| Payment links (infra) | ✓ | ✓ | ✓ |
| Analytics & reports | — | ✓ | ✓ |
| Activity logs | — | ✓ | ✓ |
| Departments & staff (limits) | 1 dept, 2 staff | 10 depts, 25 staff | unlimited |
| Customer balance ledger | — | ✓ | ✓ |
| Duplicate category (same branch) | — | ✓ | ✓ |
| Copy category templates across branches | — | — | ✓ |
| Stock loans | — | — | ✓ |
| Multi-store sync & transfers | — | — | ✓ |
| Max branches | 1 | 2 | unlimited |

Billing: Paystack, monthly / quarterly / yearly cycles.

---

## 4. Roles & permissions

### Account roles
- **Super admin (owner):** Full access; creates branches, staff, inventory structure; sees profit/cost; edits settings.
- **Staff:** Separate login; data scoped to assigned store/department.

### Store roles (staff members)
- **Manager:** Edit receipts/refunds; may edit inventory if granted `canManageInventory`.
- **Staff / intern:** Read-heavy; can create sales depending on config.

### Key permission rules (UI)
- Create/edit **inventory categories & products:** super admin, or manager with inventory flag.
- **Profit & cost columns:** super admin only.
- **Customer buybacks:** super admin only.
- **Stock loans:** manager or super admin, Enterprise plan.
- **Multi-store sync:** super admin only, Enterprise plan.
- **Settings edit:** super admin only (others see view-only).
- **Delete receipts:** super admin only.

Firestore rules enforce stricter server-side limits (e.g. folder CRUD often owner-only).

---

## 5. App routes (dashboard)

| Route | Feature |
|-------|---------|
| `/dashboard` | Home metrics, charts, low stock, payment link summary |
| `/dashboard/inventory` | Category list (grid/table) |
| `/dashboard/inventory/[id]` | Category detail: products OR subcategory hub |
| `/dashboard/receipts` | Sales hub: Receipts, Returns, Customers tabs |
| `/dashboard/buybacks` | Customer buybacks (trade-ins) |
| `/dashboard/seller-loans` | Stock loans (Enterprise) |
| `/dashboard/payment-links` | Paystack links (**coming soon** UI flag) |
| `/dashboard/analytics` | Charts, feature insights, PDF/Excel export |
| `/dashboard/activity` | Activity logs (Medium+) |
| `/dashboard/multi-store-sync` | Transfers, consolidated reports (Enterprise) |
| `/dashboard/stores/[id]/departments` | Departments per branch |
| `/dashboard/departments/[id]` | Department detail + staff |
| `/dashboard/settings` | Account, branches, subscription, data export |
| `/dashboard/profile` | Profile, 2FA, receipt terms |
| `/dashboard/help` | Searchable help center + assistant entry |
| `/dashboard/onboarding` | Currency, country, head store setup |
| `/dashboard/notifications` | Notification center |

**Demo mirror:** All dashboard routes also exist under `/demo/dashboard/*` with local seed data (no Firebase).

**Public:** Landing `/`, signin/signup, `/pay/[token]`, `/r/[token]` (shared receipts).

---

## 6. Feature modules (detailed)

### 6.1 Inventory & categories

**Status: Built**

- **Top-level categories** on `/dashboard/inventory` with search, department filter, grid/table toggle, pagination.
- **Optional subcategories (one level):** When creating a category, **Organize with subcategories** is optional (off by default). When on, parent opens a **subcategory hub**; products live in leaf categories only.
- **Category templates:** Custom columns (text, number, date, select, currency, boolean), serial vs quantity mode, optional profit tracking (cost price column).
- **Department access:** Optional per-category ACL.
- **Category detail:** Product table, discounts, item history, fullscreen mode, barcode/QR where applicable.
- **Duplicate category** (same branch): Medium+.
- **Copy from branch** (Enterprise): Side drawer — pick source branch, select **top-level** categories, optional **Also copy subcategories** checkbox; copies templates only (not stock).
- **Data export:** Settings → ZIP (nested categories), Excel for sales/buybacks/loans.

**Recent (2026):** Optional subcategories toggle; copy-from-branch hierarchy; region-based branch names in settings.

### 6.2 Sales & receipts

**Status: Built**

- **Create New Sale:** 4-step drawer — parent category → subcategory (if needed) → items → checkout (customer, payment, balance due).
- **Quick Sale:** Side drawer from Sales page; barcode scanner support; same category hierarchy.
- **Sell screen notes:** Per-branch note shown during sale flows (configured in Settings).
- **Receipt statuses:** completed, balance_due, refunded, pending, cancelled.
- **Returns/refunds:** Via receipt actions; Returns tab on Sales page.
- **Customers tab:** Directory on same Sales page.
- **Receipt sharing:** Print, PDF, WhatsApp, public link `/r/[token]`.
- **Swap-in / buyback credit:** On Create New Sale (super admin).

### 6.3 Customer buybacks

**Status: Built**

- Super-admin-only page under Inventory sidebar.
- Record trade-in: pick leaf category, item fields, amount paid → creates inventory row with unit cost.
- Appears in Analytics feature insights and demo seed.

### 6.4 Customer balance (Medium+)

**Status: Built**

- Ledger tied to balance-due sales on Customers tab.
- Analytics insights for outstanding balances.
- WhatsApp payment nudges (plan-capped on Micro).

### 6.5 Stock loans (Enterprise)

**Status: Built**

- Lend serialized inventory to external sellers.
- List/filter: Active, Returned, Sold, Overdue.
- Mark sold / return from row actions; integrates with sales flow.

### 6.6 Analytics (Medium+)

**Status: Built**

- Period picker: Daily / Weekly / Monthly.
- Charts: revenue, top products, categories, customers, payment methods, peak hours, heatmap.
- **Feature insights grid:** Sales, returns, outstanding, inventory health, customers, profit, operations, buybacks, balance, stock loans, payment links (plan/role aware).
- Export PDF and Excel.

### 6.7 Multi-store sync (Enterprise)

**Status: Built**

- Transfer items between branches with approval workflow.
- Consolidated cross-branch reports.
- Transfer history.

### 6.8 Payment links

**Status: Partial — infrastructure built, dashboard UI coming soon**

- Paystack subaccounts, server APIs, public `/pay/[token]` page exist.
- Dashboard page shows **coming soon** (`PAYMENT_LINKS_COMING_SOON = true`).
- Native app: separate coming-soon flag.

### 6.9 Departments & staff

**Status: Built**

- Departments per branch; staff assigned with roles.
- Staff login with optional forced password change.
- Plan limits on department/staff counts.

### 6.10 Settings & branches

**Status: Built**

- Account logo (Cloudinary or Firebase Storage fallback).
- **Branches:** Create/edit with **city picker from account region** (onboarding country) + optional area (e.g. `Lagos, Lekki`); sell screen note; contact fields.
- Subscription upgrade via Paystack (2FA confirm for sensitive actions).
- Receipt numbering prefix.
- Inventory defaults, payment tender methods.
- Full store data export.

### 6.11 Onboarding

**Status: Built**

- Step 1: Currency + country (sets region for branch cities).
- Step 2: Head store branch (city dropdown), address, phone, email, description.

### 6.12 Help center & assistant

**Status: Built**

- **Help center** (`/dashboard/help`): 10 categories, searchable articles, popular topics, quick screen links.
- **Assistant:** Gemini-powered in production; opens from header and help page.
- **Demo assistant:** Keyword-based canned replies (no API).
- Knowledge base: `utils/dashboard-help-content.ts` — includes recent updates (subcategories, copy-from-branch, branch cities, buybacks, analytics insights, stock loans, Quick Sale drawer).
- Replies sanitized to plain text (no Markdown bold).

### 6.13 Notifications & activity

**Status: Built**

- In-app notifications (bell dropdown + full page).
- Activity logs audit inventory changes (Medium+, manager/super admin).

### 6.14 Security

**Status: Built**

- Email verification gate.
- TOTP 2FA on profile.
- Rate limiting (Vercel KV) on sensitive APIs.
- Firestore security rules tested via emulator suite.

---

## 7. Demo mode

**Status: Built — comprehensive**

- Entry: `/demo` → `/demo/dashboard`.
- LocalStorage seed v7: 3 branches (Lagos, Abuja, Port Harcourt) with realistic inventory hierarchy (e.g. Phones → Smartphones, Toyota → Corolla/Camry/Highlander).
- Runs as Enterprise super admin.
- Full UI: inventory, sales, buybacks, stock loans, analytics insights, multi-store, assistant (canned), copy-from-branch (local), theme toggle.
- No Firebase; `syncDemoToPinia()` hydrates Pinia stores.

**iOS:** `npm run cap:build:ios` generates static app with demo routes.

---

## 8. Mobile / native (Capacitor)

**Status: Built for iOS; Android scaffold present**

- Static Nuxt generate → Capacitor sync.
- Native bottom nav, sheets, keyboard inset handling.
- Biometric login with secure credential storage.
- Marketing `/` redirects to signin on native shell.
- Server features (assistant, webhooks) need `NUXT_PUBLIC_API_BASE` pointing to hosted API.

---

## 9. External integrations

| Service | Use |
|---------|-----|
| Firebase | Auth, Firestore, Storage, Analytics |
| Paystack | Subscriptions, payment links, webhooks |
| Cloudinary | Account/store logos (unsigned upload preset) |
| WhatsApp Cloud API | Receipt delivery, balance nudges |
| Resend | Email receipts (partial — some UI still “coming soon”) |
| Google Gemini | Dashboard assistant |
| Vercel | Hosting preset, KV rate limits |

---

## 10. Data model (Firestore)

```
users/{ownerId}/
  stores/{storeId}/
    inventoryFolders/{folderId}     # parentId, usesSubcategories, template, ACLs
    inventoryItems/{itemId}         # dynamic fields + serial/qty, unitCost, buyback flags
    receipts/{receiptId}
    customers/{customerId}
    departments/{departmentId}/
      staff/{staffId}
    members/{authUid}               # staff membership
    customerBuybacks/{id}
    sellerLoanOuts/{id}
    transfers/{id}                  # multi-store
```

All operational data is **scoped to active branch** (`storeId`) except Enterprise cross-store tools.

---

## 11. Key codebase locations

| Area | Path |
|------|------|
| Dashboard pages | `pages/dashboard/` |
| Pinia stores | `stores/` |
| Subscription gates | `composables/useSubscriptionFeatures.ts`, `types/subscription.ts` |
| Permissions | `composables/usePermissions.ts` |
| Region cities (branches) | `utils/region-cities.ts`, `utils/branch-name.ts` |
| Category tree | `utils/inventory-folder-tree.ts` |
| Help & assistant KB | `utils/dashboard-help-content.ts` |
| Demo seed | `utils/demo-seed.ts`, `stores/demoApp.ts`, `utils/demo-bridge.ts` |
| Server APIs | `server/api/` |
| Firestore rules | `firestore.rules` |
| Sidebar layout | `layouts/dashboard.vue` |
| Side panels / drawers | `components/ui/SidePanel.vue` |

---

## 12. Testing & quality

| Type | Command | Coverage |
|------|---------|----------|
| E2E | `npm test` (Playwright) | Dashboard, inventory, receipts, analytics, landing |
| Unit | `npx vitest run` | Assistant, demo seed, folder tree, branch names, region cities, etc. |
| Firestore rules | `npm run test:rules` | Security rules (needs Java/emulator) |
| Format | `npm run format:check` | Prettier |

---

## 13. Known limitations & coming soon

1. **Payment links dashboard** — flagged coming soon; backend largely ready.
2. **Email receipts** — toast says “coming soon” in some flows; Resend infra exists.
3. **Firestore vs UI permissions** — managers with inventory flag may hit rule mismatches on folder CRUD (owner-only in rules).
4. **Payment links on native** — separate coming-soon flag.
5. **Subcategory nesting** — intentionally one level only (parent → child, no deeper trees).
6. **Assistant** — cannot access live store data; guidance only.

---

## 14. Recent shipping log (high signal)

Use this section to gauge “how far we’ve gone” in the latest iteration:

| Area | What shipped |
|------|----------------|
| Inventory | Optional **Organize with subcategories** on create (default off); parent hub only when opted in |
| Inventory | **Copy from branch:** top-level picker + optional subcategory copy + parent `usesSubcategories` flag |
| Settings | **Create branch:** city dropdown from account region + optional area/neighborhood |
| Buybacks | Empty state aligned with stock loans layout |
| Analytics | Feature insights grid (sales, returns, inventory, buybacks, loans, balances, etc.) |
| Assistant | Expanded KB; no `**` bold in replies; demo canned answers |
| Demo | Seed v7 with subcategory hierarchies; copy-from-branch works locally; iOS build path |
| UX | Category drawer scrollable; checkboxes styled consistently; faster theme toggle |
| Content | Help center + assistant updated for subcategories, copy-from-branch, branch cities |
| Polish | Em dash (`—`) removed app-wide (regex fix on profile page) |

---

## 15. Suggested GPT prompts (when using this doc)

- “What can a Micro vs Enterprise user do in Storvv?”
- “Explain the inventory category and subcategory model.”
- “How does copy from branch work on Enterprise?”
- “What is implemented vs coming soon for payment links?”
- “Describe demo mode capabilities.”
- “What should we build next given current gaps?”

---

## 16. One-paragraph pitch (for context)

Storvv is a Firebase-backed, Paystack-billed retail OS for multi-location shops: track inventory in customizable categories (with optional one-level subcategories), ring up sales via wizard or Quick Sale, manage customers and balance ledgers, record buybacks and Enterprise stock loans, sync stock across branches, and report through Analytics with feature-level insights. It ships as a Nuxt SPA with an iOS app, in-app help, Gemini assistant, and a full demo mode—aimed at emerging markets (Nigeria-first) with region-aware branch naming and NGN pricing.

---

*End of snapshot. For file-level journeys and API catalogs, see [STORVV_COMPLETE_GUIDE.md](./STORVV_COMPLETE_GUIDE.md) and [STORVV_APP_FLOW.md](./STORVV_APP_FLOW.md).*
