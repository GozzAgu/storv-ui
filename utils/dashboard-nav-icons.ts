import type { Component } from 'vue'
import {
  ArrowDownLeft,
  Building2,
  ChartNoAxesColumnIncreasing,
  CircleUserRound,
  Folder,
  FolderOpen,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Link2,
  LogOut,
  Package,
  ReceiptText,
  RefreshCcwDot,
  ScrollText,
  Settings2,
  Wallet,
  Store,
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
  buybacks: ArrowDownLeft,
  loans: Wallet,
  receipts: ReceiptText,
  'payment-links': Link2,
  'sales-leads': CircleUserRound,
  departments: Building2,
  analytics: ChartNoAxesColumnIncreasing,
  activity: ScrollText,
  sync: RefreshCcwDot,
  help: LifeBuoy,
  settings: Settings2,
  profile: CircleUserRound,
  more: LayoutGrid,
  folder: Folder,
  'folder-open': FolderOpen,
  branch: Store,
  'sign-out': LogOut,
}
