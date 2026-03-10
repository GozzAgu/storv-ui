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
      class="rounded-xl bg-primary-50/80 dark:bg-primary-900/20 ring-1 ring-primary-200/60 dark:ring-primary-800/50 p-3 sm:p-4 mb-4"
    >
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex-1 min-w-0">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ store.name }}</h2>
          <p v-if="store.description" class="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">{{ store.description }}</p>
          <p v-if="store.address" class="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            {{ store.address }}
          </p>
        </div>
        <span
          v-if="currentStore?.id === store.id"
          class="px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full flex-shrink-0"
        >
          Current store
        </span>
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
        <Button variant="outline" @click="resetFilters" :icon="ArrowPathIcon" extra-class="!rounded-full sm:w-auto w-full" size="sm">Reset</Button>
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

    <div v-else-if="!departmentsStore.error" class="space-y-6">
      <div class="hidden lg:flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 px-3 sm:px-5 py-3 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <div class="flex items-center flex-wrap gap-6">
          <div class="flex items-center gap-2">
            <BuildingOfficeIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span class="text-sm text-gray-600 dark:text-gray-400">Departments:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ storeDepartments.length }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UsersIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
            <span class="text-sm text-gray-600 dark:text-gray-400">Staff:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ totalStaffForStore }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search departments..."
              class="pl-9 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-56"
            />
          </div>
          <button
            @click="resetFilters"
            class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
            title="Reset filters"
          >
            <ArrowPathIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div v-if="paginatedDepartments.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
        <div
          v-for="department in paginatedDepartments"
          :key="department.id"
          class="group relative flex items-center w-full min-h-[52px] sm:min-h-[50px] rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-700/60 transition-all duration-200 active:scale-[0.99] sm:hover:scale-[1.02] hover:ring-primary-500/30 dark:hover:ring-primary-400/30 cursor-pointer overflow-hidden py-2 px-2.5 sm:py-2 sm:px-0"
          :class="{ 'opacity-60 cursor-not-allowed': department.isActive === false }"
          @click="department.isActive === false ? null : navigateToDepartment(department.id)"
        >
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
      class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-30 transition-[left] duration-300 rounded-t-2xl safe-area-inset-bottom"
      :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
    >
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredDepartments.length"
        @page-change="handlePageChange"
      />
    </div>

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
  Cog6ToothIcon,
  UsersIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import Breadcrumbs from '~/components/ui/Breadcrumbs.vue'
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
