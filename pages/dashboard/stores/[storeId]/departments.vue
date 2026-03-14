<template>
    <Breadcrumbs :items="storeDepartmentsBreadcrumbs" />

    <div class="mb-4 sm:mb-6">
      <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        {{ store?.name || 'Store' }} — Departments
      </h1>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Manage departments and staff for this store</p>
    </div>

    <div
      v-if="store"
      class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 ring-1 ring-gray-200/60 dark:ring-gray-700/60 px-3 py-2"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 ring-1 ring-gray-200/70 dark:ring-gray-700/70 flex items-center justify-center flex-shrink-0">
          <BuildingOfficeIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{{ store.name }}</span>
            <span
              v-if="currentStore?.id === store.id"
              class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex-shrink-0"
            >
              Current
            </span>
          </div>
          <p v-if="store.address" class="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {{ store.address }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap justify-end">
        <div class="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
          <span v-if="storeDepartments.length">{{ storeDepartments.length }} depts</span>
          <span v-if="storeDepartments.length && totalStaffForStore">·</span>
          <span v-if="totalStaffForStore">{{ totalStaffForStore }} staff</span>
        </div>
        <div class="relative w-full sm:w-64">
          <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search departments..."
            class="w-full pl-8 pr-9 py-2 text-xs rounded-xl bg-white dark:bg-gray-800/70 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <span class="text-xs leading-none">×</span>
          </button>
        </div>
        <button
          @click="resetFilters"
          class="hidden sm:inline-flex p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
          title="Reset filters"
          aria-label="Reset filters"
        >
          <ArrowPathIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 lg:hidden mb-6">
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Departments</p>
            <p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{{ storeDepartments.length }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BuildingOfficeIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total staff</p>
            <p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{{ totalStaffForStore }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UsersIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="departmentsStore.error && !departmentsStore.loading"
      class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-8 text-center"
    >
      <div class="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
        <BuildingOfficeIcon class="w-7 h-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error loading departments</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{{ departmentsStore.error }}</p>
      <Button variant="primary" :icon="ArrowPathIcon" @click="handleRetryFetch" extra-class="!rounded-full">Retry</Button>
    </div>

    <template v-else-if="departmentsStore.loading || storesLoading">
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden min-h-[280px] ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <div class="p-4 sm:p-6 border-b border-gray-200/60 dark:border-gray-700/60">
          <div class="flex flex-wrap gap-4 mb-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse"></div>
            <div class="h-10 w-48 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
        </div>
        <div class="p-4 sm:p-6">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 min-h-[160px]">
            <div
              v-for="i in 8"
              :key="i"
              class="flex flex-col items-center rounded-xl bg-gray-50 dark:bg-gray-800/80 shadow shadow-gray-200/40 pt-3 pb-2.5 px-3 animate-pulse"
            >
              <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0 mb-2" />
              <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1" />
              <div class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div class="flex gap-3">
                <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!departmentsStore.error" class="space-y-6">
      <div v-if="canManageDepartments && paginatedDepartments.length > 0" class="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="!rounded-lg"
          @click="toggleSelectAllDepartments"
        >
          {{ allDepartmentsOnPageSelected ? 'Deselect all' : 'Select all' }}
        </Button>
        <template v-if="selectedDepartmentsForBulk.length > 0">
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ selectedDepartmentsForBulk.length }} selected</span>
          <Button
            variant="outline"
            size="sm"
            :icon="TrashIcon"
            class="!rounded-lg !border-red-200 dark:!border-red-800 !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20"
            @click="openBulkDeleteDepartmentsModal"
          >
            Delete ({{ selectedDepartmentsForBulk.length }})
          </Button>
        </template>
      </div>
      <div v-if="paginatedDepartments.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3">
        <div
          v-for="department in paginatedDepartments"
          :key="department.id"
          class="group relative flex flex-col items-center rounded-xl bg-gray-50 dark:bg-gray-800/80 shadow shadow-gray-200/40 dark:shadow-none transition-all duration-200 hover:shadow-md hover:shadow-gray-200/50 active:scale-[0.99] cursor-pointer pt-3 pb-2.5 px-3 overflow-visible"
          :class="{ 'opacity-60 cursor-not-allowed': department.isActive === false }"
          @click="department.isActive === false ? null : navigateToDepartment(department.id)"
        >
          <!-- Checkbox top-left -->
          <div v-if="canManageDepartments" class="absolute left-2 top-2 z-10" @click.stop>
            <Checkbox
              :model-value="selectedDepartmentsForBulk.some(d => d.id === department.id)"
              @update:model-value="(checked) => toggleDepartmentSelection(department, checked)"
              size="sm"
              wrapper-class="justify-center"
            />
          </div>

          <!-- Ellipsis menu top-right -->
          <div v-if="canManageDepartments" class="absolute right-1.5 top-1.5 z-20" @click.stop>
            <button
              type="button"
              @click="toggleDepartmentMenu(department.id)"
              class="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
              aria-label="Department options"
            >
              <EllipsisVerticalIcon class="w-4 h-4" />
            </button>
            <div
              v-if="openDepartmentMenuId === department.id"
              class="absolute right-0 top-full mt-1 z-[100] min-w-[120px] bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-gray-200/80 dark:ring-gray-600 py-0.5"
              @click.stop
            >
              <button
                type="button"
                @click="handleEditDepartment(department); openDepartmentMenuId = null"
                class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
              >
                <PencilSquareIcon class="w-3.5 h-3.5 shrink-0" />
                Edit
              </button>
              <button
                type="button"
                @click="handleDeleteDepartment(department); openDepartmentMenuId = null"
                class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon class="w-3.5 h-3.5 shrink-0" />
                Delete
              </button>
            </div>
          </div>

          <!-- Department icon (blue) -->
          <div class="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-primary-400 dark:bg-primary-500 mb-2">
            <BuildingOfficeIcon class="w-5 h-5 text-white" stroke-width="1.75" />
          </div>

          <!-- Label (e.g. "X staff") -->
          <span class="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{{ department.staffCount || 0 }} staff</span>

          <!-- Department name (title) -->
          <h3
            class="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center truncate max-w-full px-0.5 mb-2"
            :title="department.name"
          >
            {{ department.name }}
          </h3>

          <!-- Stats row -->
          <div class="flex items-center justify-center gap-3 w-full text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-1" title="Staff">
              <UsersIcon class="w-3.5 h-3.5 shrink-0" />
              <span class="text-[11px] tabular-nums">{{ department.staffCount || 0 }}</span>
            </div>
          </div>

          <!-- Inactive badge -->
          <div v-if="department.isActive === false" class="absolute top-1.5 right-1.5 z-10">
            <span class="px-1 py-0.5 text-[9px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">Inactive</span>
          </div>
        </div>
      </div>

      <div
        v-if="paginatedDepartments.length === 0 && filteredDepartments.length === 0"
        class="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div class="w-16 h-16 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mb-4">
          <BuildingOfficeIcon class="w-8 h-8 text-primary-600 dark:text-primary-400" stroke-width="1.5" />
        </div>
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ searchQuery ? 'No departments found' : 'No departments yet' }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {{ searchQuery ? 'Try a different search.' : 'Create a department for this store.' }}
        </p>
        <Button
          v-if="!searchQuery && canManageDepartments"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateDepartmentModal"
          class="mt-6"
        >
          Create department
        </Button>
      </div>
    </div>

    <div
      v-if="filteredDepartments.length > 0"
      class="fixed bottom-0 left-0 right-0 rounded-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-30 transition-[left] duration-300 safe-area-inset-bottom"
      :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
    >
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredDepartments.length"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Bulk Delete Departments Modal -->
    <Modal
      v-model="showBulkDeleteDepartmentsModal"
      @update:model-value="(v: boolean) => { showBulkDeleteDepartmentsModal = v; if (!v) bulkDeleteDepartmentsConfirmed = false }"
      size="md"
    >
      <template #header>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected departments</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedDepartmentsForBulk.length }} department{{ selectedDepartmentsForBulk.length !== 1 ? 's' : '' }} selected</p>
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-xl">
          <p class="text-xs text-red-800 dark:text-red-200">This will permanently delete the selected departments and their staff associations. This action cannot be undone.</p>
        </div>
        <div class="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
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
        <Button variant="outline" size="sm" @click="showBulkDeleteDepartmentsModal = false; bulkDeleteDepartmentsConfirmed = false" class="!rounded-lg">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteDepartmentsConfirmed || isBulkDeletingDepartments"
          :icon="TrashIcon"
          class="!rounded-lg"
          @click="handleConfirmBulkDeleteDepartments"
        >
          {{ isBulkDeletingDepartments ? 'Deleting...' : `Delete ${selectedDepartmentsForBulk.length} department${selectedDepartmentsForBulk.length !== 1 ? 's' : ''}` }}
        </Button>
      </template>
    </Modal>
    <DepartmentModal
      v-model="showDepartmentModal"
      :department="editingDepartment"
      :storeId="storeId"
      @success="handleDepartmentSuccess"
      @error="handleDepartmentError"
    />

  <div v-if="canManageDepartments" class="fixed bottom-24 right-6 z-50 group">
    <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 dark:bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">New department</span>
    <button
      @click="openCreateDepartmentModal"
      class="w-12 h-12 rounded-full bg-primary-400 hover:bg-primary-500 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200"
      title="Create new department"
    >
      <PlusIcon class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  PlusIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  UsersIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import Breadcrumbs from '~/components/ui/Breadcrumbs.vue'
