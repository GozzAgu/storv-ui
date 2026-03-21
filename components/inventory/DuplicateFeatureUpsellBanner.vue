<template>
  <p
    v-if="showBanner"
    class="m-0 max-w-full text-[10px] sm:text-[11px] leading-snug text-gray-400/85 dark:text-gray-500/75"
  >
    <span class="font-medium text-gray-400/90 dark:text-gray-500/80">Duplicate</span>
    <span> - Medium &amp; Enterprise.</span>
    <template v-if="userStore.isSuperAdmin">
      {{ ' ' }}
      <NuxtLink
        to="/dashboard/settings?upgrade=1"
        class="font-medium text-gray-500/90 dark:text-gray-400/75 hover:text-primary-500/80 dark:hover:text-primary-400/80 hover:underline underline-offset-2 decoration-primary-500/40 whitespace-nowrap"
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
