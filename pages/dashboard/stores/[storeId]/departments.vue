<template>
  <div class="space-y-3 pb-24 sm:pb-20 min-h-screen w-full">
    <!-- Page Header - Compact -->
    <div>
      <div class="flex items-center gap-2 mb-1">
        <NuxtLink
          to="/dashboard/settings"
          class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium"
        >
          ← Back to Settings
        </NuxtLink>
      </div>
      <h1 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
        {{ store?.name || 'Store' }} - Departments
      </h1>
      <p class="mt-0.5 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
        Manage departments and staff for this store
      </p>
    </div>

    <!-- Store Info Card - Compact -->
    <Card v-if="store" padding="sm" extra-class="bg-gradient-to-r from-primary-50 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/20 border-l-4 border-l-primary-500 p-2.5">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{{ store.name }}</h2>
          <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1" v-if="store.description">
            {{ store.description }}
          </p>
          <div class="flex items-center gap-2 mt-1 text-[10px] text-gray-500 dark:text-gray-500">
            <span v-if="store.address" class="truncate">
              <svg class="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {{ store.address }}
            </span>
          </div>
        </div>
        <span
          v-if="currentStore?.id === store.id"
          class="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full flex-shrink-0 ml-2"
        >
          Current Store
        </span>
      </div>
    </Card>

    <!-- Stats Cards - Compact -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:hidden">
      <Card padding="sm" extra-class="border-l-4 border-l-blue-500 p-2.5">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate">Total Departments</p>
            <p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {{ storeDepartments.length }}
            </p>
          </div>
          <div class="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 ml-2">
            <BuildingOfficeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="sm" extra-class="border-l-4 border-l-green-500 p-2.5">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate">Total Staff</p>
            <p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {{ totalStaffForStore }}
            </p>
          </div>
          <div class="w-8 h-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 ml-2">
            <UsersIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters - Compact -->
    <Card padding="sm" class="lg:hidden p-2.5">
      <div class="flex flex-col md:flex-row gap-2">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search departments..."
            class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <Button
          variant="outline"
          @click="resetFilters"
          :icon="ArrowPathIcon"
          class="w-full md:w-auto text-xs py-2"
        >
          Reset
        </Button>
      </div>
    </Card>

    <!-- Error State - Compact -->
    <Card v-if="departmentsStore.error && !departmentsStore.loading" padding="sm" extra-class="p-4">
      <div class="text-center py-6">
        <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
          <BuildingOfficeIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Error Loading Departments
        </h3>
        <p class="text-xs text-red-600 dark:text-red-400 mb-4 max-w-md mx-auto px-4">
          {{ departmentsStore.error }}
        </p>
        <Button
          variant="primary"
          :icon="ArrowPathIcon"
          @click="handleRetryFetch"
          class="text-xs"
        >
          Retry
        </Button>
      </div>
    </Card>

    <!-- Loading State - Skeleton -->
    <template v-else-if="departmentsStore.loading || storesLoading">
      <!-- Stats Cards Skeleton -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <Card v-for="i in 4" :key="i" padding="sm" extra-class="p-2.5">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1.5 animate-pulse"></div>
              <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            </div>
            <div class="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse ml-2"></div>
          </div>
        </Card>
      </div>

      <!-- Departments Grid Skeleton -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
        <div v-for="i in 8" :key="i" class="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="flex items-center justify-between p-2.5 border-b border-gray-100 dark:border-gray-700/50">
            <div class="flex items-center gap-2 flex-1">
              <div class="w-7 h-7 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              <div class="flex-1">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
            <div class="flex gap-0.5">
              <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
          <div class="p-2.5">
            <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
              <div class="flex items-center justify-between">
                <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Compact Header (Visible only on large screens) -->
    <Card v-if="!departmentsStore.loading && !departmentsStore.error && !storesLoading" padding="sm" class="hidden lg:block mb-3 p-2.5">
      <div class="flex items-center justify-between gap-4">
        <!-- Compact Stats -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <BuildingOfficeIcon class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Departments:</span>
            <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ storeDepartments.length }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UsersIcon class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Staff:</span>
            <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ totalStaffForStore }}</span>
          </div>
        </div>
        <!-- Compact Search -->
        <div class="flex items-center gap-2">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search departments..."
              class="pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-56"
            />
          </div>
          <button
            @click="resetFilters"
            class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Reset filters"
          >
            <ArrowPathIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>

    <!-- Departments Grid - Compact -->
    <div v-if="!departmentsStore.loading && !departmentsStore.error && !storesLoading && paginatedDepartments.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 mb-4">
      <div
        v-for="department in paginatedDepartments"
        :key="department.id"
        class="group relative bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer transition-all duration-200 overflow-hidden"
        :class="{ 'opacity-60 cursor-not-allowed': department.isActive === false }"
        @click="department.isActive === false ? null : navigateToDepartment(department.id)"
      >
        <!-- Compact Card Header -->
        <div class="flex items-center justify-between p-2.5 border-b border-gray-100 dark:border-gray-700/50">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-7 h-7 rounded-md bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center flex-shrink-0">
              <BuildingOfficeIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {{ department.name }}
              </h3>
            </div>
          </div>
          <div v-if="canManageDepartments" class="flex items-center gap-0.5 flex-shrink-0 ml-1">
            <button
              @click.stop="department.isActive === false ? null : handleEditDepartment(department)"
              :disabled="department.isActive === false"
              class="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:bg-primary-100 dark:active:bg-primary-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :title="department.isActive === false ? 'Department is inactive' : 'Edit'"
            >
              <PencilSquareIcon class="w-3.5 h-3.5 flex-shrink-0" />
            </button>
            <button
              @click.stop="department.isActive === false ? null : handleDeleteDepartment(department)"
              :disabled="department.isActive === false"
              class="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :title="department.isActive === false ? 'Department is inactive' : 'Delete'"
            >
              <TrashIcon class="w-3.5 h-3.5 flex-shrink-0" />
            </button>
          </div>
          <div v-if="department.isActive === false" class="absolute top-2 right-2 z-10">
            <span class="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">Inactive</span>
          </div>
        </div>

        <!-- Compact Card Body -->
        <div class="p-2.5">
          <!-- Department Type - Compact -->
          <p class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-2.5 min-h-[0.875rem]">
            {{ department.departmentType || 'N/A' }}
          </p>
          
          <!-- Department Stats - Compact Horizontal Layout -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <UserCircleIcon class="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span class="text-[10px] text-gray-600 dark:text-gray-400">Manager</span>
              </div>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate ml-1 max-w-[60%]">
                {{ department.manager || 'Not assigned' }}
              </span>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <UsersIcon class="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span class="text-[10px] text-gray-600 dark:text-gray-400">Staff</span>
              </div>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {{ department.staffCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State - Compact -->
    <Card v-if="!departmentsStore.loading && !departmentsStore.error && !storesLoading && paginatedDepartments.length === 0 && filteredDepartments.length === 0" padding="sm" extra-class="p-4">
      <div class="text-center py-6">
        <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-2">
          <BuildingOfficeIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          {{ searchQuery ? 'No departments found' : 'No departments yet' }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4 px-4">
          {{ searchQuery ? 'Try adjusting your search' : 'Create your first department for this store' }}
        </p>
        <Button
          v-if="!searchQuery && canManageDepartments"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateDepartmentModal"
          class="text-xs"
        >
          Create First Department
        </Button>
      </div>
    </Card>

    <!-- Fixed Pagination - Mobile Optimized -->
    <div
      v-if="filteredDepartments.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300 safe-area-inset-bottom"
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
      :storeId="storeId"
      @success="handleDepartmentSuccess"
      @error="handleDepartmentError"
    />
  </div>

  <!-- Floating Action Button - Mobile Optimized -->
  <button
    v-if="canManageDepartments"
    @click="openCreateDepartmentModal"
    class="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-14 h-14 sm:w-11 sm:h-11 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40 touch-manipulation"
    title="Create new department"
  >
    <PlusIcon class="w-6 h-6 sm:w-5 sm:h-5" />
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  PlusIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserCircleIcon,
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
const itemsPerPage = ref(20)

// Import stores directly - Pinia handles SSR automatically
import { useDepartmentsStore } from '~/stores/departments'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import { useStoresStore } from '~/stores/stores'

// Get store instances - only accessible on client
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const storesStore = useStoresStore()
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
