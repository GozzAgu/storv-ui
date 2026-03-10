<template>
  <div class="pb-24 sm:pb-20">
    <!-- Hero header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Folders</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Organize products into folders and manage stock in one place</p>
      </div>
      <Button
        v-if="canCreateInventoryFolders"
        variant="primary"
        :icon="PlusIcon"
        @click="openCreateFolderModal"
        class="w-full sm:w-auto shrink-0"
      >
        New folder
      </Button>
    </div>

    <!-- Toolbar: search + filters (single bar, modern) -->
    <div
      v-if="!inventoryStore.loading"
      class="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"
    >
      <div class="relative flex-1 min-w-0">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search folders..."
          class="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white dark:focus:bg-gray-800 transition-colors"
        />
      </div>
      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <select
          v-model="selectedDepartmentId"
          class="px-4 py-2.5 sm:py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[140px]"
        >
          <option value="">All departments</option>
          <option v-for="dept in currentStoreDepartments" :key="dept.id" :value="dept.id">
            {{ dept.name }}
          </option>
        </select>
        <select
          v-model="sortBy"
          class="px-4 py-2.5 sm:py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[120px]"
        >
          <option value="name">Name</option>
          <option value="items">Items</option>
          <option value="date">Date</option>
        </select>
        <span class="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 ml-1">
          {{ filteredFolders.length }} folder{{ filteredFolders.length === 1 ? '' : 's' }}
        </span>
      </div>
    </div>

    <!-- Content area: show only one of skeleton, folders, or empty -->
    <!-- Loading skeleton -->
    <div v-if="inventoryStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 min-h-[200px]">
      <div
        v-for="i in 8"
        :key="i"
        class="flex items-center rounded-2xl sm:rounded-[20px] bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-700/60 h-[72px] sm:h-[70px] overflow-hidden animate-pulse px-3 sm:px-0"
      >
        <div class="w-12 h-12 sm:w-[50px] sm:h-[50px] ml-0 sm:ml-2.5 rounded-xl sm:rounded-[10px] bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div class="flex-1 min-w-0 ml-3 sm:ml-2.5 pr-2 space-y-1.5">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>

    <!-- Folders grid -->
    <div v-else-if="paginatedFolders.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
      <div
        v-for="folder in paginatedFolders"
        :key="folder.id"
        class="group relative flex items-start w-full min-h-[72px] sm:min-h-[70px] rounded-2xl sm:rounded-[20px] bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-700/60 backdrop-blur-[10px] transition-all duration-300 ease-in-out active:scale-[0.99] sm:hover:scale-105 hover:ring-primary-500/30 dark:hover:ring-primary-400/30 cursor-pointer overflow-hidden py-3 px-3 sm:py-2.5 sm:px-0"
        @click="navigateToFolder(folder.id)"
      >
        <!-- Icon with primary gradient (changes on hover) -->
        <div class="flex items-center justify-center w-12 h-12 sm:w-[50px] sm:h-[50px] sm:ml-2.5 mt-0.5 rounded-xl sm:rounded-[10px] shrink-0 bg-gradient-to-br from-primary-400 to-primary-600 group-hover:from-primary-500 group-hover:to-primary-700 transition-all duration-300 ease-in-out">
          <FolderIcon class="w-6 h-6 text-white" stroke-width="1.75" />
        </div>

        <div class="textBox flex-1 min-w-0 ml-3 sm:ml-2.5 pr-2">
          <p
            class="h1 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
            :title="folder.name"
          >
            {{ folder.name }}
          </p>
          <span class="span text-xs sm:text-[10px] text-gray-500 dark:text-gray-400 mt-1 sm:mt-0.5 block">{{ folder.itemCount }} items</span>
        </div>

        <!-- Actions: always visible on mobile for touch, hover on desktop -->
        <div v-if="canManage" class="flex items-center gap-0.5 pr-1 sm:pr-2 shrink-0 self-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            @click.stop="handleEditFolder(folder)"
            class="p-2 sm:p-1.5 rounded-xl sm:rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation"
            title="Edit folder"
            aria-label="Edit folder"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            @click.stop="handleDeleteFolder(folder)"
            class="p-2 sm:p-1.5 rounded-xl sm:rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-50 dark:active:bg-red-900/20 transition-colors touch-manipulation"
            title="Delete folder"
            aria-label="Delete folder"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state (when not loading and no folders) -->
    <div
      v-else
      class="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mb-4">
        <FolderIcon class="w-8 h-8 text-primary-600 dark:text-primary-400" stroke-width="1.5" />
      </div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {{ selectedDepartmentId ? `No folders in ${getDepartmentName(selectedDepartmentId)}` : (searchQuery ? 'No folders found' : 'No folders yet') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        {{ selectedDepartmentId ? 'Try another department or clear the filter.' : (searchQuery ? 'Try a different search.' : 'Create a folder to start organizing your inventory.') }}
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          v-if="selectedDepartmentId"
          variant="outline"
          @click="selectedDepartmentId = ''"
        >
          Clear filter
        </Button>
        <Button
          v-if="!searchQuery && !selectedDepartmentId && canCreateInventoryFolders"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateFolderModal"
        >
          Create folder
        </Button>
      </div>
    </div>

    <!-- Pagination bar -->
    <div
      v-if="filteredFolders.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 z-30 safe-area-inset-bottom transition-[left] duration-300"
      :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
    >
      <div class="px-4 sm:px-6 py-3">
        <Pagination
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
          :total="filteredFolders.length"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- FAB: New folder (when list is not empty) -->
    <div
      v-if="paginatedFolders.length > 0 && canCreateInventoryFolders"
      class="group fixed bottom-24 sm:bottom-28 right-4 sm:right-6 z-40 flex items-center justify-end"
    >
      <span
        class="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-white shadow-lg opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
      >
        New folder
      </span>
      <button
        @click="openCreateFolderModal"
        class="group w-14 h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white hover:text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="New folder"
      >
        <PlusIcon class="w-6 h-6 text-white stroke-white" stroke-width="2.5" />
      </button>
    </div>

    <!-- Delete Folder Modal -->
    <DeleteFolderModal
      v-model="showDeleteFolderModal"
      :folder="selectedFolderForDelete"
      @deleted="handleConfirmDeleteFolder"
    />

    <!-- Create Folder Modal -->
    <Modal
      v-model="showCreateFolderModal"
      :title="editingFolder ? 'Edit Folder' : 'Create New Folder'"
      size="lg"
    >
      <template #header>
        <div class="w-full">
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ editingFolder ? 'Edit Folder' : 'Create New Folder' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ editingFolder ? 'Update folder details and template.' : 'Add a new inventory folder and define its table columns.' }}
          </p>
        </div>
      </template>

      <div class="max-h-[65vh] overflow-y-auto -mx-1 px-1">
        <form @submit.prevent="handleSaveFolder" class="bg-transparent">
          <!-- Basic info -->
          <div class="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Basic info</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-4">Name, type, and description</p>
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Folder name *</label>
                  <input
                    v-model="folderForm.name"
                    type="text"
                    required
                    class="w-full px-3.5 py-2.5 text-sm rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Enter folder name"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type *</label>
                  <select
                    v-model="folderForm.type"
                    required
                    class="w-full px-3.5 py-2.5 text-sm rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
                  >
                    <option value="">Select type</option>
                    <option value="general">General</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing & Apparel</option>
                    <option value="automotive">Automotive</option>
                    <option value="food">Food & Beverage</option>
                    <option value="office">Office Supplies</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <button
                    type="button"
                    @click="handleGenerateDescription"
                    :disabled="!folderForm.name || isGeneratingDescription"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generate description with AI"
                  >
                    <SparklesIcon :class="['w-4 h-4', isGeneratingDescription ? 'animate-spin' : '']" />
                    {{ isGeneratingDescription ? 'Generating...' : 'AI Generate' }}
                  </button>
                </div>
                <textarea
                  v-model="folderForm.description"
                  @input="aiError = null"
                  rows="3"
                  class="w-full px-3.5 py-2.5 text-sm rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="Describe the folder's purpose"
                />
                <p v-if="aiError" class="text-sm text-red-600 dark:text-red-400 mt-1.5">{{ aiError }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
                <div class="flex items-center gap-3">
                  <input
                    v-model="folderForm.color"
                    type="color"
                    class="w-11 h-9 rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 cursor-pointer overflow-hidden"
                  />
                  <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">{{ folderForm.color }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Serial numbers -->
          <div class="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <Checkbox v-model="folderForm.hasSerialNumbers" size="sm" wrapper-class="items-start">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Use serial numbers for items</span>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  One serial per item (quantity fixed at 1). Turn off to allow editable quantity for bulk items.
                </p>
              </div>
            </Checkbox>
          </div>

          <!-- Department access -->
          <div v-if="canCreateInventoryFolders" class="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Department access</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">Which departments can use this folder. Empty = all.</p>
            <div v-if="departmentsStore.loading" class="text-sm text-gray-500 dark:text-gray-400 py-2">Loading departments…</div>
            <div v-else-if="departmentsStore.departments.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">No departments yet. Create one in Settings.</div>
            <div v-else class="space-y-0 max-h-44 overflow-y-auto">
              <label
                v-for="dept in departmentsStore.departments"
                :key="dept.id"
                class="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700/80 last:border-b-0 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="folderForm.allowedDepartments.includes(dept.id)"
                  @change="toggleDepartmentAccess(dept.id, ($event.target as HTMLInputElement).checked)"
                  class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                />
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">{{ dept.name }}</span>
                  <span v-if="dept.description" class="text-xs text-gray-500 dark:text-gray-400 block truncate mt-0.5">{{ dept.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Table template -->
          <div class="px-4 py-4">
            <div class="flex flex-wrap items-center gap-3 mb-3">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Table template</h4>
                <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">Custom</span>
              </div>
              <Button v-if="selectedTemplate" variant="outline" size="sm" @click="handleAddField" extra-class="!rounded-full sm:ml-auto">
                + Add field
              </Button>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Define columns for this folder’s table.</p>
            <div v-if="selectedTemplate" class="space-y-0 max-h-56 overflow-y-auto">
              <div
                v-for="(field, index) in editableFields"
                :key="field.id"
                class="py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
                    <div class="sm:col-span-3">
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Field name *</label>
                      <input
                        v-model="field.name"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 text-sm rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        placeholder="e.g. sku"
                      />
                    </div>
                    <div class="sm:col-span-3">
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Label *</label>
                      <input
                        v-model="field.label"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 text-sm rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        placeholder="Display name"
                      />
                    </div>
                    <div class="sm:col-span-3">
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Type *</label>
                      <select
                        v-model="field.type"
                        required
                        class="w-full px-3.5 py-2.5 text-sm rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="boolean">Boolean</option>
                        <option value="currency">Currency</option>
                      </select>
                    </div>
                    <div class="sm:col-span-3 flex items-center gap-3 justify-end flex-wrap">
                      <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          v-model="field.required"
                          type="checkbox"
                          class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                        />
                        <span class="text-xs text-gray-600 dark:text-gray-400">Required</span>
                      </label>
                      <button
                        v-if="!['name', 'price'].includes(field.name)"
                        type="button"
                        @click="handleRemoveField(index)"
                        class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove field"
                      >
                        <TrashIcon class="w-4 h-4" />
                      </button>
                      <span v-else class="px-2 py-1 text-[10px] font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400" title="Default field">Default</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="editableFields.length === 0" class="text-center py-10 px-5 border border-dashed border-gray-200 dark:border-gray-600">
                <Squares2X2Icon class="w-9 h-9 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">No fields yet</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Click “Add field” to define columns</p>
              </div>
            </div>
        </form>
      </div>

      <template #footer>
        <Button variant="outline" @click="handleCancelFolder" extra-class="!rounded-full">Cancel</Button>
        <Button variant="primary" type="submit" @click="handleSaveFolder" extra-class="!rounded-full">
          {{ editingFolder ? 'Update' : 'Create' }} folder
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, nextTick } from 'vue'
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import DeleteFolderModal from '~/components/inventory/DeleteFolderModal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import Pagination from '~/components/ui/Pagination.vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useInventoryStore, type InventoryFolder, type Template, type TemplateField } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useAI } from '~/composables/useAI'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Inventory Folders - Storvv',
})

