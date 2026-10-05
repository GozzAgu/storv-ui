<template>
  <header class="mk-head" :class="{ 'mk-head--center': align === 'center' }">
    <p v-if="eyebrow" class="mk-eyebrow">{{ eyebrow }}</p>
    <component :is="level" :id="titleId" class="mk-h2">
      {{ title }}
      <span v-if="accent" class="mk-accent">{{ accent }}</span>
    </component>
    <p v-if="lede" class="mk-lede">{{ lede }}</p>
    <slot />
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    /** Second phrase of the title, shown in the accent colour. */
    accent?: string
    eyebrow?: string
    lede?: string
    titleId?: string
    align?: 'center' | 'start'
    level?: 'h1' | 'h2'
  }>(),
  { align: 'center', level: 'h2' }
)
</script>
