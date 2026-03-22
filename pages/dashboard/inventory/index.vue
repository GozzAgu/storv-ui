<template>
  <div class="pb-24 sm:pb-20 flex flex-col min-h-[calc(100svh-4rem)]">
    <!-- Hero header (duplicate upsell inline beside title — Micro plan) -->
    <div class="mb-3 sm:mb-4">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h1 class="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-300 tracking-tight">Folders</h1>
        <DuplicateFeatureUpsellBanner
          :loading="inventoryStore.loading && inventoryStore.folders.length === 0"
        />
      </div>
      <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Organize products into folders and manage stock in one place</p>
    </div>

    <!-- Toolbar: search + filters (single bar, modern) -->
    <div
      v-if="!inventoryStore.loading"
      class="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mb-3"
    >
      <div class="relative flex-1 min-w-0">
        <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search folders..."
          class="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white dark:focus:bg-gray-800 transition-colors"
            />
          </div>
      <div class="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
          <select
            v-model="selectedDepartmentId"
          class="px-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[120px]"
          >
          <option value="">All departments</option>
            <option v-for="dept in currentStoreDepartments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <select
            v-model="sortBy"
          class="px-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[100px]"
          >
            <option value="name">Name</option>
          <option value="items">Products</option>
            <option value="date">Date</option>
          </select>
        <span class="hidden sm:inline text-xs text-gray-400 dark:text-gray-500 ml-1">
          {{ filteredFolders.length }} folder{{ filteredFolders.length === 1 ? '' : 's' }}
        </span>
        </div>
      </div>

    <!-- Content area: show only one of skeleton, folders, or empty -->
    <!-- Loading skeleton (only while folders are fetching AND we have none yet) -->
    <div
      v-if="inventoryStore.loading && inventoryStore.folders.length === 0"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1.5 sm:gap-2 min-h-[120px]"
    >
      <div
        v-for="i in 14"
        :key="i"
        class="group relative flex flex-col items-center rounded-lg bg-gray-50 dark:bg-gray-800 pt-2.5 pb-2 px-2.5 overflow-visible animate-pulse"
      >
        <div class="absolute left-1.5 top-1.5 w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="absolute right-1 top-1 w-5 h-5 rounded-md bg-gray-200/70 dark:bg-gray-700/70" />
        <div class="mb-1.5 w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div class="h-3 rounded bg-gray-200 dark:bg-gray-700 w-16 mb-1" />
        <div class="h-2 rounded bg-gray-200 dark:bg-gray-700 w-24" />
      </div>
    </div>

    <!-- Select all + Bulk actions (folders) -->
    <div v-if="canManage && paginatedFolders.length > 0" class="flex flex-wrap items-center gap-2 mb-3">
      <Checkbox
        :model-value="allFoldersOnPageSelected"
        @update:model-value="toggleSelectAllFolders"
        size="sm"
        wrapper-class="justify-center"
        label-class="!text-xs !ml-2 !font-normal text-gray-500 dark:text-gray-500"
      >
        {{ allFoldersOnPageSelected ? 'All selected' : 'Select all' }}
      </Checkbox>
      <template v-if="selectedFoldersForBulk.length > 0">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ selectedFoldersForBulk.length }} selected</span>
        <Button
          variant="outline"
          size="sm"
          :icon="TrashIcon"
          class="!rounded-lg !px-2.5 !py-1.5 !text-xs !border-gray-200/80 dark:!border-gray-700/80 !text-gray-600 dark:!text-gray-300 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200/80 dark:hover:!border-red-800/50 hover:!bg-red-50/60 dark:hover:!bg-red-900/10"
          @click="openBulkDeleteFoldersModal"
        >
          Delete
        </Button>
      </template>
    </div>
    <!-- Folders grid (card style: large folder icon, title, count — reference: file-manager folder tiles) -->
    <div
      v-if="paginatedFolders.length > 0"
      class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-2.5"
    >
      <div
        v-for="folder in paginatedFolders"
        :key="folder.id"
        class="group relative flex flex-col items-stretch rounded-lg bg-gray-50/80 dark:bg-gray-800/30 transition-all duration-200 hover:bg-gray-100/90 dark:hover:bg-gray-700/40 active:scale-[0.99] cursor-pointer overflow-visible min-h-[128px] sm:min-h-[136px]"
        @click="navigateToFolder(folder.id)"
      >
        <!-- Checkbox top-left -->
        <div v-if="canManage" class="absolute left-2 top-2 z-10" @click.stop>
          <Checkbox
            :model-value="selectedFoldersForBulk.some(f => f.id === folder.id)"
            @update:model-value="(checked) => toggleFolderSelection(folder, checked)"
            size="sm"
            wrapper-class="justify-center"
          />
        </div>

        <!-- Ellipsis menu top-right -->
        <div v-if="canManage" class="absolute right-1.5 top-1.5 z-20" @click.stop>
          <button
            type="button"
            @click="toggleFolderMenu(folder.id)"
            class="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/90 dark:hover:bg-gray-700/80 transition-colors"
            aria-label="Folder options"
          >
            <EllipsisVerticalIcon class="w-4 h-4" />
          </button>
          <div
            v-if="openFolderMenuId === folder.id"
            class="absolute right-0 top-full mt-1 z-[100] min-w-[120px] bg-white dark:bg-gray-800 rounded-lg shadow-xl py-0.5"
            @click.stop
          >
            <button
              v-if="canDuplicateByPlan"
              type="button"
              @click="handleDuplicateFolder(folder); openFolderMenuId = null"
              class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
            >
              <DocumentDuplicateIcon class="w-3.5 h-3.5 shrink-0 text-primary-500" />
              Duplicate
            </button>
            <button
              type="button"
              @click="handleEditFolder(folder); openFolderMenuId = null"
              class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
            >
              <PencilSquareIcon class="w-3.5 h-3.5 shrink-0" />
              Edit
            </button>
            <button
              type="button"
              @click="handleDeleteFolder(folder); openFolderMenuId = null"
              class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <TrashIcon class="w-3.5 h-3.5 shrink-0" />
              Delete
            </button>
          </div>
        </div>

        <div
          class="flex flex-1 flex-col items-center justify-between w-full px-2.5 pb-2.5 text-center"
          :class="canManage ? 'pt-8' : 'pt-3.5'"
        >
          <!-- Folder icon (compact) -->
          <div class="flex flex-1 flex-col items-center justify-center w-full min-h-[44px] sm:min-h-[48px] mb-1">
            <FolderIcon
              class="w-10 h-10 sm:w-11 sm:h-11 text-slate-400 dark:text-slate-400 shrink-0"
              stroke-width="1.25"
            />
          </div>

          <div class="w-full min-w-0 mt-auto">
            <h3
              class="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate max-w-full px-0.5 leading-tight"
              :title="folder.name"
            >
              {{ folder.name }}
            </h3>
            <p class="mt-0.5 text-[11px] font-normal text-gray-400 dark:text-gray-500 text-center">
              {{ folder.itemCount }} {{ folder.itemCount === 1 ? 'Product' : 'Products' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state (when not loading and no folders) -->
    <div
      v-else
      class="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center py-10 px-4 sm:px-6 text-center min-w-0 w-full min-h-[calc(100svh-12rem)] sm:min-h-[calc(100svh-9rem)]"
    >
      <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mb-3">
        <FolderIcon class="w-6 h-6 text-primary-500 dark:text-primary-400" stroke-width="1.5" />
      </div>
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 break-words max-w-full">
        {{ selectedDepartmentId ? `No folders in ${getDepartmentName(selectedDepartmentId)}` : (searchQuery ? 'No folders found' : 'No folders yet') }}
      </h2>
      <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto break-words">
        {{ selectedDepartmentId ? 'Try another department or clear the filter.' : (searchQuery ? 'Try a different search.' : 'Create a folder to start organizing your inventory.') }}
      </p>
      <div v-if="selectedDepartmentId" class="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          extra-class="!text-xs !py-1.5 !px-3"
          @click="selectedDepartmentId = ''"
        >
          Clear filter
        </Button>
      </div>
    </div>

    <!-- Pagination bar -->
    <div
      v-if="filteredFolders.length > 0"
      class="fixed bottom-0 left-0 right-0 rounded-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 z-30 safe-area-inset-bottom transition-[left] duration-300"
      :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
    >
      <div class="px-4 sm:px-6 py-1.5 rounded-none">
        <Pagination
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
          :total="filteredFolders.length"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- FAB: New folder (draggable handle — position saved per device) -->
    <DraggableFabContainer
      v-if="canCreateInventoryFolders && !inventoryStore.loading && (paginatedFolders.length > 0 || (paginatedFolders.length === 0 && !searchQuery && !selectedDepartmentId))"
      storage-key="storv-fab:inventory-folders"
      layout="row"
    >
      <div class="group relative flex items-center justify-end overflow-visible">
        <span
          class="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 inline-flex items-center justify-center whitespace-nowrap w-max min-w-max shrink-0 max-w-none rounded-lg bg-gray-900 dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible"
        >
          {{ paginatedFolders.length === 0 ? 'Create first folder' : 'New folder' }}
        </span>
        <button
          type="button"
          @click="openCreateFolderModal"
          class="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary-600 hover:text-white hover:shadow-xl active:scale-95"
          aria-label="New folder"
        >
          <PlusIcon class="h-5 w-5 stroke-white text-white" stroke-width="2.5" />
        </button>
      </div>
    </DraggableFabContainer>

    <!-- Bulk Delete Folders Modal -->
    <Modal
      v-model="showBulkDeleteFoldersModal"
      @update:model-value="(v: boolean) => { showBulkDeleteFoldersModal = v; if (!v) bulkDeleteFoldersConfirmed = false }"
      size="md"
    >
      <template #header>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected folders</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedFoldersForBulk.length }} folder{{ selectedFoldersForBulk.length !== 1 ? 's' : '' }} selected</p>
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-xl">
          <p class="text-xs text-red-800 dark:text-red-200">This will permanently delete the selected folders and all products inside them. This action cannot be undone.</p>
        </div>
        <div class="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
          <Checkbox
            v-model="bulkDeleteFoldersConfirmed"
            label="I understand that these folders and their products will be permanently deleted."
            size="sm"
            wrapper-class="items-start"
            label-class="text-xs text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="outline" size="sm" @click="showBulkDeleteFoldersModal = false; bulkDeleteFoldersConfirmed = false" class="!rounded-lg">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteFoldersConfirmed || isBulkDeletingFolders"
          :icon="TrashIcon"
          class="!rounded-lg"
          @click="handleConfirmBulkDeleteFolders"
        >
          {{ isBulkDeletingFolders ? 'Deleting...' : `Delete ${selectedFoldersForBulk.length} folder${selectedFoldersForBulk.length !== 1 ? 's' : ''}` }}
        </Button>
      </template>
    </Modal>
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
      :subtitle="editingFolder ? 'Update folder details and template.' : 'Add a new inventory folder and define its table columns.'"
      size="lg"
    >
      <div class="max-h-[65vh] overflow-y-auto">
        <form @submit.prevent="handleSaveFolder" class="bg-transparent">
          <!-- Basic info -->
          <div class="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/60">
            <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Basic info</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">Name, type, and description</p>
            <div class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Folder name *</label>
            <input
              v-model="folderForm.name"
              type="text"
              required
                    class="w-full px-3 py-2 text-xs rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              placeholder="Enter folder name"
            />
          </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
            <select
              v-model="folderForm.type"
              required
                    class="w-full px-3 py-2 text-xs rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
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
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Description</label>
            <button
              type="button"
              @click="handleGenerateDescription"
              :disabled="!folderForm.name || isGeneratingDescription"
                    class="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate description with AI"
            >
                    <SparklesIcon :class="['w-3.5 h-3.5', isGeneratingDescription ? 'animate-spin' : '']" />
                    {{ isGeneratingDescription ? 'Generating...' : 'AI Generate' }}
            </button>
          </div>
          <textarea
            v-model="folderForm.description"
            @input="aiError = null"
            rows="3"
                  class="w-full px-3 py-2 text-xs rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            placeholder="Describe the folder's purpose"
                />
          <p v-if="aiError" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ aiError }}</p>
        </div>
          </div>
        </div>

          <!-- Serial numbers -->
          <div class="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/60">
            <Checkbox v-model="folderForm.hasSerialNumbers" size="sm" wrapper-class="items-start">
            <div class="flex-1">
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Use serial numbers for products</span>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  One serial per product (quantity fixed at 1). Turn off to allow editable quantity for bulk products.
              </p>
            </div>
          </Checkbox>
        </div>

          <!-- Department access (optional — folders work without departments; restrict later) -->
          <div v-if="canCreateInventoryFolders" class="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/60">
            <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Department access <span class="font-normal text-gray-500 dark:text-gray-400">(optional)</span></h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
              Leave all unchecked for <span class="font-medium text-gray-700 dark:text-gray-300">all departments</span> in this store.
              Check specific departments to limit who can use this folder. You can change this anytime by editing the folder.
            </p>
            <div v-if="departmentsStore.loading" class="text-xs text-gray-500 dark:text-gray-400 py-1.5">Loading departments…</div>
            <div
              v-else-if="currentStoreDepartments.length === 0"
              class="rounded-lg bg-gray-50 dark:bg-gray-900/40 ring-1 ring-gray-200/80 dark:ring-gray-600/60 px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              <p>No departments in this store yet — you can still create this folder. It will be available to everyone until you add departments and optionally restrict access here.</p>
              <NuxtLink
                v-if="currentStoreId"
                :to="`/dashboard/stores/${currentStoreId}/departments`"
                class="inline-flex mt-2 text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                Add departments →
              </NuxtLink>
            </div>
            <div v-else class="space-y-0 max-h-40 overflow-y-auto">
              <label
              v-for="dept in currentStoreDepartments"
              :key="dept.id"
                class="flex items-center gap-2.5 py-2 border-b border-gray-100 dark:border-gray-700/80 last:border-b-0 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="folderForm.allowedDepartments.includes(dept.id)"
                  @change="toggleDepartmentAccess(dept.id, ($event.target as HTMLInputElement).checked)"
                  class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                />
                <div class="flex-1 min-w-0">
                  <span class="text-xs font-medium text-gray-900 dark:text-gray-100 block truncate">{{ dept.name }}</span>
                  <span v-if="dept.description" class="text-xs text-gray-500 dark:text-gray-400 block truncate mt-0.5">{{ dept.description }}</span>
                </div>
          </label>
          </div>
        </div>

          <!-- Table template -->
          <div class="p-3 sm:p-4">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <div class="flex items-center gap-1.5">
                <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Table template</h4>
                <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">Custom</span>
              </div>
              <Button v-if="selectedTemplate" variant="outline" size="sm" @click="handleAddField" extra-class="!rounded-lg sm:ml-auto">
                + Add field
            </Button>
          </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Define columns for this folder’s table.</p>
            <div v-if="selectedTemplate" class="space-y-0 max-h-56 overflow-y-auto px-1 py-1">
            <div
              v-for="(field, index) in editableFields"
              :key="field.id"
                class="py-3 border-b border-gray-100 dark:border-gray-700/60 last:border-b-0"
            >
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-end min-w-0">
                <div class="sm:col-span-6 min-w-0">
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Label *</label>
                  <input
                    v-model="field.label"
                    type="text"
                    required
                        class="w-full min-w-0 px-3 py-2 text-xs rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0"
                        placeholder="Column title"
                        @input="syncTemplateFieldNameFromLabel(field)"
                  />
                </div>
                <div class="sm:col-span-3 min-w-0">
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type *</label>
                  <select
                    v-model="field.type"
                    required
                        class="w-full min-w-0 px-3 py-2 text-xs rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0 cursor-pointer"
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
                    v-if="!isLockedTemplateField(field)"
                    type="button"
                    @click="handleRemoveField(index)"
                        class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove field"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                      <span v-else class="px-2 py-1 text-[10px] font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400" title="Built-in column">Default</span>
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
        <Button variant="outline" size="sm" @click="handleCancelFolder" extra-class="!rounded-lg">Cancel</Button>
        <Button variant="primary" size="sm" type="submit" @click="handleSaveFolder" extra-class="!rounded-lg">
          {{ editingFolder ? 'Update' : 'Create' }} folder
        </Button>
      </template>
    </Modal>

    <!-- Duplicate Folder Modal (multiple folder names) -->
    <Modal
      v-model="showDuplicateFolderModal"
      title="Duplicate folder"
      subtitle="Create copies with the same template and settings. Enter one or more folder names."
      size="md"
      @update:model-value="(v: boolean) => { if (!v) clearDuplicateFolderModal() }"
    >
      <form @submit.prevent="handleConfirmDuplicateFolder" class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Folder name(s)</label>
          <Button variant="outline" size="sm" type="button" @click="addDuplicateFolderName" extra-class="!rounded-lg">
            + Add name
          </Button>
        </div>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div v-if="duplicateFolderNames.length === 0" class="text-center py-4 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
            Click "+ Add name" to enter folder name(s)
          </div>
          <div
            v-for="(name, index) in duplicateFolderNames"
            :key="index"
            class="flex items-center gap-2"
          >
            <input
              v-model="duplicateFolderNames[index]"
              type="text"
              class="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
              placeholder="New folder name"
            />
            <button
              type="button"
              @click="removeDuplicateFolderName(index)"
              class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
              aria-label="Remove"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p v-if="duplicateFolderNamesError" class="text-xs text-red-600 dark:text-red-400">{{ duplicateFolderNamesError }}</p>
      </form>
      <template #footer>
        <Button variant="outline" size="sm" type="button" @click="showDuplicateFolderModal = false; clearDuplicateFolderModal()" extra-class="!rounded-lg">Cancel</Button>
        <Button variant="primary" size="sm" type="button" @click="handleConfirmDuplicateFolder" :disabled="isDuplicatingFolder || !hasValidDuplicateFolderNames" extra-class="!rounded-lg">
          {{ isDuplicatingFolder ? 'Duplicating...' : `Duplicate ${validDuplicateFolderNamesCount} folder${validDuplicateFolderNamesCount !== 1 ? 's' : ''}` }}
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
  PencilSquareIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import DeleteFolderModal from '~/components/inventory/DeleteFolderModal.vue'
