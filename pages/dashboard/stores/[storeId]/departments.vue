<template>
  <div class="ds-root s-c s-page s-team">
    <SPageHeader title="Team">
      <template #eyebrow>
        <span class="s-page-header__eyebrow s-team__branch">
          {{ store?.name || 'Branch' }}
          <SBadge v-if="store && currentStore?.id === store.id" tone="success" size="sm">Current branch</SBadge>
        </span>
      </template>
      <template #description>
        Departments group your staff and decide which inventory they can see. Open one to manage its people and roles.
      </template>
      <template v-if="canManageDepartments" #actions>
        <SButton
          variant="primary"
          :disabled="!canAddDepartmentForStore"
          :title="canAddDepartmentForStore ? undefined : departmentLimitMessage"
          @click="openCreateDepartmentModal"
        >
          <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
          New department
        </SButton>
      </template>
    </SPageHeader>

    <p v-if="canManageDepartments && !canAddDepartmentForStore && departmentLimitMessage" class="s-notice">
      {{ departmentLimitMessage }}
    </p>

    <SCard v-if="departmentsStore.error && !departmentsStore.loading">
      <SEmptyState title="Couldn't load departments" :description="departmentsStore.error">
        <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton @click="handleRetryFetch">
            <template #leading><RotateCw :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
            Try again
          </SButton>
        </template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="departmentsStore.loading || storesLoading" flush aria-busy="true">
      <ul class="s-list" aria-label="Loading departments">
        <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
          <SSkeleton width="32px" height="32px" />
          <div class="s-list__main">
            <SSkeleton width="35%" height="14px" />
            <SSkeleton width="20%" height="12px" />
          </div>
          <SSkeleton width="56px" height="14px" />
        </li>
      </ul>
    </SCard>

    <SCard v-else-if="storeDepartments.length === 0">
      <SEmptyState
        title="No departments yet"
        description="Create a department such as Sales or Warehouse, then add staff to it. Each department can have its own roster and inventory access."
      >
        <template #icon><Building2 :size="24" :stroke-width="1.75" /></template>
        <template v-if="canManageDepartments" #actions>
          <SButton variant="primary" :disabled="!canAddDepartmentForStore" @click="openCreateDepartmentModal">
            <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
            New department
          </SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <dl class="s-metrics">
        <div v-for="metric in teamMetrics" :key="metric.key" class="s-metrics__item">
          <dt class="s-metrics__label">{{ metric.label }}</dt>
          <dd class="s-metrics__value" :class="metric.tone && `s-metrics__value--${metric.tone}`">
            {{ metric.value }}
          </dd>
        </div>
      </dl>

      <STabs
        v-if="inactiveDepartmentsCount > 0"
        v-model="departmentFilter"
        :tabs="departmentFilterTabs"
        label="Department status"
      />

      <div
        v-if="canManageDepartments && selectedDepartmentsForBulk.length > 0"
        class="s-toolbar s-toolbar--selection"
        role="region"
        aria-label="Bulk actions"
      >
        <SCheckbox
          :model-value="allDepartmentsOnPageSelected"
          :label="`${selectedDepartmentsForBulk.length} selected`"
          @update:model-value="setSelectAllDepartmentsBulk"
        />
        <div class="s-toolbar__end">
          <SButton variant="ghost" size="sm" @click="selectedDepartmentsForBulk = []">Clear</SButton>
          <SButton variant="danger" size="sm" @click="openBulkDeleteDepartmentsModal">
            <template #leading><Trash2 :size="14" :stroke-width="2" aria-hidden="true" /></template>
            Delete
          </SButton>
        </div>
      </div>
      <div v-else class="s-toolbar">
        <SSearch
          v-model="searchQuery"
          class="s-toolbar__search"
          placeholder="Search departments"
          label="Search departments by name, type or manager"
        />
      </div>

      <SCard v-if="paginatedDepartments.length === 0">
        <SEmptyState
          :title="searchQuery ? 'No departments found' : `No ${departmentFilter} departments`"
          :description="searchQuery ? 'Try a different name, type or manager.' : 'Try another status.'"
        >
          <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton @click="resetFilters">Show all departments</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <!-- Phone -->
        <SCard flush class="s-only-sm">
          <ul class="s-list">
            <li v-for="department in paginatedDepartments" :key="department.id">
              <div class="s-list__item">
                <SCheckbox
                  v-if="canManageDepartments"
                  :model-value="isDepartmentSelected(department)"
                  :aria-label="`Select ${department.name}`"
                  @update:model-value="(checked) => toggleDepartmentSelection(department, checked)"
                />
                <button type="button" class="s-list__main s-list__hit" @click="navigateToDepartment(department.id)">
                  <span class="s-list__primary">{{ department.name }}</span>
                  <span class="s-list__secondary">{{ departmentSummary(department) }}</span>
                </button>
                <span class="s-list__end">
                  <span class="s-list__value">{{ staffLabel(department) }}</span>
                  <SBadge v-if="department.isActive === false" tone="warning" size="sm">Inactive</SBadge>
                </span>
                <SIconButton
                  v-if="canManageDepartments"
                  label="Department actions"
                  size="sm"
                  :data-department-actions-anchor="department.id"
                  aria-haspopup="menu"
                  :aria-expanded="openDepartmentMenuId === department.id"
                  @click="toggleDepartmentMenu(department.id)"
                >
                  <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                </SIconButton>
              </div>
            </li>
          </ul>
        </SCard>

        <!-- Tablet and desktop -->
        <div class="s-table-wrap s-hide-sm">
          <table class="s-table">
            <thead>
              <tr>
                <th v-if="canManageDepartments" scope="col" class="s-table__check">
                  <SCheckbox
                    :model-value="allDepartmentsOnPageSelected"
                    aria-label="Select all departments"
                    @update:model-value="setSelectAllDepartmentsBulk"
                  />
                </th>
                <th scope="col">Department</th>
                <th scope="col" class="s-hide-md">Type</th>
                <th scope="col" class="s-table__num">Staff</th>
                <th scope="col" class="s-hide-md">Manager</th>
                <th scope="col">Status</th>
                <th scope="col" class="s-hide-lg">Updated</th>
                <th v-if="canManageDepartments" scope="col" class="s-table__actions">
                  <span class="ds-sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="department in paginatedDepartments"
                :key="department.id"
                class="s-table__row--interactive"
                :class="{ 's-table__row--selected': isDepartmentSelected(department) }"
                tabindex="0"
                @click="navigateToDepartment(department.id)"
                @keydown.enter.self="navigateToDepartment(department.id)"
              >
                <td v-if="canManageDepartments" class="s-table__check" @click.stop>
                  <SCheckbox
                    :model-value="isDepartmentSelected(department)"
                    :aria-label="`Select ${department.name}`"
                    @update:model-value="(checked) => toggleDepartmentSelection(department, checked)"
                  />
                </td>
                <td>
                  <div class="s-team__cell">
                    <span class="s-team__mark" aria-hidden="true">
                      <Building2 :size="16" :stroke-width="1.75" />
                    </span>
                    <span class="s-team__cell-text">
                      <span class="s-table__primary">{{ department.name }}</span>
                      <span v-if="department.description?.trim()" class="s-table__secondary">
                        {{ department.description }}
                      </span>
                    </span>
                  </div>
                </td>
                <td class="s-hide-md">{{ formatDepartmentTypeLabel(department.departmentType) }}</td>
                <td class="s-table__num">{{ department.staffCount || 0 }}</td>
                <td class="s-hide-md">
                  <span v-if="department.manager?.trim()">{{ department.manager }}</span>
                  <span v-else class="s-table__muted">Not assigned</span>
                </td>
                <td>
                  <SBadge :tone="department.isActive === false ? 'warning' : 'success'" dot>
                    {{ department.isActive === false ? 'Inactive' : 'Active' }}
                  </SBadge>
                </td>
                <td class="s-hide-lg s-table__muted">
                  {{ formatCategoryDate(department.updatedAt) ?? formatCategoryDate(department.createdAt) ?? EMPTY_CELL }}
                </td>
                <td v-if="canManageDepartments" class="s-table__actions" @click.stop>
                  <SIconButton
                    label="Department actions"
                    size="sm"
                    :data-department-actions-anchor="department.id"
                    aria-haspopup="menu"
                    :aria-expanded="openDepartmentMenuId === department.id"
                    @click="toggleDepartmentMenu(department.id)"
                  >
                    <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                  </SIconButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <SPagination
          :current-page="currentPage"
          :page-size="itemsPerPage"
          :total="filteredDepartments.length"
          label="Departments pagination"
          @page-change="handlePageChange"
        />
      </template>
    </template>

    <SMenu
      :open="Boolean(openDepartmentMenuId && departmentForOpenMenu && departmentMenuFixedStyle)"
      :style="departmentMenuFixedStyle"
      menu-id="store-department"
      label="Department actions"
      @close="closeDepartmentMenu"
    >
      <SMenuItem label="Open" :icon="ArrowRight" @select="runDepartmentMenuAction((d) => navigateToDepartment(d.id))" />
      <SMenuItem label="Edit" :icon="Pencil" @select="runDepartmentMenuAction(handleEditDepartment)" />
      <SMenuItem label="Delete" :icon="Trash2" danger @select="runDepartmentMenuAction(askDeleteDepartment)" />
    </SMenu>

    <SDialog
      v-model:open="showDeleteDepartmentDialog"
      role="alertdialog"
      size="sm"
      :title="`Delete ${departmentPendingDelete?.name ?? 'department'}?`"
      description="This permanently deletes the department and its staff associations. This can't be undone."
      :dismissible="!deletingDepartmentId"
    >
      <template #footer>
        <SButton :disabled="Boolean(deletingDepartmentId)" @click="showDeleteDepartmentDialog = false">Cancel</SButton>
        <SButton variant="danger" :loading="Boolean(deletingDepartmentId)" @click="confirmDeleteDepartment">
          Delete department
        </SButton>
      </template>
    </SDialog>

    <!-- Bulk Delete Departments Modal -->
    <BulkDeleteConfirmModal
      v-model="showBulkDeleteDepartmentsModal"
      v-model:confirmed="bulkDeleteDepartmentsConfirmed"
      title="Delete selected departments"
      entity-label="department"
      :count="selectedDepartmentsForBulk.length"
      :item-names="selectedDepartmentsForBulk.map((d) => d.name)"
      warning="This permanently deletes the selected departments and their staff associations. This cannot be undone."
      confirm-label="I understand these departments will be permanently deleted."
      :loading="isBulkDeletingDepartments"
      @update:model-value="(v) => { if (!v) bulkDeleteDepartmentsConfirmed = false }"
      @confirm="handleConfirmBulkDeleteDepartments"
    />

    <DepartmentModal
      v-model="showDepartmentModal"
      :department="editingDepartment"
      :storeId="storeId"
      @success="handleDepartmentSuccess"
      @error="handleDepartmentError"
    />
  </div>
