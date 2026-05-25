<template>
 <button
 type="button"
 :class="[iconBtnClass, extraClass]"
 v-bind="$attrs"
 >
 <slot />
 </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
 defineProps<{
 extraClass?: string
 }>(),
 {
 extraClass: '',
 }
)

const { iconBtnClass } = useDashboardPageChrome()
</script>
