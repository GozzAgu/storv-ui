<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Inventory Folders</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Organize your inventory into folders for better management</p>
    </div>

    <!-- Search and Filter -->
    <Card padding="sm">
      <div class="flex items-center gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search folders..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          v-model="sortBy"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="name">Sort by Name</option>
          <option value="items">Sort by Items</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>
    </Card>

    <!-- Folders Grid -->
    <div v-if="filteredFolders.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="folder in filteredFolders"
        :key="folder.id"
        class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-all duration-200 overflow-hidden"
        @click="navigateToFolder(folder.id)"
      >
        <!-- Card Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
            >
              <FolderIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {{ folder.name }}
              </h3>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click.stop="handleEditFolder(folder)"
              class="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit folder"
            >
              <PencilIcon class="w-4 h-4" />
            </button>
            <button
              @click.stop="handleDeleteFolder(folder)"
              class="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Delete folder"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-4">
          <!-- Description -->
          <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 min-h-[2rem]">
            {{ folder.description || 'No description' }}
          </p>
          
          <!-- Folder Stats -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CubeIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span class="text-xs text-gray-600 dark:text-gray-400">Items</span>
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ folder.itemCount }}</span>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CurrencyDollarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span class="text-xs text-gray-600 dark:text-gray-400">Value</span>
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">${{ formatCurrency(folder.totalValue) }}</span>
            </div>
          </div>

          <!-- Low Stock Warning -->
          <div
            v-if="folder.lowStockCount > 0"
            class="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <p class="text-xs font-medium text-orange-700 dark:text-orange-300">
              ⚠ {{ folder.lowStockCount }} low stock
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <Card v-else>
      <div class="text-center py-12">
        <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <FolderIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {{ searchQuery ? 'No folders found' : 'No folders yet' }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search criteria' : 'Create your first folder to organize your inventory' }}
        </p>
        <Button
          v-if="!searchQuery"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateFolderModal"
        >
          Create Your First Folder
        </Button>
      </div>
    </Card>

    <!-- Floating Action Button -->
    <button
      v-if="filteredFolders.length > 0"
      @click="openCreateFolderModal"
      class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Create new folder"
    >
      <PlusIcon class="w-6 h-6" />
    </button>

    <!-- Create Folder Modal -->
    <Modal
      v-model="showCreateFolderModal"
      :title="editingFolder ? 'Edit Folder' : 'Create New Folder'"
      size="sm"
    >
      <form @submit.prevent="handleSaveFolder" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folder Name *
          </label>
          <input
            v-model="folderForm.name"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter folder name"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            v-model="folderForm.description"
            rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Enter folder description (optional)"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <Button variant="outline" @click="handleCancelFolder">Cancel</Button>
        <Button variant="primary" type="submit" @click="handleSaveFolder">
          {{ editingFolder ? 'Update' : 'Create' }} Folder
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Inventory Folders - Storv',
})

interface Folder {
  id: string
  name: string
  description: string
  color: string
  itemCount: number
  totalValue: number
  lowStockCount: number
  createdAt: string
}

const searchQuery = ref('')
const sortBy = ref('name')
const showCreateFolderModal = ref(false)
const editingFolder = ref<Folder | null>(null)

const folderForm = reactive({
  name: '',
  description: ''
})

// Sample folders data
const folders = ref<Folder[]>([
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic items and gadgets',
    color: 'blue',
    itemCount: 45,
    totalValue: 12500,
    lowStockCount: 3,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Clothing',
    description: 'Apparel and fashion items',
    color: 'pink',
    itemCount: 120,
    totalValue: 8500,
    lowStockCount: 8,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Food & Beverages',
    description: 'Food items and drinks',
    color: 'orange',
    itemCount: 89,
    totalValue: 3200,
    lowStockCount: 12,
    createdAt: '2024-01-05',
  },
  {
    id: '4',
    name: 'Office Supplies',
    description: 'Stationery and office equipment',
    color: 'purple',
    itemCount: 67,
    totalValue: 2100,
    lowStockCount: 0,
    createdAt: '2024-01-20',
  },
  {
    id: '5',
    name: 'Home & Garden',
    description: 'Home improvement and garden items',
    color: 'green',
    itemCount: 34,
    totalValue: 5600,
    lowStockCount: 5,
    createdAt: '2024-01-12',
  },
  {
    id: '6',
    name: 'Toys & Games',
    description: 'Children toys and games',
    color: 'yellow',
    itemCount: 56,
    totalValue: 3400,
    lowStockCount: 2,
    createdAt: '2024-01-18',
  },
])

const filteredFolders = computed(() => {
  let result = [...folders.value]

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      folder =>
        folder.name.toLowerCase().includes(query) ||
        folder.description.toLowerCase().includes(query)
    )
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'items':
        return b.itemCount - a.itemCount
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  return result
})

const getFolderColor = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    yellow: 'bg-yellow-500',
  }
  return colorMap[color] || 'bg-gray-500'
}

const getFolderGradient = (color: string) => {
  const gradientMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    yellow: 'from-yellow-500 to-yellow-600',
  }
  return gradientMap[color] || 'from-gray-500 to-gray-600'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const navigateToFolder = (folderId: string) => {
  navigateTo(`/dashboard/inventory/${folderId}`)
}

const openCreateFolderModal = () => {
  editingFolder.value = null
  folderForm.name = ''
  folderForm.description = ''
  showCreateFolderModal.value = true
}

const handleEditFolder = (folder: Folder) => {
  editingFolder.value = folder
  folderForm.name = folder.name
  folderForm.description = folder.description || ''
  showCreateFolderModal.value = true
}

const handleDeleteFolder = (folder: Folder) => {
  if (confirm(`Are you sure you want to delete "${folder.name}"? This will not delete the items in the folder.`)) {
    const index = folders.value.findIndex(f => f.id === folder.id)
    if (index > -1) {
      folders.value.splice(index, 1)
    }
  }
}

const handleSaveFolder = () => {
  if (!folderForm.name.trim()) {
    alert('Please enter a folder name')
    return
  }

  if (editingFolder.value) {
    // Update existing folder
    editingFolder.value.name = folderForm.name.trim()
    editingFolder.value.description = folderForm.description.trim()
    handleCancelFolder()
  } else {
    // Create new folder with user-provided name and description
    const createdAt = new Date().toISOString().split('T')[0] || new Date().toISOString()
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: folderForm.name.trim(),
      description: folderForm.description.trim(),
      color: 'blue', // Default color
      itemCount: 0,
      totalValue: 0,
      lowStockCount: 0,
      createdAt: createdAt.substring(0, 10),
    }
    folders.value.push(newFolder)
    handleCancelFolder()
  }
}

const handleCancelFolder = () => {
  showCreateFolderModal.value = false
  editingFolder.value = null
  folderForm.name = ''
  folderForm.description = ''
}
</script>

