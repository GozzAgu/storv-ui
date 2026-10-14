import type { StoreDetails } from '~/composables/useUser'

export interface StoreInfoFields {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  storeDescription: string
}

/**
 * `storeDetails` is saved as one map, so a save must carry everything else already in it
 * (settings, experience mode, enabled features) or those are erased.
 */
export function mergeStoreInfoIntoDetails(
  current: StoreDetails | null | undefined,
  info: StoreInfoFields
): StoreDetails {
  return { ...current, ...info }
}