</template>

<script setup lang="ts">
import BulkDeleteConfirmModal from '~/components/dashboard/BulkDeleteConfirmModal.vue'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ArrowRight,
  Building2,
  EllipsisVertical,
  Pencil,
  Plus,
  RotateCw,
  SearchX,
  Trash2,
  TriangleAlert,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import DepartmentModal from '~/components/departments/DepartmentModal.vue'
import type { Department } from '~/composables/useDepartments'
import {
  getEligibleStoresForPlan,
  resolveEffectiveSubscriptionPlan,
  summarizeSubscriptionAddOns,
} from '~/types/subscription'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  ssr: false,
})

const route = useRoute()
const storeId = computed(() => route.params.storeId as string)

useHead({
  title: `Departments - Storvv`,
})

const EMPTY_CELL = '—'

const showDepartmentModal = ref(false)
const editingDepartment = ref<Department | null>(null)

// Bulk delete departments
const selectedDepartmentsForBulk = ref<Department[]>([])
const showBulkDeleteDepartmentsModal = ref(false)
const bulkDeleteDepartmentsConfirmed = ref(false)
const isBulkDeletingDepartments = ref(false)

// Single department delete: which card is currently deleting
const deletingDepartmentId = ref<string | null>(null)

const searchQuery = ref('')
const departmentFilter = ref<'all' | 'active' | 'inactive'>('all')

