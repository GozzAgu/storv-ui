<template>
  <Teleport to="body">
    <div
      v-if="open && style"
      ref="panel"
      v-bind="$attrs"
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
import { ref, type CSSProperties } from 'vue'

/**
 * A `<Teleport>` root can't inherit fallthrough attributes, so the menu's
 * `data-*-menu` hooks (used by the pages' outside-click handlers) are bound
 * onto the card itself.
 */
defineOptions({ inheritAttrs: false })

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

/** Exposed so callers can measure the rendered menu when positioning it */
const panel = ref<HTMLElement | null>(null)

defineExpose({ panel })
</script>
