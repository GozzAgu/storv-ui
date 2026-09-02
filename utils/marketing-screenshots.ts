import type { MarketingFeatureIconKey } from '~/utils/marketing-feature-icons'

/** Bump when regenerating `public/marketing/screenshots/` so browsers pick up new PNGs. */
export const MARKETING_SCREENSHOTS_VERSION = '2026-09-02'

export interface MarketingScreenshot {
  id: string
  title: string
  description: string
  src: string
  iconKey: MarketingFeatureIconKey
}

function marketingShot(path: string): string {
  return `${path}?v=${MARKETING_SCREENSHOTS_VERSION}`
}

/** Demo dashboard captures for the SaaS landing slideshow (`public/marketing/screenshots/`). */
export const MARKETING_SCREENSHOTS: MarketingScreenshot[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Branch overview, KPIs, quick actions, and payment link summary.',
    src: marketingShot('/marketing/screenshots/dashboard.png'),
    iconKey: 'dashboard',
  },
  {
    id: 'inventory',
    title: 'Inventory',
    description: 'Categories, subcategories, serial or bulk stock, and low-stock signals.',
    src: marketingShot('/marketing/screenshots/inventory.png'),
    iconKey: 'inventory',
  },
  {
    id: 'receipts',
    title: 'Sales & receipts',
    description: 'Receipt history, Quick Sale, returns, and customer-linked sales.',
    src: marketingShot('/marketing/screenshots/receipts.png'),
    iconKey: 'receipts',
  },
  {
    id: 'receipts-outstanding',
    title: 'Outstanding balances',
    description: 'Deposits and balance-due receipts until paid in full.',
    src: marketingShot('/marketing/screenshots/receipts-outstanding.png'),
    iconKey: 'receipts',
  },
  {
    id: 'receipts-customers',
    title: 'Customers',
    description: 'Customer directory with spend, contact details, and balance ledger.',
    src: marketingShot('/marketing/screenshots/receipts-customers.png'),
    iconKey: 'customers',
  },
  {
    id: 'sales-leads',
    title: 'Sales leads',
    description: 'Track enquiries and convert them into receipts (Medium+).',
    src: marketingShot('/marketing/screenshots/sales-leads.png'),
    iconKey: 'sales-leads',
  },
  {
    id: 'payment-links',
    title: 'Payment links',
    description: 'Paystack checkout links for remote sales on every plan.',
    src: marketingShot('/marketing/screenshots/payment-links.png'),
    iconKey: 'payment-links',
  },
  {
    id: 'buybacks',
    title: 'Customer buybacks',
    description: 'Trade-ins recorded by super admins and added back to inventory.',
    src: marketingShot('/marketing/screenshots/buybacks.png'),
    iconKey: 'buybacks',
  },
  {
    id: 'seller-loans',
    title: 'Stock loans',
    description: 'Lend serial inventory until sold or returned (Enterprise).',
    src: marketingShot('/marketing/screenshots/seller-loans.png'),
    iconKey: 'loans',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Feature insights, charts, exports, and inventory health (Medium+).',
    src: marketingShot('/marketing/screenshots/analytics.png'),
    iconKey: 'analytics',
  },
  {
    id: 'activity',
    title: 'Activity logs',
    description: 'Audit trail of inventory, sales, and settings changes (Medium+).',
    src: marketingShot('/marketing/screenshots/activity.png'),
    iconKey: 'activity',
  },
  {
    id: 'multi-store-sync',
    title: 'Multi-store sync',
    description: 'Transfer stock and sync branches across locations (Enterprise).',
    src: marketingShot('/marketing/screenshots/multi-store-sync.png'),
    iconKey: 'sync',
  },
  {
    id: 'departments',
    title: 'Departments',
    description: 'Organize teams and staff within each branch.',
    src: marketingShot('/marketing/screenshots/departments.png'),
    iconKey: 'departments',
  },
  {
    id: 'help',
    title: 'Help center',
    description: 'In-app guides plus Storvv Assistant on every plan.',
    src: marketingShot('/marketing/screenshots/help.png'),
    iconKey: 'help',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Branch profile, subscription, inventory defaults, and receipt numbering.',
    src: marketingShot('/marketing/screenshots/settings.png'),
    iconKey: 'settings',
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Account security, theme, and personal preferences.',
    src: marketingShot('/marketing/screenshots/profile.png'),
    iconKey: 'profile',
  },
]
