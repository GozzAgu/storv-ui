/**
 * When to show plan / upgrade messaging in the product.
 *
 * 1. Action-required (global, dismissible): billing past due, canceled grace, expired plan.
 * 2. Point-of-action: user hits a limit or tries a gated control (toast, modal, disabled action).
 * 3. Route gate: dedicated empty state (FeatureGateCard) when opening a paid screen.
 *
 * Do NOT show ambient page-header upsells for features that are already hidden on the current plan.
 */

import {
  getMinimumPlanForFeature,
  getPlanDisplayName,
  planHasFeature,
  type SubscriptionFeature,
  type SubscriptionPlan,
} from '~/types/subscription'

/** Short copy when a gated action is attempted (prefer toast over header banners). */
export function planGatedActionMessage(
  feature: SubscriptionFeature,
  actionLabel: string
): string {
  const plan = getMinimumPlanForFeature(feature)
  if (!plan) return `${actionLabel} is not available on your plan.`
  return `${actionLabel} is available on ${getPlanDisplayName(plan)}.`
}

export function canUsePlanFeature(plan: SubscriptionPlan, feature: SubscriptionFeature): boolean {
  return planHasFeature(plan, feature)
}
