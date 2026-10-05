# Stage 12 brief: replace the remaining legacy UI

Repo: /Users/user/storv-ui (Nuxt 3, SSR off, Vue 3 `<script setup>`, Pinia, Firebase, Capacitor shell).

The app has been redesigned onto a design system (DS). Most screens are done. The files assigned to you
still render the OLD UI: Tailwind utility classes (`text-gray-500 dark:text-gray-400 rounded-xl px-4 …`),
arbitrary values (`tracking-[0.35em]`, `bg-[#fafafa]`), legacy class names (`dash-*`, `dashboard-table*`,
`app-field`, `btn-primary`, `btn-sm`, `glass-*`), and legacy components (`~/components/ui/Button.vue`,
`~/components/ui/Checkbox.vue`, `DashboardPageHeader`, `DashboardToolbarRow`, `DashboardPageMetrics`,
`DashboardTableEmptyState`, `DashTableSkeleton`, `AccountAvatar`). All legacy CSS files
(`assets/css/dashboard-*.css`, `web-glass-app.css`, `web-design-tokens.css`, `app-buttons.css`, most of
`main.css`) and Tailwind's styling of dashboard markup are being DELETED after you finish, so anything that
still depends on them will render unstyled. Your job: rebuild your files' markup on the DS so they look like
the rest of the redesigned app.

## The design system

- Components in `components/s/*` (read their props before use): SButton (variant primary|secondary|ghost|danger,
  size sm|md|lg, loading, block, `#leading` slot for an icon), SIconButton, SDialog (v-model:open, title,
  description, size sm|md|lg, placement center|right|bottom, dismissible, role alertdialog for destructive
  confirms, `#header`/`#footer` slots), SDialogActions (Cancel + primary pair for a dialog footer), SForm,
  SFormSection, SField, SInput, SSelect, STextarea, SCheckbox (variant checkbox|switch), SBadge, SCard, SStat,
  SEmptyState, SSkeleton, SSpinner (numeric size), SPageHeader, STabs, SSearch, SMenu/SMenuItem, SPopover,
  SPagination, SSortHeader, SAvatar. Import them explicitly: `import SButton from '~/components/s/SButton.vue'`.
- Tokens in `assets/css/ds/tokens.css` (light + dark handled by tokens, never write `dark:` or `.dark` rules):
  colours `--s-bg --s-surface --s-surface-2 --s-surface-hover --s-border --s-border-strong --s-text --s-text-2
  --s-text-muted --s-accent --s-accent-soft --s-accent-soft-text --s-success(-soft) --s-warning(-soft)
  --s-error(-soft) --s-info(-soft) --s-field-bg`; spacing (8pt) `--s-space-half(4px) -1(8) -2(16) -3(24) -4(32)
  -5(40) -6(48) -8(64)`; type `font: var(--s-text-display|title|heading|body-lg|body|small|caption)`; radius
  `--s-radius-sm|--s-radius|--s-radius-lg|--s-radius-full`; `--s-shadow-sm|md|lg`; motion
  `--s-duration-fast|--s-duration|--s-ease`; `--s-touch` (44px), `--s-control-h`.
- Existing DS class vocabulary lives in `assets/css/ds/*.css` — reuse before inventing: `components.css`
  (s-card, s-badge, s-callout, s-form*, s-field*, s-inline-field, s-list…), `data.css` (s-table, s-toolbar,
  s-table-wrap…), `sheets.css` (record/money/line-item blocks used inside sale and receipt sheets:
  s-record-*, s-money-*, s-lines-* …), `modules.css`, `shell.css`. Look at already-rebuilt examples:
  `pages/dashboard/branches.vue` (page + "Add branch" sheet — the reference sheet design),
  `components/receipts/ReceiptDetailsDrawer.vue`, `components/receipts/CreateReceiptModal.vue`,
  `pages/dashboard/customers.vue`, `pages/dashboard/leads/index.vue`, `pages/dashboard/profile.vue`.
- Icons: `@lucide/vue`, `:size="16"` (or 14/20), `:stroke-width="1.75"` or 2, `aria-hidden="true"` when decorative.
- New styles go ONLY in the CSS file assigned to you (below). Root every component/page element with the DS
  scope class `s-c` (pages: `ds-root s-c s-page` like the rebuilt pages). Class names: `s-<area>__<part>`,
  BEM-ish, prefixed so they can't clash. Values must be tokens (no raw px except 1px borders, no hex colours,
  no arbitrary values). 8pt spacing, 44px min touch targets, WCAG AA contrast, 150–250ms transitions only
  where meaningful. No glass/blur/gradient/glow effects.
- Destructive confirmation dialogs: `SDialog role="alertdialog" size="sm"`, `SDialogActions primary-variant="danger"`.
- Tables: `s-table` inside `s-table-wrap` (see data.css and customers.vue). Status: `SBadge` tones.
  Empty states: `SEmptyState`. Loading: `SSkeleton` / `SSpinner`. Page headers: `SPageHeader`.

## Rules

1. Keep ALL behaviour: data loading, Firestore/API calls, store actions, permissions, emitted events, props
   contracts used by other files, routes, v-models, validation, analytics calls, accessibility attributes.
   Only the presentation layer changes. Don't remove features or copy that users rely on; you may tighten copy.
2. No Tailwind utility classes, no `dark:` variants, no legacy class names, no inline `style` for visuals
   (dynamic positioning styles from logic are fine) in the files you own when you're done.
3. Replace legacy components with DS ones. `~/components/ui/Button.vue` → SButton, `~/components/ui/Checkbox.vue`
   → SCheckbox, etc. If a file you own is itself a legacy wrapper that becomes unused, say so (don't delete
   files outside your list).
4. Don't add explanatory comments about the migration. Match surrounding code style.
5. Only edit files in your list plus your assigned CSS file. If something outside must change, report it.

## Verify (required)

- `node .cursor/tools/sfc-check.mjs <each .vue file you changed>` → every file prints `OK`.
- `rg -n "dark:|text-gray-|bg-gray-|bg-white|rounded-(md|lg|xl|2xl)|\b(px|py|mt|mb|gap)-[0-9]|\[[#0-9]|dash-|dashboard-table|app-field|btn-primary|btn-sm|ui/Button|ui/Checkbox" <your files>` → no matches
  (ignore genuine non-class strings).
- Do NOT run `nuxt build`, `npm run dev`, or the unit tests (other agents are editing in parallel). If you need
  to see it, the dev server may already be on http://localhost:3000 but don't rely on it.

## Report back (concise)

Per file: what changed visually/structurally, any behaviour you were unsure about, anything outside your files
that needs a change, and any file in your list that is now unused.
