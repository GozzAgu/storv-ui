<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Activity">
      <template #description>
        Who added, changed or deleted inventory and leads in this branch, and when.
      </template>
    </SPageHeader>

    <SCard v-if="accessDeniedByRole">
      <SEmptyState
        title="Managers only"
        description="Activity is available to the account owner and store managers."
      >
        <template #icon><Lock :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
      </SEmptyState>
    </SCard>

    <PlanGate
      v-else-if="!canAccess"
      feature="activity_logs"
      description="See who changed what in your inventory, with a full history for every branch."
    />

    <SCard v-else-if="!storeId && !loading">
      <SEmptyState
        title="Choose a branch"
        description="Activity is kept per branch. Pick one from the branch switcher to see its history."
      >
        <template #icon><Store :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="loading" flush aria-busy="true">
      <ul class="s-list" aria-label="Loading activity">
        <li v-for="i in 8" :key="i" class="s-list__item" aria-hidden="true">
          <SSkeleton circle width="32px" height="32px" />
          <div class="s-list__main">
            <SSkeleton width="40%" height="14px" />
            <SSkeleton width="25%" height="12px" />
          </div>
          <SSkeleton width="64px" height="14px" />
        </li>
      </ul>
    </SCard>

    <SCard v-else-if="fetchError">
      <SEmptyState title="Couldn't load activity" :description="fetchError">
        <template #icon><TriangleAlert :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
        <template #actions>
          <SButton @click="loadLogs(true)">Try again</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="allLogs.length === 0">
      <SEmptyState
        title="No activity yet"
        description="When someone adds, edits or deletes inventory or leads, it shows up here."
      >
        <template #icon><History :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <STabs v-model="actionFilter" :tabs="webActionTabs" label="Filter by action" />

      <div class="s-toolbar">
        <SSearch
          v-model="searchQuery"
          class="s-toolbar__search"
          placeholder="Search activity"
          label="Search activity by person, item or record ID"
        />
      </div>

      <p v-if="reachedFetchCap" class="s-notice">
        Showing the newest {{ fetchLimit }} events. Search to find older ones.
      </p>

      <SCard v-if="filteredLogs.length === 0">
        <SEmptyState title="No matching activity" description="Try another tab, or clear the search.">
          <template #icon><SearchX :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
          <template #actions>
            <SButton @click="resetFilters()">Show all activity</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <!-- Phone -->
        <SCard flush class="s-only-sm">
          <ul class="s-list">
            <li v-for="log in paginatedLogs" :key="log.id" class="s-list__item">
              <SAvatar :name="log.userDisplayName" size="sm" />
              <div class="s-list__main">
                <span class="s-list__primary">{{ displayEntityName(log) }}</span>
                <span class="s-list__secondary">
                  {{ log.userDisplayName }} · {{ relativeTime(log.createdAt) }}
                </span>
              </div>
              <div class="s-list__end">
                <SBadge :tone="activityActionTone(log.action)" size="sm">
                  {{ activityActionLabel(log.action) }}
                </SBadge>
              </div>
            </li>
          </ul>
        </SCard>

        <!-- Tablet and desktop -->
        <div class="s-table-wrap s-hide-sm">
          <table class="s-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Action</th>
                <th scope="col">What changed</th>
                <th scope="col">When</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in paginatedLogs" :key="log.id">
                <td>
                  <span class="s-table__inline">
                    <SAvatar :name="log.userDisplayName" size="sm" />
                    <span class="s-table__primary">{{ log.userDisplayName }}</span>
                  </span>
                </td>
                <td>
                  <SBadge :tone="activityActionTone(log.action)" size="sm" dot>
                    {{ activityActionLabel(log.action) }}
                  </SBadge>
                </td>
                <td>
                  <span class="s-table__primary">{{ displayEntityName(log) }}</span>
                  <span class="s-table__secondary s-activity__meta">
                    <component
                      :is="entityTypeIcon(log.entityType)"
                      :size="14"
                      :stroke-width="2"
                      aria-hidden="true"
                    />
                    {{ activityEntityTypeLabel(log.entityType) }}
                    <template v-if="logDetailSubtitle(log)"> · {{ logDetailSubtitle(log) }}</template>
                  </span>
                </td>
                <td class="s-table__nowrap">
                  <span class="s-table__primary">{{ relativeTime(log.createdAt) }}</span>
                  <span
                    v-if="relativeTime(log.createdAt) !== formatDate(log.createdAt)"
                    class="s-table__secondary"
                  >
                    {{ formatDate(log.createdAt) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <SPagination
          :current-page="currentPage"
          :page-size="itemsPerPage"
          :total="filteredLogs.length"
          label="Activity pagination"
          @page-change="handlePageChange"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import {
  Box,
  FolderClosed,
  History,
  Inbox,
  LayoutGrid,
  Lock,
  SearchX,
  Store,
  TriangleAlert,
} from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import PlanGate from '~/components/subscription/PlanGate.vue'
import type { ActivityAction, ActivityEntityType, ActivityLog } from '~/composables/useActivityLog'
import {
  ACTIVITY_LOGS_FETCH_LIMIT,
  activityActionLabel,
  activityEntityTypeLabel,
  activityLogDetailSubtitle,
  fetchActivityLogs,
  normalizeActivityLogText,
} from '~/composables/useActivityLog'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { useDashboardPageRefreshRegister } from '~/composables/useDashboardPageRefresh'
import { isCapacitorNative } from '~/utils/capacitor-env'
const userStore = useUserStore()
const inventoryStore = useInventoryStore()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

const { hasAnyManageAccess } = usePermissions()
const hasPlanAccess = computed(() => canUseSubscriptionFeature('activity_logs'))
const canAccess = computed(
  () => (userStore.isSuperAdmin || hasAnyManageAccess.value) && hasPlanAccess.value
)
const accessDeniedByRole = computed(() => !userStore.isSuperAdmin && !hasAnyManageAccess.value)

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

const webActionTabs = computed(() =>
  actionTabs.map((tab) => ({
    value: tab.value,
    label: tab.label,
    count:
      tab.value === 'all'
        ? allLogs.value.length
        : allLogs.value.filter((log) => log.action === tab.value).length,
  }))
)

function activityActionTone(action: ActivityAction): 'success' | 'info' | 'error' {
  if (action === 'created') return 'success'
  if (action === 'deleted') return 'error'
  return 'info'
}

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
  return `${activityActionLabel(log.action)} ${activityEntityTypeLabel(
    log.entityType
  ).toLowerCase()}`
}

function entityTypeIcon(type: ActivityEntityType) {
  if (type === 'folder') return FolderClosed
  if (type === 'items_batch') return LayoutGrid
  if (type === 'lead') return Inbox
  return Box
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

let cachedActivityLogs: { storeId: string; logs: ActivityLog[]; fetchedAt: number } | null = null

async function loadLogs(force = false) {
  if (!canAccess.value) return
  storeId.value = await getCurrentStoreId()
  if (!storeId.value) {
    loading.value = false
    return
  }

  if (!force && cachedActivityLogs && cachedActivityLogs.storeId === storeId.value) {
    allLogs.value = cachedActivityLogs.logs
    loading.value = false
    if (isCapacitorNative() || Date.now() - cachedActivityLogs.fetchedAt < 60_000) {
      return
    }
  }

  if (allLogs.value.length === 0) {
    loading.value = true
  }
  fetchError.value = null
  try {
    if (inventoryStore.folders.length === 0) {
      await inventoryStore.fetchFolders().catch(() => {})
    }
    const freshLogs = await fetchActivityLogs(fetchLimit)
    allLogs.value = freshLogs
    if (storeId.value) {
      cachedActivityLogs = { storeId: storeId.value, logs: freshLogs, fetchedAt: Date.now() }
    }
  } catch (e: any) {
    console.error('[Activity] Failed to fetch logs:', e)
    if (allLogs.value.length === 0) {
      fetchError.value = e?.message || 'Permission or network error. Check the console for details.'
      allLogs.value = []
    }
  } finally {
    loading.value = false
  }
}

useDashboardPageRefreshRegister(async () => {
  await loadLogs(true)
})

const storesStore = useStoresStore()

watch(
  () => storesStore.currentStoreId,
  () => {
    cachedActivityLogs = null
    allLogs.value = []
    loadLogs(true)
  }
)

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
