<template>
  <div class="s-c s-page-header">
    <div class="s-page-header__text">
      <slot name="eyebrow" />
      <div class="s-page-header__title-row">
        <NuxtLink
          v-if="back"
          :to="back.to"
          class="s-icon-btn s-icon-btn--secondary s-icon-btn--sm s-page-header__back"
          :aria-label="`Back to ${back.label}`"
          :title="`Back to ${back.label}`"
        >
          <ArrowLeft :size="16" :stroke-width="2" aria-hidden="true" />
        </NuxtLink>
        <h2 class="s-page-header__title">{{ title }}</h2>
      </div>
      <p v-if="description || $slots.description" class="s-page-header__description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="s-page-header__actions"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

defineProps<{
  title: string
  description?: string
  /** Parent page for nested routes; renders a back link beside the title. */
  back?: { to: string; label: string }
}>()
</script>