import DuplicateFeatureUpsellBanner from '~/components/inventory/DuplicateFeatureUpsellBanner.vue'
import DraggableFabContainer from '~/components/ui/DraggableFabContainer.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import Pagination from '~/components/ui/Pagination.vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useInventoryStore, type InventoryFolder, type Template, type TemplateField } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'
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

// Bulk delete folders
const selectedFoldersForBulk = ref<InventoryFolder[]>([])
const showBulkDeleteFoldersModal = ref(false)
const bulkDeleteFoldersConfirmed = ref(false)
const isBulkDeletingFolders = ref(false)

const openFolderMenuId = ref<string | null>(null)
const toggleFolderMenu = (folderId: string) => {
  openFolderMenuId.value = openFolderMenuId.value === folderId ? null : folderId
}

// Close folder menu when clicking outside
watch(openFolderMenuId, (id) => {
  if (!id) return
  const close = () => { openFolderMenuId.value = null }
  const handler = () => {
    close()
    document.removeEventListener('click', handler)
  }
  setTimeout(() => document.addEventListener('click', handler), 0)
})

// Duplicate folder
const showDuplicateFolderModal = ref(false)
const duplicateSourceFolder = ref<InventoryFolder | null>(null)
const duplicateFolderNames = ref<string[]>([''])
const isDuplicatingFolder = ref(false)
const duplicateFolderNamesError = ref<string | null>(null)

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
const itemsPerPage = ref(100)
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
const { formatCurrency, preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol || '$')

