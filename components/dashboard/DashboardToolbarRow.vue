<template>
 <div :class="toolbarRowClass">
 <slot />
 </div>
</template>

<script setup lang="ts">
const { toolbarRowClass } = useDashboardPageChrome()
</script>
