<template>
  <svg
    class="s-buddy"
    :class="[`s-buddy--${variant}`, `s-buddy--${mood}`, { 's-buddy--down': look === 'down' }]"
    viewBox="0 0 80 80"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <clipPath :id="clipId"><circle cx="40" cy="40" r="40" /></clipPath>
    </defs>
    <circle class="s-buddy__bg" cx="40" cy="40" r="40" />
    <g :clip-path="`url(#${clipId})`">
      <path class="s-buddy__shirt" d="M12 80c2-15 13-23 28-23s26 8 28 23z" />
      <rect class="s-buddy__skin" x="34" y="46" width="12" height="13" rx="5" />
      <template v-if="variant === 'ada'">
        <circle class="s-buddy__hair" cx="40" cy="29" r="19" />
        <circle class="s-buddy__hair" cx="26" cy="27" r="9" />
        <circle class="s-buddy__hair" cx="54" cy="27" r="9" />
        <circle class="s-buddy__hair" cx="40" cy="15" r="10" />
      </template>
      <ellipse class="s-buddy__skin" cx="40" cy="36" rx="13" ry="14" />
      <path
        v-if="variant === 'tunde'"
        class="s-buddy__hair"
        d="M26.5 33c0-10.5 6-16 13.5-16s13.5 5.5 13.5 16c-3-5-8-7.5-13.5-7.5s-10.5 2.5-13.5 7.5z"
      />
    </g>

    <g class="s-buddy__face">
      <path v-if="mood === 'curious'" class="s-buddy__line" d="M32 31.5q3-2.5 6-1" />
      <template v-if="mood === 'shy'">
        <path class="s-buddy__line" d="M33 37.5q2 1.6 4 0M43 37.5q2 1.6 4 0" />
      </template>
      <template v-else-if="mood === 'cheer'">
        <path class="s-buddy__line" d="M33 37.5q2-2.2 4 0M43 37.5q2-2.2 4 0" />
      </template>
      <g v-else class="s-buddy__eyes">
        <circle class="s-buddy__ink" cx="35" cy="37" :r="mood === 'surprised' ? 2.3 : 1.8" />
        <circle class="s-buddy__ink" cx="45" cy="37" :r="mood === 'surprised' ? 2.3 : 1.8" />
      </g>

      <circle
        v-if="mood === 'shy' || mood === 'cheer'"
        class="s-buddy__cheek"
        cx="31"
        cy="41.5"
        r="2.4"
      />
      <circle
        v-if="mood === 'shy' || mood === 'cheer'"
        class="s-buddy__cheek"
        cx="49"
        cy="41.5"
        r="2.4"
      />

      <circle v-if="mood === 'surprised'" class="s-buddy__ink" cx="40" cy="44.5" r="2.2" />
      <path v-else-if="mood === 'cheer'" class="s-buddy__ink" d="M35 42.5q5 5.5 10 0z" />
      <path v-else-if="mood === 'curious'" class="s-buddy__line" d="M37 44.5q3-1 6 0" />
      <path v-else-if="mood === 'shy'" class="s-buddy__line" d="M37.5 44q2.5 1.4 5 0" />
      <path v-else class="s-buddy__line" d="M36 43q4 3.2 8 0" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { BuddyLook, BuddyMood } from '~/utils/auth-buddies'

defineProps<{
  variant: 'ada' | 'tunde'
  mood: BuddyMood
  look: BuddyLook
}>()

const clipId = `s-buddy-clip-${useId()}`
</script>
