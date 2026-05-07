<template>
  <div
    class="flex min-h-[calc(100svh-4rem)] w-full max-w-none flex-col space-y-5 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:space-y-6 sm:pb-32"
  >
    <!-- Hero + filters (aligned with Inventory → Folders) -->
    <header class="relative rounded-sm bg-white px-4 py-4 dark:!bg-dashboard-card sm:px-5 sm:py-5">
      <div class="relative">
        <div class="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div class="min-w-0 flex-1">
            <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              Store
            </p>
            <h1
              class="mt-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl sm:tracking-tight"
            >
              Departments
            </h1>
            <p class="mt-1 max-w-xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Open a department to manage staff and settings. Search and sort the grid like inventory folders.
            </p>
          </div>
          <div
            v-if="canManageDepartments"
            class="flex w-full flex-wrap items-center gap-2 shrink-0 sm:w-auto"
          >
            <Button
              variant="primary"
              size="sm"
              :icon="PlusIcon"
              :disabled="!canAddDepartmentForCurrentStore"
              :title="canAddDepartmentForCurrentStore ? 'Create new department' : departmentLimitMessage"
              extra-class="!rounded-2xl shrink-0 w-full sm:w-auto"
              @click="openCreateDepartmentModal"
            >
              New department
            </Button>
          </div>
        </div>

        <div
          v-if="!departmentsStore.loading"
          class="mt-4 flex flex-col gap-2.5 border-t border-gray-100/90 pt-4 dark:border-gray-800/80 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1.5"
        >
          <div class="relative min-w-0 flex-1 sm:min-w-[200px] sm:max-w-md">
            <MagnifyingGlassIcon
              class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search departments…"
              class="w-full rounded-sm border border-gray-200/90 bg-white py-1.5 pl-8 pr-2.5 text-[11px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-500/40"
            />
          </div>
          <div class="flex flex-wrap items-center gap-1.5 sm:flex-nowrap sm:shrink-0">
            <select
              v-model="sortBy"
              class="min-w-[104px] cursor-pointer rounded-sm border border-gray-200/90 bg-white py-1.5 pl-2.5 pr-7 text-[11px] font-medium text-gray-800 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
            >
              <option value="name">Name</option>
              <option value="staff">Staff</option>
              <option value="date">Date</option>
            </select>
            <button
              type="button"
              class="inline-flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-sm border border-gray-200/90 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700/80 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              @click="resetFilters"
            >
              <ArrowPathIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span
              class="hidden items-center rounded-full border border-gray-200/80 bg-gray-50/90 px-2 py-0.5 text-[10px] font-medium tabular-nums text-gray-600 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-400 sm:inline-flex"
            >
              {{ filteredDepartments.length }} dept{{ filteredDepartments.length === 1 ? '' : 's' }}
            </span>
            <span
              class="hidden items-center rounded-full border border-gray-200/80 bg-gray-50/90 px-2 py-0.5 text-[10px] font-medium tabular-nums text-gray-600 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-400 lg:inline-flex"
            >
              {{ totalStaff }} staff · {{ totalManagers }} mgr · {{ averageStaffPerDept }} avg/dept
            </span>
          </div>

          <div
            v-if="canManageDepartments && paginatedDepartments.length > 0"
            class="flex flex-wrap items-center gap-2 sm:ml-auto sm:border-l sm:border-gray-200/80 sm:pl-3 dark:sm:border-gray-700/80"
          >
            <Checkbox
              :model-value="allDepartmentsOnPageSelected"
              @update:model-value="toggleSelectAllDepartments"
              size="sm"
              wrapper-class="justify-center"
              label-class="!text-xs !ml-2 !font-normal text-gray-500 dark:text-gray-500"
            >
              {{ allDepartmentsOnPageSelected ? 'All selected' : 'Select all' }}
            </Checkbox>
            <template v-if="selectedDepartmentsForBulk.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ selectedDepartmentsForBulk.length }} selected</span>
              <Button
                variant="outline"
                size="sm"
                :icon="TrashIcon"
                class="!rounded-2xl !px-2.5 !py-1 !text-xs !border-gray-200/80 dark:!border-gray-700/80 !text-gray-600 dark:!text-gray-300 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200/80 dark:hover:!border-red-800/50 hover:!bg-red-50/60 dark:hover:!bg-red-900/10"
                @click="openBulkDeleteDepartmentsModal"
              >
                Delete
              </Button>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Staff banner -->
    <div
      v-if="isStaff && currentStaffMember"
      class="rounded-sm border border-primary-200/40 bg-primary-50/70 px-4 py-3 dark:border-primary-900/40 dark:bg-primary-950/25"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary-500 text-white">
            <UsersIcon class="h-4 w-4" />
          </div>
          <div class="min-w-0">
            <h3 class="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
              You are a member of {{ currentStaffMember.departmentName || 'a department' }}
            </h3>
            <p class="mt-0.5 truncate text-[11px] text-gray-600 dark:text-gray-400">
              {{ currentStaffMember.position }} · {{ currentStaffMember.role }}
            </p>
          </div>
        </div>
        <NuxtLink
          :to="currentDepartment && currentDepartment.isActive === false ? '#' : `/dashboard/departments/${currentStaffMember.departmentId}`"
          class="inline-flex shrink-0 items-center justify-center rounded-sm bg-primary-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary-600"
          :class="{ 'pointer-events-none cursor-not-allowed opacity-50': currentDepartment && currentDepartment.isActive === false }"
          :title="currentDepartment && currentDepartment.isActive === false ? 'This department is inactive' : ''"
        >
          View my department
        </NuxtLink>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="departmentsStore.error && !departmentsStore.loading"
      class="rounded-sm bg-white px-4 py-10 text-center dark:!bg-dashboard-card sm:px-6"
    >
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-red-50 ring-1 ring-red-200/80 dark:bg-red-950/40 dark:ring-red-900/50">
        <BuildingOfficeIcon class="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 class="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50">Error loading departments</h3>
      <p class="mx-auto mt-2 max-w-md text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {{ departmentsStore.error }}
      </p>
      <Button variant="primary" class="mt-5 !rounded-2xl" :icon="ArrowPathIcon" @click="handleRetryFetch">
        Retry
      </Button>
    </div>

    <!-- Loading skeleton (matches folder grid) -->
    <div
      v-else-if="departmentsStore.loading && departmentsStore.departments.length === 0"
      class="grid min-h-[78px] grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
    >
      <div
        v-for="i in 14"
        :key="i"
        class="relative flex min-h-[78px] flex-col overflow-hidden rounded-sm bg-white px-2 pb-1 pt-5 shadow-[0_1px_2px_rgb(0_0_0_/_0.06)] animate-pulse sm:min-h-[82px] dark:!bg-dashboard-card"
      >
        <div class="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded bg-gray-200 dark:bg-white/10" />
        <div class="absolute right-1.5 top-1.5 h-4 w-4 rounded-sm bg-gray-200/80 dark:bg-white/10" />
        <div class="mt-0.5 flex flex-1 items-center gap-1.5">
          <div class="h-8 w-7 shrink-0 rounded-sm bg-gray-100 dark:bg-white/10" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-2.5 w-[70%] rounded bg-gray-200 dark:bg-white/15" />
            <div class="h-2 w-12 rounded bg-gray-200/80 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>

    <!-- Grid + empty -->
    <div v-else-if="!departmentsStore.error" class="flex min-h-0 flex-1 flex-col">
      <div
        v-if="paginatedDepartments.length > 0"
        class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
      >
        <div
          v-for="department in paginatedDepartments"
          :key="department.id"
          class="relative"
          :class="{ 'pointer-events-none': deletingDepartmentId === department.id }"
        >
          <div
            v-if="deletingDepartmentId === department.id"
            class="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-sm bg-gray-900/60 backdrop-blur-[2px] dark:bg-gray-950/70"
          >
            <ArrowPathIcon class="mb-1 h-6 w-6 animate-spin text-white" aria-hidden="true" />
            <span class="text-[11px] font-medium text-white">Deleting…</span>
          </div>
          <DepartmentGridTile
            :name="department.name"
            :staff-count="department.staffCount || 0"
            :inactive="department.isActive === false"
            :has-overlays="canManageDepartments"
            @click="onDepartmentTileClick(department)"
          >
            <template v-if="canManageDepartments" #checkbox>
              <div class="absolute left-1.5 top-1.5 z-10" @click.stop>
                <Checkbox
                  :model-value="selectedDepartmentsForBulk.some(d => d.id === department.id)"
                  @update:model-value="(checked) => toggleDepartmentSelection(department, checked)"
                  size="sm"
                  wrapper-class="justify-center"
                />
              </div>
            </template>
            <template v-if="canManageDepartments" #menu>
              <div
                class="absolute right-1 top-1 z-20"
                data-department-menu
                @click.stop
              >
                <button
                  type="button"
                  :data-department-actions-anchor="department.id"
                  class="rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-500 dark:hover:bg-gray-800/90 dark:hover:text-gray-200"
                  aria-label="Department options"
                  @click="toggleDepartmentMenu(department.id)"
                >
                  <EllipsisVerticalIcon class="h-4 w-4" stroke-width="2" />
                </button>
              </div>
            </template>
          </DepartmentGridTile>
        </div>
      </div>

      <div
        v-else-if="filteredDepartments.length === 0"
        class="relative flex min-h-[min(52vh,26rem)] w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-sm bg-white px-4 py-14 text-center dark:!bg-dashboard-card sm:min-h-[min(48vh,22rem)] sm:px-6"
      >
        <div class="relative z-10">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/60"
          >
            <BuildingOfficeIcon class="h-8 w-8 text-gray-500 dark:text-gray-400" stroke-width="1.2" />
          </div>
          <h2 class="max-w-md break-words text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            {{ searchQuery ? 'No departments found' : 'No departments yet' }}
          </h2>
          <p class="mx-auto mt-2 max-w-sm break-words text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {{ searchQuery ? 'Try a different search or clear filters.' : 'Create a department to organize your store and assign staff.' }}
          </p>
        </div>
      </div>
    </div>

    <DashboardFixedFooter v-if="filteredDepartments.length > 0" :sidebar-collapsed="sidebarCollapsed">
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredDepartments.length"
        @page-change="handlePageChange"
      />
    </DashboardFixedFooter>

    <!-- Bulk Delete Departments Modal -->
    <Modal
      v-model="showBulkDeleteDepartmentsModal"
      @update:model-value="(v: boolean) => { showBulkDeleteDepartmentsModal = v; if (!v) bulkDeleteDepartmentsConfirmed = false }"
      size="md"
    >
      <template #header>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected departments</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedDepartmentsForBulk.length }} department{{ selectedDepartmentsForBulk.length !== 1 ? 's' : '' }} selected</p>
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-sm">
          <p class="text-xs text-red-800 dark:text-red-200">This will permanently delete the selected departments and their staff associations. This action cannot be undone.</p>
        </div>
        <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
          <Checkbox
            v-model="bulkDeleteDepartmentsConfirmed"
            label="I understand that these departments will be permanently deleted."
            size="sm"
            wrapper-class="items-start"
            label-class="text-xs text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="outline" size="sm" @click="showBulkDeleteDepartmentsModal = false; bulkDeleteDepartmentsConfirmed = false" class="!rounded-2xl">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteDepartmentsConfirmed || isBulkDeletingDepartments"
          :loading="isBulkDeletingDepartments"
          :icon="TrashIcon"
          class="!rounded-2xl"
          @click="handleConfirmBulkDeleteDepartments"
        >
          {{ isBulkDeletingDepartments ? 'Deleting...' : `Delete ${selectedDepartmentsForBulk.length} department${selectedDepartmentsForBulk.length !== 1 ? 's' : ''}` }}
        </Button>
      </template>
    </Modal>

    <!-- Department actions (teleported; same pattern as Inventory → Folders) -->
    <Teleport to="body">
      <div
        v-if="openDepartmentMenuId && departmentForOpenMenu && departmentMenuFixedStyle"
        data-department-menu
        class="frosted-glass fixed z-[1000] min-w-[120px] rounded-sm border border-gray-200/90 py-0.5 dark:border-gray-700/80"
        :style="departmentMenuFixedStyle"
        @click.stop
      >
        <button
          type="button"
          @click="handleEditDepartment(departmentForOpenMenu); openDepartmentMenuId = null"
          class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/85 transition-colors"
        >
          <PencilSquareIcon class="w-3.5 h-3.5 shrink-0" />
          Edit
        </button>
        <button
          type="button"
          :disabled="deletingDepartmentId === departmentForOpenMenu.id"
          class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/35 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleDeleteDepartment(departmentForOpenMenu); openDepartmentMenuId = null"
        >
          <ArrowPathIcon v-if="deletingDepartmentId === departmentForOpenMenu.id" class="w-3.5 h-3.5 shrink-0 animate-spin" />
          <TrashIcon v-else class="w-3.5 h-3.5 shrink-0" />
          {{ deletingDepartmentId === departmentForOpenMenu.id ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </Teleport>

    <DepartmentModal
      v-model="showDepartmentModal"
      :department="editingDepartment"
      @success="handleDepartmentSuccess"
      @error="handleDepartmentError"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  PlusIcon,
  BuildingOfficeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline'
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'
import DepartmentGridTile from '~/components/departments/DepartmentGridTile.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
import DashboardFixedFooter from '~/components/ui/DashboardFixedFooter.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import DepartmentModal from '~/components/departments/DepartmentModal.vue'
import type { Department } from '~/composables/useDepartments'

definePageMeta({
  layout: 'dashboard',
  ssr: false // Disable SSR for this page since it requires authentication and client-side data
})

useHead({
  title: 'Departments - Storvv',
})

const showDepartmentModal = ref(false)
const editingDepartment = ref<Department | null>(null)

// Bulk delete departments
const selectedDepartmentsForBulk = ref<Department[]>([])
const showBulkDeleteDepartmentsModal = ref(false)
const bulkDeleteDepartmentsConfirmed = ref(false)
const isBulkDeletingDepartments = ref(false)
const deletingDepartmentId = ref<string | null>(null)

const searchQuery = ref('')
const sortBy = ref<'name' | 'staff' | 'date'>('name')
// Load pagination state from localStorage
const getInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('departments-index-page')
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
import { useAppToast } from '~/composables/useAppToast'
import type { Staff } from '~/composables/useStaff'

// Get store instances - only accessible on client
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const toast = useAppToast()
const sidebarCollapsed = ref(false)

// Load sidebar state from localStorage
if (import.meta.client) {
  try {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true'
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Watch for sidebar state changes
if (import.meta.client) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'sidebarCollapsed' && e.newValue !== null) {
      sidebarCollapsed.value = e.newValue === 'true'
    }
  })
  // Also check periodically for changes (since storage event doesn't fire on same window)
  setInterval(() => {
    try {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        const newValue = savedState === 'true'
        if (newValue !== sidebarCollapsed.value) {
          sidebarCollapsed.value = newValue
        }
      }
    } catch (e) {
      // Ignore
    }
  }, 100)
}

