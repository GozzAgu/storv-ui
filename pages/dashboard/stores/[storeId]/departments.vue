<template>
  <div class="space-y-4 sm:space-y-6 pb-24 sm:pb-20 min-h-screen w-full">
    <!-- Page Header - Mobile Optimized -->
    <div>
      <div class="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
        <NuxtLink
          to="/dashboard/settings"
          class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs sm:text-sm font-medium"
        >
          ← Back to Settings
        </NuxtLink>
      </div>
      <h1 class="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
        {{ store?.name || 'Store' }} - Departments
      </h1>
      <p class="mt-1.5 text-xs sm:text-base text-gray-600 dark:text-gray-400">
        Manage departments and staff for this store
      </p>
    </div>

    <!-- Store Info Card - Mobile Optimized -->
    <Card v-if="store" padding="sm" extra-class="bg-gradient-to-r from-primary-50 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/20 border-l-4 border-l-primary-500 sm:p-4">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{{ store.name }}</h2>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2" v-if="store.description">
            {{ store.description }}
          </p>
          <div class="flex items-center gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-xs text-gray-500 dark:text-gray-500">
            <span v-if="store.address" class="truncate">
              <svg class="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {{ store.address }}
            </span>
          </div>
        </div>
        <span
          v-if="currentStore?.id === store.id"
          class="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full flex-shrink-0 ml-2"
        >
          Current Store
        </span>
      </div>
    </Card>

    <!-- Stats Cards - Mobile Optimized -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:hidden">
      <Card padding="sm" extra-class="border-l-4 border-l-blue-500 sm:p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Departments</p>
            <p class="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 min-h-[2rem] sm:min-h-[2.5rem] leading-tight">
              {{ storeDepartments.length }}
            </p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 ml-2">
            <BuildingOfficeIcon class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="sm" extra-class="border-l-4 border-l-green-500 sm:p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Staff</p>
            <p class="mt-1.5 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 min-h-[2rem] sm:min-h-[2.5rem] leading-tight">
              {{ totalStaffForStore }}
            </p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 ml-2">
            <UsersIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters - Mobile Optimized -->
    <Card padding="sm" class="lg:hidden sm:p-4">
      <div class="flex flex-col md:flex-row gap-3 sm:gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search departments..."
            class="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <Button
          variant="outline"
          @click="resetFilters"
          :icon="ArrowPathIcon"
          class="w-full md:w-auto text-xs sm:text-sm"
        >
          Reset
        </Button>
      </div>
    </Card>

    <!-- Error State - Mobile Optimized -->
    <Card v-if="departmentsStore.error && !departmentsStore.loading" padding="sm" extra-class="sm:p-6">
      <div class="text-center py-8 sm:py-12">
        <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <BuildingOfficeIcon class="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Error Loading Departments
        </h3>
        <p class="text-xs sm:text-sm text-red-600 dark:text-red-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
          {{ departmentsStore.error }}
        </p>
        <Button
          variant="primary"
          :icon="ArrowPathIcon"
          @click="handleRetryFetch"
          class="w-full sm:w-auto text-xs sm:text-sm"
        >
          Retry
        </Button>
      </div>
    </Card>

    <!-- Loading State - Mobile Optimized -->
    <Card v-else-if="departmentsStore.loading || storesLoading" padding="sm" extra-class="sm:p-6">
      <div class="text-center py-8 sm:py-12">
        <div class="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Loading departments...</p>
      </div>
    </Card>

    <!-- Compact Header (Visible only on large screens) -->
    <Card v-if="!departmentsStore.loading && !departmentsStore.error && !storesLoading" padding="sm" class="hidden lg:block mb-4">
      <div class="flex items-center justify-between">
        <!-- Compact Stats -->
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <BuildingOfficeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Departments:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ storeDepartments.length }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UsersIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Staff:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ totalStaffForStore }}</span>
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

    <!-- Departments Grid - Mobile Optimized -->
    <div v-if="!departmentsStore.loading && !departmentsStore.error && !storesLoading && paginatedDepartments.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card
        v-for="department in paginatedDepartments"
        :key="department.id"
        padding="sm"
        :extra-class="`group transition-shadow relative sm:p-4 ${department.isActive === false ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}`"
        @click="department.isActive === false ? null : navigateToDepartment(department.id)"
      >
        <div class="flex items-start justify-between mb-3 sm:mb-4">
          <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              {{ department.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {{ department.name }}
              </h3>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ department.departmentType || 'N/A' }}
              </p>
            </div>
          </div>
          <div v-if="canManageDepartments" class="flex items-center gap-1 z-10 flex-shrink-0 ml-2">
            <button
              @click.stop="department.isActive === false ? null : handleEditDepartment(department)"
              :disabled="department.isActive === false"
              class="flex-shrink-0 p-1.5 sm:p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :title="department.isActive === false ? 'Department is inactive' : 'Edit'"
            >
              <PencilSquareIcon class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </button>
            <button
              @click.stop="department.isActive === false ? null : handleDeleteDepartment(department)"
              :disabled="department.isActive === false"
              class="flex-shrink-0 p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :title="department.isActive === false ? 'Department is inactive' : 'Delete'"
            >
              <TrashIcon class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </button>
          </div>
          <div v-if="department.isActive === false" class="absolute top-2 right-2 z-10">
            <span class="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">Inactive</span>
          </div>
        </div>

        <div class="space-y-2 sm:space-y-3">
          <div class="flex items-center justify-between text-xs sm:text-sm">
            <span class="text-gray-600 dark:text-gray-400">Manager:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100 truncate ml-2">
              {{ department.manager || 'Not assigned' }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs sm:text-sm">
            <span class="text-gray-600 dark:text-gray-400">Staff Count:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ department.staffCount }} members
            </span>
          </div>
        </div>
      </Card>
    </div>

    <!-- Empty State - Mobile Optimized -->
    <Card v-if="!departmentsStore.loading && !departmentsStore.error && !storesLoading && paginatedDepartments.length === 0 && filteredDepartments.length === 0" padding="sm" extra-class="sm:p-6">
      <div class="text-center py-8 sm:py-12">
        <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <BuildingOfficeIcon class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {{ searchQuery ? 'No departments found' : 'No departments yet' }}
        </h3>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 px-4">
          {{ searchQuery ? 'Try adjusting your search' : 'Create your first department for this store' }}
        </p>
        <Button
          v-if="!searchQuery && canManageDepartments"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateDepartmentModal"
          class="w-full sm:w-auto text-xs sm:text-sm"
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
  title: `Departments - Storv`,
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
