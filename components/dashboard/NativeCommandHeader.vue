<template>
  <div class="native-command-header">
    <div class="native-command-header__row native-command-header__row--primary">
      <div class="native-command-header__greeting min-w-0 flex-1">
        <p :class="greetingClass">{{ greeting }}</p>
        <p v-if="pageTitle" :class="pageContextClass">{{ pageTitle }}</p>
      </div>
      <div class="native-command-header__actions shrink-0">
        <slot name="actions" />
      </div>
    </div>
    <div class="native-command-header__row native-command-header__row--branch">
      <NativeBranchPill v-if="canShowBranchRow" class="min-w-0 flex-1" />
      <ExperienceModeBadge variant="ios" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NativeBranchPill from '~/components/dashboard/NativeBranchPill.vue'
import { useIosTypography } from '~/composables/useIosTypography'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'

const props = defineProps<{
  greeting: string
  /** Current screen label (shown under greeting on inner pages). */
  pageTitle?: string
}>()

const { textClass } = useIosTypography()
const storesStore = useStoresStore()
const userStore = useUserStore()
const { canManageBranches } = useBusinessCapabilities()

const canShowBranchRow = computed(() => {
  if (canManageBranches.value) return true
  if (userStore.userData?.role === 'staff' && storesStore.currentStore) return true
  return false
})

const greetingClass = computed(() =>
  [textClass('headline'), 'native-command-header__greeting-text'].join(' ')
)

const pageContextClass = computed(() =>
  [textClass('footnote', { secondary: true }), 'native-command-header__page-context'].join(' ')
)
</script>
