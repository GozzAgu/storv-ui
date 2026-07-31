<template>
  <nav class="dash-drawer-stepper shrink-0" :aria-label="ariaLabel">
    <ol class="flex w-full items-start">
      <li
        v-for="(step, index) in steps"
        :key="step.id ?? index"
        class="flex min-w-0 flex-1 items-start"
        :aria-current="currentStep === index ? 'step' : undefined"
      >
        <div
          v-if="index > 0"
          class="mx-0.5 mt-3.5 h-px min-w-[0.35rem] flex-1 shrink"
          :class="connectorClass(index - 1)"
          aria-hidden="true"
        />
        <div class="flex w-full min-w-0 flex-col items-center gap-1.5 px-0.5">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors"
            :class="stepCircleClass(index)"
          >
            {{ index + 1 }}
          </span>
          <span
            class="w-full text-center text-[10px] font-medium leading-snug text-balance"
            :class="stepLabelClass(index)"
          >
            {{ step.label }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
export interface DrawerStep {
  id?: string
  label: string
}

const props = withDefaults(
  defineProps<{
    steps: DrawerStep[]
    currentStep: number
    ariaLabel?: string
  }>(),
  { ariaLabel: 'Progress' }
)

function stepCircleClass(index: number): string {
  return props.currentStep >= index
    ? 'bg-primary-500 text-white'
    : 'bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400'
}

function stepLabelClass(index: number): string {
  return props.currentStep >= index
    ? 'text-gray-900 dark:text-gray-100'
    : 'text-gray-500 dark:text-gray-400'
}

function connectorClass(leftStepIndex: number): string {
  return props.currentStep > leftStepIndex
    ? 'bg-primary-500/70'
    : 'bg-gray-200 dark:bg-gray-700/80'
}
</script>