const searchQuery = ref('')
const sortBy = ref('name')
const showCreateFolderModal = ref(false)
const editingFolder = ref<InventoryFolder | null>(null)
const showDeleteFolderModal = ref(false)
const selectedFolderForDelete = ref<InventoryFolder | null>(null)

// Department filter - load from localStorage
const getInitialDepartment = (): string => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('inventory-selected-department')
      return saved || ''
    } catch (e) {
      return ''
    }
  }
  return ''
}
const selectedDepartmentId = ref(getInitialDepartment())
// Load pagination state from localStorage
const getInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('inventory-index-page')
      return saved ? parseInt(saved, 10) : 1
    } catch (e) {
      return 1
    }
  }
  return 1
}
const currentPage = ref(getInitialPage())
const itemsPerPage = ref(20)
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

const authStore = useAuthStore()
const userStore = useUserStore()
const inventoryStore = useInventoryStore()
const departmentsStore = useDepartmentsStore()
const storesStore = useStoresStore()
const toast = useToast()
const { canManage, canCreateInventoryFolders } = usePermissions()

// Get current store ID for filtering
const currentStoreId = computed(() => storesStore.currentStoreId)

const folderForm = reactive({
  name: '',
  description: '',
  type: '',
  color: '#3B82F6',
  hasSerialNumbers: false,
  allowedDepartments: [] as string[], // Array of department IDs
})

