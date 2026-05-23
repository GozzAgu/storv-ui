<template>
  <div
    class="relative min-w-0 w-full shrink-0"
    :class="[wide ? 'xl:max-w-[min(100%,16rem)]' : 'sm:max-w-[min(100%,14rem)]', wrapperClass]"
  >
    <MagnifyingGlassIcon
      class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
      aria-hidden="true"
    />
    <input
      :id="inputId"
      v-model="model"
      type="search"
      :placeholder="placeholder"
      :class="[fieldClass, 'w-full pl-8', clearable && model ? 'pr-8' : 'pr-2.5', inputClass]"
      v-bind="$attrs"
    />
    <button
      v-if="clearable && model"
      type="button"
      class="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
      :aria-label="clearLabel"
      @click="model = ''"
    >
      <span class="text-sm leading-none" aria-hidden="true">×</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    placeholder?: string
    clearable?: boolean
    clearLabel?: string
    wide?: boolean
    inputId?: string
    inputClass?: string
    wrapperClass?: string
  }>(),
  {
    placeholder: 'Search…',
    clearable: true,
    clearLabel: 'Clear search',
    wide: true,
    inputId: undefined,
    inputClass: '',
    wrapperClass: '',
  }
)

const { fieldClass } = useDashboardPageChrome()
</script>
