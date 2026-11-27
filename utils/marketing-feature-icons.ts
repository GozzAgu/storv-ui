import type { Component } from 'vue'
import { Undo2, UsersRound } from '~/icons'
import { DASHBOARD_NAV_ICONS, type DashboardNavIconKey } from '~/utils/dashboard-nav-icons'

/** Marketing + demo surfaces reuse the same Lucide set as dashboard navigation. */
export type MarketingFeatureIconKey = DashboardNavIconKey | 'returns' | 'customers'

export const MARKETING_FEATURE_ICONS: Record<MarketingFeatureIconKey, Component> = {
  ...DASHBOARD_NAV_ICONS,
  returns: Undo2,
  customers: UsersRound,
}
