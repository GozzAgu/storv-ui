<template>
  <div class="w-full max-w-none space-y-5 pb-6 sm:space-y-6 sm:pb-8">
    <DashboardPageHeader>
      <template #eyebrow>
        <p :class="eyebrowClass">Audit trail</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Activity Logs</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">
          A complete record of inventory changes by user, action, and time. Built for accountability and security reviews.
        </p>
      </template>
    </DashboardPageHeader>

    <div
      v-if="!canAccess"
      :class="dashboardCardPaddedClass"
    >
      <p
        class="text-sm font-medium leading-relaxed"
        :class="accessDeniedByRole ? 'text-red-800 dark:text-red-200' : 'text-amber-900 dark:text-amber-100'"
      >
        {{
          accessDeniedByRole
            ? 'Activity Logs are available to super admins and store managers only.'
            : 'Activity Logs are included on Storvv Medium and Enterprise. Upgrade your plan to enable auditing.'
        }}
      </p>
      <NuxtLink
        v-if="!accessDeniedByRole"
        to="/dashboard/settings"
        class="mt-3 inline-flex text-xs font-medium text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        View plans in Settings →
      </NuxtLink>
    </div>

    <template v-else>
      <div v-if="!storeId && !loading" :class="dashboardCardPaddedClass">
        <DashboardTableEmptyState
          :icon="BuildingStorefrontIcon"
          title="Select a store to view activity"
          description="Choose a branch from the store selector in the top bar."
          :tips="[
            'Logs are scoped to the active store',
            'Inventory create, update, and delete events appear here',
          ]"
          :fill="false"
        />
      </div>

      <template v-else>
        <!-- Summary metrics -->
        <div
          v-if="!loading && allLogs.length > 0"
          class="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <div
            v-for="stat in summaryStats"
            :key="stat.key"
            :class="dashboardCardPaddedClass"
            class="!py-3 sm:!py-3.5"
          >
            <p class="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {{ stat.label }}
            </p>
            <p
              class="mt-1 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl"
              :class="stat.valueClass"
            >
              {{ stat.value }}
            </p>
          </div>
        </div>

        <div class="activity-log-shell data-table-shell flex min-h-0 flex-1 flex-col overflow-hidden">
          <DataTableToolbar>
            <template #heading>
              <div class="min-w-0">
                <h2 class="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                  Event log
                </h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Inventory activity for this store
                  <template v-if="reachedFetchCap">
                    <span class="text-gray-300 dark:text-gray-600"> · </span>
                    <span class="text-[11px]">Showing newest {{ fetchLimit }}; use search to narrow</span>
                  </template>
                </p>
              </div>
            </template>
            <template #filters>
              <div class="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <nav
                  class="flex flex-wrap gap-1 rounded-lg bg-gray-100/80 p-0.5 dark:bg-white/[0.04]"
                  aria-label="Filter by action"
                >
                  <button
                    v-for="tab in actionTabs"
                    :key="tab.value"
                    type="button"
                    class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-150"
                    :class="
                      actionFilter === tab.value
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-gray-100'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                    "
                    @click="actionFilter = tab.value"
                  >
                    {{ tab.label }}
                  </button>
                </nav>
                <DashboardToolbarSearch
                  v-model="searchQuery"
                  placeholder="Search user, item, or ID…"
                  :wide="false"
                  input-class="sm:w-52"
                />
              </div>
            </template>
          </DataTableToolbar>

          <div v-if="loading" class="px-4 py-8 sm:px-6 sm:py-10">
            <div class="space-y-0 divide-y divide-gray-100/90 dark:divide-gray-800/80">
              <div v-for="i in 8" :key="i" class="flex items-center gap-4 py-3.5">
                <div class="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200/90 dark:bg-white/10" />
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-3 w-28 animate-pulse rounded-md bg-gray-200/90 dark:bg-white/10" />
                  <div class="h-3 max-w-md animate-pulse rounded-md bg-gray-100 dark:bg-white/[0.06]" />
                </div>
                <div class="hidden h-3 w-16 animate-pulse rounded-md bg-gray-100 dark:bg-white/[0.06] sm:block" />
              </div>
            </div>
          </div>

          <div v-else-if="fetchError" class="px-4 py-12 text-center sm:px-6">
            <p class="text-sm font-medium text-red-600 dark:text-red-400">Could not load activity logs</p>
            <p class="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {{ fetchError }}
            </p>
            <button
              type="button"
              class="mt-4 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/15"
              @click="loadLogs()"
            >
              Try again
            </button>
          </div>

          <DashboardTableEmptyState
            v-else-if="allLogs.length === 0"
            :icon="ClipboardDocumentListIcon"
            title="No activity yet"
            description="Changes to inventory folders and items will appear here automatically."
            :tips="[
              'Each entry records who performed the action',
              'Create, update, and delete events are retained for auditing',
            ]"
          />

          <DashboardTableEmptyState
            v-else-if="filteredLogs.length === 0"
            :icon="MagnifyingGlassIcon"
            title="No matching events"
            description="Adjust your search or filter to see more results."
            :tips="[
              'Search matches names, item titles, and record IDs',
              'Use the action filter to focus on creates, updates, or deletes',
            ]"
          >
            <button
              type="button"
              class="text-xs font-medium text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              @click="resetFilters()"
            >
              Clear filters
            </button>
          </DashboardTableEmptyState>

          <div v-else class="flex flex-col">
            <div class="overflow-x-auto">
              <table class="dashboard-table min-w-full">
                <thead>
                  <tr>
                    <th scope="col" class="w-[min(14rem,28%)]">User</th>
                    <th scope="col" class="dashboard-table__col-status">Action</th>
                    <th scope="col">Details</th>
                    <th scope="col" class="whitespace-nowrap text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in paginatedLogs" :key="log.id">
                    <td>
                      <div class="flex min-w-0 items-center gap-3">
                        <span
                          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-tight"
                          :class="avatarToneClass(log.userDisplayName)"
                          :title="log.userDisplayName"
                        >
                          {{ getInitials(log.userDisplayName) }}
                        </span>
                        <span class="dashboard-table__primary min-w-0 truncate text-sm">
                          {{ log.userDisplayName }}
                        </span>
                      </div>
                    </td>
                    <td class="dashboard-table__col-status">
                      <span :class="activityActionBadgeClass(log.action)">
                        <span
                          class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                          :class="actionDotClass(log.action)"
                          aria-hidden="true"
                        />
                        {{ activityActionLabel(log.action) }}
                      </span>
                    </td>
                    <td class="max-w-[min(24rem,42vw)]">
                      <p
                        class="dashboard-table__primary truncate"
                        :title="displayEntityName(log)"
                      >
                        {{ displayEntityName(log) }}
                      </p>
                      <div class="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span
                          class="inline-flex items-center gap-1 rounded-md bg-gray-100/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-white/[0.05] dark:text-gray-400"
                        >
                          <component
                            :is="entityTypeIcon(log.entityType)"
                            class="h-3 w-3 shrink-0 opacity-70"
                            aria-hidden="true"
                          />
                          {{ activityEntityTypeLabel(log.entityType) }}
                        </span>
                        <span
                          v-if="logDetailSubtitle(log)"
                          class="dashboard-table__muted min-w-0 truncate text-[10px] leading-snug"
                          :title="logDetailSubtitle(log) || undefined"
                        >
                          {{ logDetailSubtitle(log) }}
                        </span>
                      </div>
                    </td>
                    <td class="whitespace-nowrap text-right">
                      <p class="dashboard-table__primary text-xs tabular-nums">
                        {{ relativeTime(log.createdAt) }}
                      </p>
                      <p class="dashboard-table__muted mt-0.5 text-[10px] tabular-nums">
                        {{ formatDate(log.createdAt) }}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <DashboardTablePagination
              :current-page="currentPage"
              :items-per-page="itemsPerPage"
              :total="filteredLogs.length"
              @page-change="handlePageChange"
            />
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import {
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
} from '@heroicons/vue/24/outline'
import type { ActivityAction, ActivityEntityType, ActivityLog } from '~/composables/useActivityLog'
import {
  ACTIVITY_LOGS_FETCH_LIMIT,
  activityActionBadgeClass,
  activityActionLabel,
  activityEntityTypeLabel,
  activityLogDetailSubtitle,
  fetchActivityLogs,
  normalizeActivityLogText,
} from '~/composables/useActivityLog'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'

