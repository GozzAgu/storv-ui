<template>
  <div :class="authEntranceClass(entranceDelay) + ' auth-page-header'">
    <a
      v-if="showMobileLogo"
      href="https://www.storvv.com"
      class="auth-page-header__mobile-logo lg:hidden"
    >
      <img :src="logoSource" alt="Storvv" width="140" height="40" />
    </a>
    <p v-if="eyebrow" class="auth-page-header__eyebrow">{{ eyebrow }}</p>
    <h1 class="auth-page-header__title">{{ title }}</h1>
    <p v-if="$slots.default" class="auth-page-header__lede">
      <slot />
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '~/composables/useTheme'
import { authEntranceClass } from '~/utils/auth-entrance'

withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    showMobileLogo?: boolean
    entranceDelay?: number
  }>(),
  {
    showMobileLogo: true,
    entranceDelay: 40,
  }
)

const { actualTheme } = useTheme()
const logoSource = computed(() =>
  actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)
</script>
