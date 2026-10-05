<template>
  <SCard v-if="visible" as="section" class="s-setup" aria-labelledby="getting-started-heading">
    <template #header>
      <div class="s-setup__intro">
        <SBadge tone="accent">Get set up</SBadge>
        <h2 id="getting-started-heading" class="s-card__title">
          {{ nextStep ? nextStep.title : `Set up your store in ${steps.length} steps` }}
        </h2>
        <p class="s-card__description">
          {{ completedCount }} of {{ steps.length }} complete
        </p>
      </div>
    </template>
    <template #actions>
      <SButton variant="ghost" size="sm" @click="dismiss">Dismiss</SButton>
    </template>

    <div
      class="s-meter s-setup__meter"
      role="progressbar"
      :aria-valuenow="progressPercent"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Setup progress"
    >
      <div class="s-meter__seg" :style="{ width: `${progressPercent}%` }" />
    </div>

    <ol class="s-setup__steps">
      <li
        v-for="step in steps"
        :key="step.id"
        class="s-setup__step"
        :class="{
          's-setup__step--done': step.done,
          's-setup__step--next': step.id === nextStep?.id,
        }"
      >
        <span class="s-setup__index" aria-hidden="true">
          <Check v-if="step.done" :size="14" :stroke-width="2.5" />
          <span v-else>{{ step.order }}</span>
        </span>
        <div class="s-setup__text">
          <p class="s-setup__title">
            {{ step.title }}
            <span v-if="step.done" class="ds-sr-only">(done)</span>
          </p>
          <p class="s-setup__description">{{ step.description }}</p>
        </div>
        <SButton
          v-if="!step.done"
          :variant="step.id === nextStep?.id ? 'primary' : 'secondary'"
          size="sm"
          :to="step.href"
        >
          {{ step.cta }}
        </SButton>
      </li>
    </ol>
  </SCard>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import { useGettingStartedPath } from '~/composables/useGettingStartedPath'

const { steps, completedCount, progressPercent, nextStep, visible, dismiss } =
  useGettingStartedPath()
</script>
