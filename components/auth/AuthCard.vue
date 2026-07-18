<template>
  <div :class="authEntranceClass(entranceDelay) + ' auth-card'">
    <div class="auth-card__inner">
      <slot />
      <div v-if="$slots.footer" class="auth-card__footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authEntranceClass } from '~/utils/auth-entrance'

withDefaults(
  defineProps<{
    entranceDelay?: number
  }>(),
  {
    entranceDelay: 120,
  }
)
</script>