// Load pagination state from localStorage
const getInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem(`stores-${storeId.value}-departments-page`)
      return saved ? parseInt(saved, 10) : 1
    } catch (e) {
      return 1
    }
  }
  return 1
}
const currentPage = ref(getInitialPage())
const itemsPerPage = ref(100)

// Import stores directly - Pinia handles SSR automatically
import { useDepartmentsStore } from '~/stores/departments'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import { useStoresStore } from '~/stores/stores'
import { useAppToast } from '~/composables/useAppToast'
import {
  getVisibleMenuAnchorElement,
  computeFixedAnchoredMenuStyle,
  isInsideAnchoredMenu,
} from '~/utils/menuAnchor'
import { formatCategoryDate } from '~/utils/inventory-category-format'
import { formatDepartmentTypeLabel } from '~/utils/department-format'

// Get store instances - only accessible on client
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const storesStore = useStoresStore()
const toast = useAppToast()

const isStaff = computed(() => userStore.userData?.role === 'staff')
const canManageDepartments = computed(() => !isStaff.value) // Only non-staff can manage

const storesLoading = computed(() => storesStore.loading)
const store = computed(() => storesStore.getStoreById(storeId.value))
const currentStore = computed(() => storesStore.currentStore)

const { canAddDepartment, limits: subscriptionLimits } = useSubscriptionFeatures()
const canAddDepartmentForStore = computed(() => canAddDepartment(storeDepartments.value.length))
const departmentLimitMessage = computed(() => {
  const max = subscriptionLimits.value.maxDepartmentsPerStore
  if (max < 0) return ''
  return max === 1
    ? 'Storvv Micro allows 1 department. Upgrade to add more.'
    : `Your plan allows up to ${max} departments per store. Upgrade for more.`
})

