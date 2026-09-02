# Storvv iOS - Premium Design System & Redesign Spec

**Role:** Senior iOS product design + Apple HIG alignment  
**Scope:** Visual system, interaction patterns, native iOS UX - **no business logic changes**  
**Platform:** Capacitor iOS shell (`html.capacitor-native`)  
**Companion:** [STORVV_PRODUCT_STATE.md](./STORVV_PRODUCT_STATE.md), existing native CSS in `assets/css/capacitor-native*.css`

**Design north star:** *“Apple designed an inventory operating system.”*

---

## 1. Design principles (priority order)

| # | Principle | Meaning in Storvv |
|---|-----------|-------------------|
| 1 | **Simplicity** | One primary action per screen; progressive disclosure for Enterprise features |
| 2 | **Speed** | Sales in ≤4 taps; inventory lookup ≤2 taps; bottom sheets over full-page forms |
| 3 | **Trust** | Stable typography, consistent numbers, clear branch context, no visual noise |
| 4 | **Professionalism** | Enterprise data density without spreadsheet ugliness |
| 5 | **Native iOS feel** | Tab bar, grouped lists, SF Pro, spring motion, safe areas, Dynamic Type |

**Avoid:** heavy gradients, neon cyberpunk, gaming UI, decorative color, web-style dense sidebars on phone.

---

## 2. Information architecture (preserved)

All existing routes and plan/role gates stay. This spec only changes **presentation** and **navigation grouping** on native.

### 2.1 Bottom tab bar (target)

| Tab | Label | Primary routes | Notes |
|-----|-------|----------------|-------|
| **Home** | Home | `/dashboard` | Command center; replaces “Dashboard” mentally |
| **Inventory** | Inventory | `/dashboard/inventory`, `/dashboard/inventory/[id]`, buybacks entry | Buybacks stays super-admin; surface via Inventory hub card or More |
| **Sales** | Sales | `/dashboard/receipts` (all tabs) | Create sale FAB; Quick Sale secondary |
| **Analytics** | Analytics | `/dashboard/analytics` | Medium+ gate → upsell sheet |
| **More** | More | Sheet menu | Everything else |

**More sheet contents (grouped, iOS Settings style):**

```
OPERATIONS
  Customer buybacks      → /dashboard/buybacks
  Stock loans            → /dashboard/seller-loans
  Multi-Store Sync       → /dashboard/multi-store-sync
  Payment links          → /dashboard/payment-links

ORGANIZATION
  Branches & departments → /dashboard/settings (Branches) + departments routes
  Staff                  → department staff flows
  Activity logs          → /dashboard/activity

ACCOUNT
  Settings               → /dashboard/settings
  Profile & security     → /dashboard/profile
  Subscription           → /dashboard/settings (scroll)
  Help & Assistant       → /dashboard/help
  Notifications          → /dashboard/notifications
```

**Implementation hook:** Extend `utils/dashboard-native-nav.ts` - set `NATIVE_PRIMARY_ORDER` to `['Dashboard', 'Inventory', 'Sales', 'Analytics']` and map labels in `nativeNavShortLabel`.

### 2.2 Top chrome (native)

Replace minimal title bar with **command header**:

```
┌─────────────────────────────────────────────┐
│ Good morning, Ada          [🔔] [Avatar]    │
│ Lagos, Lekki            ▾                   │
└─────────────────────────────────────────────┘
```

- **Greeting:** time-based (“Good morning/afternoon/evening”) + first name from profile  
- **Branch selector:** compact pill; opens `DashboardNativeSheet` branch picker (reuse store switcher logic)  
- **Notifications:** bell with badge  
- **Avatar:** profile shortcut  

**Existing:** `layouts/dashboard.vue` native top nav → evolve to `NativeCommandHeader.vue`.

---

## 3. Visual language - glass & depth

Inspired by iOS 18 materials + Vision Pro restraint (professional, not sci-fi).

### 3.1 Material tiers

| Tier | Use | Native CSS token |
|------|-----|------------------|
| **Canvas** | App background | `--ios-canvas` |
| **Glass panel** | Cards, sheets, tab bar | `--ios-glass-bg` + `backdrop-filter` |
| **Elevated glass** | FAB, floating stat hero | `--ios-glass-elevated` |
| **Solid surface** | Inputs, toggles, list rows (readable) | `--ios-surface-solid` |
| **Separator** | Hairlines | `--ios-separator` |

