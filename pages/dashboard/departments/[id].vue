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
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Location</p>
          <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ department?.location || '-' }}
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
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const departmentId = computed(() => route.params.id as string)

interface Department {
  id: string
  name: string
  location: string
  manager: string
  staffCount: number
  budget: number
}

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
const leaves = ref<LeaveRequest[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')
const typeFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Sample departments data
const departmentsData: Department[] = [
  {
    id: '1',
    name: 'Sales',
    location: 'Main Floor',
    manager: 'Sarah Johnson',
    staffCount: 8,
    budget: 50000,
  },
  {
    id: '2',
    name: 'Warehouse',
    location: 'Back Building',
    manager: 'Mike Wilson',
    staffCount: 12,
    budget: 35000,
  },
  {
    id: '3',
    name: 'Customer Service',
    location: 'Second Floor',
    manager: 'Emily Davis',
    staffCount: 6,
    budget: 40000,
  },
  {
    id: '4',
    name: 'Inventory',
    location: 'Main Floor',
    manager: 'David Brown',
    staffCount: 5,
    budget: 30000,
  },
]

// Sample leave requests
const sampleLeaves: LeaveRequest[] = [
  {
    id: '1',
    staffName: 'John Smith',
    staffEmail: 'john.smith@example.com',
    type: 'vacation',
    startDate: '2024-12-15',
    endDate: '2024-12-22',
    days: 7,
    reason: 'Family vacation',
    status: 'pending',
    departmentId: '1',
  },
  {
    id: '2',
    staffName: 'Jane Doe',
    staffEmail: 'jane.doe@example.com',
    type: 'sick',
    startDate: '2024-12-10',
    endDate: '2024-12-12',
    days: 2,
    reason: 'Flu symptoms',
    status: 'approved',
    departmentId: '1',
  },
  {
    id: '3',
    staffName: 'Bob Williams',
    staffEmail: 'bob.williams@example.com',
    type: 'personal',
    startDate: '2024-12-20',
    endDate: '2024-12-21',
    days: 1,
    reason: 'Personal appointment',
    status: 'pending',
    departmentId: '2',
  },
]

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

onMounted(() => {
  // Find department
  department.value = departmentsData.find(d => d.id === departmentId.value) || null

  // Load leave requests for this department
  leaves.value = sampleLeaves.filter(l => l.departmentId === departmentId.value)

  useHead({
    title: `${department.value?.name || 'Department'} - Leave Management - Storv`,
  })
})
</script>