import Pagination from '~/components/ui/Pagination.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import DepartmentModal from '~/components/departments/DepartmentModal.vue'
import type { Department } from '~/composables/useDepartments'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
  ssr: false
})

const route = useRoute()
const storeId = computed(() => route.params.storeId as string)

useHead({
  title: `Departments - Storvv`,
})

const showDepartmentModal = ref(false)
const editingDepartment = ref<Department | null>(null)

// Bulk delete departments
const selectedDepartmentsForBulk = ref<Department[]>([])
const showBulkDeleteDepartmentsModal = ref(false)
const bulkDeleteDepartmentsConfirmed = ref(false)
const isBulkDeletingDepartments = ref(false)

const searchQuery = ref('')

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
import { useToast } from '~/composables/useToast'

// Get store instances - only accessible on client
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const storesStore = useStoresStore()
const toast = useToast()
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
const canManageDepartments = computed(() => !isStaff.value) // Only non-staff can manage

const storesLoading = computed(() => storesStore.loading)
const store = computed(() => storesStore.getStoreById(storeId.value))
const currentStore = computed(() => storesStore.currentStore)

const storeDepartmentsBreadcrumbs = computed(() => [
  { label: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { label: store.value?.name || 'Store', icon: BuildingOfficeIcon },
])

// Filter departments by storeId
const storeDepartments = computed(() => {
  return departmentsStore.departments.filter(dept => dept.storeId === storeId.value)
})

const totalStaffForStore = computed(() => {
  return storeDepartments.value.reduce((sum, dept) => sum + (dept.staffCount || 0), 0)
})

const filteredDepartments = computed(() => {
  if (!searchQuery.value) return storeDepartments.value

  const query = searchQuery.value.toLowerCase()
  return storeDepartments.value.filter((dept: Department) =>
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

const resetFilters = () => {
  searchQuery.value = ''
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
  if (import.meta.client) {
    try {
      localStorage.setItem(`stores-${storeId.value}-departments-page`, newPage.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

// Watch for storeId changes
watch(() => route.params.storeId, (newStoreId) => {
  if (newStoreId && import.meta.client) {
    currentPage.value = 1
    // Reload departments when storeId changes
    if (authStore.currentUser) {
      departmentsStore.fetchDepartments().catch(err => console.error('Error fetching departments:', err))
    }
  }
})

const handleRetryFetch = async () => {
  console.log('[StoreDepartmentsPage] Retrying fetch...')
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
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  // Check if user is staff/intern and redirect
  if (userStore.userData?.role === 'staff') {
    console.log('[StoreDepartmentsPage] Staff user detected - redirecting to dashboard')
    await navigateTo('/dashboard')
    return
  }
  
  console.log('[StoreDepartmentsPage] onMounted - Starting load process')
  
  const loadData = async () => {
    console.log('[StoreDepartmentsPage] loadData - Checking auth state')
    
    // Wait for auth to finish loading with timeout
    let attempts = 0
    while (authStore.loading && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
      if (attempts % 10 === 0) {
        console.log('[StoreDepartmentsPage] Still waiting for auth...', attempts)
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
    
    console.log('[StoreDepartmentsPage] User authenticated:', authStore.currentUser.uid)
    
    // Fetch user data if not already loaded
    if (!userStore.userData) {
      console.log('[StoreDepartmentsPage] Fetching user data...')
      try {
        await userStore.fetchUserData(authStore.currentUser.uid)
        console.log('[StoreDepartmentsPage] User data fetched:', userStore.userData)
      } catch (error) {
        console.error('[StoreDepartmentsPage] Error fetching user data:', error)
      }
    }

    // Fetch store data
    if (!store.value) {
      console.log('[StoreDepartmentsPage] Fetching stores...')
      try {
        await storesStore.fetchStores()
      } catch (error) {
        console.error('[StoreDepartmentsPage] Error fetching stores:', error)
      }
    }
    
    // Load departments
    console.log('[StoreDepartmentsPage] Fetching departments...')
    try {
      await departmentsStore.fetchDepartments()
      console.log('[StoreDepartmentsPage] Departments fetched:', departmentsStore.departments.length)
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
watch(() => authStore.currentUser, async (newUser, oldUser) => {
  if (import.meta.server) return
  console.log('[StoreDepartmentsPage] Auth state changed:', { newUser: !!newUser, oldUser: !!oldUser })
  
  if (newUser && !departmentsStore.loading && departmentsStore.departments.length === 0) {
    console.log('[StoreDepartmentsPage] Auth changed and no departments, fetching...')
    try {
      await departmentsStore.fetchDepartments()
      console.log('[StoreDepartmentsPage] Departments fetched from watch:', departmentsStore.departments.length)
    } catch (error: any) {
      console.error('[StoreDepartmentsPage] Error in watch fetch:', error.message || error)
    }
  }
}, { immediate: false })

const openDepartmentMenuId = ref<string | null>(null)
const toggleDepartmentMenu = (departmentId: string) => {
  openDepartmentMenuId.value = openDepartmentMenuId.value === departmentId ? null : departmentId
}

// Close department menu when clicking outside
watch(openDepartmentMenuId, (id) => {
  if (!id) return
  const close = () => { openDepartmentMenuId.value = null }
  const handler = () => {
    close()
    document.removeEventListener('click', handler)
  }
  setTimeout(() => document.addEventListener('click', handler), 0)
})

const openCreateDepartmentModal = () => {
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

const handleEditDepartment = (department: Department) => {
  editingDepartment.value = department
  showDepartmentModal.value = true
}

const handleDeleteDepartment = async (department: Department) => {
  if (confirm(`Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`)) {
    try {
      await departmentsStore.deleteDepartment(department.id)
      alert('Department deleted successfully')
    } catch (error: any) {
      alert(error.message || 'Failed to delete department')
    }
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
