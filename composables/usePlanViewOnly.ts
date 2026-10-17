import { computed } from 'vue'
import { currentPlanViewOnlyReason } from '~/utils/plan-view-only'

/** Reactive view-only state for the current store (see utils/plan-access.ts). */
export function usePlanViewOnly() {
  const reason = computed(() => currentPlanViewOnlyReason())
  const isViewOnly = computed(() => reason.value !== null)
  return { reason, isViewOnly }
}
