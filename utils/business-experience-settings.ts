import type { StoreDetails } from '~/composables/useUser'
import {
  BUSINESS_CAPABILITIES,
  BUSINESS_CAPABILITY_LABELS,
  normalizeEnabledCapabilities,
  type BusinessCapability,
} from '~/types/business-experience'

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
