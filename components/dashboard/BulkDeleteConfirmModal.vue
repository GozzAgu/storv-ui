<template>
  <SDialog
    :open="modelValue"
    role="alertdialog"
    size="sm"
    :title="title"
    :description="warning"
    @update:open="emit('update:modelValue', $event)"
  >
    <div class="s-confirm">
      <p class="s-callout">
        <strong>{{ impactSummary }}</strong> · {{ countLabel }}
      </p>

      <ul v-if="itemNames.length > 0" class="s-confirm__names" :aria-label="countLabel">
        <li v-for="(name, i) in visibleNames" :key="`${name}-${i}`" class="s-confirm__name">
          <span class="s-confirm__name-primary">{{ name }}</span>
        </li>
        <li v-if="hiddenCount > 0" class="s-confirm__name s-confirm__name--more">
          and {{ hiddenCount }} more
        </li>
      </ul>

      <div class="s-confirm__ack">
        <SCheckbox
          :model-value="confirmed"
          :label="confirmLabel"
          @update:model-value="emit('update:confirmed', $event === true)"
        />
      </div>
    </div>

    <template #footer>
      <SDialogActions
        primary-variant="danger"
        :primary-icon="Trash2"
        :primary-label="primaryLabel"
        :primary-disabled="!confirmed || loading"
        @cancel="emit('update:modelValue', false)"
        @primary="emit('confirm')"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import { computed } from 'vue'
import { Trash2 } from '@lucide/vue'
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
