<template>
 <div
 :class="[ 'animate-pulse bg-gray-200 dark:bg-white/10 rounded', widthClass, heightClass, extraClass ]"
 ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
 width?: string | number
 height?: string | number
 rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
 extraClass?: string
}

const props = withDefaults(defineProps<Props>(), {
 width: 'full',
 height: '4',
 rounded: 'md',
 extraClass: ''
})

const widthClass = computed(() => {
 if (typeof props.width === 'number') {
 return `w-${props.width}`
 }
 if (props.width === 'full') {
 return 'w-full'
 }
 return props.width
})

const heightClass = computed(() => {
 if (typeof props.height === 'number') {
 return `h-${props.height}`
 }
 if (props.height === 'full') {
 return 'h-full'
 }
 return props.height
})
</script>
