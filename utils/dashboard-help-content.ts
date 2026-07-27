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
    blurb: 'Highlights from the latest Storvv releases (May 2026).',
    articles: [
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
          'The sidebar lists real product routes: Dashboard, Inventory, Stock loans (Enterprise, managers/super admins), Receipts, Analytics, Activity Logs, Multi-Store Sync, Help center, Settings, and Profile. Items such as Analytics, Stock loans, or Multi-Store Sync only appear when your plan and role include them.',
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
    blurb: 'Categories page (grid or table), category detail, items, and permissions.',
    articles: [
      {
        title: 'Categories list (/dashboard/inventory)',
        body: [
          'The Inventory entry opens Folders: search folders, filter by department, sort by name / products / date, and paginate through the list. Super admins can create, rename, delete, and bulk-delete folders where the UI provides those actions.',
          'Use the grid / table toggle next to the filters to switch layout. Grid shows folder cards; table matches the same styling as the product table inside a folder (striped rows, column alignment). Your choice is remembered on this browser.',
          'In table view, columns include folder name, type, product count, serial vs quantity tracking, and department access summary; open a folder by clicking a row. Actions stay in the row menu where available.',
          'Storvv Micro may show upsell messaging next to the title when folder limits apply; upgrade paths point toward Settings and higher plans.',
        ],
      },
      {
        title: 'Inside a folder (/dashboard/inventory/[id])',
        body: [
          'Each folder opens a table of items with the columns your account template defines. Use pagination and filters from the toolbar as needed.',
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
        title: 'Copy from branch (Enterprise)',
        body: [
          'On the Folders page (/dashboard/inventory), super admins on Storvv Enterprise see a “Copy from branch” action next to “New folder” when you have more than one active branch.',
          'It opens a dialog where you pick a source branch, then select which folder templates to copy into the branch you are currently viewing in the app (header / sidebar store switcher). Only folder definitions are copied: names, custom field templates, serial vs bulk mode, and colors. Products, quantities, and department restrictions are not copied (those IDs are per branch; re-apply access on the destination if you use them).',
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
        title: 'Create New Sale (three steps)',
        body: [
          'The drawer title is “Create New Sale” with subtitle “Pick categories and items, then sale details.” Step 1: pick an inventory category. Step 2: select items and quantities; use “Add from another category” to keep your cart and add lines from more categories in one sale. Step 3: sale details — customer fields, payment method, paid in full or balance due, and notes.',
          'Selected items are grouped by category before checkout. Serial folders can include lines on an active Stock loan: you may add them like other sellable SKUs. Completing the sale marks them sold and updates the borrower loan in the background when your plan includes Stock loans (Enterprise).',
          'After step 1, if your branch has a Sell screen note configured in Settings → create or edit branch, a short banner can appear at the top of the items and checkout steps with store-specific reminders (for example promos or price notes).',
          'Super admins can enable swap-in style lines inside the receipt flow when your business records trade-ins alongside standard SKUs.',
        ],
      },
      {
        title: 'Quick Sale, split payment, and sell screen notes',
        body: [
          'Quick Sale is a streamlined checkout view for scanning or adding products quickly in the active branch. When split payment is enabled, you can allocate amounts across multiple methods; the screen shows how much is assigned versus the total so you can balance the sale before completing.',
          'Sell screen notes are short messages set per branch in Settings (Create / Edit Branch). They appear on Quick Sale and on Create New Receipt after you choose a folder, so cashiers see branch-specific reminders without opening Settings.',
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
          'Use the period picker: Daily, Weekly, or Monthly. Cards summarize total revenue (with % change vs previous), total sales and order counts, average order value, low stock count, and refund totals.',
        ],
      },
      {
        title: 'Charts and exports',
        body: [
          'Charts include revenue trend visuals for the active period label.',
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
          'Super admins create staff logins with email and password (share credentials securely outside the app; there is no automated invite email in the default flow). Managers cannot create staff.',
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
          'When creating or editing a branch (Create Branch / Edit Branch), you can add an optional Sell screen note for that location. It is shown to people selling on Quick Sale and during Create New Receipt (items and receipt-details steps) for that branch only.',
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
    '- Keep answers concise (2-5 short paragraphs or bullets). Mention relevant routes like /dashboard/inventory when helpful.',
    '- Explain role and plan limits in general terms; remind users that missing controls may mean their role or plan does not include a feature.',
    '',
    'Knowledge base:',
    knowledgeBase,
  ].join('\n')
}
