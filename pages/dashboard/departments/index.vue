<template>
  <!-- Hero header -->
    <div class="mb-4 sm:mb-6">
      <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Departments</h1>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Manage your store departments and staff</p>
    </div>

    <!-- Stats (mobile) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:hidden mb-4">
      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Departments</p>
            <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">{{ departmentsStore.totalDepartments }}</p>
          </div>
          <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BuildingOfficeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Staff</p>
            <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">{{ totalStaff }}</p>
          </div>
          <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UsersIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Managers</p>
            <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">{{ totalManagers }}</p>
          </div>
          <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <UserCircleIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>
      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Avg. Staff/Dept</p>
            <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">{{ averageStaffPerDept }}</p>
          </div>
          <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ChartBarIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Staff banner (staff users) -->
    <div
      v-if="isStaff && currentStaffMember"
      class="rounded-xl bg-primary-50/80 dark:bg-primary-900/20 ring-1 ring-primary-200/60 dark:ring-primary-800/50 p-3 sm:p-4 mb-4"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white flex-shrink-0">
            <UsersIcon class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              You are a member of {{ currentStaffMember.departmentName || 'a department' }}
            </h3>
            <p class="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 truncate">
              {{ currentStaffMember.position }} · {{ currentStaffMember.role }}
            </p>
          </div>
        </div>
        <NuxtLink
          :to="currentDepartment && currentDepartment.isActive === false ? '#' : `/dashboard/departments/${currentStaffMember.departmentId}`"
          class="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors flex-shrink-0"
          :class="{ 'opacity-50 cursor-not-allowed pointer-events-none': currentDepartment && currentDepartment.isActive === false }"
          :title="currentDepartment && currentDepartment.isActive === false ? 'This department is inactive' : ''"
        >
          View My Department
        </NuxtLink>
      </div>
    </div>

    <!-- Filters (mobile) -->
    <div class="lg:hidden mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search departments..."
            class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
        <Button variant="outline" @click="resetFilters" :icon="ArrowPathIcon" extra-class="!rounded-full sm:w-auto w-full" size="sm">
          Reset
        </Button>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="departmentsStore.error && !departmentsStore.loading"
      class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-8 text-center"
    >
      <div class="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
        <BuildingOfficeIcon class="w-7 h-7 text-red-600 dark:text-red-400" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error loading departments</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{{ departmentsStore.error }}</p>
      <Button variant="primary" :icon="ArrowPathIcon" @click="handleRetryFetch" extra-class="!rounded-full">
        Retry
      </Button>
    </div>

    <!-- Loading skeleton -->
    <template v-else-if="departmentsStore.loading">
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden min-h-[320px] ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <div class="p-4 sm:p-6 border-b border-gray-200/60 dark:border-gray-700/60">
          <div class="flex flex-wrap gap-4 mb-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-20 animate-pulse"></div>
            <div class="h-10 w-48 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
        </div>
        <div class="p-4 sm:p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 min-h-[160px]">
            <div
              v-for="i in 8"
              :key="i"
              class="flex items-center rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-700/60 h-[52px] sm:h-[50px] overflow-hidden animate-pulse px-2.5 sm:px-0"
            >
              <div class="w-9 h-9 sm:w-8 sm:h-8 ml-0 sm:ml-2 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div class="flex-1 min-w-0 ml-2.5 sm:ml-2 pr-2 space-y-1">
                <div class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Toolbar + content (desktop when not loading) -->
    <div v-else-if="!departmentsStore.error" class="space-y-4">
      <!-- Toolbar (desktop): stats + search -->
      <div class="hidden lg:flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 px-3 sm:px-5 py-3 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <div class="flex items-center flex-wrap gap-4">
          <div class="flex items-center gap-1.5">
            <BuildingOfficeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Departments:</span>
            <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ departmentsStore.totalDepartments }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UsersIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Staff:</span>
            <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ totalStaff }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UserCircleIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Managers:</span>
            <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ totalManagers }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <ChartBarIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Avg/Dept:</span>
            <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ averageStaffPerDept }}</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search departments..."
              class="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-48"
            />
          </div>
          <button
            @click="resetFilters"
            class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
            title="Reset filters"
          >
            <ArrowPathIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Departments grid (matches inventory folder cards) -->
      <!-- Select all + Bulk actions (departments) -->
    <div v-if="canManageDepartments && paginatedDepartments.length > 0" class="flex flex-wrap items-center gap-2 mb-4 px-0 py-2">
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
    <div
        v-if="paginatedDepartments.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3"
      >
        <div
          v-for="department in paginatedDepartments"
          :key="department.id"
          class="group relative flex items-center w-full min-h-[52px] sm:min-h-[50px] rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-700/60 transition-all duration-200 active:scale-[0.99] sm:hover:scale-[1.02] hover:ring-primary-500/30 dark:hover:ring-primary-400/30 cursor-pointer overflow-hidden py-2 px-2.5 sm:py-2 sm:px-0"
          :class="{ 'opacity-60 cursor-not-allowed': department.isActive === false }"
          @click="department.isActive === false ? null : navigateToDepartment(department.id)"
        >
          <div v-if="canManageDepartments" class="flex items-center justify-center w-8 h-8 sm:ml-2 shrink-0" @click.stop>
            <Checkbox
              :model-value="selectedDepartmentsForBulk.some(d => d.id === department.id)"
              @update:model-value="(checked) => toggleDepartmentSelection(department, checked)"
              size="sm"
              wrapper-class="justify-center"
            />
          </div>
          <div class="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 sm:ml-2 rounded-lg shrink-0 bg-gradient-to-br from-primary-400 to-primary-600 group-hover:from-primary-500 group-hover:to-primary-700 transition-all duration-200">
            <BuildingOfficeIcon class="w-5 h-5 text-white" stroke-width="1.75" />
          </div>
          <div class="flex-1 min-w-0 ml-2.5 sm:ml-2 pr-1.5 sm:pr-2">
            <p
              class="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
              :title="department.name"
            >
              {{ department.name }}
            </p>
            <span class="text-[10px] text-gray-500 dark:text-gray-400 block leading-tight">{{ department.staffCount || 0 }} staff</span>
          </div>
          <div v-if="canManageDepartments" class="flex items-center gap-0.5 pr-1 sm:pr-2 shrink-0 self-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              @click.stop="department.isActive === false ? null : handleEditDepartment(department)"
              class="p-1.5 sm:p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors touch-manipulation"
              title="Edit department"
              aria-label="Edit department"
            >
              <PencilSquareIcon class="w-3.5 h-3.5" />
            </button>
            <button
              @click.stop="department.isActive === false ? null : handleDeleteDepartment(department)"
              class="p-1.5 sm:p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation"
              title="Delete department"
              aria-label="Delete department"
            >
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>
          <div v-if="department.isActive === false" class="absolute top-1.5 right-1.5 z-10">
            <span class="px-1 py-0.5 text-[9px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">Inactive</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="paginatedDepartments.length === 0 && filteredDepartments.length === 0"
        class="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div class="w-16 h-16 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mb-4">
          <BuildingOfficeIcon class="w-8 h-8 text-primary-600 dark:text-primary-400" stroke-width="1.5" />
        </div>
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ searchQuery ? 'No departments found' : 'No departments yet' }}
        </h2>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-sm">
          {{ searchQuery ? 'Try a different search.' : 'Create a department to organize your store.' }}
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

    <!-- Fixed pagination bar -->
    <div
      v-if="filteredDepartments.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-30 transition-[left] duration-300 rounded-t-2xl"
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
      @success="handleDepartmentSuccess"
      @error="handleDepartmentError"
    />

  <!-- FAB -->
  <div v-if="canManageDepartments" class="fixed bottom-24 right-6 z-50 group">
    <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 dark:bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      New department
    </span>
    <button
      @click="openCreateDepartmentModal"
      class="w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200"
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
  UsersIcon,
  UserCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
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

