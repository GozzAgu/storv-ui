<template>
  <div
    class="flex min-h-[calc(100svh-4rem)] flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:pb-32"
  >
  <!-- Hero header (aligned with Inventory → Folders) -->
    <div class="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div class="min-w-0">
        <h1 class="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-300 tracking-tight">Departments</h1>
        <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Manage your store departments and staff</p>
      </div>
      <Button
        v-if="canManageDepartments"
        variant="primary"
        size="sm"
        :icon="PlusIcon"
        :disabled="!canAddDepartmentForCurrentStore"
        :title="canAddDepartmentForCurrentStore ? 'Create new department' : departmentLimitMessage"
        extra-class="!rounded-sm w-full shrink-0 sm:w-auto"
        @click="openCreateDepartmentModal"
      >
        New department
      </Button>
    </div>

    <!-- Stats (mobile) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-1.5 lg:hidden mb-3">
      <div class="rounded-sm bg-gray-50 dark:bg-gray-800 p-2.5">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Departments</p>
            <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ departmentsStore.totalDepartments }}</p>
          </div>
          <div class="w-7 h-7 rounded-sm bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <BuildingOfficeIcon class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
      <div class="rounded-sm bg-gray-50 dark:bg-gray-800 p-2.5">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Staff</p>
            <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ totalStaff }}</p>
          </div>
          <div class="w-7 h-7 rounded-sm bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <UsersIcon class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
      <div class="rounded-sm bg-gray-50 dark:bg-gray-800 p-2.5">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Managers</p>
            <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ totalManagers }}</p>
          </div>
          <div class="w-7 h-7 rounded-sm bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <UserCircleIcon class="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
          </div>
        </div>
      </div>
      <div class="rounded-sm bg-gray-50 dark:bg-gray-800 p-2.5">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Avg. Staff/Dept</p>
            <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ averageStaffPerDept }}</p>
          </div>
          <div class="w-7 h-7 rounded-sm bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <ChartBarIcon class="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Staff banner (staff users) -->
    <div
      v-if="isStaff && currentStaffMember"
      class="rounded-sm bg-primary-50/80 dark:bg-primary-900/20 ring-1 ring-primary-200/60 dark:ring-primary-800/50 p-2.5 sm:p-3 mb-3"
    >
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-sm bg-primary-400 flex items-center justify-center text-white flex-shrink-0">
            <UsersIcon class="w-3.5 h-3.5" />
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
          class="inline-flex items-center justify-center px-2.5 py-1 rounded-sm text-xs font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors flex-shrink-0"
          :class="{ 'opacity-50 cursor-not-allowed pointer-events-none': currentDepartment && currentDepartment.isActive === false }"
          :title="currentDepartment && currentDepartment.isActive === false ? 'This department is inactive' : ''"
        >
          View My Department
        </NuxtLink>
      </div>
    </div>

    <!-- Filters (mobile) -->
    <div class="lg:hidden mb-4">
      <div class="flex flex-col sm:flex-row gap-2">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search departments..."
            class="w-full pl-8 pr-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
          />
        </div>
        <Button variant="outline" @click="resetFilters" :icon="ArrowPathIcon" extra-class="sm:w-auto w-full" size="sm">
          Reset
        </Button>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="departmentsStore.error && !departmentsStore.loading"
      class="rounded-sm bg-gray-50 dark:bg-gray-800 py-6 px-4 text-center"
    >
      <div class="w-11 h-11 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
        <BuildingOfficeIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
      </div>
      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Error loading departments</h3>
      <p class="text-xs text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">{{ departmentsStore.error }}</p>
      <Button variant="primary" :icon="ArrowPathIcon" @click="handleRetryFetch" >
        Retry
      </Button>
    </div>

    <!-- Loading skeleton -->
    <template v-else-if="departmentsStore.loading">
      <div class="rounded-sm bg-white shadow-sm dark:!bg-dashboard-card dark:shadow-lg dark:shadow-black/35 overflow-hidden min-h-[200px]">
        <div class="p-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <div class="flex flex-wrap gap-2 mb-2">
            <div class="h-3.5 bg-gray-200 dark:bg-white/10 rounded w-20 animate-pulse"></div>
            <div class="h-3.5 bg-gray-200 dark:bg-white/10 rounded w-16 animate-pulse"></div>
            <div class="h-8 w-40 rounded-sm bg-gray-200 dark:bg-white/10 animate-pulse"></div>
          </div>
        </div>
        <div class="p-3">
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5 min-h-[120px]">
            <div
              v-for="i in 8"
              :key="i"
              class="flex flex-col items-center rounded-sm bg-gray-50 px-2.5 pb-2 pt-2.5 animate-pulse dark:!bg-dashboard-card/45"
            >
              <div class="w-8 h-8 rounded-sm bg-gray-200 dark:bg-white/10 shrink-0 mb-1.5" />
              <div class="h-3 bg-gray-200 dark:bg-white/10 rounded w-16 mb-1" />
              <div class="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-14" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Toolbar + content (desktop when not loading) -->
    <div v-else-if="!departmentsStore.error" class="flex-1 flex flex-col min-h-0 space-y-3">
      <!-- Toolbar (desktop): stats + search -->
      <div class="hidden lg:flex flex-wrap items-center justify-between gap-2 rounded-sm bg-white shadow-sm dark:!bg-dashboard-card dark:shadow-md dark:shadow-black/30 px-3 py-2">
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
              class="pl-8 pr-3 py-1.5 text-xs rounded-sm bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 w-44"
            />
          </div>
          <button
            @click="resetFilters"
            class="p-1.5 rounded-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
            title="Reset filters"
          >
            <ArrowPathIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Departments grid (matches inventory folder cards) -->
      <!-- Select all + Bulk actions (departments) -->
    <div v-if="canManageDepartments && paginatedDepartments.length > 0" class="flex flex-wrap items-center gap-2 mb-3 px-0 py-1">
      <Button
        variant="outline"
        size="sm"
        class="!rounded-sm"
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
          class="!rounded-sm !border-red-200 dark:!border-red-800 !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20"
          @click="openBulkDeleteDepartmentsModal"
        >
          Delete ({{ selectedDepartmentsForBulk.length }})
        </Button>
      </template>
    </div>
    <div
        v-if="paginatedDepartments.length > 0"
        class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5"
      >
        <div
          v-for="department in paginatedDepartments"
          :key="department.id"
          class="group relative flex flex-col items-stretch rounded-sm bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:shadow-md active:scale-[0.99] cursor-pointer overflow-visible min-h-[128px] sm:min-h-[136px] dark:!bg-dashboard-card dark:shadow-md dark:shadow-black/35 dark:hover:shadow-lg dark:hover:shadow-black/50"
          :class="{
            'opacity-60 cursor-not-allowed': department.isActive === false,
            'pointer-events-none': deletingDepartmentId === department.id
          }"
          @click="department.isActive === false || deletingDepartmentId === department.id ? null : navigateToDepartment(department.id)"
        >
          <!-- Deleting overlay -->
          <div
            v-if="deletingDepartmentId === department.id"
            class="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-sm bg-gray-900/60 dark:bg-gray-950/70 backdrop-blur-[2px]"
          >
            <ArrowPathIcon class="w-6 h-6 animate-spin text-white mb-1" aria-hidden="true" />
            <span class="text-[11px] font-medium text-white">Deleting...</span>
          </div>
          <!-- Checkbox top-left -->
          <div v-if="canManageDepartments" class="absolute left-2 top-2 z-10" @click.stop>
            <Checkbox
              :model-value="selectedDepartmentsForBulk.some(d => d.id === department.id)"
              @update:model-value="(checked) => toggleDepartmentSelection(department, checked)"
              size="sm"
              wrapper-class="justify-center"
            />
          </div>

          <!-- Ellipsis menu top-right (dropdown teleported to body; see below) -->
          <div
            v-if="canManageDepartments"
            class="absolute right-1.5 top-1.5 z-20"
            data-department-menu
            @click.stop
          >
            <button
              type="button"
              :data-department-actions-anchor="department.id"
              @click="toggleDepartmentMenu(department.id)"
              class="p-1 rounded-sm text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Department options"
            >
              <EllipsisVerticalIcon class="w-4 h-4" />
            </button>
          </div>

          <div
            class="flex flex-1 flex-col items-center justify-between w-full px-2.5 pb-2.5 text-center"
            :class="canManageDepartments ? 'pt-8' : 'pt-3.5'"
          >
            <!-- Folder icon: no background, light stroke only -->
            <div class="flex flex-1 flex-col items-center justify-center w-full min-h-[44px] sm:min-h-[48px] mb-1">
              <BuildingOfficeIcon
                class="w-10 h-10 sm:w-11 sm:h-11 shrink-0 text-gray-300 dark:text-gray-500"
                stroke-width="1.25"
              />
            </div>

            <div class="w-full min-w-0 mt-auto">
              <h3
                class="text-xs font-medium text-gray-400 dark:text-gray-500 text-center truncate max-w-full px-0.5 leading-tight"
                :title="department.name"
              >
                {{ department.name }}
              </h3>
              <p class="mt-0.5 text-[11px] font-normal text-gray-300 dark:text-gray-600 text-center tabular-nums">
                {{ department.staffCount || 0 }} {{ (department.staffCount || 0) === 1 ? 'member' : 'members' }}
              </p>
              <span
                v-if="department.isActive === false"
                class="mt-1 inline-block text-[9px] font-medium text-gray-400 dark:text-gray-500"
              >
                Inactive
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="paginatedDepartments.length === 0 && filteredDepartments.length === 0"
        class="flex-1 rounded-sm bg-white shadow-sm dark:!bg-dashboard-card dark:shadow-lg dark:shadow-black/35 flex flex-col items-center justify-center py-10 px-4 sm:px-6 text-center min-w-0 w-full min-h-[calc(100svh-12rem)] sm:min-h-[calc(100svh-9rem)]"
      >
        <BuildingOfficeIcon class="w-12 h-12 shrink-0 mb-3 text-gray-300 dark:text-gray-500" stroke-width="1.25" />
        <h2 class="text-sm font-medium text-gray-400 dark:text-gray-500 break-words max-w-full">
          {{ searchQuery ? 'No departments found' : 'No departments yet' }}
        </h2>
        <p class="mt-0.5 text-xs text-gray-300 dark:text-gray-600 max-w-sm mx-auto break-words">
          {{ searchQuery ? 'Try a different search.' : 'Create a department to organize your store.' }}
        </p>
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
        <Button variant="outline" size="sm" @click="showBulkDeleteDepartmentsModal = false; bulkDeleteDepartmentsConfirmed = false" class="!rounded-sm">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteDepartmentsConfirmed || isBulkDeletingDepartments"
          :loading="isBulkDeletingDepartments"
          :icon="TrashIcon"
          class="!rounded-sm"
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
  UserCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline'
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'
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


