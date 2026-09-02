import { ref } from 'vue'

/** Shared modal state between layout host and settings cancel flow. */
export const growthPromptsState = {
  showNps: ref(false),
  showChurnSurvey: ref(false),
}

export function openChurnSurveyModal() {
  growthPromptsState.showChurnSurvey.value = true
}

export function openNpsModal() {
  growthPromptsState.showNps.value = true
}