const {
  eyebrowClass,
  pageTitleClass,
  descriptionClass,
  dashboardCardPaddedClass,
} = useDashboardPageChrome()

const userStore = useUserStore()
const staffStore = useStaffStore()
const inventoryStore = useInventoryStore()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

const isManager = computed(
  () => userStore.userData?.role === 'staff' && staffStore.getCurrentStaffMember?.role === 'manager',
)
const hasPlanAccess = computed(() => canUseSubscriptionFeature('activity_logs'))
const canAccess = computed(() => (userStore.isSuperAdmin || isManager.value) && hasPlanAccess.value)
const accessDeniedByRole = computed(() => !userStore.isSuperAdmin && !isManager.value)

const storeId = ref<string | null>(null)
const allLogs = ref<ActivityLog[]>([])
const searchQuery = ref('')
const actionFilter = ref<'all' | ActivityAction>('all')
const currentPage = ref(1)
const itemsPerPage = 25
const fetchLimit = ACTIVITY_LOGS_FETCH_LIMIT
const loading = ref(true)
const fetchError = ref<string | null>(null)

const actionTabs: Array<{ value: 'all' | ActivityAction; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
]

const AVATAR_TONES = [
  'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
  'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200',
] as const

const reachedFetchCap = computed(() => allLogs.value.length >= fetchLimit)

