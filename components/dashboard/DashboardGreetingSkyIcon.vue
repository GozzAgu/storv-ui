<template>
  <span
    class="dash-greeting-sky"
    :class="`dash-greeting-sky--${condition}`"
    :aria-label="ariaLabel"
    role="img"
  >
    <!-- Sunny -->
    <svg
      v-if="condition === 'sunny'"
      class="dash-greeting-sky__svg"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dashSkySunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFE9A8" />
          <stop offset="55%" stop-color="#FFC93C" />
          <stop offset="100%" stop-color="#F59E0B" />
        </radialGradient>
        <linearGradient id="dashSkySunRay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#F59E0B" stop-opacity="0.35" />
        </linearGradient>
      </defs>
      <g stroke="url(#dashSkySunRay)" stroke-width="2.5" stroke-linecap="round">
        <path d="M24 5v5.5" />
        <path d="M24 37.5V43" />
        <path d="M5 24h5.5" />
        <path d="M37.5 24H43" />
        <path d="M10.4 10.4l3.9 3.9" />
        <path d="M33.7 33.7l3.9 3.9" />
        <path d="M37.6 10.4l-3.9 3.9" />
        <path d="M14.3 33.7l-3.9 3.9" />
      </g>
      <circle cx="24" cy="24" r="9.5" fill="url(#dashSkySunCore)" />
      <circle cx="21" cy="21" r="3.2" fill="#FFF7D6" opacity="0.55" />
    </svg>

    <!-- Partly cloudy -->
    <svg
      v-else-if="condition === 'partly-cloudy'"
      class="dash-greeting-sky__svg"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dashSkyPartSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFE9A8" />
          <stop offset="100%" stop-color="#F59E0B" />
        </radialGradient>
        <linearGradient id="dashSkyPartCloud" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F8FAFC" />
          <stop offset="100%" stop-color="#CBD5E1" />
        </linearGradient>
      </defs>
      <circle cx="30.5" cy="16.5" r="7.5" fill="url(#dashSkyPartSun)" />
      <g stroke="#FBBF24" stroke-width="2" stroke-linecap="round" opacity="0.85">
        <path d="M30.5 5.5v3.2" />
        <path d="M41.5 16.5h-3.2" />
        <path d="M38.8 8.2l-2.3 2.3" />
      </g>
      <path
        d="M14.5 34.5c-4.2 0-7.5-2.9-7.5-6.5S10.3 21.5 14.5 21.5c.6-3.6 3.6-6.2 7.3-6.2 3.4 0 6.3 2.2 7.2 5.3 3.6.3 6.5 3.1 6.5 6.6 0 3.7-3.1 6.8-7 6.8H14.5Z"
        fill="url(#dashSkyPartCloud)"
      />
      <path
        d="M16 28.5c1.1-1.8 3-3 5.2-3 1.4 0 2.7.4 3.8 1.2"
        stroke="#94A3B8"
        stroke-width="1.4"
        stroke-linecap="round"
        opacity="0.45"
      />
    </svg>

    <!-- Cloudy -->
    <svg
      v-else-if="condition === 'cloudy'"
      class="dash-greeting-sky__svg"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dashSkyCloudA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#EEF2FF" />
          <stop offset="100%" stop-color="#A5B4FC" />
        </linearGradient>
        <linearGradient id="dashSkyCloudB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F8FAFC" />
          <stop offset="100%" stop-color="#94A3B8" />
        </linearGradient>
      </defs>
      <path
        d="M12 29.5c-3.7 0-6.7-2.7-6.7-6S8.3 17.5 12 17.5c.7-3.8 3.9-6.6 7.8-6.6 3.3 0 6.1 2 7.2 4.9 1-.4 2.1-.6 3.2-.6 4.1 0 7.4 3.1 7.4 6.9 0 .4 0 .8-.1 1.1 2.6.7 4.5 3 4.5 5.7 0 3.3-2.8 6-6.3 6H12Z"
        fill="url(#dashSkyCloudA)"
        opacity="0.9"
      />
      <path
        d="M10.5 36c-3.5 0-6.3-2.5-6.3-5.6 0-3 2.6-5.4 5.9-5.6.7-3.2 3.5-5.5 6.9-5.5 2.8 0 5.2 1.5 6.4 3.8 3.2.1 5.8 2.5 5.8 5.5 0 .3 0 .6-.1.9 2.3.5 4 2.5 4 4.8 0 2.7-2.3 4.9-5.2 4.9H10.5Z"
        fill="url(#dashSkyCloudB)"
      />
    </svg>

    <!-- Clear night / moon -->
    <svg
      v-else
      class="dash-greeting-sky__svg"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dashSkyMoon" cx="38%" cy="38%" r="62%">
          <stop offset="0%" stop-color="#F8FAFC" />
          <stop offset="55%" stop-color="#E2E8F0" />
          <stop offset="100%" stop-color="#94A3B8" />
        </radialGradient>
        <radialGradient id="dashSkyNightGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#818CF8" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#818CF8" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#dashSkyNightGlow)" />
      <path
        d="M28.8 8.5c-1.2.4-2.3 1-3.2 1.8A11.2 11.2 0 1 0 37.7 27c.3-.9.5-1.9.5-2.9C33.4 24.8 29.7 20.2 28.8 8.5Z"
        fill="url(#dashSkyMoon)"
      />
      <circle cx="12.5" cy="14" r="1.15" fill="#FDE68A" />
      <circle cx="17" cy="9.5" r="0.75" fill="#FDE68A" opacity="0.85" />
      <circle cx="39" cy="18" r="0.9" fill="#C7D2FE" />
      <circle cx="35.5" cy="12" r="0.65" fill="#C7D2FE" opacity="0.9" />
      <circle cx="10" cy="30" r="0.7" fill="#FDE68A" opacity="0.75" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimeGreeting, type SkyCondition } from '~/composables/useTimeGreeting'

const props = defineProps<{
  /** Override auto time-based condition (useful for tests/previews). */
  condition?: SkyCondition
}>()

const { skyCondition } = useTimeGreeting()

const condition = computed(() => props.condition ?? skyCondition.value)

const ariaLabel = computed(() => {
  switch (condition.value) {
    case 'sunny':
      return 'Sunny sky'
    case 'partly-cloudy':
      return 'Partly cloudy sky'
    case 'cloudy':
      return 'Cloudy sky'
    default:
      return 'Clear night sky'
  }
})
</script>

<style scoped>
.dash-greeting-sky {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 0;
  background: transparent;
}

.dash-greeting-sky__svg {
  width: 3rem;
  height: 3rem;
  display: block;
}

@media (min-width: 640px) {
  .dash-greeting-sky {
    width: 4.25rem;
    height: 4.25rem;
  }

  .dash-greeting-sky__svg {
    width: 3.5rem;
    height: 3.5rem;
  }
}
</style>
