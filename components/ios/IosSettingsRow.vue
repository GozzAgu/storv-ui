<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="ios-settings-row"
    :class="{ 'ios-settings-row--last': last }"
  >
    <component :is="icon" v-if="icon" class="ios-settings-row__icon" aria-hidden="true" />
    <span class="ios-settings-row__label">{{ label }}</span>
    <span v-if="value" class="ios-settings-row__value">{{ value }}</span>
    <ChevronRightIcon class="ios-settings-row__chevron" aria-hidden="true" />
  </NuxtLink>
  <button
    v-else
    type="button"
    class="ios-settings-row"
    :class="{ 'ios-settings-row--last': last }"
    @click="$emit('click')"
  >
    <component :is="icon" v-if="icon" class="ios-settings-row__icon" aria-hidden="true" />
    <span class="ios-settings-row__label">{{ label }}</span>
    <span v-if="value" class="ios-settings-row__value">{{ value }}</span>
    <ChevronRightIcon class="ios-settings-row__chevron" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import type { FunctionalComponent } from 'vue'
import { ChevronRightIcon } from '~/utils/app-icons'

defineProps<{
  label: string
  icon?: FunctionalComponent
  value?: string
  to?: string
  last?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