const filteredLogs = computed(() => {
  let list = allLogs.value
  if (actionFilter.value !== 'all') {
    list = list.filter((log) => log.action === actionFilter.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((log) => {
    const dateStr = formatDate(log.createdAt).toLowerCase()
    const haystack = [
      log.userDisplayName,
      log.entityName,
      log.entityId,
      log.action,
      activityActionLabel(log.action),
      activityEntityTypeLabel(log.entityType),
      dateStr,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const paginatedLogs = computed(() => {
  const list = filteredLogs.value
  const start = (currentPage.value - 1) * itemsPerPage
  return list.slice(start, start + itemsPerPage)
})

const createdCount = computed(() => filteredLogs.value.filter((log) => log.action === 'created').length)
const updatedCount = computed(() => filteredLogs.value.filter((log) => log.action === 'updated').length)
const deletedCount = computed(() => filteredLogs.value.filter((log) => log.action === 'deleted').length)

const summaryStats = computed(() => [
  {
    key: 'total',
    label: 'Events',
    value: filteredLogs.value.length,
    valueClass: 'text-gray-900 dark:text-gray-50',
  },
  {
    key: 'created',
    label: 'Created',
    value: createdCount.value,
    valueClass: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'updated',
    label: 'Updated',
    value: updatedCount.value,
    valueClass: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'deleted',
    label: 'Deleted',
    value: deletedCount.value,
    valueClass: 'text-rose-700 dark:text-rose-300',
  },
])

function handlePageChange(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetFilters() {
  searchQuery.value = ''
  actionFilter.value = 'all'
}

watch([searchQuery, actionFilter], () => {
  currentPage.value = 1
})

watch(allLogs, () => {
  currentPage.value = 1
})

function folderNameForLog(log: ActivityLog): string | null {
  if (log.entityType !== 'items_batch' && log.entityType !== 'folder') return null
  const folder = inventoryStore.folders.find((f) => f.id === log.entityId)
  return folder?.name?.trim() || null
}

function logDetailSubtitle(log: ActivityLog): string | null {
  return activityLogDetailSubtitle(log, { folderName: folderNameForLog(log) })
}

function displayEntityName(log: ActivityLog): string {
  const name = normalizeActivityLogText(log.entityName).trim()
  if (log.entityType === 'items_batch' && name && name !== '-') {
    return name
  }
  if (log.entityType === 'item' && name && name !== '-') {
    return name
  }
  if (log.entityType === 'folder' && name && name !== '-') {
    return name
  }
  if (name && name !== '-') return name
  return `${activityActionLabel(log.action)} ${activityEntityTypeLabel(log.entityType).toLowerCase()}`
}

function entityTypeIcon(type: ActivityEntityType) {
  if (type === 'folder') return FolderIcon
  if (type === 'items_batch') return Squares2X2Icon
  return CubeIcon
}

function avatarToneClass(name: string): string {
  const value = String(name || 'U')
  const idx =
    value.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_TONES.length
  return AVATAR_TONES[idx]!
}

function actionDotClass(action: ActivityAction): string {
  if (action === 'created') return 'bg-emerald-500 dark:bg-emerald-400'
  if (action === 'deleted') return 'bg-rose-500 dark:bg-rose-400'
  return 'bg-blue-500 dark:bg-blue-400'
}

function formatDate(d: Date | unknown): string {
  if (!d) return '-'
  const date = d instanceof Date ? d : new Date(d as string | number)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function relativeTime(d: Date | unknown): string {
  if (!d) return '-'
  const date = d instanceof Date ? d : new Date(d as string | number)
  if (Number.isNaN(date.getTime())) return '-'
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(d)
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
    if (inventoryStore.folders.length === 0) {
      await inventoryStore.fetchFolders().catch(() => {})
    }
    allLogs.value = await fetchActivityLogs(fetchLimit)
  } catch (e: any) {
    console.error('[Activity] Failed to fetch logs:', e)
    fetchError.value = e?.message || 'Permission or network error. Check the console for details.'
    allLogs.value = []
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
