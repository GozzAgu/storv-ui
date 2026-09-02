<template>
  <div class="relative shrink-0" :class="wrapperClass">
    <select
      :id="selectId"
      v-model="model"
      :class="[fieldClass, toolbarSelectClass, 'w-full cursor-pointer appearance-none pl-2.5 pr-8', minWidthClass]"
      v-bind="$attrs"
    >
      <slot />
    </select>
    <ChevronDownIcon
      class="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ChevronDownIcon,
} from '~/utils/app-icons'
defineOptions({ inheritAttrs: false })

const model = defineModel<string | number>({ default: '' })

withDefaults(
  defineProps<{
    selectId?: string
    minWidthClass?: string
    wrapperClass?: string
  }>(),
  {
    selectId: undefined,
    minWidthClass: 'min-w-[5.5rem]',
    wrapperClass: '',
  }
)

const { fieldClass, toolbarSelectClass } = useDashboardPageChrome()
</script>
