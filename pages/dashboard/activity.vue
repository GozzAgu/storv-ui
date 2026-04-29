<template>
  <div class="w-full max-w-none space-y-5 pb-6 sm:space-y-6 sm:pb-8">
    <!-- Hero -->
    <header
      class="relative rounded-sm bg-white/90 px-4 py-4 dark:!bg-dashboard-card sm:px-5 sm:py-5"
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
      class="rounded-sm px-4 py-4 sm:px-5 sm:py-5"
      :class="accessDeniedByRole ? 'bg-red-50/90 dark:bg-red-950/25' : 'bg-amber-50/90 dark:bg-amber-950/25'"
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
        class="rounded-sm bg-white/90 px-6 py-12 text-center dark:!bg-dashboard-card sm:px-10"
      >
        <div
          class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-sm bg-gray-100 dark:bg-gray-800/80"
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
              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <span class="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {{ logs.length }} events
                </span>
                <span class="inline-flex items-center rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {{ createdCount }} created
                </span>
                <span class="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {{ updatedCount }} updated
                </span>
                <span class="inline-flex items-center rounded-sm bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                  {{ deletedCount }} deleted
                </span>
              </div>
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
            class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-sm bg-gray-100 dark:bg-gray-800/80"
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
                  Activity
                </th>
                <th
                  scope="col"
                  class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4"
                >
                  Target
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
                class="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/70"
              >
                <td class="px-3 py-2.5 sm:px-4">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {{ getInitials(log.userDisplayName) }}
                    </span>
                    <div class="min-w-0">
                      <p class="truncate text-[11px] font-medium text-gray-900 dark:text-gray-100">
                        {{ log.userDisplayName }}
                      </p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">
                        {{ relativeTime(log.createdAt) }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2.5 sm:px-4">
                  <span
                    :class="[ 'inline-flex rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide', actionClass(log.action) ]"
                  >
                    {{ actionLabel(log.action) }}
                  </span>
                </td>
                <td class="max-w-[260px] px-3 py-2.5 sm:px-4">
                  <p class="truncate text-[11px] font-medium text-gray-800 dark:text-gray-200" :title="log.entityName">
                    {{ log.entityName }}
                  </p>
                  <p class="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">
                    {{ entityTypeLabel(log.entityType) }} · ID {{ log.entityId || '-' }}
                  </p>
                </td>
                <td class="whitespace-nowrap px-3 py-2.5 sm:px-4">
                  <p class="text-[11px] text-gray-700 dark:text-gray-300">
                    {{ formatDate(log.createdAt) }}
                  </p>
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
const createdCount = computed(() => logs.value.filter(log => log.action === 'created').length)
const updatedCount = computed(() => logs.value.filter(log => log.action === 'updated').length)
const deletedCount = computed(() => logs.value.filter(log => log.action === 'deleted').length)

function formatDate(d: Date | unknown): string {
  if (!d) return '-'
  const date = d instanceof Date ? d : new Date(d as string | number)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function relativeTime(d: Date | unknown): string {
  if (!d) return '-'
  const date = d instanceof Date ? d : new Date(d as string | number)
  if (Number.isNaN(date.getTime())) return '-'
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function actionLabel(action: ActivityLog['action']): string {
  if (action === 'created') return 'Created'
  if (action === 'deleted') return 'Deleted'
  return 'Updated'
}

function actionClass(action: ActivityLog['action']): string {
  if (action === 'created') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
  }
  if (action === 'deleted') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
  }
  return 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300'
}

function entityTypeLabel(type: ActivityLog['entityType']): string {
  if (type === 'items_batch') return 'Batch items'
  if (type === 'folder') return 'Folder'
  return 'Item'
}

function getInitials(name: string): string {
  const value = String(name || '').trim()
  if (!value) return 'U'
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  return `${parts[0]![0] || ''}${parts[parts.length - 1]![0] || ''}`.toUpperCase()
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
