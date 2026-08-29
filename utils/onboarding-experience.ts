import type { StoreDetails } from '~/composables/useUser'
import type { ExperienceMode } from '~/types/business-experience'
import { normalizeExperienceMode } from '~/types/business-experience'

/** Attach explicit onboarding experience choice before first storeDetails write. */
export function withOnboardingExperienceChoice(
  storeDetails: StoreDetails,
  experienceMode: ExperienceMode | string
): StoreDetails {
  return {
    ...storeDetails,
    experienceMode: normalizeExperienceMode(experienceMode),
    onboardingExperienceChosen: true,
  }
}
