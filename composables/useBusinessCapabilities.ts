import type { BusinessCapability, ExperienceMode } from '~/types/business-experience'
import {
  buildBusinessCapabilityContext,
  canUseBusinessCapability,
  normalizeEnabledCapabilities,
  resolveExperienceMode,
} from '~/types/business-experience'
import { resolveEffectiveSubscriptionPlan } from '~/types/subscription'
import { isProgressiveUnlockAvailableForPlan } from '~/utils/business-experience-settings'

/**
 * Business experience capabilities (Solo vs Business).
 *
 * Use alongside (not instead of) useSubscriptionFeatures() and usePermissions().
 */
export function useBusinessCapabilities() {
  const userStore = useUserStore()

  const storeDetails = computed(() => userStore.userData?.storeDetails)

  const experienceMode = computed<ExperienceMode>(() =>
    resolveExperienceMode(storeDetails.value)
  )

  const enabledCapabilities = computed(() =>
    normalizeEnabledCapabilities(storeDetails.value?.enabledCapabilities)
  )

  const capabilityContext = computed(() =>
    buildBusinessCapabilityContext(storeDetails.value)
  )

  const canUse = (capability: BusinessCapability): boolean => {
    if (!canUseBusinessCapability(capability, capabilityContext.value)) return false
    if (experienceMode.value === 'solo') {
      const plan = resolveEffectiveSubscriptionPlan(userStore.userData)
      return isProgressiveUnlockAvailableForPlan(capability, plan)
    }
    return true
  }

  const isSoloExperience = computed(() => experienceMode.value === 'solo')
  const isBusinessExperience = computed(() => experienceMode.value === 'business')
  const canManageBranches = computed(() => canUse('multiLocationAdmin'))

  return {
    experienceMode,
    enabledCapabilities,
    capabilityContext,
    canUse,
    isSoloExperience,
    isBusinessExperience,
    canManageBranches,
  }
}
