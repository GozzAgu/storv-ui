<template>
  <div class="space-y-6 pb-24">
    <!-- Header with Back Button -->
    <div class="flex items-center gap-4">
      <button
        @click="navigateTo('/dashboard/departments')"
        class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        title="Back to departments"
      >
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <div class="flex-1">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ department?.name || 'Loading...' }}
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Department Management
        </p>
      </div>
    </div>

    <!-- Department Info Card -->
    <Card padding="md">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Department Type</p>
          <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ department?.departmentType || '-' }}
          </p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Manager</p>
          <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ department?.manager || 'Not assigned' }}
          </p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
          <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ department?.staffCount || 0 }} members
          </p>
        </div>
      </div>
    </Card>

    <!-- Stats Cards - Hidden on large screens -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:hidden">
      <Card padding="md" extra-class="border-l-4 border-l-primary-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ staff.length }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <UsersIcon class="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </Card>
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ totalManagers }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <UserCircleIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>
      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ activeStaff }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircleIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Staff Management Section -->
    <Card padding="none">
      <!-- Compact Header (Visible only on large screens) -->
      <div v-if="!isLoadingStaff && staff.length > 0" class="hidden lg:block border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <!-- Compact Stats -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <UsersIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Staff:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ staff.length }}</span>
            </div>
            <div class="flex items-center gap-2">
              <UserCircleIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Managers:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ totalManagers }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircleIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Active:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ activeStaff }}</span>
            </div>
            <div class="flex items-center gap-2">
              <ClockIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">On Leave:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ onLeaveStaff }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Staff Table -->
      <div v-if="isLoadingStaff" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading staff...</p>
      </div>

      <div v-else-if="staff.length === 0" class="text-center py-8">
        <UsersIcon class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">No staff members in this department yet</p>
      </div>

      <div v-else class="overflow-x-auto mb-6">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Name
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Position
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Role
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Email
              </th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th v-if="canManageDepartments" class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="member in paginatedStaff"
              :key="member.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-3 py-2 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {{ member.firstName.charAt(0).toUpperCase() }}{{ member.lastName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ member.firstName }} {{ member.lastName }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ member.phone || 'No phone' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <span class="text-sm text-gray-900 dark:text-gray-100">
                  {{ member.position }}
                </span>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
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
              <td class="px-3 py-2 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ member.email }}
                </div>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
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
              <td class="px-3 py-2 whitespace-nowrap text-right min-w-[100px]">
                <div class="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    v-if="canManageDepartments"
                    @click="handleEditStaff(member)"
                    class="flex-shrink-0 p-1.5 sm:p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    v-if="canManageDepartments"
                    @click="handleDeleteStaff(member)"
                    class="flex-shrink-0 p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Fixed Staff Pagination -->
    <div
      v-if="staff.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300"
      :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'"
    >
      <Pagination
        :current-page="staffCurrentPage"
        :items-per-page="staffItemsPerPage"
        :total="staff.length"
        @page-change="handleStaffPageChange"
      />
    </div>

    <!-- Floating Action Button -->
    <button
      v-if="canManageDepartments && !isLoadingStaff"
      @click="openCreateStaffModal"
      class="fixed bottom-24 right-6 w-11 h-11 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Add new staff"
    >
      <PlusIcon class="w-5 h-5" />
    </button>

    <!-- Staff Modal -->
    <StaffModal
      v-if="departmentId"
      v-model="showStaffModal"
      :department-id="departmentId"
      :staff="editingStaff"
      @success="handleStaffSuccess"
      @error="handleStaffError"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  ArrowLeftIcon,
  PlusIcon,
  UsersIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
import StaffModal from '~/components/departments/StaffModal.vue'
import { useDepartmentsStore } from '~/stores/departments'
import { useStaffStore } from '~/stores/staff'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import type { Department } from '~/composables/useDepartments'
import type { Staff } from '~/composables/useStaff'

definePageMeta({
  layout: 'dashboard',
  key: (route) => `department-${route.params.id}`, // Force re-mount when ID changes
  middleware: 'auth', // Ensure auth middleware runs
  ssr: false // Disable SSR for client-side navigation
})

const route = useRoute()
const departmentId = computed(() => route.params.id as string)

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
const staffItemsPerPage = ref(20)

// Staff modal
const showStaffModal = ref(false)
const editingStaff = ref<Staff | null>(null)

const departmentsStore = useDepartmentsStore()
const staffStore = useStaffStore()
const authStore = useAuthStore()
const userStore = useUserStore()
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
// Check if current user is a manager in the department (even if they're a super admin)
const isManager = computed(() => {
  if (!department.value || !currentStaffMember.value) return false
  return currentStaffMember.value.role === 'manager' && 
         currentStaffMember.value.departmentId === department.value.id
})
// Only super admins who are not managers can manage (edit/delete staff)
const canManageDepartments = computed(() => !isStaff.value && !isManager.value)

// Current staff member (for staff users and to check manager status)
const currentStaffMember = ref<Staff | null>(null)

const paginatedStaff = computed(() => {
  const start = (staffCurrentPage.value - 1) * staffItemsPerPage.value
  const end = start + staffItemsPerPage.value
  return staff.value.slice(start, end)
})

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
        title: `${dept.name || 'Department'} - Department Management - Storv`,
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
  if (import.meta.server) return
  
  // Load data immediately
  await loadDepartmentData()
})
</script>

