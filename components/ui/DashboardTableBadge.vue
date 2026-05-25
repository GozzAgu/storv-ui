<template>
 <span :class="badgeClass" :title="title">
 <slot>{{ label }}</slot>
 </span>
</template>

<script setup lang="ts">
const props = defineProps<{
 badgeClass: string
 label?: string
 title?: string
}>()
</script>
