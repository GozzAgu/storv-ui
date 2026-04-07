<!--
  Loader visual adapted from Uiverse.io (mobinkakei); gradient sized via --sl-size.
-->
<template>
  <div
    class="storvv-sync-loader"
    :style="{ '--sl-size': `${size}px`, width: 'var(--sl-size)', height: 'var(--sl-size)' }"
    aria-hidden="true"
  >
    <div class="storvv-sync-loader__cube storvv-sync-loader__cube--color" />
    <div class="storvv-sync-loader__cube storvv-sync-loader__cube--glowing" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Edge length in pixels (default matches compact hero use). */
    size?: number
  }>(),
  { size: 88 }
)
</script>

<style scoped>
.storvv-sync-loader {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.storvv-sync-loader__cube {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: calc(var(--sl-size) * 0.2);
}

.storvv-sync-loader__cube--glowing {
  z-index: 2;
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.storvv-sync-loader__cube--color {
  z-index: 1;
  filter: blur(2px);
  background: linear-gradient(135deg, #1afbf0, #da00ff);
  animation: storvv-sync-loadtwo 2.5s ease-in-out infinite;
}

@keyframes storvv-sync-loadtwo {
  50% {
    transform: rotate(-80deg);
  }
}
</style>
