/**
 * Dashboard launch switch for storefront.
 * When hidden, Storefront is removed from nav/settings and the inquiries page redirects home.
 * Public `/store/{slug}` routes are unchanged (unpublish from settings when you need those off).
 */
export const STOREFRONT_DASHBOARD_HIDDEN = true

export function isStorefrontDashboardHidden(): boolean {
  return STOREFRONT_DASHBOARD_HIDDEN
}
