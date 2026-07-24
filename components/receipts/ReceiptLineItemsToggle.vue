<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDownIcon } from '~/utils/app-icons'

const props = withDefaults(
  defineProps<{
    expanded: boolean
    itemCount: number
    /** Singular unit label, e.g. "line item" or "receipt" */
    noun?: string
    /** Override plural, e.g. "line items" or "receipts" */
    pluralNoun?: string
    /** Override expanded-state label */
    hideText?: string
    noTopMargin?: boolean
  }>(),
  {
    noun: 'line item',
    pluralNoun: '',
    hideText: '',
    noTopMargin: false,
  }
)

defineEmits<{
  toggle: []
}>()

const resolvedPlural = computed(() => {
  if (props.pluralNoun) return props.pluralNoun
  if (props.noun === 'line item') return 'line items'
  return `${props.noun}s`
})

const collapsedLabel = computed(() => {
  const n = props.itemCount
  const unit = n === 1 ? props.noun : resolvedPlural.value
  return `${n} ${unit}`
})

const expandedLabel = computed(() => props.hideText || `Hide ${resolvedPlural.value}`)
</script>

<template>
  <button
    type="button"
    class="group inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200/90 bg-gray-50/80 px-2 py-0.5 text-[10px] font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100/90 hover:text-gray-800 dark:border-gray-700/80 dark:bg-white/[0.04] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-white/[0.07] dark:hover:text-gray-200"
    :class="noTopMargin ? '' : 'mt-1.5'"
    :aria-expanded="expanded"
    @click.stop="$emit('toggle')"
  >
    <ChevronDownIcon
      class="h-3 w-3 shrink-0 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
      :class="expanded ? 'rotate-180' : ''"
      stroke-width="2"
    />
    <span class="truncate tabular-nums">
      {{ expanded ? expandedLabel : collapsedLabel }}
    </span>
  </button>
</template>