### 3.2 Proposed tokens (add to `capacitor-native.css`)

```css
html.capacitor-native {
  /* Light */
  --ios-canvas: #f2f2f7;                    /* iOS grouped background */
  --ios-glass-bg: rgb(255 255 255 / 0.72);
  --ios-glass-border: rgb(255 255 255 / 0.8);
  --ios-glass-highlight: inset 0 1px 0 rgb(255 255 255 / 0.6);
  --ios-glass-shadow: 0 8px 32px rgb(0 0 0 / 0.06);
  --ios-glass-blur: 24px;
  --ios-surface-solid: #ffffff;
  --ios-separator: rgb(60 60 67 / 0.12);
  --ios-label: #000000;
  --ios-label-secondary: rgb(60 60 67 / 0.6);
  --ios-accent: #143f8d;                      /* Storvv primary */
  --ios-accent-muted: rgb(20 63 141 / 0.12);
  --ios-success: #34c759;
  --ios-warning: #ff9500;
  --ios-danger: #ff3b30;
  --ios-radius-sm: 12px;
  --ios-radius-md: 16px;
  --ios-radius-lg: 20px;
  --ios-radius-xl: 28px;
  --ios-space-xs: 4px;
  --ios-space-sm: 8px;
  --ios-space-md: 16px;
  --ios-space-lg: 24px;
  --ios-space-xl: 32px;
}

html.capacitor-native.dark {
  --ios-canvas: #000000;
  --ios-glass-bg: rgb(28 28 30 / 0.72);
  --ios-glass-border: rgb(255 255 255 / 0.08);
  --ios-glass-highlight: inset 0 1px 0 rgb(255 255 255 / 0.06);
  --ios-glass-shadow: 0 12px 40px rgb(0 0 0 / 0.45);
  --ios-surface-solid: #1c1c1e;
  --ios-separator: rgb(84 84 88 / 0.65);
  --ios-label: #ffffff;
  --ios-label-secondary: rgb(235 235 245 / 0.6);
  --ios-accent-muted: rgb(20 63 141 / 0.28);
}
```

### 3.3 Glass card recipe

```css
.ios-glass-card {
  background: var(--ios-glass-bg);
  backdrop-filter: blur(var(--ios-glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--ios-glass-blur)) saturate(180%);
  border: 1px solid var(--ios-glass-border);
  box-shadow: var(--ios-glass-shadow), var(--ios-glass-highlight);
  border-radius: var(--ios-radius-lg);
}
```

**Fallback (reduce motion / low power):** `@media (prefers-reduced-transparency: reduce)` → solid `--ios-surface-solid`.

---

## 4. Typography (SF Pro hierarchy)

Use system stack already in `--app-font-sans`. Define semantic roles:

| Role | Size | Weight | Use |
|------|------|--------|-----|
| **Large title** | 34px / 41 line | Bold | Home greeting (optional collapse) |
| **Title 1** | 28px | Bold | Screen titles |
| **Title 2** | 22px | Semibold | Section headers |
| **Title 3** | 20px | Semibold | Card titles |
| **Headline** | 17px | Semibold | List row primary |
| **Body** | 17px | Regular | Body copy |
| **Callout** | 16px | Regular | Secondary body |
| **Subhead** | 15px | Regular | Metadata |
| **Footnote** | 13px | Regular | Captions |
| **Caption** | 12px | Medium | Tab labels, badges |

### 4.1 Stat numerals (business-critical)

```css
.ios-stat-value {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  letter-spacing: -0.02em;
  font-weight: 600;
}
.ios-stat-value--hero {
  font-size: 2rem;      /* 32px */
  font-weight: 700;
}
.ios-stat-value--compact {
  font-size: 1.25rem;   /* 20px */
}
```

**Currency:** Always show symbol + grouped thousands (existing formatters).  
**Examples on cards:** `₦2,450,000` · `3,420 items` · `12 low stock`

