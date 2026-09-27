<template>
  <section
    :class="[
      'ios-form__section dash-drawer-section',
      fixed ? 'dash-drawer-fill__fixed' : '',
    ]"
  >
    <p v-if="title && resolvedShowTitle" class="ios-form__section-title dash-drawer-label">
      {{ title }}
    </p>
    <div :class="['ios-form__section-body', grid ? 'ios-form__grid' : '']">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    /** When false, the section heading is hidden. */
    showTitle?: boolean
    fixed?: boolean
    grid?: boolean
  }>(),
  {
    fixed: false,
    grid: true,
  }
)

const resolvedShowTitle = computed(() => props.showTitle ?? true)
</script>