// Check if current user is staff (limited permissions)
const isStaff = computed(() => userStore.userData?.role === 'staff')
const { canCreateStaff, canManage } = usePermissions()
const canManageDepartments = computed(() => canManage.value) // Super admins and managers can manage
const canCreateNewStaff = computed(() => canCreateStaff.value) // Only super admins can create staff

const { canAddDepartment, limits: subscriptionLimits } = useSubscriptionFeatures()
const canAddDepartmentForCurrentStore = computed(() =>
  canAddDepartment(departmentsStore.departments.length)
)
const departmentLimitMessage = computed(() => {
  const max = subscriptionLimits.value.maxDepartmentsPerStore
  if (max < 0) return ''
  return max === 1
    ? 'Storvv Micro allows 1 department. Upgrade to add more.'
    : `Your plan allows up to ${max} departments per store. Upgrade for more.`
})

// Current staff member data (for staff users)
const currentStaffMember = ref<Staff | null>(null)

// Get current department for staff member
const currentDepartment = computed(() => {
  if (!currentStaffMember.value?.departmentId) return null
  return departmentsStore.getDepartmentById(currentStaffMember.value.departmentId)
})

const totalStaff = computed(() => departmentsStore.totalStaff ?? 0)
const totalManagers = computed(() => departmentsStore.totalManagers ?? 0)
const averageStaffPerDept = computed(() => departmentsStore.averageStaffPerDept ?? 0)

