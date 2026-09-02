import type { StoreDetails } from '~/composables/useUser'
import {
  BUSINESS_CAPABILITIES,
  BUSINESS_CAPABILITY_LABELS,
  normalizeEnabledCapabilities,
  type BusinessCapability,
} from '~/types/business-experience'
import {
  getPlanLimits,
  planHasFeature,
  type SubscriptionPlan,
} from '~/types/subscription'

export type SoloProgressiveUnlockOption = {
  capability: BusinessCapability
  label: string
  description: string
}

/** Solo accounts can opt into admin features without switching experience mode. */
export const SOLO_PROGRESSIVE_UNLOCK_OPTIONS: SoloProgressiveUnlockOption[] = [
  {
    capability: 'staffManagement',
    label: BUSINESS_CAPABILITY_LABELS.staffManagement,
    description: 'Show Departments and team rosters in navigation.',
  },
  {
    capability: 'multiLocationAdmin',
    label: BUSINESS_CAPABILITY_LABELS.multiLocationAdmin,
    description: 'Show Branches, store switching, and Multi-Store Sync.',
  },
  {
    capability: 'rolesPermissionsAdmin',
    label: BUSINESS_CAPABILITY_LABELS.rolesPermissionsAdmin,
    description: 'Unlock manager, staff, and intern role controls.',
  },
  {
    capability: 'approvalWorkflows',
    label: BUSINESS_CAPABILITY_LABELS.approvalWorkflows,
    description: 'Require approval before stock transfers complete.',
  },
  {
    capability: 'paymentLinks',
    label: BUSINESS_CAPABILITY_LABELS.paymentLinks,
    description: 'Show Payment links for shareable remote checkout.',
  },
]

/** Whether a solo progressive-unlock toggle is meaningful on the given plan. */
export function isProgressiveUnlockAvailableForPlan(
  capability: BusinessCapability,
  plan: SubscriptionPlan
): boolean {
  switch (capability) {
    case 'staffManagement':
    case 'rolesPermissionsAdmin':
      return planHasFeature(plan, 'departments')
    case 'paymentLinks':
      return planHasFeature(plan, 'payment_links')
    case 'multiLocationAdmin': {
      const { maxStores } = getPlanLimits(plan)
      return maxStores === -1 || maxStores > 1
    }
    case 'approvalWorkflows':
      return planHasFeature(plan, 'multi_store_sync')
    default:
      return false
  }
}

export function getProgressiveUnlockOptionsForPlan(
  plan: SubscriptionPlan
): SoloProgressiveUnlockOption[] {
  return SOLO_PROGRESSIVE_UNLOCK_OPTIONS.filter((option) =>
    isProgressiveUnlockAvailableForPlan(option.capability, plan)
  )
}

/** Drop enabled capabilities that the current plan cannot use (e.g. after downgrade). */
export function filterEnabledCapabilitiesForPlan(
  capabilities: BusinessCapability[] | null | undefined,
  plan: SubscriptionPlan
): BusinessCapability[] {
  return normalizeEnabledCapabilities(capabilities).filter((capability) =>
    isProgressiveUnlockAvailableForPlan(capability, plan)
  )
}

export function isProgressiveCapabilityEnabled(
  capability: BusinessCapability,
  enabledCapabilities: BusinessCapability[] | null | undefined
): boolean {
  return normalizeEnabledCapabilities(enabledCapabilities).includes(capability)
}

/** Toggle one capability while preserving stable order and ignoring unknown keys. */
export function setProgressiveCapabilityEnabled(
  current: BusinessCapability[] | null | undefined,
  capability: BusinessCapability,
  enabled: boolean
): BusinessCapability[] {
  const set = new Set(normalizeEnabledCapabilities(current))
  if (enabled) set.add(capability)
  else set.delete(capability)
  return BUSINESS_CAPABILITIES.filter((entry) => set.has(entry))
}

export function applyEnabledCapabilitiesToStoreDetails(
  storeDetails: StoreDetails,
  enabledCapabilities: BusinessCapability[]
): StoreDetails {
  return {
    ...storeDetails,
    enabledCapabilities,
  }
}