Support **Dynamic Type:** use `rem` + `@media` scaling; avoid fixed-height stat rows.

---

## 5. Color as meaning

| Semantic | Light | Dark | When |
|----------|-------|------|------|
| **Accent** | `#143f8d` | `#5b8fd9` | Primary buttons, active tab, links |
| **Revenue up** | `#34c759` | `#30d158` | Positive delta |
| **Revenue down** | `#ff3b30` | `#ff453a` | Negative delta (sparingly) |
| **Warning** | `#ff9500` | `#ff9f0a` | Low stock, balance due |
| **Neutral metric** | label secondary | label secondary | Counts, labels |

Do not color entire cards - use **left accent stripe** (4px) or **small badge** only.

---

## 6. Component system

Build under `components/ios/` (native-only via `v-if="isNativeApp"` or CSS scoping).

### 6.1 Core components

| Component | Purpose | Replaces / wraps |
|-----------|---------|------------------|
| `IosGlassCard` | Base floating panel | `.dash-card` on native |
| `IosStatCard` | Metric + delta + subtitle | `DashboardPageMetrics`, home tiles |
| `IosCategoryCard` | Inventory category grid cell | `InventoryCategoryCard` |
| `IosProductRow` | List row with thumb, stock pill | table rows on native |
| `IosAnalyticsCard` | Insight card from analytics | `AnalyticsFeatureInsightCard` |
| `IosNativeListRow` | Settings-style row | settings rows |
| `IosSearchBar` | UISearchBar-like | inventory search |
| `IosSegmentedControl` | Period picker, receipt tabs | custom toggles |
| `IosFloatingActionButton` | Primary action | header buttons |
| `IosEmptyState` | Illustration + CTA | `DashboardTableEmptyState` |
| `IosSkeleton` | Loading placeholders | spinners |

**Sheets:** Continue `DashboardNativeSheet` - add variants:
- `variant="glass"` - frosted large detent
- `variant="checkout"` - sale flow steps
- `variant="picker"` - branch/category selection

### 6.2 Tab bar redesign

Evolve `DashboardNativeBottomNav.vue`:

- **Floating pill tab bar** inset 16px from bottom safe area (iOS 18 floating tab aesthetic)
- Glass background, blur, subtle border
- **Spring indicator** (existing `native-tabbar__indicator` - soften animation)
- 4 primary tabs + More (5th)
- Haptic: `UIImpactFeedbackGenerator.light` on tab change (Capacitor Haptics plugin - future)

### 6.3 FAB placement

| Screen | FAB | Action |
|--------|-----|--------|
| Inventory | - | Search prominent in header |
| Inventory detail | + | Add product |
| Sales | + | Create New Sale |
| Sales (alt) | Scan icon | Quick Sale / barcode |
| Category hub | + | Add subcategory |

FAB: 56×56, accent fill, white icon, shadow `--ios-glass-shadow`, bottom-right above tab bar.

---

## 7. Screen specifications

### 7.1 Home (Dashboard `/dashboard`)

**Layout (scroll, pull-to-refresh):**

```
[Command Header]

[Revenue Hero Card - glass, full width]
  Today's sales     ₦XXX,XXX
  vs yesterday      +12.4% ↑
  [sparkline 7-day mini chart]

[2-column stat grid]
  Inventory health  |  Outstanding
  3,420 items       |  ₦XXX due
  12 low stock      |  4 customers

[Business health - horizontal scroll chips]
  Recent sales · Stock moved · Buybacks · Loans

[Widget row - optional Medium+]
  Analytics preview card → tap opens Analytics tab

[Activity snippet]
  Last 3 activity log rows → More → Activity
```

**Interactions:**
- Tap revenue card → Analytics tab, Daily period
- Tap low stock → Inventory filtered view
- Tap branch pill → branch sheet

**Data:** Reuse existing dashboard composables/stores - no new APIs.

### 7.2 Inventory (`/dashboard/inventory`)

```
[Search bar - sticky glass]
[Segmented: Categories | Low stock | Recent]  // optional phase 2

[Stock health banner - only if alerts]
  "12 products need attention"

[Category grid - 2 columns]
  Glass category cards:
 - Name, item count, subcategory count
 - Status dot (healthy / low / empty)

[Floating: none on list; + on detail]
```

