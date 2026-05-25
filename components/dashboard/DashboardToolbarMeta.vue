<template>
 <span :class="[metaClass, hiddenOnMobile ? 'hidden sm:inline-flex' : '', extraClass]">
 <slot />
 </span>
</template>

<script setup lang="ts">
withDefaults(
 defineProps<{
 hiddenOnMobile?: boolean
 extraClass?: string
 }>(),
 {
 hiddenOnMobile: true,
 extraClass: '',
 }
)

const { metaClass } = useDashboardPageChrome()
</script>
