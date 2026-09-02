import { computed } from 'vue'
import type { GrowthFeedback } from '~/types/growth'
import { NPS_PROMPT_AFTER_DAYS } from '~/utils/growth-config'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useUser } from '~/composables/useUser'
import { useProductAnalytics } from '~/composables/useProductAnalytics'
import { growthPromptsState } from '~/composables/growth-prompts-state'
import { resolveUserCreatedAtIso } from '~/utils/growth-dates'

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms)) return null
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function npsDismissKey(uid: string) {
  return `storvv-nps-dismissed-${uid}`
}

/**
 * Eligibility for NPS and churn survey modals.
 */
export function useGrowthPrompts() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const { updateUserDocument } = useUser()

  const showNps = growthPromptsState.showNps
  const showChurnSurvey = growthPromptsState.showChurnSurvey

  const uid = computed(() => authStore.currentUser?.uid)

  const shouldOfferNps = computed(() => {
    if (!uid.value || userStore.userData?.role !== 'superAdmin') return false
    if (userStore.userData?.growthFeedback?.nps) return false
    if (import.meta.client && localStorage.getItem(npsDismissKey(uid.value)) === '1') {
      return false
    }
    const signedUp = resolveUserCreatedAtIso(
      userStore.userData?.createdAt,
      userStore.userData?.activationFunnel?.signedUpAt
    )
    const age = daysSince(signedUp)
    if (age == null || age < NPS_PROMPT_AFTER_DAYS) return false
    const activated =
      userStore.userData?.activationFunnel?.firstInventoryItemAt ||
      userStore.userData?.activationFunnel?.firstSaleAt
    return !!activated
  })

  function evaluateNpsPrompt() {
    if (shouldOfferNps.value) showNps.value = true
  }

  function dismissNps() {
    if (uid.value && import.meta.client) {
      localStorage.setItem(npsDismissKey(uid.value), '1')
    }
    showNps.value = false
  }

  async function submitNps(score: number, comment?: string) {
    if (!uid.value) return
    const growthFeedback: GrowthFeedback = {
      ...(userStore.userData?.growthFeedback ?? {}),
      nps: {
        score,
        comment: comment?.trim() || undefined,
        submittedAt: new Date().toISOString(),
      },
    }
    await updateUserDocument(uid.value, { growthFeedback })
    if (userStore.userData) userStore.userData.growthFeedback = growthFeedback
    showNps.value = false
    const { trackEvent } = useProductAnalytics()
    trackEvent('nps_submitted', { score })
  }

  function openChurnSurvey() {
    showChurnSurvey.value = true
  }

  async function submitChurnSurvey(reason: string, comment: string | undefined, plan: string) {
    if (!uid.value) return
    const growthFeedback: GrowthFeedback = {
      ...(userStore.userData?.growthFeedback ?? {}),
      churn: {
        reason,
        comment: comment?.trim() || undefined,
        submittedAt: new Date().toISOString(),
        plan,
      },
    }
    await updateUserDocument(uid.value, { growthFeedback })
    if (userStore.userData) userStore.userData.growthFeedback = growthFeedback
    showChurnSurvey.value = false
    const { trackEvent } = useProductAnalytics()
    trackEvent('churn_survey_submitted', { reason, plan })
  }

  return {
    showNps,
    showChurnSurvey,
    shouldOfferNps,
    evaluateNpsPrompt,
    dismissNps,
    submitNps,
    openChurnSurvey,
    submitChurnSurvey,
  }
}

