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
import { computed, ref, watch, type Component } from 'vue'
import {
  Baby,
  BatteryCharging,
  BookOpen,
  Camera,
  Car,
  CupSoda,
  Footprints,
  Gamepad2,
  Gem,
  Headphones,
  HeartPulse,
  Laptop,
  Package,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkles,
  SprayCan,
  Tablet,
  Tv,
  UtensilsCrossed,
  Watch,
  Wrench,
} from '@lucide/vue'
import { storefrontIconKey, type StorefrontIconKey } from '~/utils/storefront-media'

const ICONS: Record<StorefrontIconKey, Component> = {
  phone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  watch: Watch,
  audio: Headphones,
  tv: Tv,
  camera: Camera,
  gaming: Gamepad2,
  charger: BatteryCharging,
  fragrance: SprayCan,
  beauty: Sparkles,
  clothing: Shirt,
  shoes: Footprints,
  bag: ShoppingBag,
  jewelry: Gem,
  food: UtensilsCrossed,
  drink: CupSoda,
  book: BookOpen,
  home: Sofa,
  baby: Baby,
  car: Car,
  tools: Wrench,
  health: HeartPulse,
  package: Package,
}

const props = withDefaults(
  defineProps<{
    src?: string | null
    title: string
    alt?: string
    categoryName?: string | null
    categoryPath?: string | null
    size?: 'card' | 'hero'
  }>(),
  {
    src: null,
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

const icon = computed(
  () => ICONS[storefrontIconKey(props.categoryPath, props.categoryName, props.title)]
)
</script>
