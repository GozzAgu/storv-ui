<template>
  <nav class="shrink-0" :aria-label="ariaLabel">
    <ol class="flex items-center gap-1">
      <li
        v-for="(step, index) in steps"
        :key="step.id ?? index"
        class="flex min-w-0 flex-1 items-center gap-1"
      >
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors"
            :class="
              currentStep >= index
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400'
            "
          >
            {{ index + 1 }}
          </span>
          <span
            class="hidden min-w-0 truncate text-[11px] font-medium sm:block"
            :class="
              currentStep >= index
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            "
          >
            {{ step.label }}
          </span>
        </div>
        <div
          v-if="index < steps.length - 1"
          class="mx-0.5 hidden h-px min-w-[0.5rem] flex-1 sm:block"
          :class="currentStep > index ? 'bg-primary-500/70' : 'bg-gray-200 dark:bg-gray-700/80'"
          aria-hidden="true"
        />
      </li>
    </ol>
    <p
      v-if="steps[currentStep]"
      class="mt-2 text-[11px] text-gray-500 dark:text-gray-400 sm:hidden"
    >
      Step {{ currentStep + 1 }}: {{ steps[currentStep]?.label }}
    </p>
  </nav>
</template>

<script setup lang="ts">
export interface DrawerStep {
  id?: string
  label: string
}

withDefaults(
  defineProps<{
    steps: DrawerStep[]
    currentStep: number
    ariaLabel?: string
  }>(),
  { ariaLabel: 'Progress' }
)
</script>
