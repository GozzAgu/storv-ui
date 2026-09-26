<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    size="md"
  >
    <template #header>
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-sm bg-red-100 dark:bg-red-900/30"
        >
          <TrashIcon class="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ title }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ countLabel }}
          </p>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <div
        class="rounded-sm bg-red-50 p-3 ring-1 ring-red-200/50 dark:bg-red-900/20 dark:ring-red-800/40"
      >
        <p class="text-xs font-semibold text-red-900 dark:text-red-100">
          {{ impactSummary }}
        </p>
        <p class="mt-1 text-xs text-red-800 dark:text-red-200">
          {{ warning }}
        </p>
      </div>

      <ul
        v-if="itemNames.length > 0"
        class="max-h-36 space-y-1 overflow-y-auto rounded-sm bg-gray-50 p-2.5 text-xs text-gray-700 dark:!bg-dashboard-card/35 dark:text-gray-300"
      >
        <li v-for="(name, i) in visibleNames" :key="`${name}-${i}`" class="truncate">
          · {{ name }}
        </li>
        <li v-if="hiddenCount > 0" class="font-medium text-gray-500 dark:text-gray-400">
          · and {{ hiddenCount }} more
        </li>
      </ul>

      <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
        <Checkbox
          :model-value="confirmed"
          size="sm"
          wrapper-class="items-start"
          label-class="text-xs text-gray-700 dark:text-gray-300"
          @update:model-value="emit('update:confirmed', $event === true)"
        >
          {{ confirmLabel }}
        </Checkbox>
      </div>
    </div>

    <template #footer>
      <IosDrawerActions
        primary-variant="danger"
        :primary-icon="TrashIcon"
        :primary-label="primaryLabel"
        :primary-disabled="!confirmed || loading"
        @cancel="emit('update:modelValue', false)"
        @primary="emit('confirm')"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrashIcon } from '~/utils/app-icons'
import Checkbox from '~/components/ui/Checkbox.vue'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    confirmed: boolean
    title: string
    entityLabel: string
    entityLabelPlural?: string
    count: number
    itemNames?: string[]
    warning: string
    confirmLabel: string
    /** e.g. "Delete 3 categories and all products inside" */
    impactSummary?: string
    loading?: boolean
    maxVisibleNames?: number
  }>(),
  {
    itemNames: () => [],
    loading: false,
    maxVisibleNames: 8,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:confirmed': [value: boolean]
  confirm: []
}>()

const plural = computed(
  () => props.entityLabelPlural || `${props.entityLabel}${props.count === 1 ? '' : 's'}`
)

const impactSummary = computed(() => {
  if (props.impactSummary) return props.impactSummary
  return `Delete ${props.count} ${plural.value}`
})

const countLabel = computed(() => {
  const n = props.count
  const word =
    n === 1 ? props.entityLabel : props.entityLabelPlural || `${props.entityLabel}s`
  return `${n} ${word} selected`
})

const visibleNames = computed(() => props.itemNames.slice(0, props.maxVisibleNames))
const hiddenCount = computed(() =>
  Math.max(0, props.itemNames.length - props.maxVisibleNames)
)

const primaryLabel = computed(() => {
  if (props.loading) return 'Deleting…'
  return `Delete ${props.count} ${plural.value}`
})
</script>
