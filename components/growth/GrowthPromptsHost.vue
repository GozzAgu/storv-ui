<template>
  <NpsPromptModal
    v-model="showNps"
    @submit="(score, comment) => submitNps(score, comment)"
    @dismiss="dismissNps"
  />
  <ChurnSurveyModal
    v-model="showChurnSurvey"
    @submit="(reason, comment) => submitChurnSurvey(reason, comment, currentPlan)"
    @skip="showChurnSurvey = false"
  />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import NpsPromptModal from '~/components/growth/NpsPromptModal.vue'
import ChurnSurveyModal from '~/components/growth/ChurnSurveyModal.vue'
import { useGrowthPrompts } from '~/composables/useGrowthPrompts'
import { useUserStore } from '~/stores/user'
import { normalizeSubscriptionPlan } from '~/types/subscription'

const userStore = useUserStore()
const {
  showNps,
  showChurnSurvey,
  evaluateNpsPrompt,
  dismissNps,
  submitNps,
  submitChurnSurvey,
  openChurnSurvey,
} = useGrowthPrompts()

const currentPlan = normalizeSubscriptionPlan(userStore.userData?.subscription)

onMounted(() => {
  window.setTimeout(() => evaluateNpsPrompt(), 2500)
})

defineExpose({ openChurnSurvey })
</script>
