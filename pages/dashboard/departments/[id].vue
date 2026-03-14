<template>
    <Breadcrumbs :items="departmentBreadcrumbs" />

    <div class="mb-4 sm:mb-6 flex items-start gap-3">
      <button
        @click="navigateTo('/dashboard/departments')"
        class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        title="Back to departments"
      >
        <ArrowLeftIcon class="w-4 h-4" />
      </button>
      <div class="flex-1 min-w-0">
        <h1 v-if="isLoadingDepartment" class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          <span class="inline-block h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></span>
        </h1>
        <h1 v-else class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate">
          {{ department?.name || 'Department' }}
        </h1>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Department management</p>
      </div>
    </div>

    <div v-if="isLoadingDepartment" class="grid grid-cols-3 gap-3 lg:hidden mb-6">
      <div v-for="i in 3" :key="i" class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-4">
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 mb-2 animate-pulse"></div>
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3 lg:hidden mb-4">
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total staff</p>
            <p class="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">{{ staff.length }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <UsersIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Managers</p>
            <p class="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">{{ totalManagers }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <UserCircleIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Dept type</p>
            <p class="mt-1 text-base font-bold text-gray-900 dark:text-gray-100 truncate">{{ department?.departmentType || '—' }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center">
            <BuildingOfficeIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      </div>
    </div>

    <div
      :class="[
        'transition-all duration-300 mt-6 sm:mt-8',
        isStaffFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto' : 'relative'
      ]"
    >
      <div v-if="isStaffFullscreen" class="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/80 px-5 py-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ department?.name || 'Department' }} — Staff</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ staff.length }} staff · {{ totalManagers }} managers</p>
          </div>
          <button
            @click="isStaffFullscreen = false"
            class="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Exit fullscreen"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        :class="[
          isStaffFullscreen ? 'shadow-none' : 'rounded-2xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden ring-1 ring-gray-200/50 dark:ring-gray-700/50'
        ]"
      >
        <div v-if="canManageDepartments && selectedStaffForBulk.length > 0" class="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-2 border-b border-gray-200/60 dark:border-gray-700/60 bg-primary-50/50 dark:bg-primary-900/10">
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ selectedStaffForBulk.length }} selected</span>
          <Button
            variant="outline"
            size="sm"
            :icon="TrashIcon"
            class="!rounded-lg !border-red-200 dark:!border-red-800 !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20"
            @click="openBulkDeleteStaffModal"
          >
            Delete ({{ selectedStaffForBulk.length }})
          </Button>
        </div>
        <div v-if="!isLoadingStaff && staff.length > 0 && !isStaffFullscreen" class="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/60">
          <div class="flex items-center flex-wrap gap-4">
            <div class="flex items-center gap-1.5">
              <BuildingOfficeIcon class="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Type:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[160px]">{{ department?.departmentType || '—' }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <UserCircleIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Manager:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px]">{{ currentManager }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <UsersIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Staff:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ staff.length }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <UserCircleIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Managers:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ totalManagers }}</span>
            </div>
          </div>
          <button
            @click="isStaffFullscreen = !isStaffFullscreen"
            class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
            :title="isStaffFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          >
            <ArrowsPointingOutIcon v-if="!isStaffFullscreen" class="w-4 h-4" />
            <XMarkIcon v-else class="w-4 h-4" />
          </button>
        </div>

        <div v-if="isLoadingStaff" class="overflow-x-auto">
          <div class="p-4 sm:p-6 space-y-3">
            <div v-for="i in 6" :key="i" class="flex gap-4 items-center">
              <div class="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse w-1/3"></div>
                <div class="h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse w-1/4"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="staff.length === 0" class="text-center py-12 sm:py-16">
          <div class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <UsersIcon class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">No staff members yet</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Add staff to this department to get started</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200/80 dark:divide-gray-700/80">
            <thead class="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th v-if="canManageDepartments" class="px-4 sm:px-5 py-2.5 text-center text-[10px] !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 w-10">
                  <Checkbox
                    :model-value="paginatedStaff.length > 0 && selectedStaffForBulk.length === paginatedStaff.length"
                    @update:model-value="toggleSelectAllStaff"
                    size="sm"
                    wrapper-class="justify-center"
                  />
                </th>
                <th class="px-4 sm:px-5 py-2.5 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Name</th>
                <th class="px-4 sm:px-5 py-2.5 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 hidden sm:table-cell">Position</th>
                <th class="px-4 sm:px-5 py-2.5 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Role</th>
                <th class="px-4 sm:px-5 py-2.5 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 hidden md:table-cell">Email</th>
                <th class="px-4 sm:px-5 py-2.5 text-left text-[10px] !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Status</th>
                <th v-if="canManageDepartments" class="px-4 sm:px-5 py-2.5 text-right text-[10px] !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200/80 dark:divide-gray-700/80">
              <tr
                v-for="member in paginatedStaff"
                :key="member.id"
                class="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
              >
              <td v-if="canManageDepartments" class="px-4 sm:px-5 py-2.5 text-center w-10">
                <Checkbox
                  :model-value="selectedStaffForBulk.some(s => s.id === member.id)"
                  @update:model-value="(checked) => toggleStaffSelection(member, checked)"
                  size="sm"
                  wrapper-class="justify-center"
                  @click.stop
                />
              </td>
              <td class="px-4 sm:px-5 py-2.5">
                <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ member.firstName }} {{ member.lastName }}</span>
              </td>
              <td class="px-4 sm:px-5 py-2.5 hidden sm:table-cell">
                <span class="text-xs text-gray-600 dark:text-gray-300">{{ member.position }}</span>
              </td>
              <td class="px-4 sm:px-5 py-2.5">
                <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-medium capitalize rounded-full"
                  :class="[
                    member.role === 'manager'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'
                      : member.role === 'intern'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  ]"
                >
                  {{ member.role }}
                </span>
              </td>
              <td class="px-4 sm:px-5 py-2.5 hidden md:table-cell">
                <span class="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[150px]">{{ member.email }}</span>
              </td>
              <td class="px-4 sm:px-5 py-2.5">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 text-[10px] font-medium capitalize rounded-full',
                    member.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : member.status === 'on_leave'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  ]"
                >
                  {{ member.status === 'on_leave' ? 'On Leave' : member.status }}
                </span>
              </td>
              <td v-if="canManageDepartments" class="px-4 sm:px-5 py-2.5">
                <!-- Desktop: Show all action buttons -->
                <div class="hidden sm:flex items-center justify-end gap-2 flex-shrink-0" @click.stop>
                  <button
                    @click="handleToggleStaffRole(member)"
                    class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0"
                    :title="member.role === 'manager' ? 'Change to Staff' : 'Change to Manager'"
                  >
                    <ArrowPathIcon class="w-3.5 h-3.5 flex-shrink-0" />
                  </button>
                  <button
                    @click="handleEditStaff(member)"
                    class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors flex-shrink-0"
                    title="Edit"
                  >
                    <PencilSquareIcon class="w-3.5 h-3.5 flex-shrink-0" />
                  </button>
                  <button
                    @click="handleDeleteStaff(member)"
                    class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    <TrashIcon class="w-3.5 h-3.5 flex-shrink-0" />
                  </button>
                </div>
                <!-- Mobile: Show 3-dot menu -->
                <div class="sm:hidden relative" @click.stop>
                  <button
                    @click="toggleStaffMenu(member.id)"
                    class="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0"
                    title="Actions"
                  >
                    <EllipsisVerticalIcon class="w-4 h-4 flex-shrink-0" />
                  </button>
                  <!-- Dropdown Menu -->
                  <div
                    v-if="openStaffMenuId === member.id"
                    class="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 min-w-[44px]"
                  >
                    <button
                      @click="handleToggleStaffRole(member); openStaffMenuId = null"
                      class="w-full px-3 py-2.5 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      :title="member.role === 'manager' ? 'Change to Staff' : 'Change to Manager'"
                    >
                      <ArrowPathIcon class="w-5 h-5" />
                    </button>
                    <button
                      @click="handleEditStaff(member); openStaffMenuId = null"
                      class="w-full px-3 py-2.5 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Edit"
                    >
                      <PencilSquareIcon class="w-5 h-5" />
                    </button>
                    <button
                      @click="handleDeleteStaff(member); openStaffMenuId = null"
                      class="w-full px-3 py-2.5 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>

    <div
      v-if="staff.length > 0 && !isStaffFullscreen"
      class="fixed bottom-0 left-0 right-0 rounded-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-30 transition-[left] duration-300 safe-area-inset-bottom"
      :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
    >
      <Pagination
        :current-page="staffCurrentPage"
        :items-per-page="staffItemsPerPage"
        :total="staff.length"
        @page-change="handleStaffPageChange"
      />
    </div>

    <div v-if="isStaffFullscreen && staff.length > 0" class="sticky bottom-0 rounded-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 px-6 py-1.5 z-10">
      <Pagination
        :current-page="staffCurrentPage"
        :items-per-page="staffItemsPerPage"
        :total="staff.length"
        @page-change="handleStaffPageChange"
      />
    </div>

    <div v-if="canCreateNewStaff && !isLoadingStaff" class="fixed bottom-24 right-6 z-40 group">
      <span class="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 dark:bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Add staff
      </span>
      <button
        @click="openCreateStaffModal"
        class="w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200"
        title="Add new staff"
      >
        <PlusIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Bulk Delete Staff Modal -->
    <Modal
      v-model="showBulkDeleteStaffModal"
      @update:model-value="(v: boolean) => { showBulkDeleteStaffModal = v; if (!v) bulkDeleteStaffConfirmed = false }"
      size="md"
    >
      <template #header>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected staff</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedStaffForBulk.length }} staff member{{ selectedStaffForBulk.length !== 1 ? 's' : '' }} selected</p>
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-xl">
          <p class="text-xs text-red-800 dark:text-red-200">This will permanently remove the selected staff members from this department. This action cannot be undone.</p>
        </div>
        <div class="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
          <Checkbox
            v-model="bulkDeleteStaffConfirmed"
            label="I understand that these staff members will be permanently removed."
            size="sm"
            wrapper-class="items-start"
            label-class="text-xs text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="outline" size="sm" @click="showBulkDeleteStaffModal = false; bulkDeleteStaffConfirmed = false" class="!rounded-lg">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteStaffConfirmed || isBulkDeletingStaff"
          :icon="TrashIcon"
          class="!rounded-lg"
          @click="handleConfirmBulkDeleteStaff"
        >
          {{ isBulkDeletingStaff ? 'Deleting...' : `Delete ${selectedStaffForBulk.length} staff member${selectedStaffForBulk.length !== 1 ? 's' : ''}` }}
        </Button>
      </template>
    </Modal>
    <!-- Staff Modal -->
    <StaffModal
      v-if="departmentId"
      v-model="showStaffModal"
      :department-id="departmentId"
      :staff="editingStaff"
      @success="handleStaffSuccess"
      @error="handleStaffError"
    />