// Duplicate folders/items only on Storvv Medium and Enterprise
const canDuplicateByPlan = computed(() => {
  const sub = userStore.userData?.subscription
  return sub === 'storvv_medium' || sub === 'storvv_enterprise'
})

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
      label: 'Product',
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

/** Internal keys are fixed; only label is shown/edited for these. */
const LOCKED_TEMPLATE_FIELD_NAMES = new Set([
  'name',
  'price',
  'serialNo',
  'serialNumber',
  'brand',
  'model',
])

function isLockedTemplateField(field: TemplateField): boolean {
  return LOCKED_TEMPLATE_FIELD_NAMES.has(field.name)
}

/** Safe key from label (lowercase, spaces → underscores). */
function labelToFieldName(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '') || ''
}

/** For custom columns, keep `name` in sync with what the user types as the label. */
function syncTemplateFieldNameFromLabel(field: TemplateField) {
  if (isLockedTemplateField(field)) return
  const label = field.label.trim()
  if (!label) {
    field.name = `field_${field.id.replace(/[^a-z0-9]/gi, '').slice(-12) || 'x'}`
    return
  }
  let base = labelToFieldName(label)
  if (!base) base = 'field'
  const others = editableFields.value.filter((f) => f.id !== field.id)
  const used = new Set(others.map((f) => f.name))
  let candidate = base
  let n = 2
  while (used.has(candidate)) {
    candidate = `${base}_${n++}`
  }
  field.name = candidate
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
    
    // If serial numbers is already checked, add serialNo and product model (brand) fields
    if (folderForm.hasSerialNumbers) {
      const brandFieldExists = editableFields.value.some(f => f.name === 'brand')
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
          label: 'Product model',
          type: 'text',
          required: true,
        })
      }
    }
  }
})

