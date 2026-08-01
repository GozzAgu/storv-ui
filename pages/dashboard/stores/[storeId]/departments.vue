<template>
  <div :class="[pageWithFooterClass, 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <nav :class="eyebrowClass" aria-label="Breadcrumb">
          <NuxtLink
            to="/dashboard/settings"
            class="transition-colors hover:text-primary-500 dark:hover:text-primary-400"
          >
            Settings
          </NuxtLink>
          <span class="mx-1.5 text-gray-300 dark:text-gray-600">/</span>
          <span class="text-gray-600 dark:text-gray-400">{{ store?.name || 'Store' }}</span>
        </nav>
      </template>
      <template #title>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 :class="titleClass">Departments</h1>
          <span
            v-if="currentStore?.id === store?.id"
            class="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300/90"
          >
            Current branch
          </span>
        </div>
      </template>
      <template v-if="headerStatsReady && storeDepartments.length > 0" #description>
        <DashboardPageMetrics
          :metrics="departmentHeaderMetrics"
          aria-label="Department summary"
        />
      </template>
      <template #actions>
        <div
          v-if="storeDepartments.length > 0 && !isCapacitorIos"
          :class="viewToggleClass"
          role="group"
          aria-label="Department layout"
        >
          <button
            type="button"
            :class="[
              viewToggleBtnClass,
              departmentsViewMode === 'grid' ? viewToggleBtnActiveClass : '',
            ]"
            :aria-pressed="departmentsViewMode === 'grid'"
            @click="departmentsViewMode = 'grid'"
          >
            <Squares2X2Icon class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            :class="[
              viewToggleBtnClass,
              departmentsViewMode === 'table' ? viewToggleBtnActiveClass : '',
            ]"
            :aria-pressed="departmentsViewMode === 'table'"
            @click="departmentsViewMode = 'table'"
          >
            <TableCellsIcon class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <Button
          v-if="canManageDepartments"
          variant="primary"
          size="sm"
          :icon="BuildingOfficeIcon"
          :disabled="!canAddDepartmentForStore"
          :title="canAddDepartmentForStore ? 'Create new department' : departmentLimitMessage"
          :extra-class="headerBtnClass"
          aria-label="New department"
          @click="openCreateDepartmentModal"
        >
          <span :class="headerBtnLabelClass">New department</span>
        </Button>
      </template>
      <template v-if="headerStatsReady && storeDepartments.length > 0" #filters>
        <DashboardToolbarSearch
          v-model="searchQuery"
          placeholder="Search departments…"
          input-class="sm:w-52"
        />
        <div
          v-if="canManageDepartments && paginatedDepartments.length > 0"
          class="dash-page-header__bulk ml-auto flex flex-wrap items-center gap-2"
        >
          <Checkbox
            :model-value="allDepartmentsOnPageSelected"
            size="sm"
            wrapper-class="!h-8 items-center"
            label-class="!text-xs !ml-2 !font-normal !leading-none text-gray-500 dark:text-gray-400"
            @update:model-value="setSelectAllDepartmentsBulk"
          >
            {{ allDepartmentsOnPageSelected ? 'All selected' : 'Select all' }}
          </Checkbox>
          <template v-if="selectedDepartmentsForBulk.length > 0">
            <span
              class="inline-flex h-8 items-center text-xs font-medium tabular-nums text-gray-600 dark:text-gray-400"
            >
              {{ selectedDepartmentsForBulk.length }} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              :icon="TrashIcon"
              :extra-class="
                headerBtnClass +
                ' !border-red-200/70 !text-red-600 hover:!bg-red-50/80 dark:!border-red-900/40 dark:!text-red-400 dark:hover:!bg-red-950/30'
              "
              @click="openBulkDeleteDepartmentsModal"
            >
              <span :class="headerBtnLabelClass">Delete</span>
            </Button>
          </template>
        </div>
      </template>
    </DashboardPageHeader>

    <div
      v-if="departmentsStore.error && !departmentsStore.loading"
      :class="errorCardClass"
    >
      <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
        <BuildingOfficeIcon class="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
      <h3 :class="['dash-state-card__title', titleClass, '!text-sm']">
        Error loading departments
      </h3>
      <p :class="['dash-state-card__desc', cardDescClass, 'mx-auto max-w-md']">
        {{ departmentsStore.error }}
      </p>
      <Button variant="primary" :icon="ArrowPathIcon" class="mt-4" @click="handleRetryFetch">
        Retry
      </Button>
    </div>

    <div v-else-if="departmentsStore.loading || storesLoading" :class="gridClass">
      <div v-for="i in 12" :key="i" class="dash-skeleton dash-skeleton--grid-card" />
    </div>

    <div v-else-if="!departmentsStore.error">
      <div
        v-if="storeDepartments.length > 0"
        :class="[
          departmentsViewMode === 'table'
            ? [gridShellClass, tableShellClass, 'dash-grid-shell--table departments-shell--table']
            : [gridShellClass, 'dash-grid-shell--grid departments-shell--grid'],
        ]"
      >
        <div
          v-if="paginatedDepartments.length > 0 && departmentsViewMode === 'grid'"
          :class="[gridClass, 'departments-grid']"
        >
        <DepartmentCard
          v-for="department in paginatedDepartments"
          :key="department.id"
          :name="department.name"
          :description="department.description"
          :staff-count="department.staffCount || 0"
          :department-type="department.departmentType || ''"
          :manager="department.manager"
          :store-name="store?.name"
          :inactive="department.isActive === false"
          :deleting="deletingDepartmentId === department.id"
          :updated-at="department.updatedAt"
          :created-at="department.createdAt"
          :has-overlays="canManageDepartments"
          @open="navigateToDepartment(department.id)"
        >
          <template v-if="canManageDepartments" #checkbox>
            <Checkbox
              :model-value="selectedDepartmentsForBulk.some((d) => d.id === department.id)"
              @update:model-value="(checked) => toggleDepartmentSelection(department, checked)"
              size="sm"
              wrapper-class="justify-center"
            />
          </template>
          <template v-if="canManageDepartments" #menu>
            <div data-department-menu>
              <button
                type="button"
                :data-department-actions-anchor="department.id"
                :class="menuBtnClass"
                aria-label="Department options"
                @click="toggleDepartmentMenu(department.id)"
              >
                <EllipsisVerticalIcon class="h-3.5 w-3.5" stroke-width="2" />
              </button>
            </div>
          </template>
        </DepartmentCard>
        </div>

        <div
          v-else-if="paginatedDepartments.length > 0 && departmentsViewMode === 'table'"
          class="departments-table flex min-h-0 flex-1 flex-col"
        >
          <div class="overflow-x-auto">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr>
                  <th v-if="canManageDepartments" scope="col" class="w-11 text-center">
                    <Checkbox
                      :model-value="allDepartmentsOnPageSelected"
                      size="sm"
                      wrapper-class="justify-center"
                      @update:model-value="setSelectAllDepartmentsBulk"
                    />
                  </th>
                  <th scope="col">Department</th>
                  <th scope="col" class="hidden sm:table-cell">Type</th>
                  <th scope="col" class="text-right">Staff</th>
                  <th scope="col" class="hidden md:table-cell">Manager</th>
                  <th scope="col" class="dashboard-table__col-status">Status</th>
                  <th scope="col" class="hidden lg:table-cell">Updated</th>
                  <th
                    v-if="canManageDepartments"
                    scope="col"
                    class="dashboard-table__col-actions"
                  >
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="department in paginatedDepartments"
                  :key="department.id"
                  class="cursor-pointer"
                  @click="navigateToDepartment(department.id)"
                >
                  <td v-if="canManageDepartments" class="text-center" @click.stop>
                    <Checkbox
                      :model-value="selectedDepartmentsForBulk.some((d) => d.id === department.id)"
                      size="sm"
                      wrapper-class="justify-center"
                      @update:model-value="
                        (checked) => toggleDepartmentSelection(department, checked)
                      "
                    />
                  </td>
                  <td class="max-w-[min(16rem,32vw)]">
                    <div class="flex min-w-0 items-center gap-2.5">
                      <span
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-700 dark:bg-primary-400/15 dark:text-primary-200"
                        aria-hidden="true"
                      >
                        <BuildingOffice2Icon class="h-4 w-4" stroke-width="1.5" />
                      </span>
                      <div class="min-w-0">
                        <span class="dashboard-table__primary block truncate">{{
                          department.name
                        }}</span>
                        <span
                          v-if="department.description?.trim()"
                          class="dashboard-table__muted mt-0.5 block truncate text-[10px]"
                        >
                          {{ department.description }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="hidden sm:table-cell">
                    <span
                      class="inline-flex rounded-md bg-gray-100/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-white/[0.05] dark:text-gray-400"
                    >
                      {{ formatDepartmentTypeLabel(department.departmentType) }}
                    </span>
                  </td>
                  <td class="text-right">
                    <span class="dashboard-table__numeric">{{ department.staffCount || 0 }}</span>
                  </td>
                  <td class="hidden max-w-[12rem] md:table-cell">
                    <span class="dashboard-table__muted block truncate text-xs">
                      {{ departmentManagerLabel(department.manager) }}
                    </span>
                  </td>
                  <td class="dashboard-table__col-status">
                    <span :class="departmentStatusPill(department.isActive === false).pillClass">
                      <span class="dash-grid-card__pill-dot" aria-hidden="true" />
                      {{ departmentStatusPill(department.isActive === false).label }}
                    </span>
                  </td>
                  <td class="hidden lg:table-cell">
                    <span class="dashboard-table__muted text-xs">
                      {{
                        formatCategoryDate(department.updatedAt) ??
                        formatCategoryDate(department.createdAt) ??
                        '-'
                      }}
                    </span>
                  </td>
                  <td
                    v-if="canManageDepartments"
                    class="dashboard-table__col-actions"
                    @click.stop
                  >
                    <button
                      type="button"
                      class="dashboard-table__action-btn"
                      :data-department-actions-anchor="department.id"
                      aria-label="Department options"
                      @click="toggleDepartmentMenu(department.id)"
                    >
                      <EllipsisVerticalIcon class="h-4 w-4" stroke-width="2" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <DashboardTablePagination
            v-if="filteredDepartments.length > 0"
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :total="filteredDepartments.length"
            @page-change="handlePageChange"
          />
        </div>

        <DashboardTableEmptyState
          v-if="paginatedDepartments.length === 0 && filteredDepartments.length === 0"
          :icon="BuildingOfficeIcon"
          :title="searchQuery ? 'No departments found' : 'No departments on this page'"
          :description="
            searchQuery
              ? 'Try a different search term.'
              : 'Adjust filters or go to another page.'
          "
          :tips="[
            'Search matches department names',
            'Clear search to see every department in this store',
          ]"
        />
      </div>

      <DashboardTableEmptyState
        v-else-if="storeDepartments.length === 0"
        :icon="BuildingOfficeIcon"
        :title="searchQuery ? 'No departments found' : 'No departments yet'"
        :description="
          searchQuery
            ? 'Try a different search term.'
            : 'Departments organize staff and can restrict which inventory categories they see.'
        "
        :tips="
          searchQuery
            ? [
                'Search matches department names',
                'Clear search to see every department in this store',
              ]
            : [
                'Each department can have its own staff roster',
                'Open a department to add members and manage roles',
              ]
        "
        extra-class="dash-table-shell rounded-xl"
      />

      <DashboardTablePagination
        v-if="filteredDepartments.length > 0 && departmentsViewMode === 'grid'"
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
          <div
            class="w-8 h-8 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Delete selected departments
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ selectedDepartmentsForBulk.length }} department{{
                selectedDepartmentsForBulk.length !== 1 ? 's' : ''
              }}
              selected
            </p>
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <div
          class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-sm"
        >
          <p class="text-xs text-red-800 dark:text-red-200">
            This will permanently delete the selected departments and their staff associations. This
            action cannot be undone.
          </p>
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
        <Button
          variant="outline"
          size="sm"
          @click="
            () => {
              showBulkDeleteDepartmentsModal = false
              bulkDeleteDepartmentsConfirmed = false
            }
          "
          class="!rounded-2xl"
          >Cancel</Button
        >
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteDepartmentsConfirmed || isBulkDeletingDepartments"
          :loading="isBulkDeletingDepartments"
          :icon="TrashIcon"
          class="!rounded-2xl"
          @click="handleConfirmBulkDeleteDepartments"
        >
          {{
            isBulkDeletingDepartments
              ? 'Deleting...'
              : `Delete ${selectedDepartmentsForBulk.length} department${
                  selectedDepartmentsForBulk.length !== 1 ? 's' : ''
                }`
          }}
        </Button>
      </template>
    </Modal>

    <!-- Department ⋮ menu (teleported; same as main Departments list + Inventory folders) -->
    <Teleport to="body">
      <div
        v-if="openDepartmentMenuId && departmentForOpenMenu && departmentMenuFixedStyle"
        data-department-menu
        class="frosted-glass fixed z-[1000] min-w-[120px] rounded-sm py-0.5"
        :style="departmentMenuFixedStyle"
        @click.stop
      >
        <button
          type="button"
          @click="
            () => {
              handleEditDepartment(departmentForOpenMenu)
              openDepartmentMenuId = null
            }
          "
          class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/85 transition-colors"
        >
          <PencilSquareIcon class="w-3.5 h-3.5 shrink-0" />
          Edit
        </button>
        <button
          type="button"
          :disabled="deletingDepartmentId === departmentForOpenMenu.id"
          class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/35 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="
            () => {
              handleDeleteDepartment(departmentForOpenMenu)
              openDepartmentMenuId = null
            }
          "
        >
          <ArrowPathIcon
            v-if="deletingDepartmentId === departmentForOpenMenu.id"
            class="w-3.5 h-3.5 shrink-0 animate-spin"
          />
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
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import DashboardTablePagination from '~/components/dashboard/DashboardTablePagination.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import DepartmentModal from '~/components/departments/DepartmentModal.vue'
import DepartmentCard from '~/components/departments/DepartmentCard.vue'
import type { Department } from '~/composables/useDepartments'
import { getEligibleStoresForPlan } from '~/types/subscription'
import type { SubscriptionPlan } from '~/types/subscription'

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

