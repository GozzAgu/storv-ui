<template>
  <div class="space-y-3 pb-24 sm:pb-20">
    <!-- Page Header - Compact -->
    <div>
      <h1 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">Inventory Folders</h1>
      <p class="mt-0.5 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Organize your inventory into folders for better management</p>
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
              class="w-full pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedDepartmentId"
            class="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Departments</option>
            <option v-for="dept in currentStoreDepartments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <select
            v-model="sortBy"
            class="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="name">Sort by Name</option>
            <option value="items">Sort by Items</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>
    </Card>

    <!-- Compact Header (Visible only on large screens) -->
    <Card v-if="!inventoryStore.loading" padding="sm" class="hidden lg:block mb-3 p-2.5">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Folders: <span class="font-semibold text-gray-900 dark:text-gray-100">{{ filteredFolders.length }}</span></span>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search folders..."
              class="pl-9 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 w-56"
            />
          </div>
          <select
            v-model="selectedDepartmentId"
            class="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 min-w-[140px]"
          >
            <option value="">All Departments</option>
            <option v-for="dept in currentStoreDepartments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <select
            v-model="sortBy"
            class="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="name">Sort by Name</option>
            <option value="items">Sort by Items</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>
    </Card>

    <!-- Loading State - Folders Skeleton (Compact) -->
    <div v-if="inventoryStore.loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 mb-4">
      <div
        v-for="i in 8"
        :key="i"
        class="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="flex items-center justify-between p-2.5 border-b border-gray-100 dark:border-gray-700/50">
          <div class="flex items-center gap-2 flex-1">
            <div class="w-7 h-7 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div class="flex-1">
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-0.5 animate-pulse"></div>
            </div>
          </div>
          <div class="flex gap-0.5">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>
        </div>
        <div class="p-2.5">
          <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-full mb-1.5 animate-pulse"></div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-12 animate-pulse"></div>
              <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-8 animate-pulse"></div>
            </div>
            <div class="flex items-center justify-between">
              <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-12 animate-pulse"></div>
              <div class="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-12 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Folders Grid - Compact -->
    <div v-else-if="paginatedFolders.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 mb-4">
      <div
        v-for="folder in paginatedFolders"
        :key="folder.id"
        class="group relative bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer transition-all duration-200 overflow-hidden"
        @click="navigateToFolder(folder.id)"
      >
        <!-- Card Header - Compact -->
        <div class="flex items-center justify-between p-2.5 border-b border-gray-100 dark:border-gray-700/50">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div
              class="w-7 h-7 rounded-md bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center flex-shrink-0"
            >
              <FolderIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {{ folder.name }}
              </h3>
            </div>
          </div>
          <div v-if="canManage" class="flex items-center gap-0.5 flex-shrink-0 ml-1">
            <button
              @click.stop="handleEditFolder(folder)"
              class="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-md transition-colors"
              title="Edit folder"
            >
              <PencilSquareIcon class="w-3.5 h-3.5 flex-shrink-0" />
            </button>
            <button
              @click.stop="handleDeleteFolder(folder)"
              class="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-md transition-colors"
              title="Delete folder"
            >
              <TrashIcon class="w-3.5 h-3.5 flex-shrink-0" />
            </button>
          </div>
        </div>

        <!-- Card Body - Compact -->
        <div class="p-2.5">
          <!-- Description -->
          <p class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-2 min-h-[0.75rem]">
            {{ folder.description || 'No description' }}
          </p>
          
          <!-- Folder Stats - Compact -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1">
                <CubeIcon class="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span class="text-[10px] text-gray-600 dark:text-gray-400">Items</span>
              </div>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ folder.itemCount }}</span>
            </div>
          </div>

          <!-- Low Stock Warning - Compact -->
          <div
            v-if="folder.lowStockCount > 0"
            class="mt-2 p-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md"
          >
            <p class="text-[10px] font-medium text-orange-700 dark:text-orange-300">
              ⚠ {{ folder.lowStockCount }} low stock
            </p>
          </div>

          <!-- Department Access Info - Compact -->
          <div
            v-if="folder.allowedDepartments && folder.allowedDepartments.length > 0"
            class="mt-2 p-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md"
          >
            <p class="text-[10px] font-medium text-blue-700 dark:text-blue-300 mb-1">
              Accessible to:
            </p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="deptId in folder.allowedDepartments.slice(0, 2)"
                :key="deptId"
                class="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
              >
                {{ getDepartmentName(deptId) }}
              </span>
              <span
                v-if="folder.allowedDepartments.length > 2"
                class="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
              >
                +{{ folder.allowedDepartments.length - 2 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State - Compact -->
    <Card v-else padding="sm" extra-class="p-4">
      <div class="text-center py-6">
        <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-2">
          <FolderIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          <span v-if="selectedDepartmentId">No folders found for {{ getDepartmentName(selectedDepartmentId) }}</span>
          <span v-else-if="searchQuery">No folders found</span>
          <span v-else>No folders yet</span>
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4 px-4">
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
      :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'"
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
        <div class="flex items-center justify-between w-full">
          <div>
            <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ editingFolder ? 'Edit Folder' : 'Create New Folder' }}
            </h3>
            <div class="flex items-center gap-3 mt-1.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              <span>Created By: {{ userStore.userData?.name || authStore.currentUser?.displayName || authStore.currentUser?.email?.split('@')[0] || 'User' }}</span>
              <span>Date: {{ new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</span>
            </div>
          </div>
        </div>
      </template>
      
      <div class="max-h-[60vh] overflow-y-auto pr-1.5 -mr-1.5">
        <form @submit.prevent="handleSaveFolder" class="space-y-3 sm:space-y-4">
        <!-- Folder Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Folder Name *
            </label>
            <input
              v-model="folderForm.name"
              type="text"
              required
              class="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500 transition-all hover:border-gray-300 dark:hover:border-gray-500"
              placeholder="Enter folder name"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Type *
            </label>
            <select
              v-model="folderForm.type"
              required
              class="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500 transition-all hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer"
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

        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <button
              type="button"
              @click="handleGenerateDescription"
              :disabled="!folderForm.name || isGeneratingDescription"
              class="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate description with AI"
            >
              <SparklesIcon 
                :class="[
                  'w-3.5 h-3.5 transition-transform',
                  isGeneratingDescription ? 'animate-spin' : ''
                ]"
              />
              <span class="hidden sm:inline">{{ isGeneratingDescription ? 'Generating...' : 'AI Generate' }}</span>
            </button>
          </div>
          <textarea
            v-model="folderForm.description"
            @input="aiError = null"
            rows="3"
            class="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/40 focus:border-primary-500 resize-none transition-all hover:border-gray-300 dark:hover:border-gray-500"
            placeholder="Describe the folder's purpose"
          ></textarea>
          <p v-if="aiError" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ aiError }}</p>
        </div>

        <!-- Color Selector -->
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Color
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="folderForm.color"
              type="color"
              class="w-14 h-10 rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-500"
            />
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ folderForm.color }}</span>
          </div>
        </div>

        <!-- Serial Number Management -->
        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
          <Checkbox
            v-model="folderForm.hasSerialNumbers"
            size="sm"
            wrapper-class="items-start"
          >
            <div class="flex-1">
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                Is serial number going to be available for items in this folder?
              </span>
              <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                When enabled, quantity field will be hidden and automatically set to 1 for each item (each item has a unique serial number). When disabled, quantity field will be visible and editable for bulk items.
              </p>
            </div>
          </Checkbox>
        </div>

        <!-- Department Access Control -->
        <div v-if="canCreateInventoryFolders" class="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-md border border-blue-200/60 dark:border-blue-800">
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Department Access
          </label>
          <p class="text-[10px] text-gray-600 dark:text-gray-400 mb-2">
            Select which departments can access this folder. Leave empty to allow all departments.
          </p>
          <div v-if="departmentsStore.loading" class="text-xs text-gray-500 dark:text-gray-400">
            Loading departments...
          </div>
          <div v-else-if="departmentsStore.departments.length === 0" class="text-xs text-gray-500 dark:text-gray-400">
            No departments available. Create departments first.
          </div>
          <div v-else class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="dept in departmentsStore.departments"
              :key="dept.id"
              class="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <Checkbox
                :model-value="folderForm.allowedDepartments.includes(dept.id)"
                @update:model-value="(checked) => toggleDepartmentAccess(dept.id, checked)"
                size="sm"
              >
                <div class="flex items-center justify-between flex-1">
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ dept.name }}</span>
                  <span v-if="dept.description" class="text-[10px] text-gray-500 dark:text-gray-400 ml-auto">
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
          <div class="p-4 bg-primary-50/50 dark:bg-primary-900/20 border-2 border-primary-500 rounded-md mb-4">
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
        <div v-if="selectedTemplate" class="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
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
              class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
                <div class="sm:col-span-3">
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Field Name *
                  </label>
                  <input
                    v-model="field.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all hover:border-gray-300 dark:hover:border-gray-500"
                    placeholder="fieldName"
                  />
                </div>
                <div class="sm:col-span-3">
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Label *
                  </label>
                  <input
                    v-model="field.label"
                    type="text"
                    required
                    class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all hover:border-gray-300 dark:hover:border-gray-500"
                    placeholder="Display Name"
                  />
                </div>
                <div class="sm:col-span-3">
                  <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Field Type *
                  </label>
                  <select
                    v-model="field.type"
                    required
                    class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                    <option value="boolean">Boolean</option>
                    <option value="currency">Currency</option>
                  </select>
                </div>
                <div class="sm:col-span-3 flex items-center gap-2 sm:gap-3 justify-start sm:justify-end pl-0 sm:pl-6 sm:ml-2">
                  <label class="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                    <input
                      v-model="field.required"
                      type="checkbox"
                      class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0 cursor-pointer transition-all hover:border-primary-400 dark:hover:border-primary-500 flex-shrink-0"
                    />
                    <span class="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Required</span>
                  </label>
                  <!-- Default fields cannot be removed -->
                  <button
                    v-if="!['name', 'price'].includes(field.name)"
                    type="button"
                    @click="handleRemoveField(index)"
                    class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    title="Remove field"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                  <span
                    v-else
                    class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded whitespace-nowrap"
                    title="Default field - cannot be removed"
                  >
                    D
                  </span>
                </div>
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
  SparklesIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Card from '~/components/ui/Card.vue'
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

