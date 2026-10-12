<template>
  <svg
    class="s-storvv-mark"
    :width="size"
    :height="size"
    viewBox="-112 -112 1248 1248"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="LEAF" />
    <path :d="LEAF" transform="rotate(180 512 512)" fill-opacity="0.5" />
  </svg>
</template>

<script setup lang="ts">
/** The Storvv symbol, tinted by the surrounding text colour so it can sit among stroke icons. */
withDefaults(defineProps<{ size?: number }>(), { size: 22 })

const LEAF =
  'M747 0C770 0 785 28 775 56L680 316H530C497 316 476 336 465 368L343 707H35C12 707 -3 685 6 660L141 283C200 117 350 0 530 0Z'
</script>
