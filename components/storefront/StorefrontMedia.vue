<template>
  <div
    class="s-sf-media"
    :class="[`s-sf-media--${size}`, { 's-sf-media--placeholder': !showPhoto }]"
    role="img"
    :aria-label="alt || title || 'Product'"
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
    <component :is="icon" v-else class="s-sf-media__icon" aria-hidden="true" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { resolveCategoryKind } from '~/utils/category-kinds'
import { categoryKindIcon } from '~/utils/category-kind-icons'

const props = withDefaults(
  defineProps<{
    src?: string | null
    title: string
    alt?: string
    /** Category kind from the inventory category; names are only a fallback. */
    kind?: string | null
    categoryName?: string | null
    categoryPath?: string | null
    size?: 'card' | 'hero'
  }>(),
  {
    src: null,
    alt: '',
    kind: null,
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

const icon = computed(() =>
  categoryKindIcon(
    resolveCategoryKind(props.kind, props.categoryPath, props.categoryName, props.title)
  )
)
</script>