const filteredDepartments = computed(() => {
  if (!searchQuery.value) return departmentsStore.departments

  const query = searchQuery.value.toLowerCase()
  return departmentsStore.departments.filter((dept: Department) =>
    dept.name.toLowerCase().includes(query) ||
    (dept.departmentType && dept.departmentType.toLowerCase().includes(query)) ||
    (dept.manager && dept.manager.toLowerCase().includes(query))
  )
})

function departmentCreatedMs(d: Department): number {
  const c = d.createdAt as { toMillis?: () => number; seconds?: number } | undefined
  if (c && typeof c.toMillis === 'function') return c.toMillis()
  if (c && typeof c.seconds === 'number') return c.seconds * 1000
  return 0
}

const sortedFilteredDepartments = computed(() => {
  const list = [...filteredDepartments.value]
  if (sortBy.value === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  } else if (sortBy.value === 'staff') {
    list.sort(
      (a, b) =>
        (b.staffCount || 0) - (a.staffCount || 0) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
  } else {
    list.sort(
      (a, b) =>
        departmentCreatedMs(b) - departmentCreatedMs(a) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
  }
  return list
})

const paginatedDepartments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedFilteredDepartments.value.slice(start, end)
})

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value = 'name'
  currentPage.value = 1
  // Clear pagination from localStorage when filters are reset
  if (import.meta.client) {
    try {
      localStorage.setItem('departments-index-page', '1')
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

watch([searchQuery, sortBy], () => {
  currentPage.value = 1
  if (import.meta.client) {
    try {
      localStorage.setItem('departments-index-page', '1')
    } catch (e) {
      // Ignore
    }
  }
})

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Save to localStorage
  if (import.meta.client) {
    try {
      localStorage.setItem('departments-index-page', page.toString())
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
      localStorage.setItem('departments-index-page', newPage.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

const handleRetryFetch = async () => {
  // console.log('[DepartmentsPage] Retrying fetch...')
  try {
    await departmentsStore.fetchDepartments()
  } catch (error: any) {
    console.error('[DepartmentsPage] Retry error:', error.message || error)
  }
}

// Redirect staff/intern away from departments page
onMounted(async () => {
  // Only run on client
  if (import.meta.server) return
  
  // Wait for auth and user data to load
  let attempts = 0
  while ((authStore.loading || !userStore.userData) && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  // Check if user is staff/intern and redirect
  if (userStore.userData?.role === 'staff') {
    // console.log('[DepartmentsPage] Staff user detected - redirecting to dashboard')
    await navigateTo('/dashboard')
    return
  }
  
  // console.log('[DepartmentsPage] onMounted - Starting load process')
  
  const loadData = async () => {
    // console.log('[DepartmentsPage] loadData - Checking auth state')
    
    // Wait for auth to finish loading with timeout
    let attempts = 0
    while (authStore.loading && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
      if (attempts % 10 === 0) {
        // console.log('[DepartmentsPage] Still waiting for auth...', attempts)
      }
    }
    
    if (attempts >= 100) {
      console.warn('[DepartmentsPage] Auth loading timeout')
    }
    
    // Check if user is authenticated
    if (!authStore.currentUser) {
      console.error('[DepartmentsPage] No authenticated user found')
      /* console.log('[DepartmentsPage] Auth store state:', {
        loading: authStore.loading,
        currentUser: authStore.currentUser,
        isAuthenticated: authStore.isAuthenticated
      }) */
      return
    }
    
    // console.log('[DepartmentsPage] User authenticated:', authStore.currentUser.uid)
    
    // Fetch user data if not already loaded
    if (!userStore.userData) {
      // console.log('[DepartmentsPage] Fetching user data...')
      try {
        await userStore.fetchUserData(authStore.currentUser.uid)
        // console.log('[DepartmentsPage] User data fetched:', userStore.userData)
      } catch (error) {
        console.error('[DepartmentsPage] Error fetching user data:', error)
      }
    }

    // If user is staff, fetch their staff member data
    if (userStore.userData?.role === 'staff') {
      // console.log('[DepartmentsPage] User is staff, fetching staff member data...')
      try {
        currentStaffMember.value = await staffStore.fetchCurrentStaffMember()
        // console.log('[DepartmentsPage] Staff member data:', currentStaffMember.value)
      } catch (error) {
        console.error('[DepartmentsPage] Error fetching current staff member:', error)
      }
    }
    
    // Load departments
    // console.log('[DepartmentsPage] Fetching departments...')
    try {
      await departmentsStore.fetchDepartments()
      // console.log('[DepartmentsPage] Departments fetched:', departmentsStore.departments.length)
      if (departmentsStore.error) {
        console.error('[DepartmentsPage] Departments store error:', departmentsStore.error)
      }
    } catch (error: any) {
      console.error('[DepartmentsPage] Error loading departments:', error.message || error)
      console.error('[DepartmentsPage] Full error:', error)
    }
  }
  
  await loadData()
})

// Watch for auth state changes
watch(() => authStore.currentUser, async (newUser, oldUser) => {
  if (import.meta.server) return
  // console.log('[DepartmentsPage] Auth state changed:', { newUser: !!newUser, oldUser: !!oldUser })
  
  if (newUser && !departmentsStore.loading && departmentsStore.departments.length === 0) {
    // console.log('[DepartmentsPage] Auth changed and no departments, fetching...')
    try {
      await departmentsStore.fetchDepartments()
      // console.log('[DepartmentsPage] Departments fetched from watch:', departmentsStore.departments.length)
    } catch (error: any) {
      console.error('[DepartmentsPage] Error in watch fetch:', error.message || error)
    }
  }
}, { immediate: false })

// Also watch for when auth loading completes
watch(() => authStore.loading, async (loading) => {
  if (import.meta.server) return
  if (!loading && authStore.currentUser && departmentsStore.departments.length === 0 && !departmentsStore.loading) {
    // console.log('[DepartmentsPage] Auth loading completed, fetching departments...')
    try {
      await departmentsStore.fetchDepartments()
    } catch (error: any) {
      console.error('[DepartmentsPage] Error fetching after auth loaded:', error.message || error)
    }
  }
})

const openDepartmentMenuId = ref<string | null>(null)
const toggleDepartmentMenu = (departmentId: string) => {
  openDepartmentMenuId.value = openDepartmentMenuId.value === departmentId ? null : departmentId
}

const departmentForOpenMenu = computed(() => {
  const id = openDepartmentMenuId.value
  if (!id) return null
  return filteredDepartments.value.find(d => d.id === id) ?? null
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
    menuWidth: 120,
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

/** Capture-phase outside click + scroll/position; same as Inventory → Folders */
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
    if (t?.closest?.('[data-department-menu]')) return
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
  if (!canAddDepartmentForCurrentStore.value) {
    toast.error(departmentLimitMessage.value || 'Department limit reached. Upgrade your plan to add more.')
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

const onDepartmentTileClick = (department: Department) => {
  if (department.isActive === false) return
  if (deletingDepartmentId.value === department.id) return
  navigateToDepartment(department.id)
}

const handleEditDepartment = (department: Department) => {
  editingDepartment.value = department
  showDepartmentModal.value = true
}

const toggleDepartmentSelection = (department: Department, checked: boolean) => {
  const idx = selectedDepartmentsForBulk.value.findIndex(d => d.id === department.id)
  if (checked && idx === -1) selectedDepartmentsForBulk.value.push(department)
  else if (!checked && idx !== -1) selectedDepartmentsForBulk.value.splice(idx, 1)
}
const allDepartmentsOnPageSelected = computed(() =>
  paginatedDepartments.value.length > 0 &&
  selectedDepartmentsForBulk.value.length === paginatedDepartments.value.length
)
const toggleSelectAllDepartments = () => {
  if (allDepartmentsOnPageSelected.value) {
    selectedDepartmentsForBulk.value = []
  } else {
    selectedDepartmentsForBulk.value = [...paginatedDepartments.value]
  }
}
const openBulkDeleteDepartmentsModal = () => {
  bulkDeleteDepartmentsConfirmed.value = false
  showBulkDeleteDepartmentsModal.value = true
}
const handleConfirmBulkDeleteDepartments = async () => {
  if (!bulkDeleteDepartmentsConfirmed.value || selectedDepartmentsForBulk.value.length === 0) return
  isBulkDeletingDepartments.value = true
  const ids = selectedDepartmentsForBulk.value.map(d => d.id)
  const count = ids.length
  try {
    for (const id of ids) {
      await departmentsStore.deleteDepartment(id)
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

const handleDeleteDepartment = async (department: Department) => {
  if (!confirm(`Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`)) return
  deletingDepartmentId.value = department.id
  try {
    await departmentsStore.deleteDepartment(department.id)
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


