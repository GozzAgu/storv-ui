<template>
  <span
    :class="badgeClass"
    :title="`Workspace: ${label}`"
    role="status"
    :aria-label="`Workspace style: ${label}`"
  >
    <span v-if="showPrefix" class="dash-experience-badge__prefix">Workspace ·</span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EXPERIENCE_MODE_LABELS } from '~/types/business-experience'

const props = withDefaults(
  defineProps<{
    /** profile = account menu; sidebar = web rail; settings = settings panel; ios = command header */
    variant?: 'profile' | 'sidebar' | 'settings' | 'ios'
    showPrefix?: boolean
  }>(),
  {
    variant: 'profile',
    showPrefix: false,
  }
)

const { experienceMode, isSoloExperience } = useBusinessCapabilities()

const label = computed(() => EXPERIENCE_MODE_LABELS[experienceMode.value])

const badgeClass = computed(() => [
  'dash-experience-badge',
  `dash-experience-badge--${props.variant}`,
  isSoloExperience.value ? 'dash-experience-badge--solo' : 'dash-experience-badge--business',
])
</script>
