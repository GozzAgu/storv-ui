<template>
  <form
    :id="id"
    :class="[
      'ios-form',
      layout === 'fill' ? 'ios-form--fill dash-drawer-fill' : '',
      scroll ? 'ios-form--scroll' : '',
    ]"
    @submit.prevent="emit('submit', $event)"
  >
    <div
      :class="[
        layout === 'fill' ? 'ios-form__scroll dash-drawer-fill__scroll' : 'ios-form__body',
        noDividers ? '' : 'divide-y divide-gray-100/90 dark:divide-gray-800/80',
      ]"
    >
      <slot />
    </div>
  </form>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string
    /** `fill` matches legacy dash-drawer-fill scroll layouts */
    layout?: 'default' | 'fill'
    scroll?: boolean
    noDividers?: boolean
  }>(),
  {
    layout: 'default',
    scroll: true,
    noDividers: true,
  }
)

const emit = defineEmits<{
  submit: [event: Event]
}>()
</script>
