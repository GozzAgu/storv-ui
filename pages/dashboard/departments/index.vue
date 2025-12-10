<template>
  <div class="space-y-6 pb-24">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Departments</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Manage your store departments and staff</p>
    </div>

    <!-- Stats Cards - Hidden on large screens -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:hidden">
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Departments</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ departmentsStore.totalDepartments }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Active departments</p>
          </div>
          <div class="w-12 h-12 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BuildingOfficeIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ totalStaff }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">All departments</p>
          </div>
          <div class="w-12 h-12 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UsersIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-primary-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ totalManagers }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Department heads</p>
          </div>
          <div class="w-12 h-12 rounded-md bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <UserCircleIcon class="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Staff/Dept</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ averageStaffPerDept }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Per department</p>
          </div>
          <div class="w-12 h-12 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ChartBarIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Staff Member Banner (only for staff users) -->
    <Card v-if="isStaff && currentStaffMember" padding="md" extra-class="bg-gradient-to-r from-primary-50 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/20 border-l-4 border-l-primary-500">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
            <UsersIcon class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              You are a member of {{ currentStaffMember.departmentName || 'a department' }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Position: {{ currentStaffMember.position }} • Role: {{ currentStaffMember.role }}
            </p>
          </div>
        </div>
        <NuxtLink
          :to="currentDepartment && currentDepartment.isActive === false ? '#' : `/dashboard/departments/${currentStaffMember.departmentId}`"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          :class="{ 'opacity-50 cursor-not-allowed pointer-events-none': currentDepartment && currentDepartment.isActive === false }"
          :title="currentDepartment && currentDepartment.isActive === false ? 'This department is inactive' : ''"
        >
          View My Department
        </NuxtLink>
      </div>
    </Card>

    <!-- Filters - Hidden on large screens -->
    <Card padding="md" class="lg:hidden">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search departments by name, manager..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <Button
          variant="outline"
          @click="resetFilters"
          :icon="ArrowPathIcon"
        >
          Reset
        </Button>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-if="departmentsStore.error && !departmentsStore.loading">
      <div class="text-center py-12">
        <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <BuildingOfficeIcon class="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Error Loading Departments
        </h3>
        <p class="text-sm text-red-600 dark:text-red-400 mb-6 max-w-md mx-auto">
          {{ departmentsStore.error }}
        </p>
        <Button
          variant="primary"
          :icon="ArrowPathIcon"
          @click="handleRetryFetch"
        >
          Retry
        </Button>
      </div>
    </Card>

    <!-- Loading State - Skeleton -->
    <template v-else-if="departmentsStore.loading">
      <!-- Stats Cards Skeleton -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <Card v-for="i in 4" :key="i" padding="sm" extra-class="sm:p-4">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3 mb-2 animate-pulse"></div>
              <div class="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-1 animate-pulse"></div>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse ml-2"></div>
          </div>
        </Card>
      </div>

      <!-- Departments Grid Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card v-for="i in 8" :key="i" padding="sm" extra-class="sm:p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-2 animate-pulse"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 animate-pulse"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-full animate-pulse"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3 animate-pulse"></div>
          </div>
        </Card>
      </div>
    </template>

    <!-- Compact Header (Visible only on large screens) -->
    <Card v-if="!departmentsStore.loading && !departmentsStore.error" padding="sm" class="hidden lg:block mb-4">
      <div class="flex items-center justify-between">
        <!-- Compact Stats -->
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <BuildingOfficeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Departments:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ departmentsStore.totalDepartments }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UsersIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Staff:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ totalStaff }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UserCircleIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Managers:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ totalManagers }}</span>
          </div>
          <div class="flex items-center gap-2">
            <ChartBarIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Avg/Dept:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ averageStaffPerDept }}</span>
          </div>
        </div>
        <!-- Compact Search -->
        <div class="flex items-center gap-3">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search departments..."
              class="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>
          <button
            @click="resetFilters"
            class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Reset filters"
          >
            <ArrowPathIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>

    <!-- Departments Grid -->
    <div v-if="!departmentsStore.loading && !departmentsStore.error && paginatedDepartments.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        v-for="department in paginatedDepartments"
        :key="department.id"
        padding="md"
        :extra-class="`group transition-shadow relative ${department.isActive === false ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}`"
        @click="department.isActive === false ? null : navigateToDepartment(department.id)"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-md bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
              {{ department.name.charAt(0) }}
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {{ department.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ department.departmentType || 'N/A' }}
              </p>
            </div>
          </div>
          <div v-if="canManageDepartments" class="flex items-center gap-1 z-10 flex-shrink-0">
            <button
              @click.stop="department.isActive === false ? null : handleEditDepartment(department)"
              :disabled="department.isActive === false"
              class="flex-shrink-0 p-1.5 sm:p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :title="department.isActive === false ? 'Department is inactive' : 'Edit'"
            >
              <PencilSquareIcon class="w-5 h-5 flex-shrink-0" />
            </button>
            <button
              @click.stop="department.isActive === false ? null : handleDeleteDepartment(department)"
              :disabled="department.isActive === false"
              class="flex-shrink-0 p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :title="department.isActive === false ? 'Department is inactive' : 'Delete'"
            >
              <TrashIcon class="w-5 h-5 flex-shrink-0" />
            </button>
          </div>
          <div v-if="department.isActive === false" class="absolute top-2 right-2 z-10">
            <span class="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">Inactive</span>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Manager:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ department.manager || 'Not assigned' }}
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Staff Count:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ department.staffCount }} members
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Type:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ department.departmentType || 'N/A' }}
            </span>
          </div>
        </div>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-if="!departmentsStore.loading && !departmentsStore.error && paginatedDepartments.length === 0 && filteredDepartments.length === 0">
      <div class="text-center py-12">
        <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <BuildingOfficeIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {{ searchQuery ? 'No departments found' : 'No departments yet' }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search' : 'Create your first department to organize your store' }}
        </p>
        <Button
          v-if="!searchQuery && canManageDepartments"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateDepartmentModal"
        >
          Create First Department
        </Button>
      </div>
    </Card>

    <!-- Fixed Pagination -->
    <div
      v-if="filteredDepartments.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300"
      :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'"
    >
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredDepartments.length"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Department Modal -->
    <DepartmentModal
      v-model="showDepartmentModal"
      :department="editingDepartment"
      @success="handleDepartmentSuccess"
      @error="handleDepartmentError"
    />
  </div>

  <!-- Floating Action Button - Only visible for non-staff -->
  <button
    v-if="canManageDepartments"
    @click="openCreateDepartmentModal"
    class="fixed bottom-24 right-6 w-11 h-11 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
    title="Create new department"
  >
    <PlusIcon class="w-5 h-5" />
  </button>
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
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
import DepartmentModal from '~/components/departments/DepartmentModal.vue'
import type { Department } from '~/composables/useDepartments'

definePageMeta({
  layout: 'dashboard',
  ssr: false // Disable SSR for this page since it requires authentication and client-side data
})

useHead({
  title: 'Departments - Storv',
})

const showDepartmentModal = ref(false)
const editingDepartment = ref<Department | null>(null)

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
const itemsPerPage = ref(20)

// Import stores directly - Pinia handles SSR automatically
import { useDepartmentsStore } from '~/stores/departments'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import type { Staff } from '~/composables/useStaff'

// Get store instances - only accessible on client
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
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