const searchQuery = ref('')
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
const itemsPerPage = ref(30)

// Import stores directly - Pinia handles SSR automatically
import { useDepartmentsStore } from '~/stores/departments'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import { useToast } from '~/composables/useToast'
import type { Staff } from '~/composables/useStaff'

// Get store instances - only accessible on client
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
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
const { canCreateStaff, canManage } = usePermissions()
const canManageDepartments = computed(() => canManage.value) // Super admins and managers can manage
const canCreateNewStaff = computed(() => canCreateStaff.value) // Only super admins can create staff

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
      localStorage.setItem('departments-index-page', '1')
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
      localStorage.setItem('departments-index-page', page.toString())
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
      localStorage.setItem('departments-index-page', newPage.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

const handleRetryFetch = async () => {
  console.log('[DepartmentsPage] Retrying fetch...')
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
    console.log('[DepartmentsPage] Staff user detected - redirecting to dashboard')
    await navigateTo('/dashboard')
    return
  }
  
  console.log('[DepartmentsPage] onMounted - Starting load process')
  
  const loadData = async () => {
    console.log('[DepartmentsPage] loadData - Checking auth state')
    
    // Wait for auth to finish loading with timeout
    let attempts = 0
    while (authStore.loading && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
      if (attempts % 10 === 0) {
        console.log('[DepartmentsPage] Still waiting for auth...', attempts)
      }
    }
    
    if (attempts >= 100) {
      console.warn('[DepartmentsPage] Auth loading timeout')
    }
    
    // Check if user is authenticated
    if (!authStore.currentUser) {
      console.error('[DepartmentsPage] No authenticated user found')
      console.log('[DepartmentsPage] Auth store state:', {
        loading: authStore.loading,
        currentUser: authStore.currentUser,
        isAuthenticated: authStore.isAuthenticated
      })
      return
    }
    
    console.log('[DepartmentsPage] User authenticated:', authStore.currentUser.uid)
    
    // Fetch user data if not already loaded
    if (!userStore.userData) {
      console.log('[DepartmentsPage] Fetching user data...')
      try {
        await userStore.fetchUserData(authStore.currentUser.uid)
        console.log('[DepartmentsPage] User data fetched:', userStore.userData)
      } catch (error) {
        console.error('[DepartmentsPage] Error fetching user data:', error)
      }
    }

    // If user is staff, fetch their staff member data
    if (userStore.userData?.role === 'staff') {
      console.log('[DepartmentsPage] User is staff, fetching staff member data...')
      try {
        currentStaffMember.value = await staffStore.fetchCurrentStaffMember()
        console.log('[DepartmentsPage] Staff member data:', currentStaffMember.value)
      } catch (error) {
        console.error('[DepartmentsPage] Error fetching current staff member:', error)
      }
    }
    
    // Load departments
    console.log('[DepartmentsPage] Fetching departments...')
    try {
      await departmentsStore.fetchDepartments()
      console.log('[DepartmentsPage] Departments fetched:', departmentsStore.departments.length)
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
  console.log('[DepartmentsPage] Auth state changed:', { newUser: !!newUser, oldUser: !!oldUser })
  
  if (newUser && !departmentsStore.loading && departmentsStore.departments.length === 0) {
    console.log('[DepartmentsPage] Auth changed and no departments, fetching...')
    try {
      await departmentsStore.fetchDepartments()
      console.log('[DepartmentsPage] Departments fetched from watch:', departmentsStore.departments.length)
    } catch (error: any) {
      console.error('[DepartmentsPage] Error in watch fetch:', error.message || error)
    }
  }
}, { immediate: false })

// Also watch for when auth loading completes
watch(() => authStore.loading, async (loading) => {
  if (import.meta.server) return
  if (!loading && authStore.currentUser && departmentsStore.departments.length === 0 && !departmentsStore.loading) {
    console.log('[DepartmentsPage] Auth loading completed, fetching departments...')
    try {
      await departmentsStore.fetchDepartments()
    } catch (error: any) {
      console.error('[DepartmentsPage] Error fetching after auth loaded:', error.message || error)
    }
  }
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


