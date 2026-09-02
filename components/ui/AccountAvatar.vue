<template>
  <img
    v-if="showImage"
    :key="src"
    :src="src"
    alt=""
    class="account-avatar__img"
    @error="failed = true"
  />
  <span v-else class="relative">{{ initials }}</span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAccountAvatar } from '~/composables/useAccountAvatar'

withDefaults(
  defineProps<{
    initials?: string
  }>(),
  {
    initials: 'U',
  }
)

const { avatarImageUrl } = useAccountAvatar()
const failed = ref(false)

watch(avatarImageUrl, () => {
  failed.value = false
})

const src = computed(() => avatarImageUrl.value)
const showImage = computed(() => Boolean(src.value) && !failed.value)
</script>
