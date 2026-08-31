<template>
  <Teleport to="body">
    <div
      v-if="open && style"
      :data-context-menu="menuId"
      class="ios-context-menu"
      role="menu"
      :style="style"
      @click.stop
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

withDefaults(
  defineProps<{
    open: boolean
    style?: CSSProperties | null
    menuId?: string
  }>(),
  {
    style: null,
    menuId: 'menu',
  }
)
</script>
