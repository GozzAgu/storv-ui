<template>
  <p
    v-if="showBanner"
    class="m-0 max-w-full text-[10px] sm:text-[11px] leading-snug font-extralight text-amber-500/70 dark:text-amber-400/55"
  >
    <span>Duplicate isn't available in your plan. Upgrade to Medium &amp; Enterprise.</span>
    <template v-if="userStore.isSuperAdmin">
      {{ ' ' }}
      <NuxtLink
        to="/dashboard/settings?upgrade=1"
        class="font-extralight text-amber-500/75 dark:text-amber-400/60 hover:text-amber-600/90 dark:hover:text-amber-300/80 hover:underline underline-offset-2 whitespace-nowrap"
      >
        Upgrade
      </NuxtLink>
    </template>
    <span v-else> Ask your admin.</span>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '~/stores/user'

const props = withDefaults(
  defineProps<{
    /** Hide while parent is loading (e.g. folders fetch). */
    loading?: boolean
  }>(),
  { loading: false }
)

const userStore = useUserStore()

const canDuplicateByPlan = computed(() => {
  const sub = userStore.userData?.subscription
  return sub === 'storvv_medium' || sub === 'storvv_enterprise'
})

const showBanner = computed(() => !props.loading && !canDuplicateByPlan.value)
</script>