// AI generation
const { generateDescription, isGenerating: isGeneratingDescription, error: aiError } = useAI()

const handleGenerateDescription = async () => {
  if (!folderForm.name || folderForm.name.trim().length === 0) {
    return
  }

  const description = await generateDescription(folderForm.name, folderForm.type)
  if (description) {
    folderForm.description = description
  }
}

// Default fields that should always be included
const getDefaultFields = (): TemplateField[] => {
  return [
    {
      id: `field-name-${Date.now()}`,
      name: 'name',
      label: 'Item',
      type: 'text',
      required: true,
    },
    {
      id: `field-price-${Date.now()}`,
      name: 'price',
      label: 'Price',
      type: 'currency',
      required: false,
    },
  ]
}

const editableFields = ref<TemplateField[]>(getDefaultFields())

// Custom template only
const selectedTemplateId = ref<string>('custom')

const selectedTemplate = computed(() => {
  return {
    id: 'custom',
    name: 'Custom Template',
    description: 'Create your own custom table structure',
    fields: [],
  }
})

// Initialize with default fields for custom template
watch(() => showCreateFolderModal.value, (isOpen) => {
  if (isOpen && !editingFolder.value) {
    // Reset to default fields for new folder
    editableFields.value = getDefaultFields()
    selectedTemplateId.value = 'custom'
    
    // If serial numbers is already checked, add brand and model fields
    if (folderForm.hasSerialNumbers) {
      const brandFieldExists = editableFields.value.some(f => f.name === 'brand')
      const modelFieldExists = editableFields.value.some(f => f.name === 'model')
      const serialNoFieldExists = editableFields.value.some(f => f.name === 'serialNo' || f.name === 'serialNumber')
      
      if (!serialNoFieldExists) {
        editableFields.value.push({
          id: `field-serialNo-${Date.now()}`,
          name: 'serialNo',
          label: 'Serial Number',
          type: 'text',
          required: true,
        })
      }
      
      if (!brandFieldExists) {
        editableFields.value.push({
          id: `field-brand-${Date.now()}`,
          name: 'brand',
          label: 'Brand',
          type: 'text',
          required: true,
        })
      }
      
      if (!modelFieldExists) {
        editableFields.value.push({
          id: `field-model-${Date.now()}`,
          name: 'model',
          label: 'Model',
          type: 'text',
          required: true,
        })
      }
    }
  }
})

