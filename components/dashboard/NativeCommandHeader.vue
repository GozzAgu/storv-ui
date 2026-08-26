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
      <NativeBranchPill />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NativeBranchPill from '~/components/dashboard/NativeBranchPill.vue'
import { useIosTypography } from '~/composables/useIosTypography'

const props = defineProps<{
  greeting: string
  /** Current screen label (shown under greeting on inner pages). */
  pageTitle?: string
}>()

const { textClass } = useIosTypography()

const greetingClass = computed(() =>
  [textClass('headline'), 'native-command-header__greeting-text'].join(' ')
)

const pageContextClass = computed(() =>
  [textClass('footnote', { secondary: true }), 'native-command-header__page-context'].join(' ')
)
</script>
