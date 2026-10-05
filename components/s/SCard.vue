<template>
  <component :is="as" class="s-c s-card" :class="{ 's-card--flush': flush }">
    <header v-if="title || $slots.header || $slots.actions" class="s-card__head">
      <slot name="header">
        <div>
          <h2 class="s-card__title">{{ title }}</h2>
          <p v-if="description" class="s-card__description">{{ description }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="s-card__actions"><slot name="actions" /></div>
    </header>
    <div class="s-card__body"><slot /></div>
    <footer v-if="$slots.footer" class="s-card__foot"><slot name="footer" /></footer>
  </component>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** Body has no padding (tables, lists that run edge to edge). */
    flush?: boolean
    as?: string
  }>(),
  { as: 'section' }
)
</script>
