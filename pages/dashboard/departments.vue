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
              {{ departments.length }}
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

    <!-- Departments Grid -->
    <div v-if="paginatedDepartments.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="department in paginatedDepartments"
        :key="department.id"
        padding="md"
        extra-class="hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {{ department.name.charAt(0) }}
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ department.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ department.location }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
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
            <span class="text-gray-600 dark:text-gray-400">Budget:</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(department.budget) }}
            </span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click.stop="handleViewDepartment(department)"
            class="w-full px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            View Details
          </button>
        </div>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-else>
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
          v-if="!searchQuery"
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

    <!-- Floating Action Button -->
    <button
      v-if="filteredDepartments.length > 0"
      @click="openCreateDepartmentModal"
      class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Create new department"
    >
      <PlusIcon class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
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

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Departments - Storv',
})

interface Department {
  id: string
  name: string
  location: string
  manager: string
  staffCount: number
  budget: number
}

const departments = ref<Department[]>([
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
])

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(9)

const totalStaff = computed(() => {
  return departments.value.reduce((sum, dept) => sum + dept.staffCount, 0)
})

const totalManagers = computed(() => {
  return departments.value.filter(dept => dept.manager).length
})

const averageStaffPerDept = computed(() => {
  if (departments.value.length === 0) return 0
  return Math.round(totalStaff.value / departments.value.length)
})

const filteredDepartments = computed(() => {
  if (!searchQuery.value) return departments.value

  const query = searchQuery.value.toLowerCase()
  return departments.value.filter(dept =>
    dept.name.toLowerCase().includes(query) ||
    dept.location.toLowerCase().includes(query) ||
    dept.manager.toLowerCase().includes(query)
  )
})

const paginatedDepartments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredDepartments.value.slice(start, end)
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const resetFilters = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const openCreateDepartmentModal = () => {
  // TODO: Implement create department modal
  alert('Create department functionality coming soon!')
}

const handleViewDepartment = (department: Department) => {
  navigateTo(`/dashboard/departments/${department.id}`)
}

const handleEditDepartment = (department: Department) => {
  // TODO: Implement edit department modal
  alert(`Editing department: ${department.name}`)
}

const handleDeleteDepartment = (department: Department) => {
  if (confirm(`Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`)) {
    const index = departments.value.findIndex(d => d.id === department.id)
    if (index > -1) {
      departments.value.splice(index, 1)
    }
  }
}
</script>

