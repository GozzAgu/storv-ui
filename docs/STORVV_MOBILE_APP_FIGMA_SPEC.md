# Storvv Mobile App: Step-by-Step UI Specification for Figma (iOS + Android)

Use this document as the single brief for designing the Storvv mobile apps in Figma. It describes every screen, every step of every flow, the exact on-screen copy, the states each screen can be in, and how the same screen differs between iOS and Android.

Everything here mirrors the live Storvv web dashboard (app.storvv.com) and the existing iOS (Capacitor) build. Nothing is invented: labels, statuses, payment methods, plan rules and role rules are taken from the product.

---

## 0. How to use this document in Figma

### 0.1 Suggested prompt preface (paste before any section)

> Design a native mobile app screen for **Storvv**, a retail operating system for shops that manage stock, sales, receipts, customers, staff and multiple branches. Style: calm, premium, trustworthy, professional. One accent color (Storvv navy #143F8D). Plenty of white space, large clear numbers, grouped lists, rounded cards, soft depth. No gradients on data, no neon, no playful illustrations. Produce both **light** and **dark** mode. Follow **Apple Human Interface Guidelines** for the iOS version and **Material Design 3** for the Android version. Use the copy exactly as written.

Then paste the section for the screen you want (for example "7.3 Home").

### 0.2 Frames to create

| Platform | Frame | Size (pt/dp) | Notes |
| --- | --- | --- | --- |
| iOS | iPhone 16 / 15 | 393 × 852 | Primary design size |
| iOS | iPhone SE | 375 × 667 | Check density, no home indicator inset |
| iOS | iPhone 16 Pro Max | 440 × 956 | Check stretch |
| iOS | iPad (optional) | 820 × 1180 | Two-column split view later |
| Android | Pixel 8 / medium phone | 412 × 915 | Primary design size |
| Android | Compact phone | 360 × 800 | Check density |
| Android | Tablet (optional) | 800 × 1280 | Navigation rail instead of bottom bar |

Safe areas:
- iOS: status bar 54pt (Dynamic Island devices), home indicator 34pt.
- Android: status bar 24 to 32dp, gesture navigation bar 24dp (or 48dp for 3-button navigation).

### 0.3 Figma page structure

1. Cover
2. Foundations (colors, type, spacing, radius, elevation, icons)
3. Components (iOS)
4. Components (Android)
5. Flows: Auth and Onboarding
6. Flows: Home
7. Flows: Inventory
8. Flows: Sales
9. Flows: Customers and Outstanding balances
10. Flows: Analytics
11. Flows: Sales leads, Buybacks, Stock loans, Multi-Store Sync
12. Flows: Team (Departments and Staff), Activity logs
13. Flows: Notifications, Profile, Settings, Help and Assistant
14. Flows: Plans, upgrade and Coming soon
15. States (empty, loading, error, offline, locked)
16. Prototype

Name frames with the pattern `Platform / Area / Screen / State`, for example `iOS / Sales / New sale - Items / Default` and `Android / Sales / New sale - Items / Dark`.

---

## 1. What Storvv is (context for the designer)

Storvv is a retail operating system. A shop owner (and their team) uses it to:

1. Organize **inventory** in **categories** (with optional **subcategories**). Each category has its own set of fields (for example Brand, Color, Serial Number, Unit price).
2. Record **sales**. A sale produces a **receipt** with a sale number like `REC-493257`, line items, customer, payment method and status.
3. Handle **returns and refunds**, **part payments (balance due)** and **swap-ins** (customer trades in a device as part of a sale).
4. See **customers** built automatically from sales.
5. Run a **team**: departments, staff, roles and permissions.
6. Run **multiple branches** (stores) and move stock between them.
7. See **analytics**, **activity logs** and **notifications**.

Typical user: a phone, perfume, electronics, fashion or general retail business in Nigeria or similar markets. Currency examples use the Naira (₦), but the app supports any currency chosen during onboarding.

Product facts the design must respect:
- The **web dashboard is live**. The **iOS and Android apps are what you are designing** (marketing labels them "coming soon").
- **Storefront** and **Payment links** are **not live yet**. Show them only as "Coming soon" entries (see section 7.16).
- No prices appear inside the app except on the Subscription screen (regional pricing).

---

## 2. Brand and foundations

### 2.1 Logo

- Wordmark: "Storvv" with a two-tone interlocking "s" mark (files: `public/brand/storvv-logo.png` for light backgrounds, `public/brand/storvv-logo-reversed.png` for dark backgrounds, `public/brand/storvv-symbol.png` for the mark, `public/brand/storvv-app-icon.png` for the app icon).
- Light mode uses the navy/dark logo; dark mode uses the white logo.
- App icon: white lightning-bolt mark on navy (#143F8D) rounded square. Android adaptive icon: mark on the foreground layer, navy background layer.

### 2.2 Color tokens

Storvv uses **one accent** (navy) plus neutral surfaces. Semantic colors are only for meaning (money up/down, low stock, errors).

**Brand palette**

| Token | Hex | Use |
| --- | --- | --- |
| `brand/navy` | #143F8D | Primary buttons, active tab, links, selected states (light mode) |
| `brand/deep-navy` | #1B2A6B | Hero backgrounds, splash gradient end |
| `brand/periwinkle-500` | #5B7FE0 | Secondary accent, charts series 2 |
| `brand/periwinkle-400` | #7090F0 | Accent in dark mode (buttons, active tab) |
| `brand/periwinkle-200` | #A9BCF5 | Subtle highlights, chart fills, dark-mode tints |

**Light mode surfaces**

| Token | iOS | Android (M3 role) |
| --- | --- | --- |
| Canvas / background | #F2F2F7 | `surface` #F7F8FC |
| Card / grouped cell | #FFFFFF | `surfaceContainerLowest` #FFFFFF |
| Elevated card | #FFFFFF + shadow | `surfaceContainerLow` #F1F3FA |
| Separator | rgba(60,60,67,0.12) | `outlineVariant` #DDE1EC |
| Primary text | #0B1220 | `onSurface` #111827 |
| Secondary text | rgba(60,60,67,0.60) | `onSurfaceVariant` #5B6475 |
| Tertiary text | rgba(60,60,67,0.30) | #9AA3B2 |
| Accent | #143F8D | `primary` #143F8D, `onPrimary` #FFFFFF |
| Accent container | rgba(20,63,141,0.10) | `primaryContainer` #DCE4FA, `onPrimaryContainer` #0D2A5E |

**Dark mode surfaces**

| Token | iOS | Android (M3 role) |
| --- | --- | --- |
| Canvas | #000000 | `surface` #0E1016 |
| Card / grouped cell | #1C1C1E | `surfaceContainer` #171A22 |
| Elevated card | #2C2C2E | `surfaceContainerHigh` #1F2330 |
| Separator | rgba(84,84,88,0.65) | `outlineVariant` #2C3140 |
| Primary text | #FFFFFF | #F1F3F9 |
| Secondary text | rgba(235,235,245,0.60) | #A6AEC0 |
| Accent | #7090F0 | `primary` #A9BCF5, `onPrimary` #0D2A5E |
| Accent container | rgba(154,181,227,0.24) | `primaryContainer` #233F82 |

**Semantic**

| Meaning | Light | Dark | Where |
| --- | --- | --- | --- |
| Success / money in / Available | #059669 (text), #34C759 (iOS dot) | #34D399 | Completed status, profit, positive delta, "Available" |
| Warning / low stock / balance due / pending | #B45309 (text), #FF9500 (dot) | #FCD34D | Pending, Balance due, Low stock, Awaiting payment |
| Danger / refund / loss | #DC2626 | #F87171 | Refunded, Cancelled, negative margin, destructive buttons |
| Info / swap-in | #0369A1 | #7DD3FC | "Swap" badge, Swap-in source badge |
| Neutral | secondary text | secondary text | Counts, labels |

Rule: never fill a whole card with a semantic color. Use a small pill, a dot, or a 3 to 4pt leading stripe.

### 2.3 Typography

| | iOS | Android |
| --- | --- | --- |
| Family | Montserrat (current iOS build) with SF Pro as fallback. Alternative: SF Pro throughout. | Montserrat or Roboto Flex. Keep the same family as iOS if brand consistency matters more than platform feel. |
| Numbers | Tabular figures everywhere money or counts appear | Same |

Type scale (iOS name / Android M3 name):

| Role | Size / line | Weight | Use |
| --- | --- | --- | --- |
| Large Title / Display Small | 34/41 | Bold | Home greeting, big screen titles on scroll top |
| Title 1 / Headline Medium | 28/34 | Bold | Screen titles |
| Title 2 / Headline Small | 22/28 | Semibold | Section headers |
| Title 3 / Title Large | 20/25 | Semibold | Card titles, sheet titles |
| Headline / Title Medium | 17/22 | Semibold | List row primary text |
| Body / Body Large | 17/22 | Regular | Body copy, inputs |
| Callout / Body Medium | 16/21 | Regular | Secondary body |
| Subhead / Label Large | 15/20 | Medium | Metadata, button labels |
| Footnote / Body Small | 13/18 | Regular | Captions, helper text |
| Caption / Label Small | 12/16 | Medium | Tab labels, badges, table headers (uppercase, +0.08em tracking) |

Stat numerals: hero 32 to 34 Bold, compact 20 Semibold, letter-spacing -0.02em, tabular.

Money format: currency symbol + grouped thousands + 2 decimals: `₦35,000.00`. Compact on Home cards: `₦34.2m`, `₦12.2m`.

### 2.4 Spacing, radius, elevation

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.
- Screen side padding: 16 (iOS and Android compact), 20 on large phones, 24 on tablets.
- Radius: chips 8, inputs 12, cards 16 to 20, sheets 28 (top corners), FAB 16 (Android) or full circle 56 (iOS), pills full.
- Elevation:
  - iOS: soft shadow `0 8 32 rgba(0,0,0,0.06)` on light; on dark, no shadow, use a 1px border rgba(255,255,255,0.08).
  - Android: M3 tonal elevation levels 0 to 3 (use surface container tones rather than shadows).
- Optional glass material for the tab bar, sheets and top bar on iOS: background 72% opacity + 24px blur. Provide a solid fallback for "Reduce Transparency".

### 2.5 Icons

- Line icons, 1.5 to 1.75 stroke, rounded caps. Library: Lucide (matches the web app). On iOS you may substitute SF Symbols; on Android, Material Symbols Rounded.
- Sizes: 20 (inline), 24 (nav and toolbar), 28 (tab bar iOS), 48 (empty states, muted).
- Key icons: Home (house), Stock (box/package), Sales (receipt), Analytics (bar chart), More (grid or ellipsis), Search (magnifier), Bell, Plus, Scan (barcode), Copy, Share, Refund (arrow-uturn-left), Swap (arrows left-right), Branch (store), Team (users), Activity (list-clock), Help (life buoy), Assistant (sparkles).

### 2.6 Motion

- Push navigation: iOS slide from trailing edge; Android shared-axis X.
- Sheets: spring (damping ~0.86, ~0.45s) on iOS; M3 standard decelerate on Android.
- Card press: scale 0.98, 120ms.
- Pull to refresh on every list screen.
- Skeleton shimmer 1.2s for loading; cross-fade if Reduce Motion is on.

---

## 3. iOS vs Android: how the same screen should differ

| Element | iOS (HIG) | Android (Material 3) |
| --- | --- | --- |
| Primary navigation | Bottom tab bar, 5 items, optional floating glass pill | Bottom Navigation Bar, 5 items with pill active indicator |
| Screen title | Large title that collapses into inline title on scroll | Top App Bar (medium or large), collapses to small on scroll |
| Back | Chevron + previous title, edge swipe | Arrow back in top app bar, system back gesture |
| Primary action on a list | Toolbar "+" button top right or circular FAB bottom right above tab bar | Extended FAB ("New sale") bottom right, collapses to FAB on scroll |
| Forms | Full-height sheet with "Cancel" left, title center, "Save" right | Full-screen dialog with close X left, title, "Save" text button right |
| Pickers | Menus, wheel pickers, inline date picker | Exposed dropdown menus, M3 date picker dialog |
| Segmented filters | Segmented control | Segmented buttons or filter chips |
| Row actions | Swipe actions + long-press context menu | Long press to select + overflow menu (three dots) |
| Confirmations | Action sheet (destructive in red) or alert | M3 dialog with text buttons |
| Toasts | Small banner from top or HUD | Snackbar at the bottom (above nav bar) |
| Toggles | iOS switch | M3 switch |
| Checkboxes | Circular check in lists (Select mode) | Square checkbox |
| Search | Search field under the large title | Search bar (M3) at top, expands to full-screen search view |
| Haptics | Light impact on tab change, success on sale saved | Same via HapticFeedback |

---

## 4. Users, roles and plans (what each user can see)

Design every screen once, then mark the variants needed for role and plan.

### 4.1 Roles

| Role | Who | Key differences in UI |
| --- | --- | --- |
| **Owner (Super admin)** | Person who created the workspace | Sees everything allowed by the plan. Branch switcher. Creates categories, branches, departments, staff. Settings editable. Customer buybacks. Delete sales. |
| **Manager** | Staff with role "manager" | Can edit sales and refund. Product create/edit/delete only if granted. Sees Activity logs. |
| **Staff** | Standard team member | Sees products, creates sales (including swap-in), Quick sale, customers. No structural edits unless granted. No branch switcher (fixed to assigned branch). |

Per-module permission matrix (configured by the owner per staff member): **Products** (view, create, edit, delete), **Receipts/Sales** (view, create, edit, delete, refund), **Leads**, **Buybacks**, **Stock loans**, **Multi-Store Sync** (each view, create, edit, delete). Hidden or disabled buttons follow these switches.

### 4.2 Plans

| Feature | Micro | Medium | Enterprise |
| --- | :-: | :-: | :-: |
| Stores (branches) | 1 | 2 | Unlimited |
| Departments per store | 1 | 10 | Unlimited |
| Staff per store | 2 | 25 | Unlimited |
| Home, Inventory, Sales, Customers, Returns, Quick sale, Notifications, Settings, Help, Assistant | ✓ | ✓ | ✓ |
| WhatsApp receipt sharing | 10 / month | Unlimited | Unlimited |
| Analytics and reports (PDF/Excel export) | Locked | ✓ | ✓ |
| Activity logs | Locked | ✓ | ✓ |
| Sales leads | Locked | ✓ | ✓ |
| Customer balance (credit ledger, Outstanding) | Locked | ✓ | ✓ |
| Duplicate category (same branch) | Locked | ✓ | ✓ |
| Multi-Store Sync | Locked | Locked | ✓ |
| Copy categories from another branch | Locked | Locked | ✓ |
| Stock loans | Locked | Locked | ✓ |
| Customer buybacks | Owner only, any plan | | |

Locked features: show them with a small lock glyph and open the **Upgrade sheet** (section 7.15) on tap. Never hide core selling features.

### 4.3 Workspace style (from onboarding)

- **Just me**: hides Departments, the branch switcher and Multi-Store Sync by default. Payment links off.
- **Growing business**: full navigation as the plan allows.

Design the **More** menu in both variants.

---

## 5. App map and navigation

### 5.1 Bottom navigation (both platforms)

| Position | Label | Icon | Destination |
| --- | --- | --- | --- |
| 1 | Home | house | Home dashboard |
| 2 | Stock | package | Inventory categories |
| 3 | Sales | receipt | Sales list |
| 4 | Analytics | bar chart (lock badge on Micro) | Analytics |
| 5 | More | grid / ellipsis | More menu |

Badge rules: Sales tab can show a count dot for pending sales; More shows a dot if there are unread notifications not surfaced elsewhere.

### 5.2 More menu (grouped list, iOS Settings style / Android list with section headers)

```
OPERATIONS
  Customer buybacks        (owner only)
  Stock loans              (Enterprise; lock otherwise)
  Multi-Store Sync         (Enterprise; lock otherwise; hidden in "Just me")
  Sales leads              (Medium+; lock otherwise)
  Payment links            "Coming soon" pill
  Storefront               "Coming soon" pill

ORGANIZATION
  Branches                 (owner; hidden in "Just me")
  Departments & staff      (hidden in "Just me")
  Activity logs            (Medium+; managers and owner)

ACCOUNT
  Notifications            (unread count on the right)
  Profile & security
  Settings
  Subscription             (owner)
  Help center
  Ask Storvv Assistant
  Sign out                 (red text)
```

### 5.3 Global top bar (on Home, Stock, Sales, Analytics)

Left to right:
1. **Branch pill** (owner with 2+ branches): store icon + branch short name (for example "PHC") + green dot if active + chevron. Tap opens the Branch picker sheet.
2. Spacer.
3. **Ask AI** button (sparkles icon + "Ask AI") opens Storvv Assistant.
4. **Bell** with unread badge, opens Notifications.
5. **Avatar** (initials, for example "SC") opens Profile.

Staff (no switcher) see their branch name as plain text instead of a pill.

### 5.4 Branch picker sheet

- Title: "Switch branch".
- List of branches: name (for example "Port Harcourt"), city/area subtitle, status ("Active" green dot / "Inactive" grey), check mark on current.
- Footer button (owner): "Manage branches" (goes to Settings > Branches).
- Explanation line under the title: "Inventory, sales and customers switch to the branch you pick."
- On switch: toast "Switched to Port Harcourt".

---

## 6. Component library (build these first)

For each component, build iOS and Android variants in light and dark.

1. **Buttons**: Primary (filled navy), Secondary (tonal / grey fill), Outline, Text, Destructive (red), Icon button. Sizes L (52), M (44), S (36). Loading state with spinner and label "Saving...".
2. **Inputs**: Text field (label above, placeholder, helper, error), Currency field (symbol prefix, tabular), Phone field, Email field, Text area, Search field, Select / dropdown, Date field, Toggle row, Checkbox row, Stepper (- qty +).
3. **List rows**:
   - Settings row (icon tile, title, value, chevron).
   - Product row (thumbnail or initials tile, name, meta line, price right, availability pill).
   - Sale row (sale number + copy icon inline, customer name, time, total right, status pill).
   - Customer row (avatar initials, name, phone, orders count, total spent).
   - Activity row (actor avatar, sentence, entity, timestamp).
   - Notification row (type icon, title, message, time, unread dot).
4. **Cards**: Stat card (label, big value, delta pill, subtitle), Hero revenue card (value + sparkline), Category card (color tile, name, product count, subcategory count, chevron, health dot), Insight card, Empty-state card.
5. **Pills and badges**:
   - Sale status: Completed (green), Pending (amber), Balance due (amber), Refunded (red), Cancelled (grey/red).
   - Availability: Available (green), Awaiting payment (amber), Sold (grey), On stock loan (violet/periwinkle), Returned (blue).
   - Source: Swap-in (sky blue), Buyback (cyan), Stock (plain text).
   - Margin pill: "23%" green, negative red.
   - "Swap" mini badge on sales.
   - "Coming soon" pill, "Soon" mini pill, lock glyph badge, plan badge ("Medium", "Enterprise").
6. **Segmented control / Segmented buttons** (2 to 4 options).
7. **Filter chips** row (with counts: "All 7", "Available 7", "Awaiting 0", "Sold 0", "Returned 0").
8. **Sheets**: Bottom sheet (medium and large detents on iOS; modal bottom sheet on Android), Full-screen form sheet, Action sheet, Confirmation dialog.
9. **Stepper header** for multi-step flows: step dots or "Step 2 of 4" + step label.
10. **Sticky checkout footer**: totals summary + primary button.
11. **Toast / Snackbar**: success, error, info.
12. **Skeletons**: list rows, cards, chart.
13. **Empty state**: 48pt muted icon, title, 1 to 2 line body, primary button, optional secondary text button.
14. **Tab bar / Navigation bar**, **Top app bar**, **FAB / Extended FAB**.
15. **Chart containers**: line/area (revenue), bars (by hour, by weekday), donut (payment methods), heatmap (traffic).

---

## 7. Screens and flows, step by step

Each subsection lists: purpose, entry points, layout top to bottom, exact copy, actions, states, and iOS/Android notes.

---

### 7.1 Launch, sign in and sign up

#### Screen A1: Splash

- Navy (#143F8D) to deep navy (#1B2A6B) vertical gradient, centered white logo mark, wordmark "Storvv" below.
- Duration: until auth check completes (max ~1.5s). Then route:
  - Signed out: Welcome (A2).
  - Signed in, onboarding incomplete: Onboarding (B1).
  - Signed in: Home (7.3).
- Android 12+: use the system splash API (icon on navy), then the same transition.

#### Screen A2: Welcome (first launch, signed out)

Layout:
1. Top 55%: hero illustration area with the clean retail line-icon pattern (package, receipt, bag, bar chart, barcode, tag, store, coins) in navy at ~11% opacity, fading toward the bottom. Centered logo.
2. Headline (Title 1): "The retail operating system for modern businesses."
3. Body: "Stock, sales, receipts, and your team in one workspace."
4. Primary button (full width): "Create account".
5. Secondary button (full width, outline): "Log in".
6. Footnote: "By continuing you agree to the Terms and Privacy Policy." (Terms and Privacy as links.)

#### Screen A3: Log in

Layout:
1. Back button.
2. Title: "Welcome back".
3. Subtitle: "Log in to your Storvv workspace."
4. Field "Email" (placeholder "Enter your email", email keyboard).
5. Field "Password" (placeholder "Enter your password", show/hide eye icon).
6. Row: checkbox "Remember me" (left), link "Forgot password?" (right).
7. Biometric button (when saved credentials exist): "Autofill with Face ID" (iOS) / "Autofill with fingerprint" (Android).
8. Primary button: "Log In".
9. Footer: "New to Storvv? Create account".

States: default, filled, loading ("Log In" with spinner), error banner (red, under the title): "Incorrect email or password." / "Too many attempts. Try again in a few minutes."

#### Screen A4: Two-factor step (when 2FA is on)

1. Title: "Enter your code".
2. Body: "Open your authenticator app and enter the 6-digit code."
3. Six-box code input (auto-advance, paste supported). Label "Authentication code".
4. Primary button: "Verify and continue".
5. Text link: "Use a different account".

#### Screen A5: Forgot password

1. Title: "Reset your password".
2. Body: "Enter the email you use for Storvv and we will send a reset link."
3. Field "Email".
4. Primary: "Send reset link".
5. Success state (replace form): mail icon, "Check your email", "We sent a reset link to ada@shop.com.", button "Back to log in".

#### Screen A6: Create account

1. Title: "Create your account".
2. Subtitle: "Set up a workspace for stock, sales, and branches."
3. Field "Your business name" (placeholder "Your business name").
4. Field "Email" (placeholder "Enter your email").
5. Field "Password" (placeholder "Enter your password") with a **4-segment strength meter** under it and a hint line ("Use 8+ characters with a number and a symbol").
6. Field "Confirm password" (placeholder "Re-enter your password"), inline error "Passwords do not match".
7. Primary: "Sign Up".
8. Footer: "Already have an account? Log in".

#### Screen A7: Verify email

1. Mail illustration (line icon, navy).
2. Title: "Check your email".
3. Subtitle: "We need you to confirm your address before you sign in."
4. Body: "We sent a link to ada@shop.com."
5. Primary: "Open email app".
6. Secondary: "Resend email" (with 60s countdown: "Resend in 0:42").
7. Text link: "Change email".

---

### 7.2 Onboarding (owner, first sign-in)

Header on all steps: small label "Account Setup", progress indicator "Step 1 of 3" with 3 segments. Bottom bar: "Previous" (outline, hidden on step 1) and primary "Continue" (on the last step: "Complete Setup"; while saving: "Saving...").

#### B1: Currency and country

1. Round navy icon (globe).
2. Title: "Welcome to Storvv".
3. Body: "Let's set up your account. Choose your currency and country to get started."
4. Select "Currency": placeholder "Choose a currency...", options formatted "₦ Nigerian Naira (NGN)". Helper: "This currency will be used throughout your account for all transactions and reports."
5. Select "Country": placeholder "Choose your country...", options with flag emoji ("🇳🇬 Nigeria").
6. Error (if missing): "Please select both currency and country to continue".

#### B2: Workspace style

1. Round navy icon (person).
2. Title: "How do you run your business?"
3. Body: "Choose the setup that fits you. You can enable more features later in Settings."
4. Two large selectable cards (radio behavior):
   - **Just me**: "A focused setup for running the business yourself. Enable team and multi-location tools later."
   - **Growing business**: "The full Storvv workspace with team, branches, and advanced tools as your plan allows."
   Selected card: navy 2pt border + check circle.

#### B3: Store information

1. Round navy icon (storefront).
2. Title: "Store Information".
3. Body: "Tell us about your store. This information will be used on receipts and reports."
4. "Head store branch *": city picker based on the country (placeholder "Choose a city..."). Helper: "Cities in 🇳🇬 Nigeria based on your country selection."
5. "Store Address" (multi-line, placeholder "123 Main Street, City, State 12345").
6. "Store Phone" (placeholder "+234 801 234 5678").
7. "Store Email" (placeholder "store@example.com").
8. "Store Description" (multi-line, placeholder "Tell us about your store...").
9. Primary: "Complete Setup".

#### B4: First-win checklist (shown on Home after onboarding)

A dismissible card at the top of Home titled "Get set up" with 3 checklist rows:
1. "Add your first category" (Stock icon) > Add category.
2. "Add a product" > Add product.
3. "Record your first sale" > New sale.
Each row turns into a green check when done. When all are done, a toast: "First sale recorded. Nice work!"

Optional **dashboard tour** (coach marks, 4 steps): "Your dashboard", "Find inventory", "Record sales", "Your profile". Buttons "Next", "Skip".

---

### 7.3 Home (tab 1)

Purpose: see money and stock at a glance, jump into the next action.

Layout top to bottom (scroll, pull to refresh):

1. **Top bar** (section 5.3).
2. **Greeting** (Large title): "Good morning, Ada" (time based: morning / afternoon / evening). Under it, footnote: branch name and date ("Port Harcourt · Wed, 30 Sep").
3. **Search field**: placeholder "Search products, sales, customers". Opens Global search (7.3.1).
4. **Needs attention** (only if alerts exist): label "Needs attention" followed by horizontally scrollable alert chips, for example:
   - "3 products low on stock" (amber)
   - "2 sales with balance due" (amber)
   - "1 pending sale" (amber)
   Tap goes to the filtered list.
5. **Hero revenue card**:
   - Label: "Total revenue" with period segmented control "Daily | Weekly | Monthly".
   - Value: "₦1,240,000.00".
   - Delta pill: "+12.4% vs yesterday" (green) or red if negative.
   - 7-point sparkline in navy/periwinkle.
   - Tap: opens Analytics (or Upgrade sheet on Micro).
6. **Store activity** (section title "Store activity" + overflow menu): 2-column grid of stat cards:
   - "Orders today": 14
   - "Active customers": 86
   - "Low stock signals": 3 (amber)
   - "Outstanding balances": ₦120,000.00 (Medium+)
   - "Open leads": 5 (Medium+)
   - "Products": 14, subtitle "₦34.2m total value"
7. **Recent sales** (section title "Recent sales" + text button "New sale" with + icon): 5 sale rows (title = customer name, subtitle = items preview such as "Fire On Ice, Opulent Dubai", right = amount and time "2:14 PM"). Empty: "No sales yet" + button "Create sale".
8. **Low stock** (section title "Low stock"): up to 5 product rows with remaining quantity ("2 left") in amber. Tap opens product.
9. Bottom spacing for the tab bar.

Primary action:
- iOS: circular FAB (+) above the tab bar, or a toolbar "+". Tap opens a small action sheet: "New sale", "Quick sale", "Add product".
- Android: Extended FAB "New sale"; long press or a secondary small FAB for "Quick sale".

Quick menu (drawer from a "Menu" button on Home): section "Shortcuts": Payment links (Soon), Buybacks, Analytics, Activity logs, Settings, Help center.

Staff variant: no branch pill, no Outstanding/Leads cards unless permitted, greeting includes the branch.

Micro variant: Analytics card shows a lock and "See revenue trends and busiest hours on Medium".

Empty workspace variant: hero shows ₦0.00, stats show 0, "Get set up" checklist is prominent.

#### 7.3.1 Global search (full-screen)

1. Search field focused, "Cancel" (iOS) / back arrow (Android).
2. Segmented filter: "All | Products | Sales | Customers".
3. Recent searches (chips) when empty.
4. Results grouped by type with section headers ("Products", "Sales", "Customers"), max 3 each + "See all".
5. No results: "No matches for "opulent"".

---

### 7.4 Inventory (tab 2: "Stock")

Inventory is two levels: **Categories** (with optional **Subcategories**) and **Products** inside them. Products always live in a leaf category (a subcategory if the parent has subcategories).

#### Screen C1: Categories

Layout:
1. Large title "Inventory", breadcrumb-style subtitle "Port Harcourt · Categories".
2. Summary strip (horizontal scroll of compact stats): "Categories 3", "Products 14", "Total value ₦34.2m", "Total profit ₦12.2m" (only if user can see cost/profit), "Low stock 0".
3. Search field "Search categories…".
4. Filter row: dropdown "All departments" (owner), sort dropdown "Name" (Name / Products / Date), layout toggle (grid / list).
5. Category grid (2 columns) of Category cards:
   - Color tile (category color) with folder or custom icon.
   - Name (Headline): "Perfumes".
   - Meta (Footnote): "16 subcategories" or "7 items" or "0 items".
   - Health dot: green (healthy), amber (low stock), grey (empty).
   - Overflow (⋯) top right: "Edit", "Duplicate" (Medium+), "Delete" (owner).
6. Primary action: "Add category" (owner / products.create): iOS toolbar "+" or FAB; Android Extended FAB "Add category".
7. Secondary actions in a "More" menu: "Copy from branch" (Enterprise, owner, 2+ branches), "Export reorder list", "Select" (enters selection mode).

Selection mode: checkboxes appear on cards; bottom toolbar shows "0 selected", "Select all", "Delete" (red).

States:
- Empty: icon box, "No categories yet", "Categories hold your products and their fields, like Brand or Serial number.", button "Create category".
- Staff without create: same empty but body "Ask your admin to add categories." and no button.
- Loading: 6 card skeletons.

#### Screen C2: Category hub (category with subcategories)

1. Nav bar: back "Inventory", title "Perfumes".
2. Subtitle line: "Subcategories" heading + "Products live inside subcategories. Open one to add or manage stock."
3. Subcategory grid (2 columns): e.g. Asdaaf (0 items), Asrar, Bentley, Dolce & Gabbana (1 item), Khadlaj (1 item), Lattafa (7 items), Maison Asrar, Rave (3 items), Zara (1 item).
4. Primary: "Add subcategory".
5. Selection mode same as C1 ("Select all", "Delete").

#### Screen C3: Product list (leaf category)

1. Nav bar: back, title "Lattafa", subtitle "7 items · ₦11.2m total value".
2. Search field "Search…" + sort dropdown "Name".
3. Filter chips with counts: "All 7", "Available 7", "Awaiting 0", "Sold 0", "Returned 0".
4. Product rows (phone layout; the web table becomes a list):
   - Leading: square tile with product initials or photo.
   - Title: "Musamam Black Intense" (single line, truncates).
   - Meta line: "Qty 20 · In 8 Sep 2026".
   - Trailing: price "₦35,000.00" and below it the margin "+₦8,000.00" + pill "23%" (only if user can see profit).
   - Bottom-right: availability pill "Available".
   - Source badge when relevant: "Swap-in · REC-493257" or "Buyback".
   - Discounted item: sale price, red "-10%" label, original price struck through on the same line.
5. Primary: "Add product" (FAB / Extended FAB).
6. Toolbar "More": "Import" (from Excel), "Export", "Bulk discount", "Select".
7. Swipe actions (iOS) / long-press menu (Android): "Edit", "Discount", "Timeline", "Delete".

Tablet / landscape variant: a dense table with columns Product, Unit price, Quantity, Cost price, Date in, Date out, Margin, Source, Availability (single-line rows, ~46pt tall).

Empty: "No products in this category", "Add your first product to start selling from Lattafa.", button "Add product".

#### Screen C4: Product detail

1. Nav bar: back, title (inline) product name, trailing "Edit".
2. Hero: optional image (placeholder with initials on a soft navy tint), name (Title 1) "Opulent Dubai", category breadcrumb "Perfumes › Lattafa".
3. Stat row (3 equal tiles): "On hand 87", "Price ₦30,000.00", "Value ₦2.61m".
4. Availability pill + source badge.
5. Grouped section **Details**: every category field as a row label/value (Brand, Model, Color, Serial Number, SKU, Unit cost, Date in, Date out).
6. Grouped section **Profit** (if allowed): Unit cost ₦17,000.00, Margin +₦13,000.00 (43%).
7. Grouped section **Actions**:
   - "View timeline": subtitle "Stock history and sales".
   - "Edit product".
   - "Apply discount".
   - "Duplicate".
   - "Delete product" (red; owner or products.delete).
8. Locked item variant (sold or awaiting payment): banner "This product is linked to a sale and can't be edited." Actions limited to Timeline.

#### Screen C5: Product timeline (sheet)

Vertical timeline with dots and lines, newest first:
- "Sold on REC-493257 · 30 Sep, 2:14 PM · by Ada"
- "Discount applied (-10%) · 12 Sep"
- "Swapped in on REC-493100 · 10 Sep"
- "Added to stock · 8 Sep 2026 · by Scoz"
Each sale entry taps through to the sale.

#### Screen C6: Add / Edit category (full-screen form)

Header: "Cancel" | "New category" | "Save".

Sections:
1. **Basics**: "Category name" (placeholder "e.g. Perfumes"), "Description" (optional), "Category color" (8 swatches), "Type" (select: General, Electronics, Clothing & Apparel, Food & Beverage, Automotive, Office Supplies, Other).
2. **Tracking**: segmented "Bulk quantity | Serial numbers". Helper: "Serial numbers create one row per unit, ideal for phones and devices."
3. **Profit**: toggle "Track profit" (adds Cost price field). If off, confirmation "Continue without profit".
4. **Fields** (template builder): list of fields with drag handles. Default fields: "Product" (text), "Unit price" (currency), "Quantity" (number, hidden for serial mode), "Serial Number" (text, serial mode). Each row: label, type chip, required toggle, delete. Button "Add field" opens a sheet: "Label", "Type" (Text, Number, Currency, Select, Date, Boolean), "Options" (for Select; chip input), "Required". Empty: "No fields yet", "Add a column or import from Excel".
5. **Departments** (owner, Growing business): multi-select of departments allowed to see this category.
6. **Subcategories**: toggle "This category has subcategories" + "Apply to subcategories" option for field templates.

Bulk-add variant: "Category name(s)" accepts several names separated by commas.

#### Screen C7: Add / Edit product (full-screen form)

Header: "Cancel" | "Add product" | "Save".

1. Category chip at top (read only): "Perfumes › Lattafa".
2. Dynamic fields from the category template, in order. Examples:
   - "Product" (placeholder "Enter Product").
   - "Unit price" (currency, "₦ 0.00").
   - "Cost price" (currency; only if Track profit) with a live margin hint under it: "Margin +₦8,000.00 · 23%".
   - "Quantity" (stepper + number).
   - "Serial Number" (with a scan icon button on the right).
   - Select fields as dropdowns, date fields as date pickers, boolean fields as toggles.
3. Photo (optional): "Add photo" tile (camera / library).
4. Serial mode: "Add another unit" button repeats the serial field; duplicate serial error: "An item with serial number "X" already exists for Apple iPhone 13. Please use a different serial number."
5. Primary: "Save product". Success toast: "Product added". First product ever: "First product added. Stock is live".

#### Screen C8: Apply discount (sheet)

- Title "Apply discount".
- "Product" (read only).
- "Discount type": segmented "Percentage | Fixed amount".
- "Discount value" input.
- "Preview" card: "Original ₦35,000.00", "Discount -₦3,500.00", "New price ₦31,500.00".
- Primary "Apply discount"; secondary "Remove discount" if one exists.
- Bulk discount variant: same, applied to N selected products ("Apply to 5 products").

#### Screen C9: Copy from branch (Enterprise, owner)

1. Title "Copy from branch".
2. Explainer: "Copy category layouts from another branch. Products and quantities are not copied."
3. "Source branch" dropdown.
4. "Categories to copy": checklist with "All" / "None" quick actions.
5. "When a category name already exists here": radio "Skip that category" / "Add with (copy) suffix".
6. Primary: "Copy 4 categories".
7. Success toast: "4 categories copied to Port Harcourt".

#### Screen C10: Delete confirmations

- Category: "Delete "Perfumes"?" / "This removes the category, its subcategories and all products in them. This can't be undone." / buttons "Cancel", "Delete" (red).
- Product: "Delete "Opulent Dubai"?" / "This can't be undone." 

---

### 7.5 Sales (tab 3)

#### Screen D1: Sales list

1. Large title "Sales".
2. Summary strip: "In store 0", "Completed ₦0.00", "Today ₦0.00", "This month ₦0.00", "Outstanding 0".
3. Segmented control: "Sales | Outstanding | Customers" (Outstanding requires Medium+; shows a lock on Micro).
4. Search field "Search sales…".
5. Filter chips: status "All | Completed | Pending | Refunded"; date "All dates | Today | Week | Month".
6. Sale rows grouped by day header ("Today", "Yesterday", "Mon, 28 Sep"):
   - Line 1: sale number "REC-493257" with a small **copy icon right beside it** (tap copies, toast "Receipt number copied"), optional "Swap" mini badge.
   - Line 2: customer name "Chinedu Okafor" · items preview "Fire On Ice ×1".
   - Trailing: total "₦35,000.00", below it status pill "Completed", and time "2:14 PM".
   - Optional profit hint under total (owner): "+₦8,000.00".
7. Primary action: "New sale" (iOS FAB with receipt-plus icon / Android Extended FAB "New sale"). Secondary: "Quick sale" (scan icon) in the toolbar.
8. Row actions (swipe or long press):
   - Completed: "View sale", "Share sale", "Refund sale" (refund permission).
   - Balance due: "Record payment", "View sale", "Cancel order".
   - Pending: "View sale", "Mark completed", "Cancel order".
   - Owner: "Delete" (red, with confirmation).

States:
- Empty: receipt icon, "No sales yet", "Create your first sale to record revenue and track payments.", hint chips "Add line items from inventory categories" and "Use Outstanding for deposits and balance due", button "Create sale".
- Filter empty: "No sales match these filters" + "Clear filters".

#### Flow D2: New sale (multi-step sheet)

Opens as a large sheet (iOS) / full-screen dialog (Android). Header shows step label and progress: **Category > Subcategory > Items > Sale details**. The Subcategory step is skipped when the category has none. A **sell screen note** banner may show at the top (set per branch in Settings, e.g. "Check serial number with customer before handing over").

**Step 1: Category**
- Section label "Parent category".
- Search "Search categories…".
- Grid of category tiles (name, available count). Tap to continue.
- Empty: "No categories found".

**Step 2: Subcategory**
- Back chevron to step 1, breadcrumb "Perfumes".
- Search "Search subcategories…".
- Grid of subcategories with available counts. Empty: "No subcategories found".

**Step 3: Items**
- Search "Search products…" + scan button (barcode / serial).
- Product list with only sellable items (Available). Each row: name, key fields (serial, color), price, and a trailing "+" / stepper for bulk items or a checkbox for serial items.
- Selected rows highlight with a navy tint.
- Per-line actions (tap a selected line): edit quantity, per-item discount (percentage or fixed) with "Discount reason" required when any discount is applied.
- "Add from another category" text button keeps the cart and returns to step 1.
- Sticky footer: "Products 3" and "Subtotal (items) ₦95,000.00", primary "Continue".
- Empty: "No items available" with body "Everything in this category is sold or awaiting payment."

**Step 4: Sale details (checkout)**
Sections in order:
1. **Customer**
   - "Customer Name *" (placeholder "John Doe") with live suggestions dropdown from existing customers (name, email/phone, "3 orders").
   - "Customer Email" (placeholder "john@example.com").
   - "Customer Phone" (placeholder "+234 801 234 5678").
   - "Customer Address" (placeholder "123 Main St, City, State").
2. **Payment**
   - "Payment Method *" picker with tenders: Cash, Card (POS), Bank Transfer, OPay, Moniepoint, Palmpay, Kuda, USSD, Mobile Money (list is editable in Settings).
   - Toggle "Split Payment": shows rows of [method picker][amount] with remove (×), button "Add payment method", and a **Balance** card colored by state: green "Fully allocated", amber "₦5,000.00 left to allocate", red "₦2,000.00 over total"; footer line "Allocated ₦90,000.00 of ₦95,000.00".
   - **Part payment / Balance due** (Medium+): "Amount paid now" field; the rest becomes "Balance due" and the sale is reserved (items become "Awaiting payment").
3. **Status**: "Status *" segmented "Completed | Pending".
4. **Notes (Optional)**: "Additional notes...".
5. **Discount reason** (only if any discount): "Why is a discount being applied to this sale?" (required).
6. **Commission** (owner/manager, optional): "Commission amount" (hint "Folded into the total the customer pays."), "Owed to" (placeholder "e.g. referral agent's name"), "Attribute to staff (optional)" picker.
7. **Swap-in** (available to everyone who can make sales): checkbox "This is a swap-in transaction". When on:
   - "Select Folder for Swapped-In Device *" picker (placeholder "Select folder for swapped-in device"; empty "No inventory folders found").
   - "Swapped-In Device Details": the selected category's fields (e.g. Brand, Model, Serial Number, Condition, Value).
   - Totals show "Swap credit (trade-in) −₦120,000.00".
8. **Totals card** (sticky footer): "Products 3", "Subtotal (items) ₦95,000.00", "Discount −₦5,000.00", "Commission ₦2,000.00", "Swap credit (trade-in) −₦0.00", big "Total" (or "Amount due" for swap-ins) "₦92,000.00".
9. Primary button: "Create sale" (loading "Creating...").

Validation errors inline in red; disabled primary until required fields are valid.

**Step 5: Success**
- Animated check (green), title "Sale recorded", sale number "REC-493258" with copy icon.
- Summary: customer, items count, total, payment method, status pill.
- Actions (large buttons/list): "Share on WhatsApp", "Email receipt", "Download PDF", "Print", "View sale".
- Secondary: "New sale" (starts again) and "Done".
- First sale ever: toast "First sale recorded. Nice work!"

#### Flow D3: Quick sale (scan-first sheet)

1. Title "Quick Sale", helper "Pick a category, then scan or tap a product".
2. "Category" picker (then subcategory if needed).
3. **Scan or search** field pinned at top: placeholder "Enter barcode, SKU, or serial…" with a camera scan button.
4. Search results / product list ("Search products…").
5. "Selected Items" list with qty steppers and remove.
6. Collapsible "Customer Info (Optional)": "Customer Name", "Phone (Optional)".
7. "Payment" picker + "Split payment" toggle (same balance card behavior).
8. "Discount" (with "Discount reason") and "Commission (Optional)".
9. Sticky footer: "Total ₦35,000.00" + primary "Complete sale".
10. Success: compact version of D2 step 5.

#### Screen D4: Sale detail (receipt view)

Looks like a printed receipt on a card, plus actions.

1. Nav bar: back, title "REC-493257" (with copy), overflow menu.
2. Receipt card:
   - Store logo + store name + branch, address, phone.
   - "Receipt" label, sale number, "Date & time" "30 Sep 2026, 2:14 PM".
   - "Customer": name, phone, email.
   - Items table: "Product", qty, "Price"; per-line discount shown under the line.
   - "Subtotal", "Discount", "Commission", "Total" (bold), "Payment" (method or split breakdown).
   - Balance due variant: "Paid ₦50,000.00", "Balance ₦45,000.00" (amber) and payment history list.
   - Swap-in variant: "Swap credit" line and a link "View swapped-in item".
   - "Notes".
   - Footer: "Thank you for your business", then collapsible "Refund policy", "Warranty policy", "Terms & conditions (sales)".
3. Owner-only card **Profit**: "Cost of goods sold ₦27,000.00", "Gross profit ₦8,000.00".
4. Status pill + "Created by Ada" + timeline link "View sale timeline".
5. Bottom action bar: "Share" (primary), "Refund" (if allowed), "More" (Email, Download PDF, Print, Record payment, Cancel order, Delete).

Share sheet: native share with a rendered receipt image/PDF; WhatsApp shortcut. Micro plan after 10 WhatsApp sends in a month: Upgrade sheet "Unlimited WhatsApp receipts on Medium".

Email sheet: title "Send Receipt via Email", field placeholder "Enter email address", button "Send".

#### Flow D5: Refund / return

1. From sale detail: "Refund sale".
2. Sheet "Refund sale": list of line items with checkboxes (full or partial), "Return Reason" text area (placeholder "Enter reason for return/refund..."), toggle "Return items to stock" (on by default).
3. Summary "Refund amount ₦35,000.00".
4. Confirm dialog: "Refund REC-493257?" / "Items go back to stock and the sale is marked Refunded." / "Cancel", "Refund" (red).
5. Result: status pill "Refunded", items availability "Returned", toast "Sale refunded".

#### Flow D6: Record payment (balance due)

Sheet "Record payment": "Total ₦95,000.00", "Balance ₦45,000.00", "Payment amount" (prefilled with balance), "Payment method", primary "Record payment". When the balance hits zero the status becomes "Completed" and items become "Sold".

#### Flow D7: Cancel order (pending / balance due)

Dialog: "Cancel REC-493257? Reserved stock will be released. This cannot be undone." Buttons "Keep order", "Cancel order" (red).

#### Screen D8: Outstanding (segment 2, Medium+)

- Summary cards: "Open balances 4", "Balance due ₦120,000.00".
- List rows: sale number, customer, "Total", "Paid", "Balance" (amber), action "Record payment".
- Empty: "No outstanding balances", "Deposits and part payments show here until they are fully paid."

#### Screen D9: Customers (segment 3)

- Search "Search customers…", sort chips "Name | Orders | Spent | Recent".
- Customer rows: avatar initials, name, phone/email, "3 orders", "₦210,000.00 spent", "Last order 28 Sep". Balance pill (Medium+) if they owe.
- Customer detail: header (name, phone with call/WhatsApp buttons, email), stats ("Orders", "Total Spent", "Balance"), list of their sales, "Payment reminder" button (Medium+, WhatsApp).
- Empty: "No customers yet", "Customers are added automatically when you record a sale."

---

### 7.6 Analytics (tab 4, Medium+)

Micro: full-screen locked state with a blurred preview of charts behind, lock icon, title "Analytics is on Medium", body "See revenue trends and busiest hours on Medium", primary "View plans", secondary "Not now".

Layout (Medium+):
1. Large title "Analytics", subtitle "Analytics & Reports".
2. Period segmented: "Daily | Weekly | Monthly" (+ custom range in a menu).
3. Hero card: "Revenue" big number, delta pill, area chart.
4. KPI grid (2 columns): "Orders", "Avg. order", "Customers", "Completed", "Discounts", "COGS".
5. **Feature insights** carousel: short insight cards ("Best day: Saturday", "Best hour: 4 PM", "Top product: Opulent Dubai").
6. Chart cards (single column, 200 to 240pt tall each):
   - "Revenue trends" (line).
   - "Sales by hour" / "Peak hours" ("Revenue by hour of day") (bars).
   - "Sales by day of week" with "Best and worst days".
   - "Sales by category" (horizontal bars).
   - "Payment methods" ("Completed sales by tender type") (donut).
   - "Discount trend".
   - "Top products" (ranked list with amount).
   - "Top customers" (ranked list "Customer", "Spent").
   - "Inventory health": "Low stock" ("Items at or below threshold"), "Open inventory", "All stocked" empty state, link "View inventory".
   - "Recent returns": "Product", "Amount", "Reason".
7. Export bar (sticky bottom): "PDF" and "Excel" buttons (spinner while generating, toast "Report exported").

Charts: muted grid, navy primary series, periwinkle secondary, no heavy legends. Dark mode: light lines on dark cards.

---

### 7.7 Sales leads (Medium+)

#### Screen E1: Leads list
- Title "Sales leads".
- Summary: "Open leads 5", "Est. pipeline ₦640,000.00".
- Search "Search customer, phone, or product…".
- Status chips: "All | Open | Won | Lost".
- Rows: customer, product of interest, "Source" (Walk-in, WhatsApp, Instagram, Referral), "Est. value", status pill, "Updated 2h ago".
- Primary: "Add lead".
- Empty: "No leads yet", "Track enquiries before they become receipts."

#### Screen E2: Add lead (form)
Customer name, phone, email, product of interest (picker from inventory or free text), estimated value, source, notes, "Assigned to" (staff picker). Save.

#### Screen E3: Lead detail
- Header: customer, status pill, "Assigned to" (or "Unassigned").
- "Commerce" section: product, est. value, primary button "Convert to sale" (opens New sale prefilled).
- "Activity" timeline with "Add note" (placeholder "Follow-up details").
- Actions: "Mark lost" (sheet: "Reason (optional)", placeholder "Price, timing, bought elsewhere…"), "Delete lead" (confirm "Delete lead?").

---

### 7.8 Customer buybacks (owner only)

#### Screen F1: Buybacks list
- Title "Customer buybacks".
- Summary: "Buybacks 6", "Total paid ₦480,000.00".
- Rows: item name, customer, "Paid ₦80,000.00", method, date, action "View in stock".
- Primary: "Add buyback".
- Empty: "No buybacks yet", "Record items you buy back from customers. They go straight into stock."

#### Screen F2: Record customer buyback (form)
Title "Record customer buyback". Fields: "Customer name" (placeholder "Who sold this item?"), "Phone" ("Contact number"), "Email" ("Email address"), "Inventory category" ("Select category"), then the category's product fields, "Amount paid to customer", "Payment method", "Notes" ("Condition, ID check, reference…"). Primary "Record buyback". Result: product appears with "Buyback · ₦80,000.00" source badge.

---

### 7.9 Stock loans (Enterprise)

#### Screen G1: Stock loans list
- Title "Stock loans".
- Summary: "On loan 3", "Units 5".
- Chips: "All | Active | Sold | Returned".
- Rows: borrower name and phone, product (serial), "Units", "Started 12 Sep", status pill ("On loan", "Sold (borrower)", "Returned").
- Row actions: "Mark sold (borrower)", "Return to store".
- Primary: "New loan" (choose products from serial categories, borrower name/phone, notes).
- Empty: "No stock loans yet", "Lend serial-tracked stock to trusted resellers until it is sold or returned."

---

### 7.10 Multi-Store Sync (Enterprise, owner)

Segmented: "Transfer | History | Reports" (+ "Stores").

1. **Transfer** ("Move stock between branches"): "Source store" > "Source category" > "Select items to transfer" (checklist) > "Destination store" > "Destination category" > "Notes (optional)" > primary "Request transfer". Empty helper texts: "No categories on the source branch yet." / "No categories on the destination branch yet."
2. **History** ("Transfer history"): rows with from/to branches, item count, status (Requested, Approved, In transit, Completed, Cancelled); actions "Approve", "Complete", "Cancel"; "Shipment tracking" sheet with "Carrier" and "Tracking number", "Save".
3. **Reports** ("Consolidated reports"): range chips ("All time", "Last year"...), "Total revenue", "Total sales", "Avg order value", "Store breakdown" list per branch.

Locked state (Micro/Medium): "Enterprise: move stock between branches" + "View plans".

---

### 7.11 Team: Departments and Staff (Growing business)

#### Screen H1: Departments
- Title "Departments".
- List rows: department name (for example "Sales"), staff count ("1 staff"), chevron.
- Primary "Add department" (cap per plan; at the cap show Upgrade sheet "Medium supports up to 10 departments").
- Empty: "No departments yet".

#### Screen H2: Department detail (Staff roster)
- Nav: back "Departments", title "Sales", overflow ("Edit", "Move department", "Delete").
- Search "Search staff…".
- Segmented: "Active | Removed".
- Staff rows: avatar, name, "Position", email, "Access" summary ("Sales, Products view"), status pill ("Active", "Inactive", "On Leave").
- Primary "Add staff". At plan cap (Micro: 2): Upgrade sheet "Medium supports up to 25 staff per store".
- Empty: "No staff members yet". Removed empty: "No removed staff".

#### Screen H3: Add / Edit staff (form)
Fields: "First name", "Last name", "Email", "Phone", "Position", "Status" (Active / Inactive / On Leave), "Hire date", "Salary" (optional), Role (Staff / Manager).

Section **Permissions** (matrix of toggles):
- Products: View, Create, Edit, Delete
- Sales: View, Create, Edit, Delete, Refund
- Sales leads: View, Create, Edit, Delete
- Buybacks: View, Create, Edit, Delete
- Stock loans: View, Create, Edit, Delete
- Multi-Store Sync: View, Create, Edit, Delete
Preset buttons: "Cashier", "Supervisor", "Full access".

Delivery: primary "Email sign-in details" or "Email to staff instead". Success state: "Account created" / "Invite emailed" with temporary password reveal + copy, button "Done". Sensitive actions may require "Confirm with authenticator" (6-digit code sheet).

---

### 7.12 Activity logs (Medium+, owner and managers)

- Title "Activity logs".
- Filters: date range, actor, entity type (Products, Sales, Staff, Categories, Settings).
- Rows grouped by day: avatar, sentence "Ada refunded REC-493257", entity chip, time "2:14 PM". Tap opens detail sheet with before/after values (for price changes: "Price ₦30,000.00 > ₦35,000.00").
- Empty: "No activity yet".
- Locked (Micro): "See who changed what on Medium".

---

### 7.13 Notifications

- Title "Notifications" (Inbox), action "Mark all as read".
- Segmented: "All | Unread".
- Rows: type icon in a tinted circle, title, message, relative time, unread dot. Types and titles:
  - Sale created: "New sale", "REC-493257 was created for Chinedu Okafor".
  - Swap-in: "Swap-in Completed", "Swap-in receipt #REC-493258 was created for Tolu".
  - Refund: "Sale refunded".
  - Product created / updated / deleted, discount applied / removed.
  - Category created / updated / deleted.
  - Staff created / updated / removed, Department created / updated / deleted.
  - Import completed, Export completed.
  - Lead created, Lead converted.
- Tap opens the related screen. Swipe (iOS) / long press (Android): "Mark as read", "Delete".
- Note under the list: "Notifications older than 24 hours are cleared from this list."
- Empty: bell icon, "You're all caught up".

Push notification designs (lock screen): "New sale · ₦35,000.00 from Chinedu Okafor", "Low stock · Opulent Dubai has 2 left".

---

### 7.14 Profile and Settings

#### Screen I1: Profile (from avatar or More)

Header card: large avatar (photo or initials), name, email, role chip ("Owner" / "Manager" / "Staff"), branch.

Grouped sections (exact labels):
- **Account details**: "Profile", "Change profile photo".
- **Business**: "Store information", "Branch & store details", "Store settings".
- **General**: "Light / dark mode" (System / Light / Dark), "Language", "Region", "Currency", "Timezone", "Notifications".
- **Receipts**: "Receipt terms & policies".
- **Access**: "Roles & permissions".
- **Security**: "Password", "Two-factor authentication", "Active sessions".
- **Billing**: "Subscription & billing".
- **Support**: "Help center", "Ask assistant", "Dashboard tour".
- "Sign out" (red, centered row).

Two-factor setup flow: intro > QR code + manual key with copy > enter 6-digit code > recovery codes (copy / download) > "Done".

Change password: "Current password", "New password" (strength meter), "Confirm new password", "Update password".

#### Screen I2: Settings (owner)

Grouped sections (titles and subtitles):
1. **Account**: "Company logo and billing for your whole account." Rows: logo (with "Upload logo"), business name, "Subscription" (current plan + renewal date).
2. **Workspace style**: "How much of the app to show. Does not change what you pay for." Same 2 cards as onboarding.
3. **Advanced features** (Just me only): "You chose a simple setup. Turn on team and multi-location tools when you need them." Toggles: "Team & staff management", "Multi-location administration", "Roles & permissions administration", "Approval workflows", "Payment links" (Coming soon).
4. **Branches**: "Create, edit, and switch between store locations." List with edit / delete; "Add branch". Empty "No branches yet". At cap: Upgrade sheet "Add a second branch on Medium".
5. **Your assignment** (staff): "Store and department linked to your account." (read only).
6. **Inventory**: "Stock alerts and defaults for new products." Low-stock threshold, "Auto-reorder enabled" toggle, default tracking.
7. **Checkout payments**: "Tender types on sales, including OPay, Moniepoint, transfer, and cash." Reorderable list with remove, "Add method".
8. **Sales & receipts**: "Numbering, prefixes, and print behavior." Prefix (e.g. "REC"), next number, "Print receipt automatically" toggle, receipt footer text.
9. **Data export**: "Download Excel backups of inventory (by category folder), sales, buybacks, and stock loans for this branch." Buttons per dataset.

Branch form (sheet): "Branch Name *", "Description", "Sell screen note", "Address", "Phone", "Email", toggle "Active". Delete branch dialog: "Delete Store" / "This action cannot be undone."

---

### 7.15 Plans, subscription and upgrade sheet

#### Upgrade sheet (shown when tapping any locked feature)
- Plan badge ("Medium" or "Enterprise").
- Title from the trigger, for example:
  - Analytics: "See revenue trends and busiest hours on Medium"
  - Sales leads: "Track enquiries before they become receipts on Medium"
  - 3rd staff: "Medium supports up to 25 staff per store"
  - 2nd store: "Add a second branch on Medium"
  - WhatsApp cap: "Unlimited WhatsApp receipts on Medium"
  - Copy from branch: "Enterprise: copy category templates across branches"
  - Stock loans: "Enterprise: track inventory lent to borrowers"
- 3 bullet benefits with check icons.
- Primary "View plans", secondary "Not now".

#### Subscription screen (owner)
1. Current plan card: plan name, status ("Active", "Past due" amber), "Renews on 30 Oct 2026" or "Ends on ...", buttons "Change plan", "Cancel auto-renew".
2. Billing cycle segmented: "Monthly | Quarterly (Save 10%) | Yearly (Save 15%)".
3. Plan cards: Micro, Medium (badge "Recommended"), Enterprise, each with regional price, cycle, and the feature list from section 4.2. Primary "Upgrade to Medium". Payment handled by Paystack (opens a secure web sheet).
4. Cancel auto-renew dialog: "Cancel auto-renew?" / "You keep Medium until 30 Oct 2026, then move to Micro." / "Keep auto-renew", "Cancel auto-renew".

---

### 7.16 Help center and Storvv Assistant

#### Help center
- Title "Help center", search "Search help topics…".
- "Popular topics" chips: Getting started, Inventory, Sales, Sales & refunds, Sales leads, Stock loans, Staff & roles, Analytics, Plans & billing, Mobile app, Settings, Profile.
- "Common screens" list (Dashboard, Inventory, Sales, ...), each opening an article.
- Article screen: title, "On this page" mini table of contents, body, "Back to top".
- Bottom card: "Ask assistant".

#### Storvv Assistant (chat)
- Opened from "Ask AI" in the top bar or More.
- Header: sparkles icon, "Storvv Assistant", close.
- Empty state: greeting "Hi Ada, what do you need?" + suggestion chips: "What sold best this week?", "Which products are low on stock?", "How do I refund a sale?", "Add a new staff member".
- Message bubbles: user (navy, right), assistant (surface card, left) with rich answers (mini tables, product chips, "Open sale" buttons).
- Composer: text field "Ask anything about your store…", send button, optional mic.

---

### 7.17 Coming soon entries

Show these as list rows or cards with a "Coming soon" pill. Tapping opens a sheet; nothing is functional.

- **Payment links**: icon link. Sheet: "Payment links are coming soon", "Send customers a secure link to pay by card or transfer, and see when it's paid.", button "Notify me", "Close".
- **Storefront**: icon storefront. Sheet: "Storefront is coming soon", "A public page for your products so customers can browse and send requests.", "Notify me".

Do not design checkout, payout or storefront management screens yet.

---

## 8. Global states to design for every list or form

| State | Design |
| --- | --- |
| Loading | Skeleton rows/cards matching the final layout; no spinners over content |
| Empty | Section 6 empty-state component with screen-specific copy (given above) |
| Filter / search empty | "No results for "…"" + "Clear filters" |
| Error | Card with alert icon, "Couldn't load sales", "Check your connection and try again.", "Try again" button |
| Offline | Top banner "You're offline. Changes will sync when you're back online." (amber); sales can still be recorded and show a small "Pending sync" cloud icon |
| No store selected | "Select a store" empty state + "Choose branch" button |
| Permission denied | Lock icon, "You don't have access to this", "Ask your admin to update your permissions." |
| Plan locked | Upgrade sheet (7.15) or inline locked card |
| Success | Toast/snackbar (e.g. "Product added", "Sale refunded", "Receipt number copied") |
| Destructive confirm | Action sheet (iOS) / dialog (Android) with red primary |

Accessibility for all states: minimum touch target 44pt / 48dp, contrast WCAG AA, Dynamic Type / font scaling up to 200% without clipping (cards grow vertically), VoiceOver/TalkBack labels for icon-only buttons (for example "Copy receipt number", "Sale actions").

---

## 9. Sample data (use for realistic mockups)

Business: "Scoz Fragrances", owner "Scoz" (initials SC), email scoz@storvv.com. Branches: "Port Harcourt" (PHC, active), "Abuja" (inactive). Department: "Sales" (1 staff).

Categories: Perfumes (16 subcategories), Body Sprays (0 items), Scented Candles (0 items).

Lattafa products:

| Product | Unit price | Qty | Cost | Date in | Margin | Availability |
| --- | --- | --- | --- | --- | --- | --- |
| Fire On Ice | ₦35,000.00 | 20 | ₦27,000.00 | 8 Sep 2026 | +₦8,000.00 · 23% | Available |
| Hayatii Gold Elixir | ₦23,000.00 | 40 | ₦13,000.00 | 8 Sep 2026 | +₦10,000.00 · 43% | Available |
| Musamam Black Intense | ₦35,000.00 | 20 | ₦27,000.00 | 8 Sep 2026 | +₦8,000.00 · 23% | Available |
| Musamam White Intense | ₦35,000.00 | 20 | ₦27,000.00 | 8 Sep 2026 | +₦8,000.00 · 23% | Available |
| Opulent Dubai | ₦30,000.00 | 87 | ₦17,000.00 | 8 Sep 2026 | +₦13,000.00 · 43% | Available |
| Opulent Musk Blue | ₦30,000.00 | 93 | ₦17,000.00 | 8 Sep 2026 | +₦13,000.00 · 43% | Available |
| Opulent Musk Red | ₦30,000.00 | 93 | ₦17,000.00 | 8 Sep 2026 | +₦13,000.00 · 43% | Available |

Sales:

| Sale # | Customer | Items | Total | Payment | Status |
| --- | --- | --- | --- | --- | --- |
| REC-493257 | Chinedu Okafor (0803 555 0192) | Fire On Ice ×1 | ₦35,000.00 | Bank Transfer | Completed |
| REC-493258 | Tolu Adeyemi | iPhone 13 swap + Opulent Dubai | ₦30,000.00 | Split Payment | Completed (Swap) |
| REC-493259 | Amaka Nwosu | Opulent Musk Blue ×2 | ₦60,000.00 | Cash | Balance due (Paid ₦40,000.00) |
| REC-493260 | Walk-in customer | Hayatii Gold Elixir ×1 | ₦23,000.00 | Card (POS) | Pending |
| REC-493201 | Ibrahim Musa | Musamam Black Intense ×1 | ₦35,000.00 | OPay | Refunded |

Home metrics: Total revenue ₦1,240,000.00 (+12.4%), Orders today 14, Active customers 86, Low stock signals 3, Outstanding balances ₦120,000.00, Open leads 5, Products 14, Total value ₦34.2m, Total profit ₦12.2m.

---

## 10. Screen checklist (frames to deliver)

For each item: iOS light, iOS dark, Android light, Android dark.

**Auth and onboarding**
- [ ] Splash
- [ ] Welcome
- [ ] Log in (default, error, biometric)
- [ ] Two-factor code
- [ ] Forgot password (form, sent)
- [ ] Create account (with strength meter, error)
- [ ] Verify email
- [ ] Onboarding step 1, 2, 3
- [ ] Home with "Get set up" checklist + tour coach mark

**Home**
- [ ] Home (populated, empty workspace, staff, Micro)
- [ ] New action sheet (New sale / Quick sale / Add product)
- [ ] Global search (empty, results, no results)
- [ ] Branch picker sheet

**Inventory**
- [ ] Categories (grid, list, empty, loading, selection mode)
- [ ] Category hub (subcategories)
- [ ] Product list (filters, discounted row, swap-in row, empty)
- [ ] Product detail (default, locked/sold)
- [ ] Product timeline
- [ ] Add/Edit category (+ Add field sheet)
- [ ] Add/Edit product (bulk, serial with duplicate error)
- [ ] Apply discount / Bulk discount
- [ ] Copy from branch
- [ ] Delete confirmations

**Sales**
- [ ] Sales list (populated, empty, filtered empty)
- [ ] New sale: Category, Subcategory, Items, Sale details (single payment, split payment states, part payment, swap-in on), Success
- [ ] Quick sale (scan, selected items, success)
- [ ] Sale detail (completed, balance due, swap-in, refunded)
- [ ] Share sheet, Email receipt sheet
- [ ] Refund flow (sheet + confirm)
- [ ] Record payment
- [ ] Cancel order dialog
- [ ] Outstanding (populated, empty, locked)
- [ ] Customers list + Customer detail

**Analytics**
- [ ] Analytics (populated) + export state
- [ ] Analytics locked (Micro)

**Operations**
- [ ] Sales leads list, Add lead, Lead detail, Mark lost
- [ ] Buybacks list, Record buyback
- [ ] Stock loans list, New loan, Mark sold / Return
- [ ] Multi-Store Sync: Transfer, History (+ tracking sheet), Reports, Locked

**Team and audit**
- [ ] Departments
- [ ] Department roster (Active, Removed, empty)
- [ ] Add/Edit staff + Permissions matrix + Invite success
- [ ] Activity logs (+ detail sheet, locked)

**Account**
- [ ] Notifications (all, unread, empty) + push notification mockups
- [ ] Profile
- [ ] 2FA setup flow, Change password
- [ ] Settings (owner) + Branch form + Delete branch
- [ ] Subscription + Upgrade sheet + Cancel auto-renew
- [ ] Help center + Article
- [ ] Storvv Assistant (empty, conversation)
- [ ] Coming soon sheets (Payment links, Storefront)
- [ ] More menu (Growing business, Just me, Staff)

**Global states**
- [ ] Loading skeletons, Error card, Offline banner, Permission denied, No store selected, Toast/Snackbar variants

---

## 11. Prototype paths to wire in Figma

1. **First run**: Splash > Welcome > Create account > Verify email > Log in > Onboarding 1 > 2 > 3 > Home (checklist).
2. **Stock a category**: Home > Stock tab > Add category > Save > Category > Add product > Save > Product list.
3. **Make a sale**: Sales tab > New sale > Category > Subcategory > Items (add 2) > Sale details (customer suggestion, split payment) > Create sale > Success > Share on WhatsApp.
4. **Swap-in sale**: New sale > Items > Sale details > toggle swap-in > pick folder > device details > Create sale > Sale detail with "Swap" badge.
5. **Quick sale**: Home FAB > Quick sale > scan > Complete sale.
6. **Part payment**: New sale > amount paid now > Create sale > Outstanding > Record payment > Completed.
7. **Refund**: Sales > row > Sale detail > Refund > Confirm > Refunded.
8. **Branch switch**: Home > Branch pill > Abuja > toast > Home refreshed.
9. **Upgrade**: Analytics tab (Micro) > Locked > View plans > Subscription.
10. **Add staff**: More > Departments & staff > Sales > Add staff > permissions > Email sign-in details > Invite emailed.

---

*End of specification.*
