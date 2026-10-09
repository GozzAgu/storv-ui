<template>
  <div
    class="s-sf-media"
    :class="[`s-sf-media--${size}`, { 's-sf-media--placeholder': !showPhoto }]"
    :style="showPhoto ? undefined : placeholderStyle"
    role="img"
    :aria-label="alt || title || categoryDisplay || 'Product'"
  >
    <img
      v-if="showPhoto"
      :src="src!"
      alt=""
      class="s-sf-media__img"
      :loading="size === 'hero' ? 'eager' : 'lazy'"
      decoding="async"
      @error="failed = true"
    />
    <span v-else class="s-sf-media__name" aria-hidden="true">
      {{ placeholderText }}
    </span>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storefrontCategoryLabel, storefrontPlaceholderStyle } from '~/utils/storefront-media'

const props = withDefaults(
  defineProps<{
    src?: string | null
    title: string
    /** Extra seed (e.g. item id) so similar titles still get distinct colors. */
    seed?: string
    alt?: string
    /** Leaf folder name (subcategory when nested). */
    categoryName?: string | null
    categoryPath?: string | null
    size?: 'card' | 'recent' | 'hero' | 'compare' | 'folder'
  }>(),
  {
    src: null,
    seed: '',
    alt: '',
    categoryName: null,
    categoryPath: null,
    size: 'card',
  }
)

const failed = ref(false)
watch(
  () => props.src,
  () => {
    failed.value = false
  }
)

const showPhoto = computed(() => Boolean(props.src) && !failed.value)

const categoryDisplay = computed(() =>
  storefrontCategoryLabel(props.categoryName, props.categoryPath)
)

const placeholderText = computed(() => {
  const text = categoryDisplay.value || props.title || 'Product'
  return props.size === 'folder' ? text.trim().charAt(0).toUpperCase() : text
})

const placeholderStyle = computed(() =>
  storefrontPlaceholderStyle(`${props.seed || props.title}::${props.title}`)
)
</script>
