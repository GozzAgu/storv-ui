<template>
  <div>
    <div class="mb-6 sm:mb-8">
      <p class="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">Security</p>
      <h1 class="mt-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Activity Logs</h1>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Track who changed what in inventory. Improves accountability and supports security auditing.
      </p>
    </div>

    <div v-if="!canAccess" class="rounded-2xl ring-1 p-6 text-center max-w-md mx-auto" :class="accessDeniedByRole ? 'bg-red-50 dark:bg-red-900/20 ring-red-200/60 dark:ring-red-700/50' : 'bg-amber-50 dark:bg-amber-900/20 ring-amber-200/60 dark:ring-amber-700/50'">
      <p v-if="accessDeniedByRole" class="text-xs text-red-800 dark:text-red-200">Activity Logs are only available to super admins and managers.</p>
      <p v-else class="text-xs text-amber-800 dark:text-amber-200">Activity Logs are available on Storvv Medium and Storvv Enterprise. Upgrade your plan to view logs.</p>
      <NuxtLink v-if="!accessDeniedByRole" to="/dashboard/settings" class="mt-3 inline-block text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">Go to Settings →</NuxtLink>
    </div>

    <template v-else>
    <div v-if="!storeId" class="rounded-2xl bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/60 dark:ring-amber-700/50 p-6 text-center">
      <p class="text-xs text-amber-800 dark:text-amber-200">Select a store to view activity logs.</p>
    </div>

    <div v-else class="rounded-2xl bg-white dark:bg-gray-800/90 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-700/50 overflow-hidden">
      <div v-if="loading" class="p-8 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
      <div v-else-if="logs.length === 0" class="p-12 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">No activity recorded yet for this store.</p>
        <p class="mt-1 text-[10px] text-gray-400 dark:text-gray-500">Create or edit inventory items to see logs here.</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200/80 dark:divide-gray-700/80">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th scope="col" class="px-3 sm:px-4 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                User
              </th>
              <th scope="col" class="px-3 sm:px-4 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Action
              </th>
              <th scope="col" class="px-3 sm:px-4 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Item
              </th>
              <th scope="col" class="px-3 sm:px-4 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Date
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200/80 dark:divide-gray-700/80">
            <tr
              v-for="log in logs"
              :key="log.id"
              class="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-3 sm:px-4 py-2 text-[11px] font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {{ log.userDisplayName }}
              </td>
              <td class="px-3 sm:px-4 py-2 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-1.5 py-0.5 text-[9px] font-medium capitalize rounded-full',
                    log.action === 'created'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : log.action === 'deleted'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  ]"
                >
                  {{ log.action }}
                </span>
              </td>
              <td class="px-3 sm:px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 max-w-[200px] truncate" :title="log.entityName">
                {{ log.entityName }}
              </td>
              <td class="px-3 sm:px-4 py-2 text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {{ formatDate(log.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import type { ActivityLog } from '~/composables/useActivityLog'
import { fetchActivityLogs } from '~/composables/useActivityLog'
import { getCurrentStoreId } from '~/composables/useCurrentStore'

const userStore = useUserStore()
const staffStore = useStaffStore()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

const isManager = computed(() => userStore.userData?.role === 'staff' && staffStore.getCurrentStaffMember?.role === 'manager')
const hasPlanAccess = computed(() => canUseSubscriptionFeature('activity_logs'))
const canAccess = computed(() => (userStore.isSuperAdmin || isManager.value) && hasPlanAccess.value)
const accessDeniedByRole = computed(() => !userStore.isSuperAdmin && !isManager.value)

const storeId = ref<string | null>(null)
const logs = ref<ActivityLog[]>([])
const loading = ref(true)

function formatDate(d: Date | unknown): string {
  if (!d) return '—'
  const date = d instanceof Date ? d : new Date(d as string | number)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

async function loadLogs() {
  if (!canAccess.value) return
  loading.value = true
  storeId.value = await getCurrentStoreId()
  if (!storeId.value) {
    loading.value = false
    return
  }
  try {
    logs.value = await fetchActivityLogs(200)
  } catch (e) {
    console.error('[Activity] Failed to fetch logs:', e)
    logs.value = []
  } finally {
    loading.value = false
  }
}

const storesStore = useStoresStore()

onMounted(() => {
  if (canAccess.value) loadLogs()
})

watch(() => storesStore.currentStoreId, () => {
  loadLogs()
})

// Refetch when page becomes visible (e.g. user returns from inventory tab after making changes)
onMounted(() => {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && canAccess.value) loadLogs()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  onUnmounted(() => document.removeEventListener('visibilitychange', onVisibilityChange))
})
</script>
