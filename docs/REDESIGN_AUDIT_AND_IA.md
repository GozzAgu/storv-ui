# Storvv UI Replacement: Stage 1 Audit and Proposed Information Architecture

Branch: `dev-ui-update`. Scope: the signed-in product (web dashboard and the Capacitor iOS shell that renders it), plus auth and onboarding. The marketing site is out of scope unless decided otherwise.

Rule for everything below: **keep the logic, replace the presentation.** Stores, composables, Firestore paths, rules, server routes and data models stay untouched.

---

## 1. What exists today

### 1.1 Size of the presentation layer

| Area | Count | Notes |
| --- | --- | --- |
| Pages (`pages/**`) | 47 files, ~46k lines incl. layouts | Dashboard pages are very large single files with UI and orchestration mixed |
| Layouts | 2 (`dashboard.vue` 2,174 lines, `marketing.vue`) | Dashboard layout holds sidebar, header, branch switcher, search, notifications, native tab bar, FAB, sheets |
| Components | ~232 `.vue` | `ios/` 48, `dashboard/` 35, `ui/` 32, `landing/` 20, `receipts/` 18, `inventory/` 11, others small |
| Stores (Pinia) | 19 | Logic. Keep. |
| Composables | 104 | Mostly logic. A minority are UI chrome helpers (sheet chrome, drawer chrome, native table layout) that get replaced |
| CSS | 63 files, ~36.8k lines, ~1.1 MB source | Overlapping layers: `main.css`, `web-design-tokens.css`, `web-glass-app.css`, `dashboard-*.css` (shell, cards, pages, tables, overlays), `capacitor-*.css`, `ios-*.css`, `landing-*.css` |
| Native branches | ~3,200 `capacitor-native` CSS selectors, ~256 `isCapacitorIos/isNativeApp` template branches | Two parallel UIs (web and iOS) maintained in the same files |
| Icons | One library already: `@lucide/vue`, re-exported via `utils/app-icons.ts` under legacy Heroicon names | Good base. Rename to native Lucide names during rebuild |
| Fonts | Quicksand / Plus Jakarta Sans (web), Montserrat (iOS), Google Fonts at runtime | Replace with Inter (self-hosted, variable, subset) or system stack |
| Error page | None (`error.vue` missing) | Must be created |
| Tests | 88 unit, 11 Playwright specs, rules tests | Use as regression net after each stage |

### 1.2 Routes

Signed-in product (`layouts/dashboard.vue`):

| Route | Lines | Function |
| --- | --- | --- |
| `/dashboard` | 1,514 | Overview, metrics, recent sales, low stock, first-win checklist |
| `/dashboard/inventory` | 3,254 | Categories grid, copy from branch, duplicate, bulk delete, department filter |
| `/dashboard/inventory/[id]` | 6,074 | Subcategory hub or product table: inline edit, discounts, timeline, import/export, bulk actions, availability filters |
| `/dashboard/receipts` | 3,854 | Sales list, Outstanding, Customers tabs, New sale wizard, Quick sale, refunds, payments, share |
| `/dashboard/customers`, `/dashboard/returns` | ~20 each | Thin entries into the Sales tabs |
| `/dashboard/analytics` | 2,894 | KPIs, charts, insights, PDF/Excel export (Medium+) |
| `/dashboard/leads`, `/leads/[id]` | 601 + detail | Sales leads pipeline (Medium+) |
| `/dashboard/buybacks` | | Customer buybacks (owner) |
| `/dashboard/seller-loans` | 896 | Stock loans (Enterprise) |
| `/dashboard/multi-store-sync` | 1,885 | Transfers, history, consolidated reports (Enterprise) |
| `/dashboard/departments`, `/departments/[id]`, `/stores/[storeId]/departments` | 1,643 / 1,264 | Departments and staff roster, permissions |
| `/dashboard/activity` | 709 | Activity logs (Medium+) |
| `/dashboard/notifications` | | Notification feed |
| `/dashboard/storefront` (+ inquiries redirect) | 804 | Storefront management (not live) |
| `/dashboard/payment-links` | 785 | Payment links (not live) |
| `/dashboard/settings` | 2,432 | Account, workspace style, branches, inventory, payments, receipts, export |
| `/dashboard/profile` | 2,995 | Profile, preferences, security, 2FA, sessions, billing |
| `/dashboard/help` | 492 | Help center |
| `/dashboard/onboarding` | 524 | 3-step setup |
| `/dashboard/verify-email`, `/change-password`, `/experience-unavailable` | | Utility screens |

