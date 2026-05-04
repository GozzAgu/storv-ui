<template>
  <div
    class="flex min-h-[calc(100svh-4rem)] w-full max-w-none flex-col space-y-2 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:space-y-2.5 sm:pb-32"
  >
    <Breadcrumbs :items="storeDepartmentsBreadcrumbs" class="!mb-0" />

    <!-- Title + store context + search / bulk (aligned with Inventory → Folders) -->
    <header
      class="relative overflow-hidden rounded-sm bg-white px-3 py-2.5 dark:bg-[#12141c] sm:px-4 sm:py-3"
    >
      <div
        class="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-gradient-to-br from-primary-400/12 via-primary-500/5 to-transparent blur-2xl dark:hidden"
      />
      <div
        class="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr from-gray-200/35 to-transparent blur-2xl dark:hidden"
      />
      <div class="relative">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div class="min-w-0">
            <p class="text-[8px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              Store
            </p>
            <h1 class="mt-0.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-lg">
              Departments in {{ store?.name || 'Store' }}
            </h1>
            <p class="mt-0.5 max-w-xl text-[11px] leading-snug text-gray-500 dark:text-gray-400">
              Manage departments and staff for this store: search and open cards below.
            </p>
            <div
              v-if="store"
              class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-600 dark:text-gray-400"
            >
              <span class="font-medium text-gray-800 dark:text-gray-200">{{ store.name }}</span>
              <span
                v-if="currentStore?.id === store.id"
                class="rounded-full bg-emerald-100/90 px-2 py-px text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-300"
              >
                Current
              </span>
              <span v-if="store.address" class="text-gray-500 dark:text-gray-500">· {{ store.address }}</span>
              <span class="hidden text-gray-400 sm:inline">·</span>
              <span v-if="storeDepartments.length" class="tabular-nums text-gray-500 dark:text-gray-500">{{ storeDepartments.length }} depts</span>
              <span v-if="storeDepartments.length && totalStaffForStore" class="text-gray-400">·</span>
              <span v-if="totalStaffForStore" class="tabular-nums text-gray-500 dark:text-gray-500">{{ totalStaffForStore }} staff</span>
            </div>
          </div>
          <Button
            v-if="canManageDepartments"
            variant="primary"
            size="sm"
            :icon="PlusIcon"
            :disabled="!canAddDepartmentForStore"
            :title="canAddDepartmentForStore ? 'Create new department' : departmentLimitMessage"
            extra-class="!rounded-sm w-full shrink-0 sm:w-auto"
            @click="openCreateDepartmentModal"
          >
            New department
          </Button>
        </div>

        <div
          v-if="store && !departmentsStore.loading && !storesLoading"
          class="mt-2 flex flex-col gap-2 border-t border-gray-100/90 pt-2 dark:border-gray-800/80 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1.5"
        >
          <div class="relative min-w-0 flex-1 sm:min-w-[200px] sm:max-w-md">
            <MagnifyingGlassIcon
              class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search departments…"
              class="w-full rounded-sm border border-gray-200/90 bg-white py-1.5 pl-8 pr-8 text-[11px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-500/40"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              title="Clear search"
              aria-label="Clear search"
              @click="searchQuery = ''"
            >
              <span class="text-sm leading-none">×</span>
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 sm:shrink-0">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-sm border border-gray-200/90 bg-white p-1.5 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-400 dark:hover:bg-gray-800"
              title="Reset filters"
              aria-label="Reset filters"
              @click="resetFilters"
            >
              <ArrowPathIcon class="h-4 w-4" />
            </button>
            <span
              class="hidden items-center rounded-full border border-gray-200/80 bg-gray-50/90 px-2 py-0.5 text-[10px] font-medium tabular-nums text-gray-600 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-400 sm:inline-flex"
            >
              {{ filteredDepartments.length }} dept{{ filteredDepartments.length === 1 ? '' : 's' }}
            </span>
          </div>

          <div
            v-if="canManageDepartments && paginatedDepartments.length > 0"
            class="flex flex-wrap items-center gap-2 sm:ml-auto sm:border-l sm:border-gray-200/80 sm:pl-3 dark:sm:border-gray-700/80"
          >
            <Checkbox
              :model-value="allDepartmentsOnPageSelected"
              size="sm"
              wrapper-class="justify-center"
              label-class="!text-xs !ml-2 !font-normal text-gray-500 dark:text-gray-500"
              @update:model-value="setSelectAllDepartmentsBulk"
            >
              {{ allDepartmentsOnPageSelected ? 'All selected' : 'Select all' }}
            </Checkbox>
            <template v-if="selectedDepartmentsForBulk.length > 0">
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ selectedDepartmentsForBulk.length }} selected</span>
              <Button
                variant="outline"
                size="sm"
                :icon="TrashIcon"
                class="!rounded-sm !px-2.5 !py-1 !text-xs !border-gray-200/80 dark:!border-gray-700/80 !text-gray-600 dark:!text-gray-300 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200/80 dark:hover:!border-red-800/50 hover:!bg-red-50/60 dark:hover:!bg-red-900/10"
                @click="openBulkDeleteDepartmentsModal"
              >
                Delete
              </Button>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile stats (compact, same surface language as folder cards) -->
    <div v-if="store" class="grid grid-cols-2 gap-1.5 lg:hidden">
      <div
        class="rounded-sm bg-white px-2.5 py-2 dark:!bg-dashboard-card"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-medium text-gray-500 dark:text-gray-400">Departments</p>
            <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {{ storeDepartments.length }}
            </p>
          </div>
          <BuildingOfficeIcon class="h-6 w-6 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.2" />
        </div>
      </div>
      <div
        class="rounded-sm bg-white px-2.5 py-2 dark:!bg-dashboard-card"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-medium text-gray-500 dark:text-gray-400">Total staff</p>
            <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {{ totalStaffForStore }}
            </p>
          </div>
          <UsersIcon class="h-6 w-6 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.2" />
        </div>
      </div>
    </div>

    <div
      v-if="departmentsStore.error && !departmentsStore.loading"
      class="rounded-sm border border-red-200/80 bg-red-50/50 px-4 py-6 text-center dark:border-red-900/40 dark:bg-red-950/20"
    >
      <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-sm bg-red-100 dark:bg-red-900/30">
        <BuildingOfficeIcon class="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
      <h3 class="mb-1.5 text-base font-semibold text-gray-900 dark:text-gray-100">Error loading departments</h3>
      <p class="mx-auto mb-4 max-w-md text-xs text-gray-600 dark:text-gray-400">{{ departmentsStore.error }}</p>
      <Button variant="primary" :icon="ArrowPathIcon" @click="handleRetryFetch">Retry</Button>
    </div>

    <div
      v-else-if="departmentsStore.loading || storesLoading"
      class="grid min-h-[96px] grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
    >
      <div
        v-for="i in 14"
        :key="i"
        class="group relative flex flex-col items-center overflow-hidden rounded-sm bg-white px-2 pb-2 pt-2 dark:!bg-dashboard-card animate-pulse"
      >
        <div class="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded bg-gray-200 dark:bg-white/10" />
        <div class="absolute right-1.5 top-1.5 h-4 w-4 rounded-sm bg-gray-200/80 dark:bg-white/10" />
        <div class="mb-1.5 mt-3 h-9 w-9 rounded-sm bg-gray-200 dark:bg-white/10 sm:h-10 sm:w-10" />
        <div class="mb-0.5 h-2.5 w-16 rounded bg-gray-200 dark:bg-white/10" />
        <div class="h-2 w-20 rounded bg-gray-200 dark:bg-white/10" />
      </div>
    </div>

    <div v-else-if="!departmentsStore.error">
      <div
        v-if="paginatedDepartments.length > 0"
        class="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
      >
        <div
          v-for="department in paginatedDepartments"
          :key="department.id"
          class="group relative flex min-h-[108px] cursor-pointer flex-col items-stretch overflow-hidden rounded-sm bg-white duration-200 ease-out active:scale-[0.99] dark:!bg-dashboard-card sm:min-h-[112px] hover:-translate-y-px"
          :class="{ 'opacity-60 cursor-not-allowed': department.isActive === false, 'pointer-events-none': deletingDepartmentId === department.id }"
          @click="department.isActive === false || deletingDepartmentId === department.id ? null : navigateToDepartment(department.id)"
        >
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/35 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:via-primary-500/30"
          />
          <div
            v-if="deletingDepartmentId === department.id"
            class="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-sm bg-gray-900/60 backdrop-blur-[2px] dark:bg-gray-950/70"
          >
            <ArrowPathIcon class="mb-1 h-6 w-6 animate-spin text-white" aria-hidden="true" />
            <span class="text-[11px] font-medium text-white">Deleting...</span>
          </div>
          <div v-if="canManageDepartments" class="absolute left-1.5 top-1.5 z-10" @click.stop>
            <Checkbox
              :model-value="selectedDepartmentsForBulk.some(d => d.id === department.id)"
              @update:model-value="(checked) => toggleDepartmentSelection(department, checked)"
              size="sm"
              wrapper-class="justify-center"
            />
          </div>

          <div
            v-if="canManageDepartments"
            class="absolute right-1 top-1 z-20"
            data-department-menu
            @click.stop
          >
            <button
              type="button"
              :data-department-actions-anchor="department.id"
              class="rounded-sm p-0.5 text-gray-400 transition-colors hover:bg-white/90 hover:text-gray-800 dark:text-gray-500 dark:hover:bg-gray-800/90 dark:hover:text-gray-200"
              aria-label="Department options"
              @click="toggleDepartmentMenu(department.id)"
            >
              <EllipsisVerticalIcon class="h-3.5 w-3.5" />
            </button>
          </div>

          <div
            class="flex w-full flex-1 flex-col items-center justify-between px-2 pb-2 pt-1 text-center"
            :class="canManageDepartments ? 'pt-7' : 'pt-3'"
          >
            <div class="mb-1 flex min-h-[48px] w-full flex-1 flex-col items-center justify-center sm:min-h-[52px]">
              <BuildingOfficeIcon
                class="h-9 w-9 shrink-0 text-gray-400 transition-colors group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400 sm:h-10 sm:w-10"
                stroke-width="1.25"
              />
            </div>

            <div class="mt-auto w-full min-w-0">
              <h3
                class="max-w-full truncate px-0.5 text-center text-xs font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100"
                :title="department.name"
              >
                {{ department.name }}
              </h3>
              <p
                class="mt-1 inline-flex items-center justify-center rounded-full border border-gray-200/80 bg-white/90 px-1.5 py-px text-[9px] font-medium tabular-nums text-gray-600 dark:border-gray-700/80 dark:!bg-dashboard-card/60 dark:text-gray-400"
              >
                {{ department.staffCount || 0 }} {{ (department.staffCount || 0) === 1 ? 'member' : 'members' }}
              </p>
              <span
                v-if="department.isActive === false"
                class="mt-1 inline-block text-[9px] font-medium text-amber-700 dark:text-amber-400/90"
              >
                Inactive
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="paginatedDepartments.length === 0 && filteredDepartments.length === 0"
        class="relative flex min-h-[min(60vh,28rem)] w-full flex-col items-center justify-center overflow-hidden rounded-sm bg-white px-4 py-10 text-center dark:!bg-dashboard-card sm:min-h-[min(50vh,24rem)] sm:px-6"
      >
        <div
          class="pointer-events-none absolute left-1/2 top-1/2 h-[min(70vw,22rem)] w-[min(70vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-primary-400/12 via-transparent to-gray-200/15 blur-3xl dark:from-primary-500/10 dark:to-gray-600/10"
        />
        <div class="relative z-10">
          <div class="mx-auto mb-3 flex items-center justify-center">
            <BuildingOfficeIcon class="h-10 w-10 text-gray-400 dark:text-gray-500" stroke-width="1.2" />
          </div>
          <h2 class="max-w-md break-words text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {{ searchQuery ? 'No departments found' : 'No departments yet' }}
          </h2>
          <p class="mx-auto mt-1.5 max-w-sm break-words text-[11px] leading-snug text-gray-500 dark:text-gray-400">
            {{ searchQuery ? 'Try a different search.' : 'Create a department for this store.' }}
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

    <!-- Department ⋮ menu (teleported; same as main Departments list + Inventory folders) -->
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
      :storeId="storeId"
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
import DashboardFixedFooter from '~/components/ui/DashboardFixedFooter.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import DepartmentModal from '~/components/departments/DepartmentModal.vue'
import type { Department } from '~/composables/useDepartments'
import { getEligibleStoresForPlan } from '~/types/subscription'
import type { SubscriptionPlan } from '~/types/subscription'

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

// Single department delete: which card is currently deleting
const deletingDepartmentId = ref<string | null>(null)

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
import { useAppToast } from '~/composables/useAppToast'
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'

// Get store instances - only accessible on client
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const storesStore = useStoresStore()
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
    await new Promise(resolve => setTimeout(resolve, 100))
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
      await new Promise(resolve => setTimeout(resolve, 100))
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
      const plan = (userStore.userData.subscription as SubscriptionPlan) || 'storvv_micro'
      const eligible = getEligibleStoresForPlan(storesStore.stores, plan)
      const eligibleIds = new Set(eligible.map(s => s.id))
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
watch(() => authStore.currentUser, async (newUser, oldUser) => {
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
}, { immediate: false })

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
  if (!canAddDepartmentForStore.value) {
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
  const ids = selectedDepartmentsForBulk.value.map(d => d.id)
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

const handleDeleteDepartment = async (department: Department) => {
  if (!confirm(`Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`)) return
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