const {
  pageWithFooterClass,
  eyebrowClass,
  titleClass,
  cardDescClass,
  headerBtnClass,
  headerBtnLabelClass,
  gridShellClass,
  gridClass,
  menuBtnClass,
  errorCardClass,
  viewToggleClass,
  viewToggleBtnClass,
  viewToggleBtnActiveClass,
} = useDashboardGridPagesChrome()

const { tableShellClass } = useDashboardTableChrome()
const { isCapacitorIos } = useIsCapacitorIos()

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

const getInitialDepartmentsView = (): 'grid' | 'table' => {
  if (import.meta.client) {
    try {
      if (
        document.documentElement.classList.contains('capacitor-ios') ||
        window.matchMedia('(max-width: 639px)').matches
      ) {
        return 'table'
      }
      const saved = localStorage.getItem(`stores-${storeId.value}-departments-view`)
      if (saved === 'table' || saved === 'grid') return saved
    } catch {
      /* ignore */
    }
  }
  return 'grid'
}

const departmentsViewMode = ref<'grid' | 'table'>(getInitialDepartmentsView())
watch(departmentsViewMode, (mode) => {
  openDepartmentMenuId.value = null
  if (!import.meta.client) return
  try {
    localStorage.setItem(`stores-${storeId.value}-departments-view`, mode)
  } catch {
    /* ignore */
  }
})

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
import { formatCategoryDate } from '~/utils/inventory-category-card'
import {
  departmentManagerLabel,
  departmentStatusPill,
  formatDepartmentTypeLabel,
} from '~/utils/department-card'

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