// Filter departments by storeId
const storeDepartments = computed(() => {
  return departmentsStore.departments.filter((dept) => dept.storeId === storeId.value)
})

const totalStaffForStore = computed(() => {
  return storeDepartments.value.reduce((sum, dept) => sum + (dept.staffCount || 0), 0)
})

const activeDepartmentsCount = computed(
  () => storeDepartments.value.filter((dept) => dept.isActive !== false).length
)

const inactiveDepartmentsCount = computed(
  () => storeDepartments.value.filter((dept) => dept.isActive === false).length
)

const teamMetrics = computed(() => [
  { key: 'departments', label: 'Departments', value: String(storeDepartments.value.length) },
  { key: 'staff', label: 'Staff', value: String(totalStaffForStore.value) },
  {
    key: 'inactive',
    label: 'Inactive',
    value: String(inactiveDepartmentsCount.value),
    tone: inactiveDepartmentsCount.value > 0 ? ('warning' as const) : undefined,
  },
])

const departmentFilterTabs = computed(() => [
  { value: 'all', label: 'All', count: storeDepartments.value.length },
  { value: 'active', label: 'Active', count: activeDepartmentsCount.value },
  { value: 'inactive', label: 'Inactive', count: inactiveDepartmentsCount.value },
])

function departmentSummary(department: Department): string {
  const parts = [formatDepartmentTypeLabel(department.departmentType)]
  const manager = department.manager?.trim()
  if (manager) parts.push(manager)
  return parts.join(' · ')
}

function staffLabel(department: Department): string {
  const count = department.staffCount || 0
  return `${count} staff`
}

const filteredDepartments = computed(() => {
  let list = storeDepartments.value

  if (departmentFilter.value === 'active') {
    list = list.filter((dept) => dept.isActive !== false)
  } else if (departmentFilter.value === 'inactive') {
    list = list.filter((dept) => dept.isActive === false)
  }

  if (!searchQuery.value) return list

  const query = searchQuery.value.toLowerCase()
  return list.filter(
    (dept: Department) =>
      dept.name.toLowerCase().includes(query) ||
      (dept.departmentType && dept.departmentType.toLowerCase().includes(query)) ||
      (dept.manager && dept.manager.toLowerCase().includes(query))
  )
})

const paginatedDepartments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredDepartments.value.slice(start, end)
})

function isDepartmentSelected(department: Department): boolean {
  return selectedDepartmentsForBulk.value.some((d) => d.id === department.id)
}

