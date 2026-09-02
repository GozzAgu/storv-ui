<template>
  <DashboardNativeSheet
    :model-value="modelValue"
    :title="title"
    :subtitle="subtitle"
    :eyebrow="eyebrow"
    :variant="variant"
    :show-close="showClose"
    :close-on-backdrop="closeOnBackdrop"
    :show-header="showHeader"
    :body-padding="resolvedBodyPadding"
    :aria-label="ariaLabel"
    :backdrop-label="backdropLabel"
    :panel-id="panelId"
    :mount="mount"
    root-class="ios-drawer"
    @update:model-value="emit('update:modelValue', $event)"
    @close="emit('close')"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <div class="ios-drawer__content">
      <slot />
    </div>

    <template v-if="$slots.footer" #footer>
      <IosDrawerFooter :variant="footerVariant">
        <template v-if="$slots.leading" #leading>
          <slot name="leading" />
        </template>
        <slot name="footer" />
      </IosDrawerFooter>
    </template>
  </DashboardNativeSheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardNativeSheet from '~/components/dashboard/DashboardNativeSheet.vue'
import IosDrawerFooter from '~/components/ios/IosDrawerFooter.vue'
import type { DashboardNativeSheetVariant } from '~/composables/useDashboardNativeSheetChrome'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    eyebrow?: string
    variant?: DashboardNativeSheetVariant
    showClose?: boolean
    closeOnBackdrop?: boolean
    showHeader?: boolean
    bodyPadding?: string
    ariaLabel?: string
    backdropLabel?: string
    panelId?: string
    mount?: 'overlay-host' | 'body'
    footerVariant?: 'actions' | 'menu'
  }>(),
  {
    variant: 'crud',
    showClose: true,
    closeOnBackdrop: true,
    showHeader: true,
    bodyPadding: '',
    backdropLabel: 'Close',
    mount: 'overlay-host',
    footerVariant: 'actions',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const resolvedBodyPadding = computed(() => {
  if (props.bodyPadding) return props.bodyPadding
  if (props.variant === 'menu') return 'p-0'
  return ''
})
</script>
