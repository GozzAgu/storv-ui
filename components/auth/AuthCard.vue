<template>
  <div :class="['auth-card', flat ? 'auth-card--flat' : '']">
    <div class="auth-card__inner">
      <slot />
      <div v-if="$slots.footer" class="auth-card__footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    flat?: boolean
  }>(),
  {
    flat: true,
  }
)
</script>