watch(departmentFilter, () => {
  currentPage.value = 1
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const resetFilters = () => {
  searchQuery.value = ''
  departmentFilter.value = 'all'
  currentPage.value = 1
  // Clear pagination from localStorage when filters are reset
  if (import.meta.client) {
    try {
      localStorage.setItem(`stores-${storeId.value}-departments-page`, '1')
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Save to localStorage
  if (import.meta.client) {
    try {
      localStorage.setItem(`stores-${storeId.value}-departments-page`, page.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch for page changes to persist
watch(currentPage, (newPage) => {
  openDepartmentMenuId.value = null
  if (import.meta.client) {
    try {
      localStorage.setItem(`stores-${storeId.value}-departments-page`, newPage.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

// Watch for storeId changes
watch(
  () => route.params.storeId,
  (newStoreId) => {
    if (newStoreId && import.meta.client) {
      currentPage.value = 1
      // Reload departments when storeId changes
      if (authStore.currentUser) {
        departmentsStore
          .fetchDepartments()
          .catch((err) => console.error('Error fetching departments:', err))
      }
    }
  }
)

const handleRetryFetch = async () => {
  // console.log('[StoreDepartmentsPage] Retrying fetch...')
  try {
    await departmentsStore.fetchDepartments()
  } catch (error: any) {
    console.error('[StoreDepartmentsPage] Retry error:', error.message || error)
  }
}

// Load departments on mount
onMounted(async () => {
  // Only run on client
  if (import.meta.server) return

  // Wait for auth and user data to load
  let attempts = 0
  while ((authStore.loading || !userStore.userData) && attempts < 100) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }

  // Check if user is staff/intern and redirect
  if (userStore.userData?.role === 'staff') {
    // console.log('[StoreDepartmentsPage] Staff user detected - redirecting to dashboard')
    await navigateTo('/dashboard')
    return
  }

  // console.log('[StoreDepartmentsPage] onMounted - Starting load process')

  const loadData = async () => {
    // console.log('[StoreDepartmentsPage] loadData - Checking auth state')

    // Wait for auth to finish loading with timeout
    let attempts = 0
    while (authStore.loading && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
      if (attempts % 10 === 0) {
        // console.log('[StoreDepartmentsPage] Still waiting for auth...', attempts)
      }
    }

    if (attempts >= 100) {
      console.warn('[StoreDepartmentsPage] Auth loading timeout')
    }

    // Check if user is authenticated
    if (!authStore.currentUser) {
      console.error('[StoreDepartmentsPage] No authenticated user found')
      return
    }

    // console.log('[StoreDepartmentsPage] User authenticated:', authStore.currentUser.uid)

    // Fetch user data if not already loaded
    if (!userStore.userData) {
      // console.log('[StoreDepartmentsPage] Fetching user data...')
      try {
        await userStore.fetchUserData(authStore.currentUser.uid)
        // console.log('[StoreDepartmentsPage] User data fetched:', userStore.userData)
      } catch (error) {
        console.error('[StoreDepartmentsPage] Error fetching user data:', error)
      }
    }

    if (!store.value) {
      // console.log('[StoreDepartmentsPage] Fetching stores...')
      try {
        await storesStore.fetchStores()
      } catch (error) {
        console.error('[StoreDepartmentsPage] Error fetching stores:', error)
      }
    }

    if (userStore.userData?.role === 'superAdmin' && storesStore.stores.length > 0) {
      const plan = resolveEffectiveSubscriptionPlan(userStore.userData)
      const eligible = getEligibleStoresForPlan(
        storesStore.stores,
        plan,
        summarizeSubscriptionAddOns(userStore.userData.subscriptionAddOns)
      )
      const eligibleIds = new Set(eligible.map((s) => s.id))
      if (!eligibleIds.has(storeId.value)) {
        const fallback = eligible[0]
        if (fallback) {
          toast.info('This branch is not on your current plan. Opening an available branch.')
          await navigateTo(`/dashboard/stores/${fallback.id}/departments`, { replace: true })
          return
        }
        await navigateTo('/dashboard/settings', { replace: true })
        return
      }
    }

    // Load departments
    // console.log('[StoreDepartmentsPage] Fetching departments...')
    try {
      await departmentsStore.fetchDepartments()
      // console.log('[StoreDepartmentsPage] Departments fetched:', departmentsStore.departments.length)
      if (departmentsStore.error) {
        console.error('[StoreDepartmentsPage] Departments store error:', departmentsStore.error)
      }
    } catch (error: any) {
      console.error('[StoreDepartmentsPage] Error loading departments:', error.message || error)
      console.error('[StoreDepartmentsPage] Full error:', error)
    }
  }

  await loadData()
})

// Watch for auth state changes
watch(
  () => authStore.currentUser,
  async (newUser, oldUser) => {
    if (import.meta.server) return
    // console.log('[StoreDepartmentsPage] Auth state changed:', { newUser: !!newUser, oldUser: !!oldUser })

    if (newUser && !departmentsStore.loading && departmentsStore.departments.length === 0) {
      // console.log('[StoreDepartmentsPage] Auth changed and no departments, fetching...')
      try {
        await departmentsStore.fetchDepartments()
        // console.log('[StoreDepartmentsPage] Departments fetched from watch:', departmentsStore.departments.length)
      } catch (error: any) {
        console.error('[StoreDepartmentsPage] Error in watch fetch:', error.message || error)
      }
    }
  },
  { immediate: false }
)

const openDepartmentMenuId = ref<string | null>(null)
const toggleDepartmentMenu = (departmentId: string) => {
  openDepartmentMenuId.value = openDepartmentMenuId.value === departmentId ? null : departmentId
}

const departmentForOpenMenu = computed(() => {
  const id = openDepartmentMenuId.value
  if (!id) return null
  return filteredDepartments.value.find((d) => d.id === id) ?? null
})

const departmentMenuFixedStyle = ref<Record<string, string> | null>(null)

function updateDepartmentMenuPosition() {
  const id = openDepartmentMenuId.value
  if (!id || !import.meta.client) {
    departmentMenuFixedStyle.value = null
    return
  }
  const el = getVisibleMenuAnchorElement('data-department-actions-anchor', id)
  if (!el) {
    departmentMenuFixedStyle.value = null
    return
  }
  const r = el.getBoundingClientRect()
  departmentMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
    estimatedMenuHeight: 88,
    margin: 4,
    viewportPadding: 8,
  })
}

function addDepartmentMenuPositionListeners() {
  if (!import.meta.client) return
  window.addEventListener('scroll', updateDepartmentMenuPosition, true)
  window.addEventListener('resize', updateDepartmentMenuPosition)
}

function removeDepartmentMenuPositionListeners() {
  if (!import.meta.client) return
  window.removeEventListener('scroll', updateDepartmentMenuPosition, true)
  window.removeEventListener('resize', updateDepartmentMenuPosition)
}

let departmentMenuOutsideHandler: ((e: MouseEvent) => void) | null = null

function removeDepartmentMenuOutsideListener() {
  if (departmentMenuOutsideHandler && import.meta.client) {
    document.removeEventListener('click', departmentMenuOutsideHandler, true)
    departmentMenuOutsideHandler = null
  }
}

watch(openDepartmentMenuId, (id) => {
  removeDepartmentMenuOutsideListener()
  removeDepartmentMenuPositionListeners()
  departmentMenuFixedStyle.value = null
  if (!id || !import.meta.client) return

  nextTick(() => {
    updateDepartmentMenuPosition()
    addDepartmentMenuPositionListeners()
  })

  departmentMenuOutsideHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (isInsideAnchoredMenu(t)) return
    if (t?.closest?.('[data-department-actions-anchor]')) return
    openDepartmentMenuId.value = null
    removeDepartmentMenuOutsideListener()
  }

  nextTick(() => {
    setTimeout(() => {
      if (openDepartmentMenuId.value && departmentMenuOutsideHandler) {
        document.addEventListener('click', departmentMenuOutsideHandler, true)
      }
    }, 0)
  })
})

onBeforeUnmount(() => {
  removeDepartmentMenuOutsideListener()
  removeDepartmentMenuPositionListeners()
})

const openCreateDepartmentModal = () => {
  if (!canAddDepartmentForStore.value) {
    toast.error(
      departmentLimitMessage.value || 'Department limit reached. Upgrade your plan to add more.'
    )
    return
  }
  editingDepartment.value = null
  showDepartmentModal.value = true
}

const navigateToDepartment = async (departmentId: string) => {
  if (import.meta.server) return

  try {
    // Use router directly for more reliable navigation
    const router = useRouter()
    await router.push(`/dashboard/departments/${departmentId}`)

    // Force scroll to top after navigation
    await nextTick()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('Navigation error:', error)
    // Fallback to navigateTo if router.push fails
    try {
      await navigateTo(`/dashboard/departments/${departmentId}`)
    } catch (err) {
      console.error('Both navigation methods failed:', err)
    }
  }
}

const toggleDepartmentSelection = (department: Department, checked: boolean) => {
  const idx = selectedDepartmentsForBulk.value.findIndex((d) => d.id === department.id)
  if (checked && idx === -1) selectedDepartmentsForBulk.value.push(department)
  else if (!checked && idx !== -1) selectedDepartmentsForBulk.value.splice(idx, 1)
}
const allDepartmentsOnPageSelected = computed(
  () =>
    paginatedDepartments.value.length > 0 &&
    selectedDepartmentsForBulk.value.length === paginatedDepartments.value.length
)

/** Checkbox "Select all" in header (Inventory Folders pattern) */
const setSelectAllDepartmentsBulk = (checked: boolean) => {
  if (checked) {
    selectedDepartmentsForBulk.value = [...paginatedDepartments.value]
  } else {
    selectedDepartmentsForBulk.value = []
  }
}
const openBulkDeleteDepartmentsModal = () => {
  bulkDeleteDepartmentsConfirmed.value = false
  showBulkDeleteDepartmentsModal.value = true
}
const handleConfirmBulkDeleteDepartments = async () => {
  if (!bulkDeleteDepartmentsConfirmed.value || selectedDepartmentsForBulk.value.length === 0) return
  isBulkDeletingDepartments.value = true
  const ids = selectedDepartmentsForBulk.value.map((d) => d.id)
  const count = ids.length
  try {
    for (const id of ids) {
      await departmentsStore.deleteDepartment(id, storeId.value)
    }
    selectedDepartmentsForBulk.value = []
    showBulkDeleteDepartmentsModal.value = false
    bulkDeleteDepartmentsConfirmed.value = false
    await departmentsStore.fetchDepartments()
    toast.success(`${count} department${count !== 1 ? 's' : ''} deleted`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete some departments')
  } finally {
    isBulkDeletingDepartments.value = false
  }
}

const handleEditDepartment = (department: Department) => {
  editingDepartment.value = department
  showDepartmentModal.value = true
}

const showDeleteDepartmentDialog = ref(false)
const departmentPendingDelete = ref<Department | null>(null)

function askDeleteDepartment(department: Department) {
  departmentPendingDelete.value = department
  showDeleteDepartmentDialog.value = true
}

async function confirmDeleteDepartment() {
  const department = departmentPendingDelete.value
  if (!department) return
  await deleteDepartment(department)
  showDeleteDepartmentDialog.value = false
}

function runDepartmentMenuAction(action: (department: Department) => unknown) {
  const department = departmentForOpenMenu.value
  openDepartmentMenuId.value = null
  if (department) action(department)
}

function closeDepartmentMenu() {
  const id = openDepartmentMenuId.value
  openDepartmentMenuId.value = null
  if (id) getVisibleMenuAnchorElement('data-department-actions-anchor', id)?.focus()
}

async function deleteDepartment(department: Department) {
  deletingDepartmentId.value = department.id
  try {
    await departmentsStore.deleteDepartment(department.id, storeId.value)
    toast.success('Department deleted successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete department')
  } finally {
    deletingDepartmentId.value = null
  }
}

const handleDepartmentSuccess = async (action?: 'create' | 'update') => {
  // Only refetch on update, since create already adds to local state
  if (action === 'update') {
    await departmentsStore.fetchDepartments()
  }
  // For create, the department is already in local state, no need to refetch

  showDepartmentModal.value = false
  editingDepartment.value = null
}

const handleDepartmentError = (error: string) => {
  console.error('Department operation failed:', error)
}
</script>
