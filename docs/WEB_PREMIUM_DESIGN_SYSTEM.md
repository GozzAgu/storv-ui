# Storvv Web - Premium SaaS Design System & Redesign Spec

**Role:** Senior SaaS product design + frontend architecture  
**Scope:** Visual system, UX, layout, components - **no business logic, routes, permissions, or data changes**  
**Platform:** Web dashboard (`html:not(.capacitor-native)`)  
**Companion:** [STORVV_PRODUCT_STATE.md](./STORVV_PRODUCT_STATE.md), [IOS_PREMIUM_DESIGN_SYSTEM.md](./IOS_PREMIUM_DESIGN_SYSTEM.md)

**Design north star:** *“Apple designed Shopify for modern retailers.”*

---

## 1. Design principles

| Priority | Principle | Storvv expression |
|----------|-----------|-------------------|
| 1 | **Premium SaaS appearance** | Glass surfaces, confident spacing, no Bootstrap clutter |
| 2 | **Speed & usability** | Command palette, global search, guided sale flow, sticky tables |
| 3 | **Clear business insights** | Large tabular numerals, semantic color, executive analytics |
| 4 | **Enterprise trust** | Stable chrome, branch context always visible, restrained palette |
| 5 | **Beautiful simplicity** | One accent, neutral foundation, purposeful motion |

**Avoid:** rainbow dashboards, heavy gradients, overcrowded tables, decorative icons, generic admin templates.

**References:** macOS apps, Linear, Stripe Dashboard, Shopify Admin, Notion, Vercel.

---

## 2. Global visual system

### 2.1 Color tokens

Implemented in `assets/css/web-design-tokens.css` as `--saas-*` on `.dashboard-layout-root`.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--saas-canvas` | `#f4f6fb` | `#07080c` | Page background |
| `--saas-surface` | `#ffffff` | `#12141c` | Solid panels |
| `--saas-glass-bg` | `rgb(255 255 255 / 0.78)` | `rgb(18 20 28 / 0.82)` | Cards, sidebar |
| `--saas-glass-border` | `rgb(15 23 42 / 0.08)` | `rgb(255 255 255 / 0.08)` | Hairlines |
| `--saas-accent` | `#143f8d` | `#9ab5e3` | Primary actions, links |
| `--saas-accent-soft` | `rgb(20 63 141 / 0.08)` | `rgb(154 181 227 / 0.12)` | Active nav, badges |
| `--saas-success` | `#34d399` | `#34d399` | Revenue up, completed |
| `--saas-warning` | `#fbbf24` | `#fbbf24` | Low stock, pending |
| `--saas-danger` | `#f87171` | `#f87171` | Errors, balance due |
| `--saas-ink` | `#0f172a` | `#f8fafc` | Primary text |
| `--saas-muted` | `#64748b` | `#94a3b8` | Labels, meta |

**Rule:** Color communicates status - never decorates empty space.

### 2.2 Typography

System stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif` (already in use).

| Role | Size | Weight | Example |
|------|------|--------|---------|
| Display greeting | 1.75rem | 600 | Good afternoon, Franklin |
| Page title | 1.25rem | 600 | Inventory |
| Section title | 0.6875rem | 600 | OVERVIEW (nav groups) |
| Metric hero | 2rem | 700 | ₦2,450,000 |
| Metric compact | 1.25rem | 600 | 3,420 |
| Body | 0.9375rem | 400 | Descriptions |
| Label | 0.8125rem | 500 | Total revenue |

Use `font-variant-numeric: tabular-nums` on all business numbers (class: `.saas-stat-value`).

### 2.3 Elevation & glass

Three tiers:

1. **Canvas** - flat background  
2. **Glass card** - `.saas-glass-card` - blur 20px, subtle border, soft shadow  
3. **Elevated** - `.saas-glass-card--elevated` - modals, command palette, assistant panel  

```css
.saas-glass-card {
  background: var(--saas-glass-bg);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--saas-glass-border);
  border-radius: 1rem;
  box-shadow: var(--saas-shadow-md);
}
```

---

## 3. Application shell

### 3.1 Desktop layout

```
┌──────────────┬────────────────────────────────────────────┐
│  Floating    │  Top bar: branch · search · 🔔 · AI · user │
│  glass       ├────────────────────────────────────────────┤
│  sidebar     │                                            │
│  (collapsible│  Main content (max-width optional)         │
│   icon rail) │                                            │
│              │                                            │
└──────────────┴────────────────────────────────────────────┘
```

**Sidebar (web only):**
- Inset 12px from viewport edges on `lg+`
- 16px corner radius, glass background
- Collapse to 72px icon rail with tooltips
- Grouped navigation sections (see §3.2)

**Top bar:**
- Frosted glass, sticky
- Branch selector (existing store switcher)
- Global search (⌘K)
- Notifications
- Assistant FAB / entry
- Profile menu

### 3.2 Sidebar navigation groups

Routes and permissions unchanged. Items are **visually grouped** with section labels:

| Section | Nav items (existing names) |
|---------|---------------------------|
| **Overview** | Dashboard |
| **Commerce** | Inventory, Sales |
| **Stock operations** | Customer buybacks, Stock loans, Multi-Store Sync, Payment links |
| **Organization** | Departments (+ expandable branches block for super admins) |
| **Insights** | Analytics, Activity Logs |
| **Account** | Help center, Settings, Profile |

**Note:** Customers are accessed via **Sales → Customers tab** (`/dashboard/receipts`). No new route required.

Implementation: `utils/dashboard-web-nav-groups.ts` + section labels in `layouts/dashboard.vue` (web only).

### 3.3 Tablet & mobile web

- Sidebar → drawer overlay (existing)
- Top bar compact: logo trigger + page title
- Cards stack single column
- Tables → existing mobile accordion (`dashboard-mobile-table-accordion.css`)

---

## 4. Screen specifications

### 4.1 Dashboard (command center)

**Header:**
```
Good afternoon, Franklin          [Create sale] [Quick actions ▾]
Lagos · Lekki branch
```

**Metric grid (4 columns desktop, 2 tablet, 1 mobile):**

| Card | Primary | Secondary |
|------|---------|-----------|
| Revenue | Today's sales | vs prior period % |
| Inventory health | Total products | Low / out of stock |
| Customers | New today | Outstanding balances |
| Operations | Recent activity count | Stock movement hint |

**Below:**
- Revenue chart (Daily / Weekly / Monthly segmented control)
- Payment methods + top products (side column)
- Activity snippet + quick links

**Components:** `SaasMetricCard`, existing `StatCard` (enhanced via tokens), `SaasGlassCard`.

### 4.2 Inventory

**Header actions:** + Add Product · + Create Category · Import · Export

**Search:** Full-width `.saas-search-bar` - sticky below top nav on scroll

**Category grid:**
- Glass cards with icon tile, name, product count, stock value, health dot
- Hover: subtle lift (`translateY(-2px)`)

**Product table:**
- Sticky header row
- Existing `DataTableToolbar` + column prefs
- Row hover highlight, status pills
- Bulk select + export (unchanged logic)

### 4.3 Create sale (guided workflow)

Existing wizard logic; visual treatment:

```
Step indicator: Category → Product → Customer → Payment → Receipt
```

- **SidePanel** / drawer with glass header
- Large category tiles
- Product list with search
- Customer picker + payment step
- Receipt confirmation with share/print

Feel: Stripe Checkout clarity + Shopify POS speed.

### 4.4 Sales & receipts

Tabs: **Receipts · Returns · Customers** (existing)

Receipt rows/cards show:
- Customer name
- Amount (tabular nums)
- Status pill: Completed · Pending · Balance due · Refunded
- Date + actions menu

### 4.5 Analytics (executive)

- Period segmented control
- Hero revenue + main chart (minimal grid, accent stroke)
- Feature insight grid (`AnalyticsFeatureInsightCard`)
- Export bar (PDF / Excel)

Chart theme: Apple Fitness / Stripe - muted axes, no chart junk.

### 4.6 Settings

macOS System Settings + Stripe layout:

Grouped `.saas-grouped-section` blocks:

```
ACCOUNT        Business logo, subscription
BUSINESS       Branches, receipt numbering, payment methods
SECURITY       Link to Profile
DATA           Export all data
NOTIFICATIONS  (future)
```

Toggle switches: existing checkbox/toggle components, unified spacing.

### 4.7 AI Assistant

- Floating button (existing `DashboardAssistant`)
- Glass chat panel with blur
- Suggested prompts as chips
- No markdown bold in replies (already enforced)

---

## 5. Component library

| Component | Path | Purpose |
|-----------|------|---------|
| `SaasGlassCard` | `components/saas/SaasGlassCard.vue` | Base glass panel |
| `SaasMetricCard` | `components/saas/SaasMetricCard.vue` | KPI with delta + sparkline |
| `SaasNavSection` | CSS class `.saas-nav-section-label` | Sidebar group headers |
| `SaasGroupedSection` | `components/saas/SaasGroupedSection.vue` | Settings-style groups |
| `SaasListRow` | `components/saas/SaasListRow.vue` | Settings row with chevron |
| `SaasSearchBar` | CSS + existing search | Inventory / global |
| `StatCard` | `components/ui/StatCard.vue` | Enhanced via tokens |
| `EmptyState` | `components/ui/EmptyState.vue` | Polished empty states |
| `SidePanel` | `components/ui/SidePanel.vue` | Drawers / sale flow |
| `DataTableToolbar` | existing | Table chrome |

Native iOS equivalents live in `components/ios/` - do not mix scopes.

---

## 6. Motion & interaction

| Pattern | Spec |
|---------|------|
| Sidebar collapse | 300ms `cubic-bezier(0.22, 1, 0.36, 1)` |
| Card hover | `translateY(-2px)` + shadow deepen, 180ms |
| Card press | `scale(0.99)`, 120ms |
| Drawer | Slide from right, 320ms spring |
| Page enter | Fade + 8px Y, 200ms |
| Skeleton | Shimmer 1.4s |
| Dropdown | Scale 0.98→1 + fade, 150ms |

`prefers-reduced-motion`: disable transforms, keep opacity fades.

---

## 7. Responsiveness matrix

| Breakpoint | Sidebar | Metrics | Tables |
|------------|---------|---------|--------|
| `< lg` | Drawer | 1-2 col | Accordion rows |
| `lg-xl` | Floating full | 2-3 col | Horizontal scroll |
| `≥ xl` | Floating / collapsed | 4 col | Full table |

---

## 8. Accessibility

- WCAG AA contrast on all text
- Focus rings: `ring-2 ring-[#143f8d]/40`
- 44px min touch targets on mobile web
- `aria-current="page"` on active nav
- Section labels: `aria-hidden` decorative or `<h2 class="sr-only">`

---

## 9. Implementation roadmap

### Phase 1 - Foundation ✅ (started)
- [x] `web-design-tokens.css` - tokens, glass cards, floating sidebar
- [x] Sidebar nav section labels
- [x] `SaasGlassCard`, `SaasMetricCard`, `SaasGroupedSection`, `SaasListRow`
- [x] Time-based dashboard greeting (web)

### Phase 2 - Shell polish
- [ ] Top nav visual refresh (search pill, action cluster)
- [ ] Dashboard home metric grid with `SaasMetricCard`
- [ ] Card hover animations globally

### Phase 3 - Inventory & sales
- [ ] Category card redesign
- [ ] Sticky inventory search
- [ ] Sale wizard step chrome

### Phase 4 - Analytics & settings
- [ ] Chart theme tokens for ApexCharts
- [ ] Settings grouped layout with `SaasGroupedSection`

### Phase 5 - Polish
- [ ] Page transitions
- [ ] Enhanced empty states pass
- [ ] Assistant panel glass treatment

**Scope rule:** All web changes under `html:not(.capacitor-native)` or `components/saas/*`. Capacitor uses `ios-design-tokens.css`.

---

## 10. File map

| Area | Files |
|------|-------|
| Tokens | `assets/css/web-design-tokens.css` |
| Shell | `assets/css/dashboard-shell.css`, `layouts/dashboard.vue` |
| Cards | `assets/css/dashboard-cards.css`, `components/saas/*` |
| Nav groups | `utils/dashboard-web-nav-groups.ts` |
| Home | `pages/dashboard/index.vue`, `composables/useTimeGreeting.ts` |
| Inventory | `pages/dashboard/inventory/index.vue` |
| Sales | `pages/dashboard/receipts.vue` |
| Analytics | `pages/dashboard/analytics.vue` |
| Settings | `pages/dashboard/settings.vue` |
| Assistant | `components/dashboard/DashboardAssistant.vue` |

---

## 11. Success criteria

Users should feel:
- *My business data is secure*
- *My store looks professional*
- *I can manage everything easily*
- *This product is worth paying for*

Benchmark visually against Stripe Dashboard, Shopify Admin, and Linear - not generic admin templates.

---

*Single source of truth for Storvv web premium UI. Pair with iOS spec for full-platform consistency.*