// Watch hasSerialNumbers to auto-add/remove serialNo, brand, and model fields
watch(() => folderForm.hasSerialNumbers, (hasSerial) => {
  if (hasSerial) {
    // Check if serialNo field already exists
    const serialNoFieldExists = editableFields.value.some(f => f.name === 'serialNo' || f.name === 'serialNumber')
    if (!serialNoFieldExists) {
      // Add serialNo field to the template
      const serialNoField: TemplateField = {
        id: `field-serialNo-${Date.now()}`,
        name: 'serialNo',
        label: 'Serial Number',
        type: 'text',
        required: true,
      }
      editableFields.value.push(serialNoField)
    }
    
    // Check if brand field already exists
    const brandFieldExists = editableFields.value.some(f => f.name === 'brand')
    if (!brandFieldExists) {
      // Add brand field to the template
      const brandField: TemplateField = {
        id: `field-brand-${Date.now()}`,
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: true,
      }
      editableFields.value.push(brandField)
    }
    
    // Check if model field already exists
    const modelFieldExists = editableFields.value.some(f => f.name === 'model')
    if (!modelFieldExists) {
      // Add model field to the template
      const modelField: TemplateField = {
        id: `field-model-${Date.now()}`,
        name: 'model',
        label: 'Model',
        type: 'text',
        required: true,
      }
      editableFields.value.push(modelField)
    }
  } else {
    // Remove serialNo, brand, and model fields when unchecked
    editableFields.value = editableFields.value.filter(f => 
      f.name !== 'serialNo' && 
      f.name !== 'serialNumber' && 
      f.name !== 'brand' && 
      f.name !== 'model'
    )
  }
})

