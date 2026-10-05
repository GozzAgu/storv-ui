<template>
  <div
    v-if="bannerContent && bannerVisible"
    class="s-c s-banner"
    :class="`s-banner--${tone}`"
    role="status"
    :aria-label="bannerContent.title"
  >
    <div class="s-banner__lead">
      <component :is="toneIcon" class="s-banner__icon" :size="16" :stroke-width="2" aria-hidden="true" />
      <p class="s-banner__text">
        <strong>{{ bannerContent.title }}.</strong> {{ bannerContent.message }}
      </p>
    </div>
    <div class="s-banner__actions">
      <SButton size="sm" :to="bannerContent.actionHref">{{ bannerContent.actionLabel }}</SButton>
      <SIconButton
        size="sm"
        label="Dismiss billing notice"
        @click="dismissBanner(bannerContent.id)"
      >
        <X :size="16" :stroke-width="2" aria-hidden="true" />
      </SIconButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleAlert, Info, TriangleAlert, X } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SIconButton from '~/components/s/SIconButton.vue'

const { bannerContent, bannerVisible, dismissBanner } = useSubscriptionBillingUi()

const tone = computed(() => {
  const variant = bannerContent.value?.variant
  if (variant === 'past_due') return 'error'
  if (variant === 'expired') return 'warning'
  return 'info'
})

const toneIcon = computed(() => {
  if (tone.value === 'error') return CircleAlert
  if (tone.value === 'warning') return TriangleAlert
  return Info
})
</script>
