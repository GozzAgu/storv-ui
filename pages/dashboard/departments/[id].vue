<template>
  <div class="space-y-6">
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
          Department Management & Leave Requests
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

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card padding="md" extra-class="border-l-4 border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ staff.length }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <UsersIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Leaves</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ pendingLeavesCount }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ClockIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Approved This Month</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ approvedThisMonth }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircleIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">On Leave Now</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ onLeaveNow }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <CalendarDaysIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Staff Management Section -->
    <Card padding="md">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Staff Members</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage staff in this department</p>
        </div>
        <Button
          :icon="PlusIcon"
          @click="openCreateStaffModal"
        >
          Add Staff
        </Button>
      </div>

      <!-- Staff Table -->
      <div v-if="isLoadingStaff" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading staff...</p>
      </div>

      <div v-else-if="staff.length === 0" class="text-center py-8">
        <UsersIcon class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">No staff members in this department yet</p>
        <Button
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateStaffModal"
        >
          Add First Staff Member
        </Button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Position
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
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
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
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
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900 dark:text-gray-100">
                  {{ member.position }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                  :class="[
                    member.role === 'manager'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                      : member.role === 'intern'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  ]"
                >
                  {{ member.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ member.email }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
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
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="handleEditStaff(member)"
                    class="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="handleDeleteStaff(member)"
                    class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Staff Pagination -->
      <Pagination
        v-if="staff.length > 0"
        :current-page="staffCurrentPage"
        :items-per-page="staffItemsPerPage"
        :total="staff.length"
        @page-change="handleStaffPageChange"
        class="mt-4"
      />
    </Card>

    <!-- Filters -->
    <Card padding="md">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by staff name, leave type..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          v-model="statusFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          v-model="typeFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Types</option>
          <option value="vacation">Vacation</option>
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
        <Button
          variant="outline"
          @click="resetFilters"
          :icon="ArrowPathIcon"
        >
          Reset
        </Button>
      </div>
    </Card>

    <!-- Leave Requests Table -->
    <Card padding="none">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Staff Member
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Leave Type
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Start Date
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                End Date
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Days
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Reason
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="leave in paginatedLeaves"
              :key="leave.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {{ leave.staffName.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ leave.staffName }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ leave.staffEmail }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300 capitalize">
                  {{ leave.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ formatDate(leave.startDate) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ formatDate(leave.endDate) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ leave.days }} days
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="leave.reason">
                  {{ leave.reason }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    leave.status === 'approved'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : leave.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  ]"
                >
                  {{ leave.status.charAt(0).toUpperCase() + leave.status.slice(1) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="leave.status === 'pending'"
                    @click="handleApproveLeave(leave)"
                    class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Approve"
                  >
                    <CheckCircleIcon class="w-5 h-5" />
                  </button>
                  <button
                    v-if="leave.status === 'pending'"
                    @click="handleRejectLeave(leave)"
                    class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="handleViewLeave(leave)"
                    class="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="filteredLeaves.length === 0">
              <td colspan="8" class="px-6 py-12">
                <div class="text-center">
                  <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <CalendarDaysIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {{ searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'No leave requests found' : 'No leave requests yet' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Leave requests from staff will appear here' }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <Pagination
        v-if="filteredLeaves.length > 0"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredLeaves.length"
        @page-change="handlePageChange"
      />
    </Card>

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
  ClockIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  EyeIcon,
  PlusIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
import StaffModal from '~/components/departments/StaffModal.vue'
import { useDepartments, type Department } from '~/composables/useDepartments'
import { useStaff, type Staff } from '~/composables/useStaff'

definePageMeta({
  layout: 'dashboard',
  key: (route) => `department-${route.params.id}`, // Force re-mount when ID changes
  middleware: 'auth' // Ensure auth middleware runs
})

const route = useRoute()
const departmentId = computed(() => route.params.id as string)

interface LeaveRequest {
  id: string
  staffName: string
  staffEmail: string
  type: 'vacation' | 'sick' | 'personal' | 'other'
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  departmentId: string
}

const department = ref<Department | null>(null)
const staff = ref<Staff[]>([])
const leaves = ref<LeaveRequest[]>([])
const isLoadingDepartment = ref(true)
const isLoadingStaff = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')
const typeFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Staff pagination
const staffCurrentPage = ref(1)
const staffItemsPerPage = ref(10)

// Staff modal
const showStaffModal = ref(false)
const editingStaff = ref<Staff | null>(null)

const { getDepartment } = useDepartments()
const { getStaffByDepartment, deleteStaff } = useStaff()

const paginatedStaff = computed(() => {
  const start = (staffCurrentPage.value - 1) * staffItemsPerPage.value
  const end = start + staffItemsPerPage.value
  return staff.value.slice(start, end)
})

const filteredLeaves = computed(() => {
  let result = leaves.value.filter(l => l.departmentId === departmentId.value)

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(l =>
      l.staffName.toLowerCase().includes(query) ||
      l.staffEmail.toLowerCase().includes(query) ||
      l.type.toLowerCase().includes(query) ||
      l.reason.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(l => l.status === statusFilter.value)
  }

  // Type filter
  if (typeFilter.value !== 'all') {
    result = result.filter(l => l.type === typeFilter.value)
  }

  // Sort by date (newest first)
  result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  return result
})

const paginatedLeaves = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredLeaves.value.slice(start, end)
})

const pendingLeavesCount = computed(() => {
  return leaves.value.filter(l => l.departmentId === departmentId.value && l.status === 'pending').length
})

const approvedThisMonth = computed(() => {
  const now = new Date()
  return leaves.value.filter(l => {
    if (l.departmentId !== departmentId.value || l.status !== 'approved') return false
    const leaveDate = new Date(l.startDate)
    return leaveDate.getMonth() === now.getMonth() && leaveDate.getFullYear() === now.getFullYear()
  }).length
})

const onLeaveNow = computed(() => {
  const today = new Date().toISOString().split('T')[0]!
  return leaves.value.filter(l => {
    if (l.departmentId !== departmentId.value || l.status !== 'approved') return false
    return l.startDate <= today && l.endDate >= today
  }).length
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  typeFilter.value = 'all'
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleApproveLeave = (leave: LeaveRequest) => {
  if (confirm(`Approve leave request for ${leave.staffName}?`)) {
    const index = leaves.value.findIndex(l => l.id === leave.id)
    if (index > -1 && leaves.value[index]) {
      leaves.value[index].status = 'approved'
    }
  }
}

const handleRejectLeave = (leave: LeaveRequest) => {
  if (confirm(`Reject leave request for ${leave.staffName}?`)) {
    const index = leaves.value.findIndex(l => l.id === leave.id)
    if (index > -1 && leaves.value[index]) {
      leaves.value[index].status = 'rejected'
    }
  }
}

const handleViewLeave = (leave: LeaveRequest) => {
  // TODO: Implement view leave details modal
  alert(`Viewing leave details for ${leave.staffName}`)
}

// Load department and staff data
const loadDepartmentData = async () => {
  if (!departmentId.value || typeof departmentId.value !== 'string') {
    console.error('Invalid department ID:', departmentId.value)
    return
  }

  isLoadingDepartment.value = true
  isLoadingStaff.value = true
  
  try {
    // Load department
    const dept = await getDepartment(departmentId.value)
    if (dept) {
      department.value = dept
      useHead({
        title: `${dept.name || 'Department'} - Leave Management - Storv`,
      })
    } else {
      // Department not found, redirect
      navigateTo('/dashboard/departments')
      return
    }

    // Load staff for this department
    staff.value = await getStaffByDepartment(departmentId.value)
  } catch (error: any) {
    console.error('Error loading department data:', error.message || error)
    alert(error.message || 'Failed to load department data')
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
      await deleteStaff(staffMember.id)
      await loadDepartmentData() // Reload to update staff list and counts
      alert('Staff member deleted successfully')
    } catch (error: any) {
      alert(error.message || 'Failed to delete staff member')
    }
  }
}

const handleStaffSuccess = async () => {
  await loadDepartmentData() // Reload staff list
  showStaffModal.value = false
  editingStaff.value = null
}

const handleStaffError = (error: string) => {
  console.error('Staff error:', error)
}

const handleStaffPageChange = (page: number) => {
  staffCurrentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch for route parameter changes when navigating between departments
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId && typeof newId === 'string') {
    // Clear previous data
    department.value = null
    staff.value = []
    leaves.value = []
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
  
  // Load leave requests (for now, we'll keep sample data until leave requests are integrated with Firestore)
  // TODO: Integrate leave requests with Firestore
  leaves.value = []
})
</script>