const headerStatsReady = computed(
  () => !!store.value && !departmentsStore.loading && !storesLoading.value
)

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

const departmentHeaderMetrics = computed(() => {
  const total = storeDepartments.value.length
  const shown = filteredDepartments.value.length
  const categoriesValue = shown !== total ? `${shown} / ${total}` : String(total)

  return [
    {
      key: 'departments',
      label: shown !== total ? 'Departments shown' : 'Departments',
      value: categoriesValue,
    },
    {
      key: 'staff',
      label: 'Staff',
      value: String(totalStaffForStore.value),
    },
    {
      key: 'active',
      label: 'Active',
      value: String(activeDepartmentsCount.value),
      tone: 'success' as const,
    },
    {
      key: 'inactive',
      label: 'Inactive',
      value: String(inactiveDepartmentsCount.value),
      tone: inactiveDepartmentsCount.value > 0 ? ('warning' as const) : undefined,
    },
  ]
})

const filteredDepartments = computed(() => {
  if (!searchQuery.value) return storeDepartments.value

  const query = searchQuery.value.toLowerCase()
  return storeDepartments.value.filter(
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
      const plan = (userStore.userData.subscription as SubscriptionPlan) || 'storvv_micro'
      const eligible = getEligibleStoresForPlan(storesStore.stores, plan)
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

const handleDeleteDepartment = async (department: Department) => {
  if (
    !confirm(
      `Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`
    )
  )
    return
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
