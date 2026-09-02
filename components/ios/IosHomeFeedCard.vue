<template>
  <NuxtLink :to="href" class="ios-home-feed-card">
    <div class="ios-home-feed-card__head">
      <div class="ios-home-feed-card__profile">
        <div class="ios-home-feed-card__avatar" aria-hidden="true">{{ initials }}</div>
        <div class="ios-home-feed-card__identity">
          <p class="ios-home-feed-card__name">{{ title }}</p>
          <p class="ios-home-feed-card__role">{{ subtitle }}</p>
        </div>
      </div>
      <div class="ios-home-feed-card__actions">
        <span v-if="badge" class="ios-home-feed-card__badge">{{ badge }}</span>
        <EllipsisVerticalIcon class="ios-home-feed-card__menu" aria-hidden="true" />
      </div>
    </div>
    <p v-if="body" class="ios-home-feed-card__body">{{ body }}</p>
    <div class="ios-home-feed-card__foot">
      <span class="ios-home-feed-card__meta">
        <ClockIcon aria-hidden="true" />
        {{ timeLabel }}
      </span>
      <span class="ios-home-feed-card__meta ios-home-feed-card__meta--value">
        <EyeIcon aria-hidden="true" />
        {{ valueLabel }}
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { ClockIcon, EllipsisVerticalIcon, EyeIcon } from '~/utils/app-icons'

defineProps<{
  title: string
  subtitle: string
  body?: string
  timeLabel: string
  valueLabel: string
  initials: string
  badge?: string
  href: string
}>()
</script>
