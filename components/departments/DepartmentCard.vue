<template>
  <article
    class="dash-grid-card dept-grid-card dash-folder-card"
    :class="[
      inactive ? 'dash-grid-card--disabled' : '',
      deleting ? 'pointer-events-none' : '',
    ]"
    role="button"
    tabindex="0"
    @click="!inactive && !deleting && $emit('open')"
    @keydown.enter.prevent="!inactive && !deleting && $emit('open')"
    @keydown.space.prevent="!inactive && !deleting && $emit('open')"
  >
    <div v-if="deleting" class="dash-grid-card__overlay">
      <ArrowPathIcon class="h-5 w-5 animate-spin text-white" aria-hidden="true" />
    </div>

    <div v-if="hasOverlays" class="dash-folder-card__chrome">
      <div class="dash-folder-card__check" @click.stop>
        <slot name="checkbox" />
      </div>
      <div class="dash-folder-card__menu" @click.stop>
        <slot name="menu" />
      </div>
    </div>

    <GlassFolderMark class="dash-folder-card__mark" />

    <div class="dash-folder-card__copy">
      <h3 class="dash-folder-card__title">{{ displayName }}</h3>
      <p class="dash-folder-card__meta">{{ metaLabel }}</p>
      <p v-if="inactive" class="dash-folder-card__hint dash-folder-card__hint--warning">
        Inactive
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowPathIcon } from '~/utils/app-icons'
import GlassFolderMark from '~/components/ui/GlassFolderMark.vue'
import { formatCategoryDisplayName } from '~/utils/inventory-category-card'

const props = withDefaults(
  defineProps<{
    name: string
    description?: string
    departmentType?: string
    staffCount?: number
    manager?: string
    storeName?: string
    inactive?: boolean
    deleting?: boolean
    hasOverlays?: boolean
    updatedAt?: unknown
    createdAt?: unknown
  }>(),
  {
    description: '',
    departmentType: '',
    staffCount: 0,
    manager: '',
    storeName: '',
    inactive: false,
    deleting: false,
    hasOverlays: false,
    updatedAt: undefined,
    createdAt: undefined,
  }
)

defineEmits<{
  open: []
}>()

const displayName = computed(() => formatCategoryDisplayName(props.name))

const metaLabel = computed(() => {
  const n = props.staffCount ?? 0
  return `${n} ${n === 1 ? 'member' : 'members'}`
})
</script>