</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ArrowLeftIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import Breadcrumbs from '~/components/ui/Breadcrumbs.vue'
import Pagination from '~/components/ui/Pagination.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import StaffModal from '~/components/departments/StaffModal.vue'
import { useDepartmentsStore } from '~/stores/departments'
import { useStaffStore } from '~/stores/staff'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import type { Department } from '~/composables/useDepartments'
import type { Staff } from '~/composables/useStaff'
import { usePermissions } from '~/composables/usePermissions'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'dashboard',
  key: (route) => `department-${route.params.id}`, // Force re-mount when ID changes
  middleware: 'auth', // Ensure auth middleware runs
  ssr: false // Disable SSR for client-side navigation
})

const route = useRoute()
const departmentId = computed(() => route.params.id as string)

const departmentBreadcrumbs = computed(() => [
  { label: 'Departments', href: '/dashboard/departments', icon: BuildingOfficeIcon },
  { label: department.value?.name || 'Department', icon: UsersIcon },
])

const department = ref<Department | null>(null)
const staff = ref<Staff[]>([])
const isLoadingDepartment = ref(true)
const isLoadingStaff = ref(true)

// Staff pagination - load from localStorage per department
const getStaffInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const deptId = route.params.id as string
      if (deptId) {
        const saved = localStorage.getItem(`departments-staff-page-${deptId}`)
        return saved ? parseInt(saved, 10) : 1
      }
    } catch (e) {
      return 1
    }
  }
  return 1
}
const staffCurrentPage = ref(getStaffInitialPage())
const staffItemsPerPage = ref(100)

