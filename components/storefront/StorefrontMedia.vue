<template>
  <div
    class="sf-media"
    :class="[
      `sf-media--${size}`,
      {
        'sf-media--photo': Boolean(src),
        'sf-media--placeholder': !src,
      },
    ]"
    :style="mediaStyle"
    role="img"
    :aria-label="alt || title || categoryDisplay || 'Product'"
  >
    <template v-if="!src">
      <span class="sf-media__name" aria-hidden="true">{{ categoryDisplay || 'Product' }}</span>
    </template>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  storefrontCategoryLabel,
  storefrontPlaceholderStyle,
} from '~/utils/storefront-media'

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
    size?: 'card' | 'recent' | 'hero' | 'compare'
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

const categoryDisplay = computed(() =>
  storefrontCategoryLabel(props.categoryName, props.categoryPath)
)

const mediaStyle = computed(() => {
  if (props.src) {
    return { backgroundImage: `url(${props.src})` }
  }
  return storefrontPlaceholderStyle(`${props.seed || props.title}::${props.title}`)
})
</script>

<style scoped>
.sf-media {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.sf-media--placeholder {
  isolation: isolate;
}

.sf-media--placeholder::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 15%, rgb(255 255 255 / 0.18), transparent 42%),
    radial-gradient(circle at 80% 90%, rgb(0 0 0 / 0.18), transparent 45%);
  pointer-events: none;
  z-index: 0;
}

.sf-media__name {
  position: relative;
  z-index: 1;
  max-width: 88%;
  padding: 0 0.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-align: center;
  text-wrap: balance;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  text-shadow: 0 1px 12px rgb(0 0 0 / 0.18);
  word-break: break-word;
}

.sf-media--card {
  aspect-ratio: 1 / 1;
  width: 100%;
}

.sf-media--card .sf-media__name {
  font-size: clamp(0.8125rem, 3.6vw, 1.05rem);
  -webkit-line-clamp: 4;
}

.sf-media--recent {
  height: 6.5rem;
  width: 100%;
}

.sf-media--recent .sf-media__name {
  font-size: 0.8125rem;
  -webkit-line-clamp: 3;
}

.sf-media--compare {
  height: 5.5rem;
  width: 100%;
  border-radius: 0.85rem;
}

.sf-media--compare .sf-media__name {
  font-size: 0.75rem;
  -webkit-line-clamp: 3;
}

.sf-media--hero {
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: min(68vw, 22rem);
}

.sf-media--hero .sf-media__name {
  font-size: clamp(1.35rem, 5.5vw, 2.15rem);
  -webkit-line-clamp: 4;
  max-width: 78%;
}
</style>
