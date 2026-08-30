<template>
  <div :class="['ios-drawer-footer', variant === 'menu' ? 'ios-drawer-footer--menu' : '']">
    <div v-if="$slots.leading" class="ios-drawer-footer__leading">
      <slot name="leading" />
    </div>
    <div class="ios-drawer-footer__actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** `actions` = CRUD cancel/save row; `menu` = full-width list-style footer rows */
    variant?: 'actions' | 'menu'
  }>(),
  { variant: 'actions' }
)
</script>