**Category card anatomy:**
- 64px icon/gradient tile (category color, subtle)
- Title (Headline)
- `142 items · 2 subcategories` (Footnote)
- Chevron

**Product detail (`/dashboard/inventory/[id]` leaf):**
- Hero: optional image placeholder
- Large product name (Title 1)
- Stat row: On hand · Price · Value
- **Grouped list sections:**
 - Details (custom fields)
 - Timeline (history)
 - Sales linked
- **Toolbar actions:** Edit · Discount · More

**Subcategory hub:** Same grid, breadcrumb in header, “Add subcategory” as inset grouped button.

### 7.3 Sales (`/dashboard/receipts`)

**Native layout:**
- Segmented control: Receipts | Returns | Customers (keep existing tabs, iOS styling)
- **FAB:** New sale
- Receipt rows: `IosProductRow` pattern - customer, amount, status pill, time
- Swipe actions (phase 2): View · Share · Refund (manager+)

**Create Sale flow - bottom sheet stack:**

| Step | Sheet title | Content |
|------|-------------|---------|
| 1 | Category | Grid of parent categories (glass cells) |
| 2 | Products | Search + list; subcategory step if needed |
| 3 | Cart | Lines, qty steppers, add from another category |
| 4 | Checkout | Customer, payment, balance due |
| 5 | Done | Receipt preview, share, print |

Reuse `CreateReceiptWizard` / `QuickSaleModal` logic - re-skin as sheet steps (`DashboardNativeSheet` multi-step).

**Quick Sale:** Separate sheet with scan field pinned top (barcode wedge).

### 7.4 Analytics (`/dashboard/analytics`)

**Executive layout:**

```
[Period segmented: Day | Week | Month]

[Hero revenue card + main chart - full bleed glass]

[Insight cards - 2 column grid, scroll]
  Feature insights (existing data)

[Charts stack - single column]
  Each in glass card, 200-240px chart height

[Export bar - sticky bottom inset]
  PDF | Excel
```

Charts: simplify ApexCharts theme for native - muted grid, accent stroke, no heavy legends.

### 7.5 More → Settings (`/dashboard/settings`)

**iOS Settings pattern:**

```
Grouped inset lists (rounded rect container):

ACCOUNT
  Logo, business name          >
  Subscription               >

BUSINESS
  Branches                   >
  Receipt numbering          >
  Payment methods            >

DATA
  Export all data            >

SECURITY
  View on Profile            >
```

Use `IosNativeListRow` with chevron, optional value on right.

**Create Branch sheet:** Keep existing fields; city picker + area + subcategories toggle with native list styling.

### 7.6 Empty states

Template `IosEmptyState`:

- Icon: SF Symbol-style line icon (existing Lucide, 48px, muted)
- Title: Title 3
- Body: Subhead, max 2 lines
- Primary button: filled accent
- Secondary: text button

Copy examples:
- Inventory: “No categories yet” → “Create category”
- Products: “No products in this category” → “Add product”
- Sales: “No receipts today” → “Create sale”
- Analytics (Micro): “Upgrade to see insights” → “View plans”

---

## 8. Motion & feedback

| Pattern | Spec |
|---------|------|
| Page push | iOS standard - slide from trailing edge (Vue `<Transition name="ios-push">`) |
| Sheet present | Spring damping 0.86, duration ~0.45s |
| Card press | Scale 0.98, opacity 0.92, 120ms |
| Tab indicator | Spring follow (existing, tune easing) |
| Pull to refresh | Native rubber-band + spinner in nav bar area |
| Skeleton | Shimmer 1.2s ease-in-out, respect reduced motion |

**Avoid:** parallax, particle effects, bounce loops.

---

## 9. Dark mode

- Canvas: true black `#000` for OLED
- Glass: higher blur, lower opacity fill
- Charts: light lines on dark glass
- Elevated shadows: deeper, no white inset on dark cards
- Test contrast: WCAG AA for all stat text

Toggle: existing `stores/theme.ts` - ensure native tab bar and glass tokens swap instantly (160ms theme transition already optimized).

---

## 10. Accessibility

