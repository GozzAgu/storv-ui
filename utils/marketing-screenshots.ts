import type { MarketingFeatureIconKey } from '~/utils/marketing-feature-icons'

export interface MarketingScreenshot {
  id: string
  title: string
  description: string
  src: string
  iconKey: MarketingFeatureIconKey
}

/** Demo dashboard captures for the SaaS landing page (`public/marketing/screenshots/`). */
export const MARKETING_SCREENSHOTS: MarketingScreenshot[] = [
  {
    id: 'dashboard',
    title: 'Dashboard overview',
    description: 'Revenue, stock health, and recent activity for the active branch.',
    src: '/marketing/screenshots/dashboard.png',
    iconKey: 'dashboard',
  },
  {
    id: 'inventory',
    title: 'Inventory & categories',
    description: 'Folders, variants, and low-stock signals per location.',
    src: '/marketing/screenshots/inventory.png',
    iconKey: 'inventory',
  },
  {
    id: 'buybacks',
    title: 'Customer buybacks',
    description: 'Record trade-ins and add units back into stock for resale.',
    src: '/marketing/screenshots/buybacks.png',
    iconKey: 'buybacks',
  },
  {
    id: 'seller-loans',
    title: 'Stock loans',
    description: 'Track serial inventory lent out and expected returns.',
    src: '/marketing/screenshots/seller-loans.png',
    iconKey: 'loans',
  },
  {
    id: 'receipts',
    title: 'Receipts & sales',
    description: 'Sales history, payments, and customer links in one place.',
    src: '/marketing/screenshots/receipts.png',
    iconKey: 'receipts',
  },
  {
    id: 'receipts-outstanding',
    title: 'Outstanding payments',
    description: 'See partial payments and balances still due on open receipts.',
    src: '/marketing/screenshots/receipts-outstanding.png',
    iconKey: 'receipts',
  },
  {
    id: 'receipts-customers',
    title: 'Receipt customers',
    description: 'Customer names, phones, and spend linked to every sale.',
    src: '/marketing/screenshots/receipts-customers.png',
    iconKey: 'customers',
  },
  {
    id: 'payment-links',
    title: 'Payment links',
    description: 'Send Paystack checkout links and get paid remotely.',
    src: '/marketing/screenshots/payment-links.png',
    iconKey: 'payment-links',
  },
  {
    id: 'departments',
    title: 'Departments',
    description: 'Organize staff and inventory by department within each branch.',
    src: '/marketing/screenshots/departments.png',
    iconKey: 'departments',
  },
  {
    id: 'analytics',
    title: 'Analytics & reports',
    description:
      'Feature insights, period charts, peak hours, low stock, and PDF/Excel export (Medium+).',
    src: '/marketing/screenshots/analytics.png',
    iconKey: 'analytics',
  },
  {
    id: 'activity',
    title: 'Activity logs',
    description: 'Audit trail of changes across inventory, sales, and settings.',
    src: '/marketing/screenshots/activity.png',
    iconKey: 'activity',
  },
  {
    id: 'multi-store-sync',
    title: 'Multi-store sync',
    description: 'Switch branches, transfer stock, and keep locations in sync.',
    src: '/marketing/screenshots/multi-store-sync.png',
    iconKey: 'sync',
  },
  {
    id: 'help',
    title: 'Help center',
    description: 'Guides and answers for your team inside the app.',
    src: '/marketing/screenshots/help.png',
    iconKey: 'help',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Store profile, billing, staff roles, and workspace preferences.',
    src: '/marketing/screenshots/settings.png',
    iconKey: 'settings',
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Your account details, password, and personal preferences.',
    src: '/marketing/screenshots/profile.png',
    iconKey: 'profile',
  },
]