// Staff modal
const showStaffModal = ref(false)
const editingStaff = ref<Staff | null>(null)

// Bulk delete staff
const selectedStaffForBulk = ref<Staff[]>([])
const showBulkDeleteStaffModal = ref(false)
const bulkDeleteStaffConfirmed = ref(false)
const isBulkDeletingStaff = ref(false)
const toast = useToast()

const departmentsStore = useDepartmentsStore()
const staffStore = useStaffStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const sidebarCollapsed = ref(false)
const isStaffFullscreen = ref(false)
const openStaffMenuId = ref<string | null>(null)

const toggleStaffMenu = (staffId: string) => {
  openStaffMenuId.value = openStaffMenuId.value === staffId ? null : staffId
}

// Handle ESC key to exit fullscreen and close menus
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isStaffFullscreen.value) {
      isStaffFullscreen.value = false
    }
    openStaffMenuId.value = null
  }
}

// Watch fullscreen state to lock/unlock body scroll
watch(isStaffFullscreen, (fullscreen) => {
  if (import.meta.client) {
    if (fullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

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
// Check if current user is a manager in the department (even if they're a super admin)
const isManager = computed(() => {
  if (!department.value || !currentStaffMember.value) return false
  return currentStaffMember.value.role === 'manager' && 
         currentStaffMember.value.departmentId === department.value.id
})
// Get permissions
const { canCreateStaff, canManage } = usePermissions()
// Only super admins can create staff (managers cannot create staff)
// Managers can edit/delete staff but not create new staff
const canManageDepartments = computed(() => canManage.value)
const canCreateNewStaff = computed(() => canCreateStaff.value)

// Current staff member (for staff users and to check manager status)
const currentStaffMember = ref<Staff | null>(null)

const paginatedStaff = computed(() => {
  const start = (staffCurrentPage.value - 1) * staffItemsPerPage.value
  const end = start + staffItemsPerPage.value
  return staff.value.slice(start, end)
})

const toggleStaffSelection = (member: Staff, checked: boolean) => {
  const idx = selectedStaffForBulk.value.findIndex(s => s.id === member.id)
  if (checked && idx === -1) selectedStaffForBulk.value.push(member)
  else if (!checked && idx !== -1) selectedStaffForBulk.value.splice(idx, 1)
}
const toggleSelectAllStaff = (checked: boolean) => {
  if (checked) selectedStaffForBulk.value = [...paginatedStaff.value]
  else selectedStaffForBulk.value = []
}
const openBulkDeleteStaffModal = () => {
  bulkDeleteStaffConfirmed.value = false
  showBulkDeleteStaffModal.value = true
}
const handleConfirmBulkDeleteStaff = async () => {
  if (!bulkDeleteStaffConfirmed.value || selectedStaffForBulk.value.length === 0) return
  isBulkDeletingStaff.value = true
  const ids = selectedStaffForBulk.value.map(s => s.id)
  const count = ids.length
  try {
    for (const id of ids) {
      await staffStore.deleteStaff(id)
    }
    selectedStaffForBulk.value = []
    showBulkDeleteStaffModal.value = false
    bulkDeleteStaffConfirmed.value = false
    await loadDepartmentData()
    toast.success(`${count} staff member${count !== 1 ? 's' : ''} deleted`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete some staff members')
  } finally {
    isBulkDeletingStaff.value = false
  }
}

// Computed stats for compact header
const totalManagers = computed(() => {
  return staff.value.filter(m => m.role === 'manager').length
})

const activeStaff = computed(() => {
  return staff.value.filter(m => m.status === 'active').length
})

const onLeaveStaff = computed(() => {
  return staff.value.filter(m => m.status === 'on_leave').length
})

// Computed property for current manager name
const currentManager = computed(() => {
  const manager = staff.value.find(m => m.role === 'manager')
  if (manager) {
    return `${manager.firstName} ${manager.lastName}`
  }
  return 'Not assigned'
})


// Load department and staff data
const loadDepartmentData = async () => {
  // Fetch user data if authenticated and not already loaded
  if (authStore.currentUser?.uid && !userStore.userData) {
    await userStore.fetchUserData(authStore.currentUser.uid)
  }

  if (!departmentId.value || typeof departmentId.value !== 'string') {
    console.error('Invalid department ID:', departmentId.value)
    navigateTo('/dashboard/departments')
    return
  }

  isLoadingDepartment.value = true
  isLoadingStaff.value = true
  
  try {
    // Load department using Pinia store
    const dept = await departmentsStore.fetchDepartment(departmentId.value)
    if (dept) {
      department.value = dept
      useHead({
        title: `${dept.name || 'Department'} - Department Management - Storvv`,
      })
    } else {
      // Department not found, redirect
      navigateTo('/dashboard/departments')
      return
    }

    // Load staff for this department using Pinia store
    await staffStore.fetchStaffByDepartment(departmentId.value)
    // Get staff from store getter (it's a function that takes departmentId)
    staff.value = staffStore.getStaffByDepartment(departmentId.value)

    // Get current staff member data (for staff users and to check if user is a manager)
    // This helps determine if a super admin is also a manager in this department
    try {
      const staffMember = await staffStore.fetchCurrentStaffMember()
      if (staffMember && staffMember.departmentId === departmentId.value) {
        currentStaffMember.value = staffMember
      }
    } catch (error) {
      // Not a staff member in this department, that's okay
      if (userStore.userData?.role === 'staff') {
        // If they're a staff user, they should be in a department
        console.warn('Staff user not found in department:', error)
      }
    }

  } catch (error: any) {
    console.error('Error loading department data:', error.message || error)
    alert(error.message || 'Failed to load department data')
    navigateTo('/dashboard/departments')
  } finally {
    isLoadingDepartment.value = false
    isLoadingStaff.value = false
  }
}


// Staff management functions
const openCreateStaffModal = () => {
  editingStaff.value = null
  showStaffModal.value = true
}

const handleEditStaff = (staffMember: Staff) => {
  editingStaff.value = staffMember
  showStaffModal.value = true
}

const handleToggleStaffRole = async (staffMember: Staff) => {
  const { useToast } = await import('~/composables/useToast')
  const toast = useToast()
  
  const newRole = staffMember.role === 'manager' ? 'staff' : 'manager'
  const roleLabel = newRole === 'manager' ? 'Manager' : 'Staff'
  
  // Optimistically update the UI
  const staffIndex = staff.value.findIndex(s => s.id === staffMember.id)
  let originalRole: 'manager' | 'staff' | 'intern' | null = null
  
  if (staffIndex > -1 && staff.value[staffIndex]) {
    // Store original role for potential revert
    originalRole = staff.value[staffIndex].role
    // Update the role in the local array directly
    staff.value[staffIndex].role = newRole as 'manager' | 'staff' | 'intern'
  }
  
  try {
    await staffStore.updateStaff(staffMember.id, {
      role: newRole as 'manager' | 'staff' | 'intern',
    })
    
    // Update department manager field if needed
    if (department.value) {
      const manager = staff.value.find(m => m.role === 'manager')
      if (manager) {
        department.value.manager = `${manager.firstName} ${manager.lastName}`
      } else {
        department.value.manager = 'Not assigned'
      }
    }
    
    // Refresh from store to ensure consistency (non-blocking)
    staffStore.fetchStaffByDepartment(departmentId.value).then(() => {
      staff.value = staffStore.getStaffByDepartment(departmentId.value)
      // Also refresh department to sync manager field
      departmentsStore.fetchDepartment(departmentId.value).then(() => {
        const updatedDept = departmentsStore.getDepartmentById(departmentId.value)
        if (updatedDept) {
          department.value = updatedDept
        }
      }).catch(console.error)
    }).catch(console.error)
    
    toast.success(`${staffMember.firstName} ${staffMember.lastName} role changed to ${roleLabel}`)
  } catch (error: any) {
    // Revert optimistic update on error
    if (staffIndex > -1 && originalRole !== null && staff.value[staffIndex]) {
      staff.value[staffIndex].role = originalRole
    }
    toast.error(error.message || 'Failed to update staff role')
  }
}

const handleDeleteStaff = async (staffMember: Staff) => {
  if (confirm(`Are you sure you want to delete ${staffMember.firstName} ${staffMember.lastName}? This action cannot be undone.`)) {
    try {
      await staffStore.deleteStaff(staffMember.id)
      await loadDepartmentData() // Reload to update staff list and counts
      alert('Staff member deleted successfully')
    } catch (error: any) {
      alert(error.message || 'Failed to delete staff member')
    }
  }
}

const handleStaffSuccess = async () => {
  // Close modal immediately for better UX
  showStaffModal.value = false
  editingStaff.value = null
  
  // Refresh staff list in the background (non-blocking)
  // The store's createStaff already triggers background refresh, but we'll also refresh here
  // to ensure the table updates reactively
  isLoadingStaff.value = true
  
  // Refresh in background without blocking
  Promise.all([
    // Refresh staff for this department
    staffStore.fetchStaffByDepartment(departmentId.value).then(() => {
      // Update local staff ref from store getter
      staff.value = staffStore.getStaffByDepartment(departmentId.value)
    }),
    // Also refresh the department to update staff count
    departmentsStore.fetchDepartment(departmentId.value).then(() => {
      // Update local department ref
      const updatedDept = departmentsStore.getDepartmentById(departmentId.value)
      if (updatedDept) {
        department.value = updatedDept
      }
    }),
  ]).then(() => {
    console.log('[Department Page] Staff list refreshed after creation')
  }).catch((error: any) => {
    console.error('Error refreshing staff after creation:', error)
  }).finally(() => {
    isLoadingStaff.value = false
  })
}

const handleStaffError = (error: string) => {
  console.error('Staff error:', error)
}

const handleStaffPageChange = (page: number) => {
  staffCurrentPage.value = page
  // Save to localStorage with department ID
  if (import.meta.client) {
    try {
      const deptId = departmentId.value
      if (deptId) {
        localStorage.setItem(`departments-staff-page-${deptId}`, page.toString())
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch for page changes to persist
watch(staffCurrentPage, (newPage) => {
  if (import.meta.client) {
    try {
      const deptId = departmentId.value
      if (deptId) {
        localStorage.setItem(`departments-staff-page-${deptId}`, newPage.toString())
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

// Watch for department ID changes and restore pagination
watch(() => route.params.id, (newDeptId) => {
  if (import.meta.client && newDeptId) {
    try {
      const saved = localStorage.getItem(`departments-staff-page-${newDeptId}`)
      if (saved) {
        staffCurrentPage.value = parseInt(saved, 10)
      } else {
        staffCurrentPage.value = 1
      }
    } catch (e) {
      staffCurrentPage.value = 1
    }
  }
}, { immediate: false })

// Watch for route parameter changes when navigating between departments
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId && typeof newId === 'string') {
    // Clear previous data
    department.value = null
    staff.value = []
    isLoadingDepartment.value = true
    isLoadingStaff.value = true
    // Load new data
    try {
      await loadDepartmentData()
    } catch (error) {
      console.error('Error loading department data:', error)
    }
  }
}, { immediate: false })

onMounted(async () => {
  // Add keyboard listener for ESC key
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        openStaffMenuId.value = null
      }
    })
  }

  if (import.meta.server) return

  // Wait for auth and user data to load
  let attempts = 0
  while ((authStore.loading || !userStore.userData) && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  // Check if user is staff/intern and redirect
  if (userStore.userData?.role === 'staff') {
    console.log('[DepartmentDetailPage] Staff user detected - redirecting to dashboard')
    await navigateTo('/dashboard')
    return
  }

  // Load data immediately
  await loadDepartmentData()
})

// Cleanup keyboard listener and restore body overflow
onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
  }
})
</script>