- **Dynamic Type:** All body uses relative units; cards grow vertically
- **VoiceOver:** Every glass card = one accessibility element or logical grouping; stat cards read “Today’s sales, 2 million naira, up 12 percent”
- **Touch targets:** Minimum 44×44pt (already enforced on native tab bar)
- **Reduce Transparency:** Solid surfaces fallback
- **Reduce Motion:** Disable sheet spring, use cross-fade

---

## 11. Implementation roadmap

### Phase 1 - Foundation (1-2 weeks)
- [x] Add `--ios-*` tokens to `ios-design-tokens.css` / `ios-system.css`
- [x] `IosGlassCard`, `IosStatCard`, `IosNativeListRow`
- [x] Update tab bar to 4-tab + More; Payment links promoted when live
- [x] `NativeCommandHeader` on Home

### Phase 2 - Home & Inventory (2-3 weeks)
- [ ] Redesign `/dashboard` native layout with hero + stat grid
- [ ] Inventory category grid glass cards
- [ ] `IosSearchBar` sticky header
- [ ] Product detail grouped lists

### Phase 3 - Sales sheets (2-3 weeks)
- [ ] Create Sale as multi-step native sheet
- [ ] Quick Sale scan-first sheet
- [ ] FAB wiring

### Phase 4 - Analytics & Settings (1-2 weeks)
- [ ] Analytics native executive layout
- [ ] Settings grouped lists
- [ ] Empty states pass

### Phase 5 - Polish (ongoing)
- [ ] Pull-to-refresh
- [ ] Skeleton loaders
- [ ] Haptics
- [ ] Swipe actions on receipts

**Rule:** All changes scoped under `html.capacitor-native` or `components/ios/*` - **web dashboard unchanged**.

---

## 12. File map (engineering)

| Area | Files |
|------|-------|
| Tokens | `assets/css/ios-design-tokens.css`, `assets/css/ios-system.css` (import in `ios-native.css`) |
| Composables | `composables/useIosDesignSystem.ts`, `composables/useIosTypography.ts` |
| Tab nav | `components/dashboard/DashboardNativeBottomNav.vue`, `utils/dashboard-native-nav.ts` |
| Header | `components/ios/NativeCommandHeader.vue` (new), `layouts/dashboard.vue` |
| Home | `pages/dashboard/index.vue` (+ native-only template block) |
| Inventory | `pages/dashboard/inventory/index.vue`, `[id].vue`, `InventoryCategoryCard.vue` |
| Sales | `pages/dashboard/receipts.vue`, `QuickSaleModal.vue`, `CreateReceiptWizard` |
| Analytics | `pages/dashboard/analytics.vue`, insight cards |
| Settings | `pages/dashboard/settings.vue` |
| Sheets | `components/dashboard/DashboardNativeSheet.vue`, `composables/useDashboardNativeSheetChrome.ts` |
| Shared | `composables/useCapacitorNativeApp.ts`, `useNativeTableLayout.ts` |

---

## 13. Reference comparisons

| App | What to borrow |
|-----|----------------|
| **Apple Health / Wallet** | Glass cards, large numerals, grouped lists |
| **Apple Settings** | Inset grouped tables, chevrons, section footers |
| **Linear** | Calm spacing, monochrome + one accent |
| **Shopify POS** | Fast checkout steps, large product tiles |
| **Stripe Dashboard** | Trustworthy metrics, subtle charts |

---

## 14. Success criteria

Users should say:
- “This feels like a real iPhone app, not a website.”
- “I can see my money and stock in one glance.”
- “Creating a sale is faster than my old notebook.”

Measure (post-launch):
- Time to complete sale (native)
- Home screen engagement (scroll depth, card taps)
- App Store screenshots quality vs. Shopify/Stripe benchmarks

---

## 15. Out of scope (this redesign)

- Changing Firestore schema, plan gates, or role rules
- Replacing ApexCharts library (re-theme only)
- Android-specific Material redesign (can follow later with shared tokens)
- Payment links functional launch (UI can preview; feature flag remains)

---

*This document is the single source of truth for Storvv iOS premium UI. Implement phase-by-phase; review each screen against Apple HIG § Materials, § Layout, § Navigation, and § Accessibility.*