Public / auth: `/signin`, `/signup`, `/forgot-password`, `/auth/action`, `/demo`, `/r/[token]` (shared receipt), `/pay/[token]` (payment link checkout), `/store/[slug]` and `/store/[slug]/p/[itemId]` (public storefront). Marketing: `/`, `/features`, `/pricing`, `/security`, `/privacy`, `/terms`.

### 1.3 Requested modules that do not exist

| Requested | Reality | Proposal |
| --- | --- | --- |
| Procurement | No purchase orders, suppliers or receiving flow anywhere in code or data | Not part of a UI replacement. Needs product + data design. Reserve a nav slot only if confirmed |
| Lease management | Closest is **Stock loans** (lend serial stock to resellers until sold/returned) | Treat "Leases" as Stock loans, or scope as a new feature separately |
| Reports | Exists as **Analytics** (+ Multi-Store consolidated reports, Data export) | Rename to "Reports" in the new IA |
| Products | Lives inside Inventory categories | Keep inside Inventory; add an all-products view (UI-only, uses existing queries) |
| Branches | Inside Settings | Promote to its own screen under Organization |

### 1.4 Current UI patterns (and why they get replaced)

- **Shell**: dense sidebar with five group labels and up to 17 items, header with branch pill, search, assistant, bell, avatar; separate native tab bar + FAB + more-sheet. Navigation is visually dominant and differs by platform.
- **Pages**: every page re-implements its own header, metric strip, toolbar, table, pagination and empty state with page-specific classes, so similar things look slightly different everywhere.
- **Tables**: one table style with global `!important` overrides (padding forced to 16px), separate mobile card lists per page.
- **Overlays**: `Modal`, `SidePanel`, `DashboardNativeSheet`, iOS drawers and ad-hoc teleported menus coexist.
- **Styling**: glass effects, gradients, many radii and shadow recipes, three font families, tokens defined in several files with overrides layered on top.
- **States**: skeletons exist for some screens; empty and error states are inconsistent; no error page.

### 1.5 Reuse / refactor / replace

| Keep as-is (logic) | Refactor (keep behaviour, extract from pages) | Replace (presentation) |
| --- | --- | --- |
| All `stores/*` | Wizard state in `CreateReceiptWizard` / `QuickSaleModal` into composables (`useSaleDraft`) | `layouts/dashboard.vue` shell |
| Logic composables (`usePermissions`, `useSubscriptionFeatures`, `usePreferences`, `usePaymentTenders`, `useFirestorePaths`, `useActivityLog`, `useReceiptTimeline`, ...) | Inventory page orchestration (filters, pagination, inline edit) into composables | `components/ui/*`, `components/dashboard/*`, `components/ios/*` |
| `utils/*` business helpers (receipt status, availability, margin, tenders, nav filtering/gating) | Nav definitions (`dashboard-web-nav-groups`, `dashboard-native-nav`, `dashboard-native-more-groups`) into one `navigation` config | All dashboard and native CSS (`dashboard-*`, `web-glass-app`, `web-design-tokens`, `capacitor-*`, `ios-*`) |
| `server/**`, `firestore.rules`, Firebase setup | Large page files split into page shell + feature components | Every dashboard page template, auth pages, onboarding |
| `@lucide/vue` | `utils/app-icons.ts` (move to direct Lucide names) | Fonts (Inter replaces Quicksand/Plus Jakarta/Montserrat) |

---

## 2. Proposed information architecture

### 2.1 Primary destinations (same five on desktop and mobile)

| # | Destination | Contains | Replaces |
| --- | --- | --- | --- |
| 1 | **Overview** | Business performance, alerts, recent activity, branch performance, quick actions | Dashboard |
| 2 | **Inventory** | All products, Categories, Low stock, Transfers (Enterprise), Buybacks (owner), Stock loans (Enterprise) | Inventory, Multi-Store Sync (transfers), Buybacks, Stock loans |
| 3 | **Sales** | Sales (receipts), Outstanding, Returns, Leads (Medium+); primary action **New sale** | Sales/Receipts, Returns, Sales leads |
| 4 | **Customers** | Customer list, customer detail with history and balance | Customers tab inside Sales |
| 5 | **More** (mobile) / secondary nav (desktop) | Reports, Team, Branches, Activity, Storefront (Soon), Payment links (Soon), Settings, Help | Everything else |

