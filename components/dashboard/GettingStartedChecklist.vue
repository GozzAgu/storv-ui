<template>
  <section
    v-if="visible"
    class="rounded-xl border border-primary-500/20 bg-primary-500/[0.04] px-4 py-4 dark:border-primary-400/15 dark:bg-primary-500/[0.07] sm:px-5"
    aria-labelledby="getting-started-heading"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-700/80 dark:text-primary-300/80">
          First win
        </p>
        <h2 id="getting-started-heading" class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ nextStep ? nextStep.title : `Set up your store in ${steps.length} steps` }}
        </h2>
        <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {{ completedCount }} of {{ steps.length }} complete
          <template v-if="nextStep"> · Next: {{ nextStep.cta }}</template>
        </p>
      </div>
      <button
        type="button"
        class="text-[11px] font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        @click="dismiss"
      >
        Dismiss
      </button>
    </div>

    <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-200/80 dark:bg-white/10">
      <div
        class="h-full rounded-full bg-primary-600 transition-all duration-300 dark:bg-primary-500"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <ol class="mt-4 space-y-2">
      <li
        v-for="step in steps"
        :key="step.id"
        class="flex items-start gap-3 rounded-lg border border-transparent px-1 py-1.5"
        :class="step.done ? 'opacity-80' : step.id === nextStep?.id ? 'bg-primary-500/[0.06]' : ''"
      >
        <span
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          :class="
            step.done
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-gray-200/80 text-gray-600 dark:bg-white/10 dark:text-gray-300'
          "
          aria-hidden="true"
        >
          <CheckIcon v-if="step.done" class="h-3 w-3" stroke-width="2.5" />
          <span v-else>{{ step.order }}</span>
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
            {{ step.title }}
          </p>
          <p class="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            {{ step.description }}
          </p>
        </div>
        <NuxtLink
          v-if="!step.done"
          :to="step.href"
          class="shrink-0 text-[11px] font-semibold text-primary-700 hover:underline dark:text-primary-300"
        >
          {{ step.cta }}
        </NuxtLink>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { CheckIcon } from '~/utils/app-icons'
import { useGettingStartedPath } from '~/composables/useGettingStartedPath'

const { steps, completedCount, progressPercent, nextStep, visible, dismiss } =
  useGettingStartedPath()
</script>