// Watch hasSerialNumbers to auto-add/remove serialNo and product model (brand) fields
watch(() => folderForm.hasSerialNumbers, (hasSerial) => {
  if (hasSerial) {
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
        label: 'Product model',
        type: 'text',
        required: true,
      }
      editableFields.value.push(brandField)
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
    purple: 'bg-primary-400',
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

const handleDuplicateFolder = (folder: InventoryFolder) => {
  if (!canDuplicateByPlan.value) {
    toast.error('Duplicating folders is available on Storvv Medium and Enterprise plans.')
    return
  }
  duplicateSourceFolder.value = folder
  duplicateFolderNames.value = ['']
  duplicateFolderNamesError.value = null
  showDuplicateFolderModal.value = true
}

const clearDuplicateFolderModal = () => {
  duplicateSourceFolder.value = null
  duplicateFolderNames.value = []
  duplicateFolderNamesError.value = null
}

const validDuplicateFolderNames = computed(() => {
  const trimmed = duplicateFolderNames.value.map(n => n?.trim()).filter(Boolean)
  return [...new Set(trimmed)]
})

const validDuplicateFolderNamesCount = computed(() => validDuplicateFolderNames.value.length)

const hasValidDuplicateFolderNames = computed(() => validDuplicateFolderNamesCount.value > 0)

const addDuplicateFolderName = () => {
  duplicateFolderNames.value.push('')
  duplicateFolderNamesError.value = null
}

const removeDuplicateFolderName = (index: number) => {
  duplicateFolderNames.value.splice(index, 1)
  duplicateFolderNamesError.value = null
}

const handleConfirmDuplicateFolder = async () => {
  if (!canDuplicateByPlan.value) {
    toast.error('Duplicating folders is available on Storvv Medium and Enterprise plans.')
    return
  }
  const source = duplicateSourceFolder.value
  const names = validDuplicateFolderNames.value
  if (!source || names.length === 0) return

  const trimmedInputs = duplicateFolderNames.value.map(n => n?.trim()).filter(Boolean)
  if (trimmedInputs.length !== validDuplicateFolderNames.value.length) {
    duplicateFolderNamesError.value = 'Duplicate names are not allowed. Please ensure each folder name is unique.'
    return
  }
  duplicateFolderNamesError.value = null

  isDuplicatingFolder.value = true
  try {
    const allowedDepartments =
      source.allowedDepartments && source.allowedDepartments.length > 0 ? [...source.allowedDepartments] : []
    const template = source.template ? { ...source.template, fields: source.template.fields.map(f => ({ ...f })) } : undefined

    for (const name of names) {
      await inventoryStore.createFolder({
        name,
        description: source.description || '',
        type: source.type || '',
        color: source.color || '#3B82F6',
        hasSerialNumbers: source.hasSerialNumbers ?? false,
        template: template as Template | undefined,
        allowedDepartments,
      })
    }
    showDuplicateFolderModal.value = false
    clearDuplicateFolderModal()
    toast.success(`${names.length} folder${names.length !== 1 ? 's' : ''} created`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to duplicate folder')
  } finally {
    isDuplicatingFolder.value = false
  }
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
  
  // If hasSerialNumbers is true, ensure serialNo and product model (brand) fields exist
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
        label: 'Product model',
        type: 'text',
        required: true,
      }
      editableFields.value.push(brandField)
    }
  }
  nextTick(() => {
    editableFields.value.forEach((f) => {
      if (!isLockedTemplateField(f)) syncTemplateFieldNameFromLabel(f)
    })
  })
  showCreateFolderModal.value = true
}

