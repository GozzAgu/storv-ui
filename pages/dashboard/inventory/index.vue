<template>
  <div class="space-y-4 sm:space-y-6 pb-24 sm:pb-20">
    <!-- Page Header - Mobile Optimized -->
    <div>
      <h1 class="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Inventory Folders</h1>
      <p class="mt-1.5 text-xs sm:text-base text-gray-600 dark:text-gray-400">Organize your inventory into folders for better management</p>
    </div>

    <!-- Search and Filter - Mobile Optimized -->
    <Card padding="sm" class="lg:hidden">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="flex-1 relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search folders..."
              class="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedDepartmentId"
            class="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Departments</option>
            <option v-for="dept in currentStoreDepartments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <select
            v-model="sortBy"
            class="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="name">Sort by Name</option>
            <option value="items">Sort by Items</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>
    </Card>

    <!-- Compact Header (Visible only on large screens) -->
    <Card v-if="!inventoryStore.loading" padding="sm" class="hidden lg:block mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Folders: <span class="font-semibold">{{ filteredFolders.length }}</span></span>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search folders..."
              class="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>
          <select
            v-model="selectedDepartmentId"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[180px]"
          >
            <option value="">All Departments</option>
            <option v-for="dept in currentStoreDepartments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <select
            v-model="sortBy"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="name">Sort by Name</option>
            <option value="items">Sort by Items</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>
    </Card>

    <!-- Folders Grid - Mobile Optimized -->
    <div v-if="paginatedFolders.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
      <div
        v-for="folder in paginatedFolders"
        :key="folder.id"
        class="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 active:scale-[0.98] cursor-pointer transition-all duration-200 overflow-hidden"
        @click="navigateToFolder(folder.id)"
      >
        <!-- Card Header - Mobile Optimized -->
        <div class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"
            >
              <FolderIcon class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-xs sm:text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {{ folder.name }}
              </h3>
            </div>
          </div>
          <div v-if="canManage" class="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              @click.stop="handleEditFolder(folder)"
              class="flex-shrink-0 p-2 sm:p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg transition-colors touch-manipulation"
              title="Edit folder"
            >
              <PencilSquareIcon class="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
            </button>
            <button
              @click.stop="handleDeleteFolder(folder)"
              class="flex-shrink-0 p-2 sm:p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg transition-colors touch-manipulation"
              title="Delete folder"
            >
              <TrashIcon class="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
            </button>
          </div>
        </div>

        <!-- Card Body - Mobile Optimized -->
        <div class="p-3 sm:p-4">
          <!-- Description -->
          <p class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 sm:mb-4 min-h-[1.5rem]">
            {{ folder.description || 'No description' }}
          </p>
          
          <!-- Folder Stats - Mobile Optimized -->
          <div class="space-y-2 sm:space-y-2">
            <div class="flex items-center justify-between py-1">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <CubeIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span class="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Items</span>
              </div>
              <span class="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">{{ folder.itemCount }}</span>
            </div>
            
            <div class="flex items-center justify-between py-1">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <CurrencyDollarIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span class="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Value</span>
              </div>
              <span class="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">${{ formatCurrency(folder.totalValue) }}</span>
            </div>
          </div>

          <!-- Low Stock Warning - Mobile Optimized -->
          <div
            v-if="folder.lowStockCount > 0"
            class="mt-3 p-2 sm:p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <p class="text-[10px] sm:text-xs font-medium text-orange-700 dark:text-orange-300">
              ⚠ {{ folder.lowStockCount }} low stock
            </p>
          </div>

          <!-- Department Access Info - Mobile Optimized -->
          <div
            v-if="folder.allowedDepartments && folder.allowedDepartments.length > 0"
            class="mt-3 p-2 sm:p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <p class="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 sm:mb-1">
              Accessible to:
            </p>
            <div class="flex flex-wrap gap-1 sm:gap-1">
              <span
                v-for="deptId in folder.allowedDepartments"
                :key="deptId"
                class="inline-block px-1.5 sm:px-2 py-0.5 sm:py-0.5 text-[10px] sm:text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md sm:rounded"
              >
                {{ getDepartmentName(deptId) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State - Mobile Optimized -->
    <Card v-else>
      <div class="text-center py-8 sm:py-12">
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <FolderIcon class="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          <span v-if="selectedDepartmentId">No folders found for {{ getDepartmentName(selectedDepartmentId) }}</span>
          <span v-else-if="searchQuery">No folders found</span>
          <span v-else>No folders yet</span>
        </h3>
        <p class="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 px-4">
          <span v-if="selectedDepartmentId">Try selecting a different department or clear the filter</span>
          <span v-else-if="searchQuery">Try adjusting your search criteria</span>
          <span v-else>Create your first folder to organize your inventory</span>
        </p>
        <div v-if="selectedDepartmentId" class="mb-4">
          <Button
            variant="outline"
            @click="selectedDepartmentId = ''"
            class="w-full sm:w-auto"
          >
            Clear Department Filter
          </Button>
        </div>
        <Button
          v-if="!searchQuery && !selectedDepartmentId && canCreateInventoryFolders"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateFolderModal"
          class="w-full sm:w-auto"
        >
          Create Your First Folder
        </Button>
      </div>
    </Card>

    <!-- Fixed Pagination - Mobile Optimized -->
    <div
      v-if="filteredFolders.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300 safe-area-inset-bottom"
      :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'"
    >
      <div class="px-4 sm:px-6">
        <Pagination
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
          :total="filteredFolders.length"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Floating Action Button - Mobile Optimized -->
    <button
      v-if="filteredFolders.length > 0 && canCreateInventoryFolders"
      @click="openCreateFolderModal"
      class="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-14 h-14 sm:w-11 sm:h-11 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40 touch-manipulation"
      title="Create new folder"
    >
      <PlusIcon class="w-6 h-6 sm:w-5 sm:h-5" />
    </button>

    <!-- Create Folder Modal -->
    <Modal
      v-model="showCreateFolderModal"
      :title="editingFolder ? 'Edit Folder' : 'Create New Folder'"
      size="lg"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ editingFolder ? 'Edit Folder' : 'Create New Folder' }}
            </h3>
            <div class="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Created By: {{ userStore.userData?.name || authStore.currentUser?.displayName || authStore.currentUser?.email?.split('@')[0] || 'User' }}</span>
              <span>Date: {{ new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</span>
            </div>
          </div>
        </div>
      </template>
      
      <div class="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
        <form @submit.prevent="handleSaveFolder" class="space-y-6">
        <!-- Folder Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Type *
            </label>
            <select
              v-model="folderForm.type"
              required
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            v-model="folderForm.description"
            rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Describe the folder's purpose"
          ></textarea>
        </div>

        <!-- Color Selector -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="folderForm.color"
              type="color"
              class="w-16 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ folderForm.color }}</span>
          </div>
        </div>

        <!-- Serial Number Management -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <Checkbox
            v-model="folderForm.hasSerialNumbers"
            size="sm"
            wrapper-class="items-start"
          >
            <div class="flex-1">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Is serial number going to be available for items in this folder?
              </span>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                When enabled, quantity field will be hidden and automatically set to 1 for each item (each item has a unique serial number). When disabled, quantity field will be visible and editable for bulk items.
              </p>
            </div>
          </Checkbox>
        </div>

        <!-- Department Access Control -->
        <div v-if="canCreateInventoryFolders" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Department Access
          </label>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Select which departments can access this folder. Leave empty to allow all departments.
          </p>
          <div v-if="departmentsStore.loading" class="text-sm text-gray-500 dark:text-gray-400">
            Loading departments...
          </div>
          <div v-else-if="departmentsStore.departments.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
            No departments available. Create departments first.
          </div>
          <div v-else class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="dept in departmentsStore.departments"
              :key="dept.id"
              class="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Checkbox
                :model-value="folderForm.allowedDepartments.includes(dept.id)"
                @update:model-value="(checked) => toggleDepartmentAccess(dept.id, checked)"
                size="sm"
              >
                <div class="flex items-center justify-between flex-1">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ dept.name }}</span>
                  <span v-if="dept.description" class="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                    {{ dept.description }}
                  </span>
                </div>
              </Checkbox>
            </div>
          </div>
        </div>

        <!-- Template Editor -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Table Template *
          </label>
          <div class="p-4 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 rounded-xl mb-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Custom Template
              </span>
              <span class="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                Custom
              </span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Create your own custom table structure by adding fields below
            </p>
          </div>
        </div>

        <!-- Template Editor -->
        <div v-if="selectedTemplate" class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Customize Template Fields
            </h4>
            <Button
              variant="outline"
              size="sm"
              @click="handleAddField"
            >
              + Add Field
            </Button>
          </div>
          
          <div class="space-y-3 max-h-64 overflow-y-auto pr-2">
            <div
              v-for="(field, index) in editableFields"
              :key="field.id"
              class="flex flex-col sm:flex-row items-start gap-3 sm:gap-3 p-4 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Field Name *
                  </label>
                  <input
                    v-model="field.name"
                    type="text"
                    required
                    class="w-full px-3 sm:px-4 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="fieldName"
                  />
                </div>
                <div>
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Label *
                  </label>
                  <input
                    v-model="field.label"
                    type="text"
                    required
                    class="w-full px-3 sm:px-4 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="Display Name"
                  />
                </div>
                <div>
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Field Type *
                  </label>
                  <select
                    v-model="field.type"
                    required
                    class="w-full px-3 sm:px-4 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                    <option value="boolean">Boolean</option>
                    <option value="currency">Currency</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center gap-2 pt-3 sm:pt-6 w-full sm:w-auto justify-between sm:justify-start">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    v-model="field.required"
                    type="checkbox"
                    class="w-4 h-4 sm:w-3 sm:h-3 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                  />
                  <span class="text-xs sm:text-xs text-gray-600 dark:text-gray-400">Required</span>
                </label>
                <!-- Default fields cannot be removed -->
                <button
                  v-if="!['name', 'price'].includes(field.name)"
                  type="button"
                  @click="handleRemoveField(index)"
                  class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove field"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
                <span
                  v-else
                  class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                  title="Default field - cannot be removed"
                >
                  Default
                </span>
              </div>
            </div>
            
            <div v-if="editableFields.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              No fields added. Click "Add Field" to get started.
            </div>
          </div>
        </div>
        </form>
      </div>

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
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import Pagination from '~/components/ui/Pagination.vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useInventoryStore, type InventoryFolder, type Template, type TemplateField } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Inventory Folders - Storv',
})

const searchQuery = ref('')
const sortBy = ref('name')
const showCreateFolderModal = ref(false)
const editingFolder = ref<InventoryFolder | null>(null)

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
  }
})

// Watch hasSerialNumbers to auto-add/remove serialNo field
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
  } else {
    // Remove serialNo field when unchecked
    editableFields.value = editableFields.value.filter(f => f.name !== 'serialNo' && f.name !== 'serialNumber')
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
  
  // If hasSerialNumbers is true, ensure serialNo field exists
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
  }
  showCreateFolderModal.value = true
}

const handleDeleteFolder = async (folder: InventoryFolder) => {
  if (confirm(`Are you sure you want to delete "${folder.name}"? This will not delete the items in the folder.`)) {
    try {
      await inventoryStore.deleteFolder(folder.id)
    } catch (error: any) {
      alert(error.message || 'Failed to delete folder')
    }
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

