export type DashboardHelpArticle = {
  title: string
  body: string[]
  bullets?: string[]
}

export type DashboardHelpCategoryId =
  | 'recent-updates'
  | 'getting-started'
  | 'navigation-search'
  | 'inventory'
  | 'sales-receipts-customers'
  | 'analytics'
  | 'activity-logs'
  | 'departments-staff'
  | 'multi-store'
  | 'settings-subscription'
  | 'profile-notifications'

export type DashboardHelpCategory = {
  id: DashboardHelpCategoryId
  title: string
  blurb: string
  articles: DashboardHelpArticle[]
}

export const dashboardHelpCategories: DashboardHelpCategory[] =
[
  {
    id: 'recent-updates',
    title: 'Recent updates',
    blurb: 'Highlights from recent Storvv releases.',
    articles: [
      {
        title: 'Optional subcategories when creating categories',
        body: [
          'When you create or edit a top-level category (Inventory → New category), Organize with subcategories is optional and off by default. Leave it off to add products directly in that category, like a simple flat folder.',
          'Turn it on when you want a parent hub (for example Toyota with Corolla and Camry underneath). The parent opens a subcategory hub instead of a product table until you add subcategories. You cannot switch on subcategories after products already exist in that category.',
          'Category cards on the main Inventory list show a subcategory count when a parent already has children. Add subcategories from the parent hub with Add subcategory; each subcategory inherits columns, serial vs quantity mode, profit tracking, and department access from the parent.',
        ],
        bullets: [
          'Sales, Quick Sale, and buybacks only use leaf categories: subcategories or top-level categories without subcategories enabled.',
          'Editing a parent and changing columns or tracking prompts you to apply the same settings to existing subcategories or keep changes on the parent only.',
        ],
      },
      {
        title: 'Copy from branch: optional subcategories (Enterprise)',
        body: [
          'On Inventory (/dashboard/inventory), super admins on Storvv Enterprise use Copy from branch when you have more than one active branch. Pick a source branch, then select top-level category templates to copy into the branch you are viewing in the header store switcher.',
          'Each selected parent shows how many subcategories it has (for example Toyota · 3 subcategories). Check Also copy subcategories into selected folders when you want the full hierarchy copied, not just the parent shells. Parent categories are always included; subcategories copy only when that box is checked.',
          'Only category templates copy: names, custom columns, serial vs bulk mode, and colors. Products, stock counts, and department restrictions do not copy. If a name already exists on the destination, skip it or create an automatic “(copy)” suffix.',
        ],
        bullets: [
          'The category checklist lists top-level categories only; subcategory names appear in the preview when the include-subcategories option is on.',
          'Duplicating a single category within one branch remains on Storvv Medium; cross-branch template copy is Enterprise only.',
        ],
      },
      {
        title: 'Branch names from your region (Settings)',
        body: [
          'When creating a branch in Settings → Branches → Create Branch, the branch name uses cities from your account region (the country you picked during onboarding), matching the head-store step in Account setup.',
          'Choose a city from the dropdown (for example Lagos, Abuja, or Port Harcourt for Nigeria). Optionally add an area or neighborhood after the city (for example Lekki or GRA) so the branch displays as “Lagos, Lekki” in the sidebar and store switcher.',
          'If your region has no preset city list, you can enter a custom branch name instead. Sell screen notes and contact fields remain optional on the same form.',
        ],
        bullets: [
          'Branch limits follow your plan: Storvv Micro allows one store; Medium and Enterprise allow more.',
          'Managers and staff cannot create branches; only the account owner (super admin) can.',
        ],
      },
      {
        title: 'Customer buybacks',
        body: [
          'Super admins can record customer buybacks from Inventory → Customer buybacks (/dashboard/buybacks). Use this when someone sells an item to your store: you pay them, a new inventory row is created in the leaf category you pick, and the buyback appears in the list with customer, item, amount paid, and payment method.',
          'Record buyback opens a side drawer: pick a leaf category (parent · subcategory labels when applicable), fill the item fields for that template, enter amount paid to the customer and payment method, then save. That amount becomes the item unit cost in inventory.',
          'On Create New Sale, super admins can add swap-in / buyback credit lines when trade-in value applies to a sale. Buybacks are scoped to the active store in the header switcher.',
        ],
        bullets: [
          'Only store owners (super admins) can record buybacks; managers and staff do not see this screen.',
          'Use leaf categories only—the same rule as adding products or creating a sale.',
        ],
      },
      {
        title: 'Analytics feature insights',
        body: [
          'Analytics & Reports (/dashboard/analytics) on Storvv Medium and Enterprise now includes a Feature insights grid alongside charts and exports. After you pick Daily, Weekly, or Monthly, cards summarize sales, returns, outstanding balances, inventory health, customers, profit and cost (super admin), operations, buybacks, customer balance ledger, stock loans, and payment links where your plan includes them.',
          'Inventory health shows available vs sold units, low-stock lines, and book value with the same progress bar as the dashboard home. Peak hours, sales by hour, day-of-week charts, and the traffic heatmap help you spot busy periods.',
        ],
        bullets: [
          'Analytics requires a selected store; super admins use the header store switcher.',
          'Export PDF and Export Excel download reports for the active period and branch.',
        ],
      },
      {
        title: 'Quick Sale side drawer',
        body: [
          'Quick Sale opens as a right-side drawer (not a centered modal) from the Sales page. Pick a parent category, then a subcategory when the parent has children, then scan barcodes or search products. External USB barcode scanners work as keyboard input when the scan field is focused.',
          'Quick Sale shares the same category hierarchy and stock checks as Create New Sale. Over-quantity lines show an error and block checkout.',
        ],
      },
      {
        title: 'Stock loans (Enterprise)',
        body: [
          'Super admins and store managers on Storvv Enterprise get Stock loans under Inventory in the sidebar. Use it when serial-tracked inventory is lent to a borrower (for example stock on consignment) while it still belongs to your branch on paper.',
          'Create a loan from a serial folder by selecting rows and confirming the borrower. Active loans list borrower, units, filters for Active / Returned / Sold (borrower) / All, and per-row actions.',
        ],
        bullets: [
          'Selling a loaned serial line on Create New Receipt or Quick Sale marks it sold, clears borrowing flags from inventory, and updates the linked stock loan.',
          'The row actions menu (three dots) opens Mark sold when the borrower sold off-POS, or Return to store when units come back. Mark sold writes the usual sold state to inventory.',
          'Multi-store transfer screens still warn if an item is on a loan until you resolve it through receipt, borrower sale, or return.',
        ],
      },
      {
        title: 'Activity Logs readability',
        body: [
          'Activity Logs now normalizes long typographic dashes in automated descriptions to plain commas or hyphens, so rows stay easy to scan in the Target column.',
        ],
      },
      {
        title: 'Navigation polish',
        body: [
          'The Stock loans sidebar icon uses a filled glyph when that page is active so the active rail state matches bolder labels everywhere else.',
          "The public Storvv site opens with a dedicated What's new band under the hero, then lists Stock loans in the capabilities grid.",
          'This Help center is updated alongside product changes: search for stock loan or recent updates in the help search box to jump here.',
        ],
      },
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting started',
    blurb: 'Roles, stores, and first-time setup inside Storvv.',
    articles: [
      {
        title: 'What Storvv does in this app',
        body: [
          'Storvv is your operational workspace: inventory lives in folders and items, sales are recorded as receipts (with customers on the same Sales screen), and optional areas include Analytics, Activity Logs, Departments, and Multi-Store Sync depending on your subscription.',
          'Nearly all data is tied to the store that is active for your session. Super admins switch stores from the store selector in the header; managers and staff work inside the store they have been assigned.',
          'The sidebar lists real product routes: Dashboard, Inventory, Customer buybacks (super admins), Stock loans (Enterprise, managers/super admins), Receipts, Analytics, Activity Logs, Multi-Store Sync, Payment links (when enabled), Help center, Settings, and Profile. Items such as Analytics, Stock loans, Payment links, or Multi-Store Sync only appear when your plan and role include them.',
        ],
      },
      {
        title: 'Super admin, manager, and staff',
        body: [
          'Super admins are account owners: they can edit Settings (store profile, inventory defaults, receipt numbering, Paystack subscription upgrades), create folders and edit item definitions, delete receipts, create staff logins, and run Multi-Store Sync when the plan allows.',
          'Staff users sign in with their own email and password. A staff user is either a store manager or standard staff. Managers can edit receipts and run refunds; standard staff are mostly read-only for inventory structure and settings but can still create new receipts.',
          'Only super admins can create inventory folders, change item rows, or delete receipts. Only super admins can add staff accounts; managers cannot.',
        ],
        bullets: [
          'If a control is missing or disabled, check role (super admin vs staff) and subscription first.',
          'Use separate logins per teammate so Activity Logs stay meaningful.',
        ],
      },
      {
        title: 'Account setup (onboarding)',
        body: [
          'New accounts complete Account setup on the Onboarding wizard: currency and country (used for every money field and format), then store details. Finish onboarding before relying on totals in reports.',
          'The Dashboard can show a Tutorial that highlights key UI areas; complete or dismiss it from the Dashboard when you are ready.',
        ],
      },
    ],
  },
  {
    id: 'navigation-search',
    title: 'Navigation & search',
    blurb: 'Sidebar, collapse state, store switcher, global search, toasts, theme.',
    articles: [
      {
        title: 'Sidebar, header, and version',
        body: [
          'The sidebar collapses on desktop to a narrow icon rail or expands to show full labels. On mobile, open it with the menu control in the top bar.',
          'When the sidebar is collapsed on a large screen, the active page is highlighted on its icon (a clear “pill” state) so you can see where you are at a glance.',
          'The header shows the active page name (on medium screens and up), opens Global Search, shows the store / branch switcher for super admins, theme toggle, notifications, and your profile menu (Profile, Settings, Sign out).',
          'At the bottom of the sidebar, a small version label (for example V0.1) reflects the current app build; it is informational only.',
        ],
      },
      {
        title: 'Store switcher (branches)',
        body: [
          'Super admins switch the active branch from the store control in the header. The menu lists your branches; the current one is marked active. Choose “Manage stores” to jump to Settings and edit branch details.',
          'Managers and staff work in the store they were assigned; they do not change branch from this control.',
          'Always confirm the correct branch is selected before editing inventory, recording sales, or reading analytics, because most screens use the active branch only.',
          'If Analytics prompts you to pick a store, use the header switcher (super admins) or ask an admin to confirm your assigned branch.',
        ],
      },
      {
        title: 'Global search (⌘K / Ctrl+K)',
        body: [
          'Click Search in the header or press ⌘K on Mac / Ctrl+K on Windows. The modal searches receipts, inventory, and customers and offers quick filters by entity type.',
          'Use arrow keys to move through results, Enter to open a result, Esc to close; this matches the on-screen hints.',
        ],
      },
      {
        title: 'Notifications and toasts',
        body: [
          'Short status messages (saved, deleted, errors) appear as lightweight toasts in the corner so you get feedback without leaving your flow.',
        ],
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    blurb: 'Categories page (grid or table), subcategories, category detail, items, and permissions.',
    articles: [
      {
        title: 'Categories list (/dashboard/inventory)',
        body: [
          'The Inventory entry opens top-level categories only: search, filter by department, sort by name / products / date, and paginate. Subcategories (for example Corolla under Toyota) do not appear on this main list - open the parent category to see them.',
          'Category cards show how many subcategories a parent has when applicable. Use the grid / table toggle next to the filters to switch layout. Grid shows category cards; table matches the same styling as the product table inside a category.',
          'Super admins can create top-level categories with New category, rename, delete, and bulk-delete where the UI provides those actions. Storvv Micro may show upsell messaging when category limits apply.',
        ],
      },
      {
        title: 'Subcategories (one level under a parent category)',
        body: [
          'Storvv supports one level of subcategories: a top-level category (parent) can contain subcategories, but subcategories cannot contain further nested folders. Example: Inventory → Toyota (parent) → Corolla, Camry (subcategories).',
          'When creating a top-level category, turn on Organize with subcategories if you want a parent hub (for example Toyota with Corolla and Camry underneath). Leave it off to add products directly in that category.',
          'Open a parent category from /dashboard/inventory to reach its subcategory hub. The hub lists subcategory cards (same card style as top-level categories) and an Add subcategory button when the parent has no products directly in it.',
          'Products always live in leaf categories: either a subcategory (Corolla) or a top-level category that has no subcategories. You cannot add products to a parent that still has subcategories - open a subcategory instead.',
          'When creating a subcategory, it inherits the parent’s column template, serial vs quantity mode, profit tracking, department access, type, and color. You only enter a subcategory name and optional description.',
          'Add subcategory from the parent hub, or from inside any subcategory under the same parent (Add subcategory adds a sibling). The main Categories page does not create subcategories - only top-level categories.',
          'If a parent category already has products in it, you cannot add subcategories to that parent. Organize with subcategories before adding stock at the parent level, or use a fresh parent category.',
          'When a super admin edits a parent category and changes columns, tracking, or access settings, Storvv asks whether to apply those changes to existing subcategories too (Parent only vs Apply to subcategories). Name and description of each subcategory are never overwritten by that sync.',
          'Sales and Create New Sale only let you pick leaf categories (subcategories or categories without children). Data export (Settings → Data export) writes inventory ZIP folders as Parent/Subcategory/items.xlsx when subcategories exist.',
        ],
        bullets: [
          'Breadcrumbs follow the path: Inventory → Toyota → Corolla. The back arrow on a subcategory page returns to its parent (Toyota), not always to the main Inventory list.',
          'Deleting a parent category removes its subcategories and their products (with confirmation).',
        ],
      },
      {
        title: 'Inside a category (/dashboard/inventory/[id])',
        body: [
          'Parent categories with subcategories enabled (or an empty parent that already has subcategories) show the subcategory hub instead of a product table.',
          'Leaf categories - subcategories or top-level categories without children - open a table of products with the columns your template defines. Use pagination, search, and filters from the toolbar.',
          'Row actions (three-dot menu) include History (item timeline), Add discount / Discount for line-level pricing, and Edit item when the item is not locked. Items tied to completed sales can be restricted so catalog edits do not fight receipt history.',
        ],
      },
      {
        title: 'Who can change inventory',
        body: [
          'Folder creation, item creation, and editing item definitions require a super admin. Managers and staff pick from the catalog when building receipts but cannot create folders or redefine items.',
          'Quantities typically move when receipts complete or refunds process; use those flows plus super-admin corrections rather than informal workarounds.',
        ],
      },
      {
        title: 'Customer buybacks (/dashboard/buybacks)',
        body: [
          'Customer buybacks is under Inventory in the sidebar for super admins only. Record when a customer sells stock to your branch: you capture item details in a leaf category, pay the customer, and Storvv adds the unit to inventory with that purchase price as unit cost.',
          'The buybacks table lists customer, item summary, amount paid, payment method, and date. Open View in stock to jump to the inventory row. Swap-in credit on Create New Sale can apply buyback value toward a purchase when your workflow uses trade-ins.',
        ],
        bullets: [
          'Managers and staff cannot open Customer buybacks; only the store owner account can.',
          'Pick the correct leaf category before recording so columns and serial vs quantity mode match the item.',
        ],
      },
      {
        title: 'Copy from branch (Enterprise)',
        body: [
          'On the Categories page (/dashboard/inventory), super admins on Storvv Enterprise see a “Copy from branch” action next to “New category” when you have more than one active branch.',
          'It opens a side drawer where you pick a source branch, then select top-level category templates to copy into the branch you are currently viewing in the app (header / sidebar store switcher). Each parent row shows its subcategory count when applicable.',
          'Check Also copy subcategories into selected folders to copy the full hierarchy (for example Toyota plus Corolla, Camry, and Highlander). Leave it unchecked to copy only the selected parent category shells. Parent categories you select are always copied; subcategories copy only when that option is on.',
          'Only folder definitions are copied: names, custom field templates, serial vs bulk mode, colors, and whether the parent uses subcategories. Products, quantities, and department restrictions are not copied (those IDs are per branch; re-apply access on the destination if you use them).',
          'If a folder name already exists on the destination, you can skip that folder or create a copy with an automatic “(copy)” suffix. Medium plan includes duplicating a single folder within one branch; copying selected templates across branches is Enterprise only.',
        ],
        bullets: [
          'The checklist always reflects the source branch in the dialog, not the folder grid behind the window. Match “Source branch” to where your templates live.',
        ],
      },
    ],
  },
  {
    id: 'sales-receipts-customers',
    title: 'Sales: receipts & customers',
    blurb: 'The Sales page (/dashboard/receipts), permissions, and refunds.',
    articles: [
      {
        title: 'Sales page: Receipts and Customers tabs',
        body: [
          'Sidebar label is Receipts, but the page title reads “Sales” with subtitle “Manage receipts, customers, and returns”. Two tabs exist: Receipts (default) and Customers.',
          'Receipts shows totals for receipt count, sales amount, today, and month, plus search, status filters (All, Completed, Pending, Refunded), and date filters (All dates, Today, This week, This month). Use fullscreen mode for dense lists; filters stay pinned at the top.',
          'Use the “New sale” button in the sales table toolbar to open Create New Sale.',
        ],
      },
      {
        title: 'Create New Sale (four steps)',
        body: [
          'The drawer title is “Create New Sale” with subtitle “Pick category, subcategory, items, then sale details.” Step 1: pick a parent category (for example Toyota or Office Chairs). Step 2: pick a subcategory when the parent has children (for example Corolla under Toyota); leaf categories skip this step. Step 3: select items and quantities; use “Add from another category” to keep your cart and add lines from more categories in one sale. Step 4: sale details - customer fields, payment method, paid in full or balance due, and notes.',
          'Selected items are grouped by category before checkout. Serial folders can include lines on an active Stock loan: you may add them like other sellable SKUs. Completing the sale marks them sold and updates the borrower loan in the background when your plan includes Stock loans (Enterprise).',
          'After you reach the items step, if your branch has a Sell screen note configured in Settings → create or edit branch, a short banner can appear at the top of the items and checkout steps with store-specific reminders (for example promos or price notes).',
          'Super admins can enable swap-in style lines inside the receipt flow when your business records trade-ins alongside standard SKUs.',
        ],
      },
      {
        title: 'Quick Sale (side drawer)',
        body: [
          'Quick Sale opens from the Sales page toolbar as a side drawer. Step through parent category → subcategory (when needed) → product list, then add lines to the cart. Barcode scanning and wedge scanners (keyboard input) work when the active category is selected and the scan field is focused.',
          'Stock validation matches Create New Sale: you cannot add more quantity than available, and checkout stays disabled until the cart is valid. Quick Sale uses the same payment and customer fields as other checkout flows where shown.',
          'Sell screen notes from Settings → branch profile appear at the top of Quick Sale and Create New Sale after you pick a category, so cashiers see branch reminders inline.',
        ],
      },
      {
        title: 'Payment links',
        body: [
          'Payment links (/dashboard/payment-links) let you create shareable Paystack checkout links for remote sales when your plan includes payment_links. Connect a payout account first, then create links with customer name, amount, and description.',
          'The Payment links summary on Dashboard home and Analytics shows collected, paid, unpaid, and failed counts plus recent links. On native iOS/Android apps, payment links may show as coming soon depending on build configuration—use the web app for full setup when needed.',
        ],
      },
      {
        title: 'Customer balance and credit ledger',
        body: [
          'Storvv Medium and Enterprise include customer balance tracking on the Sales → Customers tab. When a sale is completed with balance due or credit applied, the customer ledger records charges and payments.',
          'Open a customer row menu to view or adjust balance where your role allows. Payment reminders and WhatsApp nudges for outstanding balances follow your plan limits (Micro caps WhatsApp sends per month).',
        ],
      },
      {
        title: 'Receipt actions and roles',
        body: [
          'View, print, and PDF actions run from the receipt detail and timeline views where those buttons appear. Refunds use the return flow on each receipt for users with edit rights.',
          'Super admins and store managers may edit receipt-level details and process refunds; standard staff cannot change completed receipts that way. Only super admins can delete a receipt from the delete action, which may offer a short undo window in the notification.',
        ],
      },
      {
        title: 'Customers tab',
        body: [
          'Switch to Customers to search and maintain the customer directory used when filling receipt details. The tab has its own pagination and fullscreen option parallel to receipts.',
        ],
      },
      {
        title: 'Returns and refunds',
        body: [
          'Returns are processed per receipt via the Return flow (not a separate third tab). Filter the Receipts list with status Refunded to audit completed refunds.',
          'Bookmarks to /dashboard/returns redirect into Sales; stay on the Receipts tab and open the return / refund action on the row when you have permission.',
        ],
        bullets: [
          'Match the correct receipt before refunding so inventory and totals reconcile.',
          'If something looks wrong after a refund, managers and super admins should coordinate before editing underlying data.',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    blurb: '/dashboard/analytics: metrics, charts, exports.',
    articles: [
      {
        title: 'Analytics page',
        body: [
          'Analytics & Reports (/dashboard/analytics) appears when your subscription exposes it in the sidebar (Storvv Medium and Enterprise include analytics navigation; Storvv Micro focuses on core sales and inventory).',
          'You must select a store first; the page shows a centered prompt with a link to Settings if nothing is selected.',
          'Use the period picker: Daily (last 30 days), Weekly (last 12 weeks), or Monthly (last 12 months). Header metrics summarize total revenue, completed revenue, orders, average order value, customers in period, low stock count, refunds, and gross profit / COGS when the owner can view cost data.',
          'A period summary paragraph and Inventory health bar mirror the dashboard home. Feature insights cards break down sales, returns, outstanding balances, inventory, customers, profit, operations, buybacks, customer balance, and stock loans depending on role and plan.',
        ],
      },
      {
        title: 'Charts, tables, and exports',
        body: [
          'Charts include revenue trends, top products (donut and table), sales by category, top customers, payment methods, peak hours, sales by hour and day of week, and a day × hour traffic heatmap.',
          'Tables list top products, top customers, recent returns, and low stock with an export reorder list action. Payment links summary appears when your plan includes payment links.',
          'Export PDF and Export Excel buttons in the header download reports for the current store and period; they disable while an export is running.',
        ],
      },
    ],
  },
  {
    id: 'activity-logs',
    title: 'Activity Logs',
    blurb: '/dashboard/activity: inventory audit trail.',
    articles: [
      {
        title: 'Who sees Activity Logs',
        body: [
          'Activity Logs is limited to super admins and store managers. Standard staff see an access denied message.',
          'The feature requires Storvv Medium or Storvv Enterprise. Micro accounts see an upgrade notice with a shortcut to Settings.',
          'Pick a store, then review the table columns User, Activity, Target, and Date. Empty state explains that editing inventory will produce entries over time.',
          'Automated descriptions use plain punctuation (no long dash characters) so entries stay easy to read in the Target column.',
        ],
      },
    ],
  },
  {
    id: 'departments-staff',
    title: 'Departments & staff',
    blurb: 'Department routes and how staff accounts are created.',
    articles: [
      {
        title: 'Departments',
        body: [
          'Departments live under each branch: open Branches in the sidebar, expand a location, then “View departments” or the location name. Opening a department card goes to its staff page. There is no separate global departments list.',
          'Use these screens to organize teams, roles, and staff per department. How many departments and staff you can add depends on your plan; check caps and upgrades in Settings.',
        ],
      },
      {
        title: 'Creating staff',
        body: [
          'Super admins create staff logins with email and password. You can email sign-in details to staff (via Resend) or copy them manually until the staff member sets a new password. Managers cannot create staff.',
          'Assign each person as store manager or standard staff so receipt edits, refunds, and locked-down areas match their role.',
        ],
      },
    ],
  },
  {
    id: 'multi-store',
    title: 'Multi-Store Sync',
    blurb: '/dashboard/multi-store-sync: Enterprise transfers.',
    articles: [
      {
        title: 'Access',
        body: [
          'Multi-Store Sync lives at /dashboard/multi-store-sync. Storvv Enterprise unlocks it in the sidebar; super admins are the only role that can use the tools. Staff users see “Access restricted”.',
        ],
      },
      {
        title: 'Transfer Items, Consolidated Reports, Transfer History',
        body: [
          'Transfer Items: pick source store, destination store, destination folder, then SKUs and quantities. The page explains the flow request → approve → in transit (optional tracking) → complete so stock updates in both branches.',
          'Consolidated Reports summarizes performance across locations; Transfer History lists past transfers for auditing.',
        ],
      },
    ],
  },
  {
    id: 'settings-subscription',
    title: 'Settings & subscription',
    blurb: '/dashboard/settings: Paystack upgrades and store defaults.',
    articles: [
      {
        title: 'Super-admin-only editing',
        body: [
          'Only super admins can edit Settings. Others see a View only banner while fields stay disabled.',
          'Super admins manage account logo, Paystack subscription upgrades between Storvv Micro, Medium, and Enterprise, store profile data (branch name, business type, contact fields), inventory defaults (low stock threshold, default category), and receipt numbering (prefix + next number).',
          'Branches: use Create Branch to add locations. Branch names use a city picker from your account region (same country as onboarding), with an optional area or neighborhood field (for example “Port Harcourt, GRA”). When creating or editing a branch, you can add an optional Sell screen note for that location. It is shown to people selling on Quick Sale and during Create New Receipt (items and receipt-details steps) for that branch only.',
        ],
      },
      {
        title: 'Plan tiers',
        body: [
          'Storvv Micro: one store, one department, up to 2 staff. Core dashboard, inventory, Sales (receipts + customers + refunds), notifications, Help center, Profile. WhatsApp receipts capped at 10 per month.',
          'Storvv Medium adds up to 2 stores, 10 departments and 25 staff per store, Analytics, Activity Logs, customer balance ledger, unlimited WhatsApp, and duplicate categories within the same branch.',
          'Storvv Enterprise adds unlimited stores, departments, and staff; Multi-Store Sync and stock transfers; Copy from branch on Inventory (category templates across branches); Stock loans for serial inventory; and priority support.',
        ],
      },
    ],
  },
  {
    id: 'profile-notifications',
    title: 'Profile, password & notifications',
    blurb: '/dashboard/profile, security, and alerts.',
    articles: [
      {
        title: 'Profile & 2FA',
        body: [
          'Profile (/dashboard/profile) is where you manage your name, contact info, and security; Two-Factor Authentication can be turned on or off using the prompts on that page.',
          'Super admins can edit Receipt terms & policies (sales terms, refund policy) on Profile; that text can surface on printed / viewed receipts and related customer communications where the product uses it.',
          'Password changes use the Change password screen (/dashboard/change-password), linked from Profile.',
        ],
      },
      {
        title: 'Notifications',
        body: [
          'Click the bell for the dropdown NotificationsPanel. Full-page alerts live at /dashboard/notifications using the same component in page mode.',
        ],
      },
      {
        title: 'Help center search',
        body: [
          'The search box on this page filters only these help topics; it does not search your store data. Use Global Search in the header for receipts, inventory, and customers.',
        ],
      },
    ],
  },
]

export function buildDashboardHelpKnowledgeBase(
  categories: DashboardHelpCategory[] = dashboardHelpCategories
): string {
  const sections: string[] = []
  for (const category of categories) {
    sections.push(`## ${category.title}`)
    sections.push(category.blurb)
    for (const article of category.articles) {
      sections.push(`### ${article.title}`)
      sections.push(...article.body)
      if (article.bullets?.length) {
        sections.push(article.bullets.map((b) => `- ${b}`).join('\n'))
      }
    }
  }
  return sections.join('\n\n')
}

export function buildAssistantSystemPrompt(knowledgeBase: string): string {
  return [
    'You are Storvv Assistant, a helpful in-app guide for the Storvv inventory and sales dashboard.',
    '',
    'Rules:',
    '- Answer ONLY about how to use Storvv: navigation, roles, permissions, plans, and workflows.',
    '- Use the knowledge base below as your primary source. If unsure, say you are not sure and suggest the Help center (/dashboard/help).',
    '- NEVER invent live store data (stock counts, prices, customer names, profits, receipt numbers). You cannot access the user account.',
    '- Keep answers concise (2-5 short paragraphs or bullet lists). Mention relevant routes like /dashboard/inventory when helpful.',
    '- Use plain text only. Do NOT use Markdown bold (**text**), headings (#), or other Markdown formatting. For lists, use lines starting with "- " (hyphen and space).',
    '- Explain role and plan limits in general terms; remind users that missing controls may mean their role or plan does not include a feature.',
    '- Inventory uses top-level categories plus optional one-level subcategories (not unlimited nesting). When creating a category, Organize with subcategories is optional (off by default). When users ask about subfolders or subcategories, describe the parent hub, leaf-only products, inheritance rules, and the optional toggle from the knowledge base - do not say folders are strictly flat.',
    '- Copy from branch (Enterprise, /dashboard/inventory): select top-level templates from another branch; optionally include subcategories with a checkbox. Branch creation (Settings): city picker from account region plus optional area suffix.',
    '- Customer buybacks (/dashboard/buybacks) are super-admin only. Quick Sale and Create New Sale use parent → subcategory → items → checkout. Analytics includes feature insight cards for sales, inventory, buybacks, loans, and balances when applicable.',
    '',
    'Knowledge base:',
    knowledgeBase,
  ].join('\n')
}