const toggleFolderSelection = (folder: InventoryFolder, checked: boolean) => {
  const idx = selectedFoldersForBulk.value.findIndex(f => f.id === folder.id)
  if (checked && idx === -1) selectedFoldersForBulk.value.push(folder)
  else if (!checked && idx !== -1) selectedFoldersForBulk.value.splice(idx, 1)
}
const allFoldersOnPageSelected = computed(() =>
  paginatedFolders.value.length > 0 &&
  selectedFoldersForBulk.value.length === paginatedFolders.value.length
)
const toggleSelectAllFolders = () => {
  if (allFoldersOnPageSelected.value) {
    selectedFoldersForBulk.value = []
  } else {
    selectedFoldersForBulk.value = [...paginatedFolders.value]
  }
}
const openBulkDeleteFoldersModal = () => {
  bulkDeleteFoldersConfirmed.value = false
  showBulkDeleteFoldersModal.value = true
}
const handleConfirmBulkDeleteFolders = async () => {
  if (!bulkDeleteFoldersConfirmed.value || selectedFoldersForBulk.value.length === 0) return
  isBulkDeletingFolders.value = true
  const ids = selectedFoldersForBulk.value.map(f => f.id)
  const count = ids.length
  try {
    for (const id of ids) {
      await inventoryStore.deleteFolder(id)
    }
    selectedFoldersForBulk.value = []
    showBulkDeleteFoldersModal.value = false
    bulkDeleteFoldersConfirmed.value = false
    await inventoryStore.fetchFolders()
    toast.success(`${count} folder${count !== 1 ? 's' : ''} deleted`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete some folders')
  } finally {
    isBulkDeletingFolders.value = false
  }
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

  for (const f of editableFields.value) {
    if (!f.label.trim()) {
      alert('Please enter a label for every column')
      return
    }
    if (!isLockedTemplateField(f)) {
      syncTemplateFieldNameFromLabel(f)
    }
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
    // [] = all departments (same as omitting field). Non-empty = restrict to listed departments.
    // Use [] not undefined so Firestore updates clear a previous restriction when user unchecks all.
    const allowedDepartments =
      folderForm.allowedDepartments.length > 0 ? [...folderForm.allowedDepartments] : []

    if (editingFolder.value) {
      // Update existing folder
      await inventoryStore.updateFolder(editingFolder.value.id, {
        name: folderForm.name.trim(),
        description: folderForm.description.trim(),
        type: folderForm.type,
        color: folderForm.color,
        hasSerialNumbers: folderForm.hasSerialNumbers,
        template: template,
        allowedDepartments,
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
        allowedDepartments,
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
  const id = `field-${Date.now()}-${Math.random()}`
  const newField: TemplateField = {
    id,
    name: `tmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    label: '',
    type: 'text',
    required: false,
  }
  // Top of the list (save will still order name + price first, then other columns)
  editableFields.value.unshift(newField)
}

const handleRemoveField = (index: number) => {
  const field = editableFields.value[index]
  if (field && isLockedTemplateField(field)) {
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