### 2.2 Desktop navigation

Slim left rail (expanded 232px, collapsible to 64px icons):

```
[Logo]
[Branch switcher: Port Harcourt ▾]

Overview
Inventory
Sales
Customers
Reports            (lock if Micro)

OPERATIONS (collapsible)
  Transfers        (Enterprise)
  Stock loans      (Enterprise)
  Buybacks         (owner)
  Storefront       Soon
  Payment links    Soon

ORGANIZATION (collapsible)
  Team             (departments, staff, roles)
  Branches
  Activity         (Medium+)

---
Help    Settings
[Avatar · Name · Plan]
```

Top bar per page (not global chrome): page title, page-level actions, global search (Cmd/Ctrl+K), Assistant, Notifications. Branch context always visible in the rail.

### 2.3 Mobile navigation

Bottom bar: **Overview · Inventory · Sales · Customers · More**. A single primary action per screen (New sale on Sales and Overview, Add product on Inventory). Inventory and Sales use top segmented tabs for their sub-areas. "More" is a grouped list with the same Operations / Organization / Account groups.

### 2.4 Route mapping

Existing URLs keep working so bookmarks, notifications and deep links do not break. New paths are aliases or redirects only where the IA changes.

| New location | Route |
| --- | --- |
| Overview | `/dashboard` |
| Inventory > Categories / products | `/dashboard/inventory`, `/dashboard/inventory/[id]` |
| Inventory > Transfers | `/dashboard/multi-store-sync` |
| Inventory > Buybacks / Stock loans | `/dashboard/buybacks`, `/dashboard/seller-loans` |
| Sales > Sales / Outstanding / Returns | `/dashboard/receipts` (tabs), `/dashboard/returns` |
| Sales > Leads | `/dashboard/leads` |
| Customers | `/dashboard/customers` (promoted to a real page using the existing customers store) |
| Reports | `/dashboard/analytics` |
| Team | `/dashboard/departments/**` |
| Branches | `/dashboard/settings#branches` initially, then `/dashboard/branches` |
| Activity | `/dashboard/activity` |

Plan, role and "Just me / Growing business" gating continues to come from the existing nav filter utilities; only the presentation changes.

---

## 3. Proposed delivery plan

Each stage ends with: unit tests, rules tests where relevant, a production build, and browser checks in light/dark at mobile, tablet and desktop widths.

| Stage | Output |
| --- | --- |
| 2 Design system | `assets/css/storvv-ds/` tokens (color, type, 8pt spacing, radius, elevation, motion), Inter self-hosted, dark mode |
| 3 Shell | New layout, rail, top bar, mobile bottom bar, branch switcher, search, notifications, user menu. Old shell removed |
| 4 Components | `components/s/*` library (Button, IconButton, Input, Select, Search, Textarea, Checkbox, Switch, Card, List, ListItem, DataTable with mobile list mode, Badge, Avatar, Modal, Drawer/Sheet, Dropdown, Tabs, Tooltip, PageHeader, Section, EmptyState, LoadingState, ErrorState, SuccessState, Toast, ConfirmDialog, BottomNav, NavItem) |
| 5 to 10 | Overview, Inventory, Sales (choose products, review, complete, receipt), Customers, Team, Branches, Reports and secondary modules, Auth and onboarding (3 skippable screens) |
| 11 Mobile | Same components, mobile layouts verified; Capacitor-specific CSS retired as each screen is rebuilt |
| 12 | Remove remaining legacy components and CSS files; delete unused assets |
| 13 to 14 | Accessibility (keyboard, focus, labels, contrast, reduced motion) and visual consistency pass |

Legacy CSS and components are deleted screen by screen as they stop being referenced, so the two systems never ship mixed on the same screen.

---

## 4. Decisions needed before Stage 2

1. **Logo**: path to the new official logo (the brief says `[INSERT LOGO PATH]`).
2. **Procurement and lease management**: build as new features (needs data design) or treat Leases = Stock loans and defer Procurement.
3. **Figma**: should the redesign follow the WebApp Figma file shared earlier (requires the Figma MCP connection), or is this brief the design source?
4. **Marketing site**: in or out of scope.
5. **Accent color**: keep Storvv navy #143F8D as the single accent, or define a new brand accent with the new logo.
