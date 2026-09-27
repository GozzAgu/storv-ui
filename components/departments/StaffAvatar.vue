<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200/80 font-semibold text-gray-700 ring-1 ring-black/5 dark:bg-white/10 dark:text-gray-200 dark:ring-white/10"
    :class="size === 'md' ? 'h-9 w-9 text-xs' : 'h-7 w-7 text-[10px]'"
    aria-hidden="true"
  >
    <img
      v-if="showImage"
      :key="photoUrl"
      :src="photoUrl"
      alt=""
      class="h-full w-full object-cover"
      loading="lazy"
      @error="failed = true"
    />
    <span v-else>{{ initials }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    firstName?: string
    lastName?: string
    photoUrl?: string
    size?: 'sm' | 'md'
  }>(),
  {
    firstName: '',
    lastName: '',
    photoUrl: '',
    size: 'sm',
  }
)

const failed = ref(false)

watch(
  () => props.photoUrl,
  () => {
    failed.value = false
  }
)

const showImage = computed(() => Boolean(props.photoUrl) && !failed.value)

const initials = computed(() => {
  const value = `${props.firstName.trim().charAt(0)}${props.lastName.trim().charAt(0)}`
  return (value || '?').toUpperCase()
})
</script>
