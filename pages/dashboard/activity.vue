<template>
  <div class="w-full max-w-none space-y-5 pb-6 sm:space-y-6 sm:pb-8">
    <!-- Hero -->
    <header
      class="relative rounded-sm border border-gray-200/80 bg-white/90 px-4 py-4 shadow-sm dark:border-gray-800/70 dark:!bg-dashboard-card sm:px-5 sm:py-5"
    >
      <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
        Security
      </p>
      <h1
        class="mt-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl sm:tracking-tight"
      >
        Activity Logs
      </h1>
      <p class="mt-1 max-w-lg text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        Track who changed what in inventory. Improves accountability and supports security auditing.
      </p>
    </header>

    <div
      v-if="!canAccess"
      class="rounded-sm border px-4 py-4 shadow-sm sm:px-5 sm:py-5"
      :class="
        accessDeniedByRole
          ? 'border-red-200/80 bg-red-50/90 dark:border-red-800/50 dark:bg-red-950/25'
          : 'border-amber-200/80 bg-amber-50/90 dark:border-amber-800/50 dark:bg-amber-950/25'
      "
    >
      <p
        class="text-xs font-medium"
        :class="accessDeniedByRole ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'"
      >
        {{
          accessDeniedByRole
            ? 'Activity Logs are only available to super admins and managers.'
            : 'Activity Logs are available on Storvv Medium and Storvv Enterprise. Upgrade your plan to view logs.'
        }}
      </p>
      <NuxtLink
        v-if="!accessDeniedByRole"
        to="/dashboard/settings"
        class="mt-3 inline-block text-xs font-medium text-gray-700 underline decoration-gray-300 underline-offset-2 transition hover:text-gray-900 dark:text-gray-300 dark:decoration-gray-600 dark:hover:text-white"
      >
        Go to Settings →
      </NuxtLink>
    </div>

    <template v-else>
      <div
        v-if="!storeId && !loading"
        class="rounded-sm border border-gray-200/80 bg-white/90 px-6 py-12 text-center shadow-sm dark:border-gray-800/70 dark:!bg-dashboard-card sm:px-10"
      >
        <div
          class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-sm bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/60"
        >
          <BuildingStorefrontIcon class="h-7 w-7 text-gray-500 dark:text-gray-400" stroke-width="1.5" />
        </div>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Select a store to view activity logs</p>
        <p class="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Choose a store from the selector in the top bar.
        </p>
      </div>

      <div v-else class="data-table-shell overflow-hidden">
        <DataTableToolbar>
          <template #heading>
            <div class="min-w-0">
              <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
                Recent activity
              </h2>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Inventory changes for the current store
              </p>
            </div>
          </template>
        </DataTableToolbar>

        <div v-if="loading" class="p-6 sm:p-8">
          <div class="space-y-3">
            <div v-for="i in 6" :key="i" class="flex items-center gap-3">
              <div class="h-9 w-9 shrink-0 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
              <div class="min-w-0 flex-1 space-y-2">
                <div class="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
                <div class="h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="fetchError" class="px-4 py-10 text-center sm:px-6">
          <p class="text-sm font-medium text-red-600 dark:text-red-400">Could not load activity logs.</p>
          <p class="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">{{ fetchError }}</p>
          <button
            type="button"
            class="mt-4 text-xs font-medium text-gray-700 underline decoration-gray-300 underline-offset-2 transition hover:text-gray-900 dark:text-gray-300 dark:decoration-gray-600 dark:hover:text-white"
            @click="loadLogs()"
          >
            Try again
          </button>
        </div>

        <div v-else-if="logs.length === 0" class="px-4 py-14 text-center sm:px-6">
          <div
            class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-sm bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/60"
          >
            <ClipboardDocumentListIcon class="h-7 w-7 text-gray-500 dark:text-gray-400" stroke-width="1.5" />
          </div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">No activity recorded yet</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Create or edit inventory items to see logs here.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200/80 dark:divide-gray-700/80">
            <thead class="bg-gray-50/90 dark:!bg-dashboard-card/85">
              <tr>
                <th
                  scope="col"
                  class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4"
                >
                  User
                </th>
                <th
                  scope="col"
                  class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4"
                >
                  Action
                </th>
                <th
                  scope="col"
                  class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4"
                >
                  Item
                </th>
                <th
                  scope="col"
                  class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4"
                >
                  Date
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200/80 bg-white/90 dark:divide-gray-700/80 dark:!bg-dashboard-card">
              <tr
                v-for="log in logs"
                :key="log.id"
                class="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/80"
              >
                <td class="whitespace-nowrap px-3 py-2.5 text-[11px] font-medium text-gray-900 dark:text-gray-100 sm:px-4">
                  {{ log.userDisplayName }}
                </td>
                <td class="whitespace-nowrap px-3 py-2.5 sm:px-4">
                  <span
                    :class="[
                      'inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize',
                      log.action === 'created'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : log.action === 'deleted'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
                    ]"
                  >
                    {{ log.action }}
                  </span>
                </td>
                <td
                  class="max-w-[200px] truncate px-3 py-2.5 text-[11px] text-gray-700 dark:text-gray-300 sm:px-4"
                  :title="log.entityName"
                >
                  {{ log.entityName }}
                </td>
                <td class="whitespace-nowrap px-3 py-2.5 text-[11px] text-gray-500 dark:text-gray-400 sm:px-4">
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

import { BuildingStorefrontIcon, ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'
import type { ActivityLog } from '~/composables/useActivityLog'
import { fetchActivityLogs } from '~/composables/useActivityLog'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'

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
const fetchError = ref<string | null>(null)

function formatDate(d: Date | unknown): string {
  if (!d) return '-'
  const date = d instanceof Date ? d : new Date(d as string | number)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

async function loadLogs() {
  if (!canAccess.value) return
  loading.value = true
  fetchError.value = null
  storeId.value = await getCurrentStoreId()
  if (!storeId.value) {
    loading.value = false
    return
  }
  try {
    logs.value = await fetchActivityLogs(200)
  } catch (e: any) {
    console.error('[Activity] Failed to fetch logs:', e)
    fetchError.value = e?.message || 'Permission or network error. Check the console for details.'
    logs.value = []
  } finally {
    loading.value = false
  }
}

const storesStore = useStoresStore()

watch(() => storesStore.currentStoreId, () => {
  loadLogs()
})

watch(canAccess, (ok) => {
  if (ok) loadLogs()
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible' && canAccess.value) loadLogs()
}

onMounted(() => {
  if (canAccess.value) loadLogs()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>