const folders = computed(() => inventoryStore.folders)

// Get departments for current store only
const currentStoreDepartments = computed(() => {
  if (!currentStoreId.value) return departmentsStore.departments
  return departmentsStore.departments.filter(dept => dept.storeId === currentStoreId.value)
})

const filteredFolders = computed(() => {
  let result = [...folders.value]

  // Filter by selected department
  if (selectedDepartmentId.value) {
    result = result.filter(folder => {
      // If folder has no allowedDepartments, it's accessible to all departments
      if (!folder.allowedDepartments || folder.allowedDepartments.length === 0) {
        return true
      }
      // Otherwise, check if selected department is in the allowed list
      return folder.allowedDepartments.includes(selectedDepartmentId.value)
    })
  }

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
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      default:
        return 0
    }
  })

  return result
})

const paginatedFolders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredFolders.value.slice(start, end)
})

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Save to localStorage
  if (import.meta.client) {
    try {
      localStorage.setItem('inventory-index-page', page.toString())
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
      localStorage.setItem('inventory-index-page', newPage.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

// Watch for department filter changes and persist
watch(selectedDepartmentId, (newDeptId) => {
  if (import.meta.client) {
    try {
      if (newDeptId) {
        localStorage.setItem('inventory-selected-department', newDeptId)
      } else {
        localStorage.removeItem('inventory-selected-department')
      }
      // Reset to first page when department changes
      currentPage.value = 1
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

const getFolderColor = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-primary-500',
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
    purple: 'from-primary-500 to-primary-600',
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

const getDepartmentName = (deptId: string) => {
  const dept = departmentsStore.getDepartmentById(deptId)
  return dept?.name || deptId
}

const formatFolderDate = (date: any) => {
  if (!date) return '-'
  
  try {
    // Handle Firestore Timestamp objects (with toDate method)
    if (date && typeof date === 'object' && typeof date.toDate === 'function') {
      const dateObj = date.toDate()
      if (isNaN(dateObj.getTime())) return '-'
      return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    
    // Handle Firestore Timestamp objects (with seconds property)
    if (date && typeof date === 'object' && 'seconds' in date) {
      const timestamp = date.seconds * 1000 + ((date.nanoseconds || 0) / 1000000)
      const dateObj = new Date(timestamp)
      if (isNaN(dateObj.getTime())) return '-'
      return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      const dateObj = new Date(date)
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }
    }
    
    return '-'
  } catch (error) {
    console.warn('Error formatting folder date:', date, error)
    return '-'
  }
}

const navigateToFolder = (folderId: string) => {
  navigateTo(`/dashboard/inventory/${folderId}`)
}

const openCreateFolderModal = () => {
  editingFolder.value = null
  folderForm.name = ''
  folderForm.description = ''
  folderForm.type = ''
  folderForm.color = '#3B82F6'
  folderForm.hasSerialNumbers = false
  editableFields.value = getDefaultFields()
  showCreateFolderModal.value = true
}

const handleEditFolder = (folder: InventoryFolder) => {
  editingFolder.value = folder
  folderForm.name = folder.name
  folderForm.description = folder.description || ''
  folderForm.type = folder.type || ''
  folderForm.color = folder.color || '#3B82F6'
  folderForm.hasSerialNumbers = folder.hasSerialNumbers || false
  folderForm.allowedDepartments = folder.allowedDepartments ? [...folder.allowedDepartments] : []
  if (folder.template) {
    editableFields.value = folder.template.fields.map(f => ({ ...f }))
  } else {
    editableFields.value = getDefaultFields()
  }
  
  // Ensure default fields are always included when editing
  const defaultFieldNames = ['name', 'price']
  const existingFieldNames = editableFields.value.map(f => f.name)
  const missingDefaults = defaultFieldNames.filter(name => !existingFieldNames.includes(name))
  
  if (missingDefaults.length > 0) {
    const defaults = getDefaultFields()
    missingDefaults.forEach(fieldName => {
      const defaultField = defaults.find(f => f.name === fieldName)
      if (defaultField) {
        editableFields.value.unshift({ ...defaultField, id: `field-${fieldName}-${Date.now()}` })
      }
    })
  }
  
  // Ensure default fields are in the correct order (at the beginning)
  const defaultFields = editableFields.value.filter(f => defaultFieldNames.includes(f.name))
  const customFields = editableFields.value.filter(f => !defaultFieldNames.includes(f.name))
  editableFields.value = [...defaultFields.sort((a, b) => {
    const indexA = defaultFieldNames.indexOf(a.name)
    const indexB = defaultFieldNames.indexOf(b.name)
    return indexA - indexB
  }), ...customFields]
  
  // If hasSerialNumbers is true, ensure serialNo, brand, and model fields exist
  if (folderForm.hasSerialNumbers) {
    const serialNoFieldExists = editableFields.value.some(f => f.name === 'serialNo' || f.name === 'serialNumber')
    if (!serialNoFieldExists) {
      const serialNoField: TemplateField = {
        id: `field-serialNo-${Date.now()}`,
        name: 'serialNo',
        label: 'Serial Number',
        type: 'text',
        required: true,
      }
      editableFields.value.push(serialNoField)
    }
    
    const brandFieldExists = editableFields.value.some(f => f.name === 'brand')
    if (!brandFieldExists) {
      const brandField: TemplateField = {
        id: `field-brand-${Date.now()}`,
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: true,
      }
      editableFields.value.push(brandField)
    }
    
    const modelFieldExists = editableFields.value.some(f => f.name === 'model')
    if (!modelFieldExists) {
      const modelField: TemplateField = {
        id: `field-model-${Date.now()}`,
        name: 'model',
        label: 'Model',
        type: 'text',
        required: true,
      }
      editableFields.value.push(modelField)
    }
  }
  showCreateFolderModal.value = true
}

const handleDeleteFolder = (folder: InventoryFolder) => {
  selectedFolderForDelete.value = folder
  showDeleteFolderModal.value = true
}

const handleConfirmDeleteFolder = async (folder: InventoryFolder) => {
  try {
    await inventoryStore.deleteFolder(folder.id)
    toast.success('Folder deleted successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete folder')
  } finally {
    showDeleteFolderModal.value = false
    selectedFolderForDelete.value = null
  }
}

const handleSaveFolder = async () => {
  if (!folderForm.name.trim()) {
    alert('Please enter a folder name')
    return
  }

  if (!folderForm.type) {
    alert('Please select a folder type')
    return
  }

  // Template is always custom, no need to check

  // Ensure default fields are always included
  const defaultFieldNames = ['name', 'price']
  const existingFieldNames = editableFields.value.map(f => f.name)
  const missingDefaults = defaultFieldNames.filter(name => !existingFieldNames.includes(name))
  
  // Add any missing default fields
  if (missingDefaults.length > 0) {
    const defaults = getDefaultFields()
    missingDefaults.forEach(fieldName => {
      const defaultField = defaults.find(f => f.name === fieldName)
      if (defaultField) {
        editableFields.value.unshift({ ...defaultField, id: `field-${fieldName}-${Date.now()}` })
      }
    })
  }
  
  // Ensure default fields are in the correct order (at the beginning)
  const defaultFields = editableFields.value.filter(f => defaultFieldNames.includes(f.name))
  const customFields = editableFields.value.filter(f => !defaultFieldNames.includes(f.name))
  editableFields.value = [...defaultFields.sort((a, b) => {
    const indexA = defaultFieldNames.indexOf(a.name)
    const indexB = defaultFieldNames.indexOf(b.name)
    return indexA - indexB
  }), ...customFields]
  
  if (editableFields.value.length === 0) {
    alert('Please add at least one field to the template')
    return
  }

  const template: Template = {
    id: 'custom',
    name: 'Custom Template',
    description: 'Custom table structure',
    fields: editableFields.value.map(f => ({ ...f })),
  }

  try {
    // Prepare allowedDepartments - use empty array if none selected (accessible to all)
    const allowedDepartments = folderForm.allowedDepartments.length > 0 ? folderForm.allowedDepartments : undefined

    if (editingFolder.value) {
      // Update existing folder
      await inventoryStore.updateFolder(editingFolder.value.id, {
        name: folderForm.name.trim(),
        description: folderForm.description.trim(),
        type: folderForm.type,
        color: folderForm.color,
        hasSerialNumbers: folderForm.hasSerialNumbers,
        template: template,
        allowedDepartments: allowedDepartments,
      })
      handleCancelFolder()
    } else {
      // Create new folder
      await inventoryStore.createFolder({
        name: folderForm.name.trim(),
        description: folderForm.description.trim(),
        type: folderForm.type,
        color: folderForm.color,
        hasSerialNumbers: folderForm.hasSerialNumbers,
        template: template,
        allowedDepartments: allowedDepartments,
      })
      handleCancelFolder()
    }
  } catch (error: any) {
    alert(error.message || 'Failed to save folder')
  }
}

const handleCancelFolder = () => {
  showCreateFolderModal.value = false
  editingFolder.value = null
  folderForm.name = ''
  folderForm.description = ''
  folderForm.type = ''
  folderForm.color = '#3B82F6'
  folderForm.hasSerialNumbers = false
  folderForm.allowedDepartments = []
  editableFields.value = getDefaultFields()
  // Clear AI error when closing modal
  if (aiError.value) {
    aiError.value = null
  }
}

const handleAddField = () => {
  const newField: TemplateField = {
    id: `field-${Date.now()}-${Math.random()}`,
    name: '',
    label: '',
    type: 'text',
    required: false,
  }
  editableFields.value.push(newField)
}

const handleRemoveField = (index: number) => {
  const field = editableFields.value[index]
  // Prevent removal of default fields
  if (field && ['name', 'price'].includes(field.name)) {
    return
  }
  editableFields.value.splice(index, 1)
}

const toggleDepartmentAccess = (departmentId: string, checked: boolean) => {
  if (checked) {
    if (!folderForm.allowedDepartments.includes(departmentId)) {
      folderForm.allowedDepartments.push(departmentId)
    }
  } else {
    const index = folderForm.allowedDepartments.indexOf(departmentId)
    if (index > -1) {
      folderForm.allowedDepartments.splice(index, 1)
    }
  }
}

// Load folders on mount
onMounted(async () => {
  // Only run on client
  if (import.meta.server) return
  
  console.log('[InventoryPage] onMounted - Starting load process')
  
  const loadData = async () => {
    console.log('[InventoryPage] loadData - Checking auth state')
    
    // Wait for auth to finish loading with timeout
    let attempts = 0
    while (authStore.loading && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
      if (attempts % 10 === 0) {
        console.log('[InventoryPage] Still waiting for auth...', attempts)
      }
    }
    
    if (attempts >= 100) {
      console.warn('[InventoryPage] Auth loading timeout, proceeding anyway')
    }
    
    // Check if user is authenticated
    if (!authStore.currentUser) {
      console.log('[InventoryPage] No authenticated user, skipping fetch')
      return
    }
    
    console.log('[InventoryPage] User authenticated:', authStore.currentUser.uid)
    
    // Fetch user data first (needed to determine if staff)
    try {
      if (!userStore.userData) {
        console.log('[InventoryPage] Fetching user data...')
        await userStore.fetchUserData(authStore.currentUser.uid)
        const userData = userStore.userData
        console.log('[InventoryPage] User data fetched:', userData ? (userData as any).role : 'unknown')
      } else {
        const userData = userStore.userData
      
      // Load stores and departments if user can manage (needed for department access UI and filter)
      if (canManage) {
        try {
          // Initialize current store if not set
          if (!storesStore.currentStoreId) {
            await storesStore.initializeCurrentStore()
          }
          await departmentsStore.fetchDepartments()
        } catch (error: any) {
          console.warn('[InventoryPage] Error fetching stores/departments:', error.message || error)
        }
      }
        console.log('[InventoryPage] User data already loaded:', userData ? (userData as any).role : 'unknown')
      }
      
      // Now fetch folders
      console.log('[InventoryPage] Fetching folders...')
      await inventoryStore.fetchFolders()
      console.log('[InventoryPage] Folders fetched:', inventoryStore.folders.length)
    } catch (error: any) {
      console.error('[InventoryPage] Error loading data:', error.message || error)
    }
  }
  
  // Start loading after a small delay to ensure stores are initialized
  await nextTick()
  await loadData()
})


// Watch for user data changes and fetch folders when it becomes available
watch(() => userStore.userData, async (userData) => {
  if (userData && authStore.currentUser && inventoryStore.folders.length === 0) {
    console.log('[InventoryPage] User data changed, fetching folders...')
    try {
      await inventoryStore.fetchFolders()
      console.log('[InventoryPage] Folders fetched after user data change:', inventoryStore.folders.length)
    } catch (error: any) {
      console.error('[InventoryPage] Error fetching folders:', error.message || error)
    }
  }
}, { immediate: false })

// Watch for auth state changes
watch(() => authStore.currentUser, async (user) => {
  if (user && inventoryStore.folders.length === 0) {
    console.log('[InventoryPage] Auth user changed, fetching user data and folders...')
    try {
      // Fetch user data first
      if (!userStore.userData) {
        await userStore.fetchUserData(user.uid)
      }
      // Then fetch folders
      await inventoryStore.fetchFolders()
      console.log('[InventoryPage] Folders fetched after auth change:', inventoryStore.folders.length)
    } catch (error: any) {
      console.error('[InventoryPage] Error fetching folders:', error.message || error)
    }
  }
}, { immediate: false })

// Watch for store changes and refetch folders
watch(() => storesStore.currentStoreId, async (newStoreId, oldStoreId) => {
  if (newStoreId && newStoreId !== oldStoreId && authStore.currentUser) {
    console.log('[InventoryPage] Store changed, refetching folders...')
    try {
      // Reset department filter when store changes
      selectedDepartmentId.value = ''
      // Refetch folders for new store
      await inventoryStore.fetchFolders()
      // Refetch departments for new store
      if (canManage) {
        await departmentsStore.fetchDepartments()
      }
      console.log('[InventoryPage] Folders refetched after store change:', inventoryStore.folders.length)
    } catch (error: any) {
      console.error('[InventoryPage] Error refetching folders after store change:', error.message || error)
    }
  }
}, { immediate: false })
</script>
