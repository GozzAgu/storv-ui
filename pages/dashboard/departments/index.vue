<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Departments</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Manage your store departments and staff</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Departments</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ departmentsStore.totalDepartments }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Active departments</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
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
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UsersIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ totalManagers }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Department heads</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <UserCircleIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
          <div class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ChartBarIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Staff Member Banner (only for staff users) -->
    <Card v-if="isStaff && currentStaffMember" padding="md" extra-class="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-l-4 border-l-primary-500">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
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
          :to="`/dashboard/departments/${currentStaffMember.departmentId}`"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          View My Department
        </NuxtLink>
      </div>
    </Card>

    <!-- Filters -->
    <Card padding="md">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search departments by name, manager..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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

    <!-- Loading State -->
    <Card v-else-if="departmentsStore.loading">
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading departments...</p>
      </div>
    </Card>

    <!-- Departments Grid -->
    <div v-else-if="paginatedDepartments.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        v-for="department in paginatedDepartments"
        :key="department.id"
        padding="md"
        extra-class="group hover:shadow-lg transition-shadow relative cursor-pointer"
        @click="navigateToDepartment(department.id)"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
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
          <div v-if="canManageDepartments" class="flex items-center gap-1 z-10">
            <button
              @click.stop="handleEditDepartment(department)"
              class="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              title="Edit"
            >
              <PencilIcon class="w-5 h-5" />
            </button>
            <button
              @click.stop="handleDeleteDepartment(department)"
              class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
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
    <Card v-else-if="!departmentsStore.loading">
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

    <!-- Pagination -->
    <Pagination
      v-if="filteredDepartments.length > 0"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total="filteredDepartments.length"
      @page-change="handlePageChange"
    />

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
    class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
    title="Create new department"
  >
    <PlusIcon class="w-6 h-6" />
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
  PencilIcon,
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
const currentPage = ref(1)
const itemsPerPage = ref(12)

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

// Check if current user is staff (limited permissions)
const isStaff = computed(() => userStore.userData?.role === 'staff')
const canManageDepartments = computed(() => !isStaff.value) // Only non-staff can manage

// Current staff member data (for staff users)
const currentStaffMember = ref<Staff | null>(null)

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
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Load departments on mount
onMounted(async () => {
  // Only run on client
  if (import.meta.server) return
  
  // Fetch user data if authenticated and not already loaded
  if (authStore.currentUser?.uid && !userStore.userData) {
    await userStore.fetchUserData(authStore.currentUser.uid)
  }

  // If user is staff, fetch their staff member data
  if (userStore.userData?.role === 'staff') {
    try {
      currentStaffMember.value = await staffStore.fetchCurrentStaffMember()
    } catch (error) {
      console.error('Error fetching current staff member:', error)
    }
  }
  
  try {
    // Wait for auth to finish loading before loading departments
    if (authStore.loading) {
      let resolved = false
      await new Promise((resolve) => {
        const unwatch = watch(() => authStore.loading, (val) => {
          if (!val && !resolved) {
            resolved = true
            unwatch()
            resolve(true)
          }
        })
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!resolved) {
            resolved = true
            unwatch()
            resolve(true)
          }
        }, 5000)
      })
    }
    
    // Only load departments if user is authenticated
    if (authStore.currentUser) {
      await departmentsStore.fetchDepartments()
    }
  } catch (error: any) {
    console.error('Error loading departments:', error.message || error)
  }
})

// Watch for auth state changes
watch(() => authStore.currentUser, async (newUser) => {
  if (import.meta.server) return
  if (newUser && !departmentsStore.loading && departmentsStore.departments.length === 0) {
    try {
      await departmentsStore.fetchDepartments()
    } catch (error) {
      // Silently handle - error is already in store
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

const handleRetryFetch = async () => {
  await departmentsStore.fetchDepartments()
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


