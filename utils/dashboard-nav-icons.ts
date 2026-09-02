import type { Component } from 'vue'
import {
  Building2,
  ChartNoAxesColumnIncreasing,
  CircleUserRound,
  Ellipsis,
  Folder,
  FolderOpen,
  HandCoins,
  Handshake,
  History,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  LogOut,
  Package,
  ReceiptText,
  RefreshCcwDot,
  Settings2,
  Store,
  UserPlus,
} from '@lucide/vue'

export type DashboardNavIconKey =
  | 'dashboard'
  | 'inventory'
  | 'buybacks'
  | 'loans'
  | 'receipts'
  | 'payment-links'
  | 'sales-leads'
  | 'departments'
  | 'analytics'
  | 'activity'
  | 'sync'
  | 'help'
  | 'settings'
  | 'profile'
  | 'more'
  | 'folder'
  | 'folder-open'
  | 'branch'
  | 'sign-out'

export const DASHBOARD_NAV_ICONS: Record<DashboardNavIconKey, Component> = {
  dashboard: LayoutDashboard,
  inventory: Package,
  // Paying a customer for a trade-in - a coin changing hands reads clearer than a bare arrow.
  buybacks: HandCoins,
  // Lending stock out to a seller is an agreement, not a cash wallet.
  loans: Handshake,
  receipts: ReceiptText,
  'payment-links': Link2,
  // Distinct from `profile` below - a prospective customer, not the signed-in user.
  'sales-leads': UserPlus,
  departments: Building2,
  analytics: ChartNoAxesColumnIncreasing,
  // The conventional "history" glyph reads as an audit trail more instantly than a scroll.
  activity: History,
  sync: RefreshCcwDot,
  help: LifeBuoy,
  settings: Settings2,
  profile: CircleUserRound,
  // Matches the platform convention for a tab-bar "More" overflow entry.
  more: Ellipsis,
  folder: Folder,
  'folder-open': FolderOpen,
  branch: Store,
  'sign-out': LogOut,
}
