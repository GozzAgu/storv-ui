<template>
  <div
    class="flex min-h-[calc(100svh-4rem)] w-full max-w-none flex-col space-y-5 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:space-y-6 sm:pb-32"
  >
    <!-- Hero + filters -->
    <header
      class="relative rounded-sm bg-white px-4 py-4 dark:!bg-dashboard-card sm:px-5 sm:py-5"
    >
      <div class="relative">
        <div class="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div class="min-w-0 flex-1">
            <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              Inventory
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1
                class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl sm:tracking-tight"
              >
                Folders
              </h1>
              <DuplicateFeatureUpsellBanner
                :loading="inventoryStore.loading && inventoryStore.folders.length === 0"
              />
            </div>
            <p class="mt-1 max-w-xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Search, filter, and open folders. Switch between grid and table view.
            </p>
          </div>
          <div
            v-if="canCreateInventoryFolders"
            class="flex flex-wrap items-center gap-2 shrink-0"
          >
            <Button
              v-if="canShowCopyFolderTemplatesFromBranch"
              variant="outline"
              size="sm"
              :icon="ArrowsRightLeftIcon"
              extra-class="!rounded-2xl shrink-0"
              @click="openCopyFolderTemplatesFromBranchModal"
            >
              Copy from branch
            </Button>
            <Button
              variant="primary"
              size="sm"
              :icon="PlusIcon"
              extra-class="!rounded-2xl shrink-0"
              @click="openCreateFolderModal"
            >
              New folder
            </Button>
          </div>
        </div>

        <!-- Filters + select-all -->
        <div
          v-if="!inventoryStore.loading"
          class="mt-4 flex flex-col gap-2.5 border-t border-gray-100/90 pt-4 dark:border-gray-800/80 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1.5"
        >
          <div class="relative min-w-0 flex-1 sm:min-w-[200px] sm:max-w-md">
            <MagnifyingGlassIcon
              class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search folders…"
              class="w-full rounded-sm border border-gray-200/90 bg-white py-1.5 pl-8 pr-2.5 text-[11px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-500/40"
            />
          </div>
          <div class="flex flex-wrap items-center gap-1.5 sm:flex-nowrap sm:shrink-0">
            <select
              v-model="selectedDepartmentId"
              class="min-w-[108px] cursor-pointer rounded-sm border border-gray-200/90 bg-white py-1.5 pl-2.5 pr-7 text-[11px] font-medium text-gray-800 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
            >
              <option value="">All departments</option>
              <option v-for="dept in currentStoreDepartments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
            <select
              v-model="sortBy"
              class="min-w-[96px] cursor-pointer rounded-sm border border-gray-200/90 bg-white py-1.5 pl-2.5 pr-7 text-[11px] font-medium text-gray-800 transition-colors focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
            >
              <option value="name">Name</option>
              <option value="items">Products</option>
              <option value="date">Date</option>
            </select>
            <span
              class="hidden items-center rounded-full border border-gray-200/80 bg-gray-50/90 px-2 py-0.5 text-[10px] font-medium tabular-nums text-gray-600 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-400 sm:inline-flex"
            >
              {{ filteredFolders.length }} folder{{ filteredFolders.length === 1 ? '' : 's' }}
            </span>
            <div
              class="inline-flex items-center rounded-sm border border-gray-200/90 p-0.5 dark:border-gray-700/80"
              role="group"
              aria-label="Folder layout"
            >
              <button
                type="button"
                class="rounded-sm px-1.5 py-1 transition-colors"
                :class="
                  foldersViewMode === 'grid'
                    ? 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-50/90 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
                "
                :aria-pressed="foldersViewMode === 'grid'"
                @click="foldersViewMode = 'grid'"
              >
                <Squares2X2Icon class="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="rounded-sm px-1.5 py-1 transition-colors"
                :class="
                  foldersViewMode === 'table'
                    ? 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-50/90 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
                "
                :aria-pressed="foldersViewMode === 'table'"
                @click="foldersViewMode = 'table'"
              >
                <TableCellsIcon class="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- Select all: same row on sm+ -->
          <div
            v-if="canCreateInventoryFolders && paginatedFolders.length > 0"
            class="flex flex-wrap items-center gap-2 sm:ml-auto sm:border-l sm:border-gray-200/80 sm:pl-3 dark:sm:border-gray-700/80"
          >
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
                class="!rounded-2xl !px-2.5 !py-1 !text-xs !border-gray-200/80 dark:!border-gray-700/80 !text-gray-600 dark:!text-gray-300 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200/80 dark:hover:!border-red-800/50 hover:!bg-red-50/60 dark:hover:!bg-red-900/10"
                @click="openBulkDeleteFoldersModal"
              >
                Delete
              </Button>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Content area: show only one of skeleton, folders, or empty -->
    <!-- Loading skeleton -->
    <div
      v-if="inventoryStore.loading && inventoryStore.folders.length === 0"
      class="grid min-h-[78px] grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
    >
      <div
        v-for="i in 14"
        :key="i"
        class="relative flex min-h-[78px] flex-col overflow-hidden rounded-sm bg-white px-2 pb-1 pt-5 shadow-[0_1px_2px_rgb(0_0_0_/_0.06)] animate-pulse sm:min-h-[82px] dark:!bg-dashboard-card"
      >
        <div class="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded bg-gray-200 dark:bg-white/10" />
        <div class="absolute right-1.5 top-1.5 h-4 w-4 rounded-sm bg-gray-200/80 dark:bg-white/10" />
        <div class="mt-0.5 flex flex-1 items-center gap-1.5">
          <div class="h-8 w-7 shrink-0 rounded-sm bg-gray-100 dark:bg-white/10" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-2.5 w-[70%] rounded bg-gray-200 dark:bg-white/15" />
            <div class="h-2 w-12 rounded bg-gray-200/80 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>

    <Transition name="folders-view" mode="out-in">
      <!-- Folders grid -->
      <div
        v-if="paginatedFolders.length > 0 && foldersViewMode === 'grid'"
        key="grid"
        class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
      >
        <InventoryFolderUiverseTile
          v-for="folder in paginatedFolders"
          :key="folder.id"
          :name="folder.name"
          :item-count="folder.itemCount"
          :tile-key="folder.id"
          :has-overlays="canCreateInventoryFolders"
          @click="navigateToFolder(folder.id)"
        >
          <template v-if="canCreateInventoryFolders" #checkbox>
            <div class="absolute left-1.5 top-1.5 z-10" @click.stop>
              <Checkbox
                :model-value="selectedFoldersForBulk.some(f => f.id === folder.id)"
                @update:model-value="(checked) => toggleFolderSelection(folder, checked)"
                size="sm"
                wrapper-class="justify-center"
              />
            </div>
          </template>
          <template v-if="canCreateInventoryFolders" #menu>
            <div
              class="absolute right-1 top-1 z-20"
              data-inventory-folder-menu
              @click.stop
            >
              <button
                type="button"
                :data-folder-actions-anchor="folder.id"
                @click="toggleFolderMenu(folder.id)"
                class="rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-500 dark:hover:bg-gray-800/90 dark:hover:text-gray-200"
                aria-label="Folder options"
              >
                <EllipsisVerticalIcon class="h-4 w-4" stroke-width="2" />
              </button>
            </div>
          </template>
        </InventoryFolderUiverseTile>
      </div>

      <!-- Folders table (styling aligned with folder item table on /inventory/[id]) -->
      <!-- `data-table-shell`: pairs with main.css so theme toggle doesn’t animate hundreds of row backgrounds (folders page-only lag). -->
      <div
        v-else-if="paginatedFolders.length > 0 && foldersViewMode === 'table'"
        key="table"
        class="data-table-shell"
      >
        <div class="overflow-x-auto">
        <table class="min-w-full border-separate border-spacing-0">
          <thead
            class="border-b border-gray-200/90 bg-gray-50/95 dark:border-gray-800/80 dark:bg-dashboard-card/90!"
          >
            <tr>
              <th
                v-if="canCreateInventoryFolders"
                scope="col"
                class="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
              >
                <Checkbox
                  :model-value="allFoldersOnPageSelected"
                  @update:model-value="toggleSelectAllFolders"
                  size="sm"
                  wrapper-class="justify-center"
                />
              </th>
              <th
                scope="col"
                class="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
              >
                Folder
              </th>
              <th
                scope="col"
                class="hidden px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:table-cell sm:px-4"
              >
                Type
              </th>
              <th
                scope="col"
                class="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4 tabular-nums"
              >
                Products
              </th>
              <th
                scope="col"
                class="hidden px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 md:table-cell md:px-4"
              >
                Tracking
              </th>
              <th
                scope="col"
                class="hidden px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 lg:table-cell lg:px-4"
              >
                Departments
              </th>
              <th
                v-if="canCreateInventoryFolders"
                scope="col"
                class="w-12 px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:w-[4.5rem] sm:px-4"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-dashboard-card/35!">
            <tr
              v-for="folder in paginatedFolders"
              :key="folder.id"
              class="cursor-pointer border-b border-gray-100/90 transition-colors duration-300 even:bg-gray-50/40 hover:bg-gray-50/95 dark:border-gray-800/70 dark:even:bg-gray-900/25 dark:hover:bg-gray-900/70"
              @click="navigateToFolder(folder.id)"
            >
              <td v-if="canCreateInventoryFolders" class="px-3 py-2.5 text-center sm:px-4" @click.stop>
                <Checkbox
                  :model-value="selectedFoldersForBulk.some(f => f.id === folder.id)"
                  @update:model-value="(checked) => toggleFolderSelection(folder, checked)"
                  size="sm"
                  wrapper-class="justify-center"
                />
              </td>
              <td class="px-3 py-2.5 sm:px-4 align-top">
                <span class="text-[10px] font-medium text-gray-900 dark:text-gray-100">{{ folder.name }}</span>
              </td>
              <td class="hidden px-3 py-2.5 align-top text-[10px] text-gray-600 dark:text-gray-300 sm:table-cell sm:px-4">
                {{ formatFolderTypeLabel(folder.type) }}
              </td>
              <td
                class="px-3 py-2.5 text-right align-top text-[10px] tabular-nums text-gray-600 dark:text-gray-300 sm:px-4"
              >
                {{ folder.itemCount }}
              </td>
              <td class="hidden px-3 py-2.5 align-top text-[10px] text-gray-600 dark:text-gray-300 md:table-cell md:px-4">
                {{ folder.hasSerialNumbers ? 'Serial' : 'Quantity' }}
              </td>
              <td
                class="hidden max-w-[11rem] truncate px-3 py-2.5 align-top text-[10px] text-gray-600 dark:text-gray-300 lg:table-cell lg:px-4"
                :title="folderDepartmentsSummary(folder)"
              >
                {{ folderDepartmentsSummary(folder) }}
              </td>
              <td v-if="canCreateInventoryFolders" class="px-3 py-2.5 text-right sm:px-4" @click.stop>
                <div class="relative inline-flex justify-end" data-inventory-folder-menu>
                  <button
                    type="button"
                    :data-folder-actions-anchor="folder.id"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:hover:text-gray-200"
                    aria-label="Folder options"
                    @click="toggleFolderMenu(folder.id)"
                  >
                    <EllipsisVerticalIcon class="h-4 w-4" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </Transition>

    <!-- Empty state -->
    <div
      v-if="!inventoryStore.loading && paginatedFolders.length === 0"
      class="relative flex min-h-[min(52vh,26rem)] w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-sm bg-white px-4 py-14 text-center dark:!bg-dashboard-card sm:min-h-[min(48vh,22rem)] sm:px-6"
    >
      <div class="relative z-10">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/60"
        >
          <FolderIcon class="h-8 w-8 text-gray-500 dark:text-gray-400" stroke-width="1.2" />
        </div>
        <h2 class="max-w-md break-words text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          {{ selectedDepartmentId ? `No folders in ${getDepartmentName(selectedDepartmentId)}` : (searchQuery ? 'No folders found' : 'No folders yet') }}
        </h2>
        <p class="mx-auto mt-2 max-w-sm break-words text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {{ selectedDepartmentId ? 'Try another department or clear the filter.' : (searchQuery ? 'Try a different search.' : 'Create a folder to start organizing your inventory.') }}
        </p>
      </div>
      <div v-if="selectedDepartmentId" class="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2">
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

    <DashboardFixedFooter v-if="filteredFolders.length > 0" :sidebar-collapsed="sidebarCollapsed">
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredFolders.length"
        @page-change="handlePageChange"
      />
    </DashboardFixedFooter>

    <!-- Bulk Delete Folders Modal -->
    <Modal
      v-model="showBulkDeleteFoldersModal"
      @update:model-value="(v: boolean) => { showBulkDeleteFoldersModal = v; if (!v) bulkDeleteFoldersConfirmed = false }"
      size="md"
    >
      <template #header>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected folders</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedFoldersForBulk.length }} folder{{ selectedFoldersForBulk.length !== 1 ? 's' : '' }} selected</p>
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-sm">
          <p class="text-xs text-red-800 dark:text-red-200">This will permanently delete the selected folders and all products inside them. This action cannot be undone.</p>
        </div>
        <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
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
        <Button variant="outline" size="sm" @click="showBulkDeleteFoldersModal = false; bulkDeleteFoldersConfirmed = false" class="!rounded-2xl">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteFoldersConfirmed || isBulkDeletingFolders"
          :icon="TrashIcon"
          class="!rounded-2xl"
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

    <!-- Create Folder (slide-over) -->
    <SidePanel
      v-model="showCreateFolderModal"
      :title="editingFolder ? 'Edit Folder' : 'Create New Folder'"
      :subtitle="editingFolder ? 'Update folder details and template.' : 'Add a new inventory folder and define its table columns.'"
    >
      <div class="min-h-0">
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
                    class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              placeholder="Enter folder name"
            />
          </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
            <select
              v-model="folderForm.type"
              required
                    class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
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
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            v-model="folderForm.description"
            rows="3"
                  class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            placeholder="Describe the folder's purpose"
                />
        </div>
          </div>
        </div>

          <!-- Serial numbers -->
          <div class="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/60">
            <Checkbox v-model="folderForm.hasSerialNumbers" size="sm" wrapper-class="items-start">
            <div class="flex-1">
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Use serial numbers for products</span>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  When on: one row per unit with a serial; no quantity field. When off: quantity on each row counts stock for that product.
              </p>
            </div>
          </Checkbox>
        </div>

          <!-- Department access (optional; folders work without departments; restrict later) -->
          <div v-if="canCreateInventoryFolders" class="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/60">
            <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Department access <span class="font-normal text-gray-500 dark:text-gray-400">(optional)</span></h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
              Leave all unchecked for <span class="font-medium text-gray-700 dark:text-gray-300">all departments</span> in this store.
              Check specific departments to limit who can use this folder. You can change this anytime by editing the folder.
            </p>
            <div v-if="departmentsStore.loading" class="text-xs text-gray-500 dark:text-gray-400 py-1.5">Loading departments…</div>
            <div
              v-else-if="currentStoreDepartments.length === 0"
              class="rounded-sm bg-gray-50 dark:!bg-dashboard-card/40 ring-1 ring-gray-200/80 dark:ring-gray-600/60 px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
            >
              <p>No departments in this store yet. You can still create this folder. It will be available to everyone until you add departments and optionally restrict access here.</p>
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
              <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
                <input
                  ref="folderTemplateExcelInput"
                  type="file"
                  accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  class="sr-only"
                  :disabled="importingFolderTemplate"
                  @change="handleImportFolderTemplateExcel"
                />
                <Button
                  v-if="selectedTemplate"
                  type="button"
                  variant="outline"
                  size="sm"
                  :icon="ArrowUpTrayIcon"
                  :loading="importingFolderTemplate"
                  :disabled="importingFolderTemplate"
                  extra-class="!rounded-2xl"
                  @click="triggerFolderTemplateExcelPicker"
                >
                  Import from Excel
                </Button>
                <Button v-if="selectedTemplate" variant="outline" size="sm" @click="handleAddField" extra-class="!rounded-2xl">
                  + Add field
                </Button>
              </div>
          </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Define columns for this folder’s table, or import row 1 of a sheet as column headers. Types are guessed from sample rows when possible.
            </p>
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
                        class="w-full min-w-0 px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0"
                        placeholder="Column title"
                        @input="syncTemplateFieldNameFromLabel(field)"
                  />
                </div>
                <div class="sm:col-span-3 min-w-0">
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type *</label>
                  <select
                    v-model="field.type"
                    required
                        class="w-full min-w-0 px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0 cursor-pointer"
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
                        class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                      <span v-else class="px-2 py-1 text-[10px] font-medium rounded-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400" title="Built-in column">Default</span>
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
        <Button variant="outline" size="sm" @click="handleCancelFolder" extra-class="!rounded-2xl">Cancel</Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          :disabled="!isFolderDrawerValid"
          @click="handleSaveFolder"
          extra-class="!rounded-2xl"
        >
          {{ editingFolder ? 'Update' : 'Create' }} folder
        </Button>
      </template>
    </SidePanel>

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
          <Button variant="outline" size="sm" type="button" @click="addDuplicateFolderName" extra-class="!rounded-2xl">
            + Add name
          </Button>
        </div>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div v-if="duplicateFolderNames.length === 0" class="text-center py-4 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-600 rounded-sm bg-gray-50/50 dark:bg-gray-800/30">
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
              class="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
              placeholder="New folder name"
            />
            <button
              type="button"
              @click="removeDuplicateFolderName(index)"
              class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors shrink-0"
              aria-label="Remove"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p v-if="duplicateFolderNamesError" class="text-xs text-red-600 dark:text-red-400">{{ duplicateFolderNamesError }}</p>
      </form>
      <template #footer>
        <Button variant="outline" size="sm" type="button" @click="showDuplicateFolderModal = false; clearDuplicateFolderModal()" extra-class="!rounded-2xl">Cancel</Button>
        <Button variant="primary" size="sm" type="button" @click="handleConfirmDuplicateFolder" :disabled="isDuplicatingFolder || !hasValidDuplicateFolderNames" extra-class="!rounded-2xl">
          {{ isDuplicatingFolder ? 'Duplicating...' : `Duplicate ${validDuplicateFolderNamesCount} folder${validDuplicateFolderNamesCount !== 1 ? 's' : ''}` }}
        </Button>
      </template>
    </Modal>

    <!-- Copy selected folder templates from another branch -->
    <Modal
      v-model="showCopyFolderTemplatesModal"
      title="Copy folder templates from another branch"
      subtitle="The checklist is always for the branch you choose in Source branch, not the branch shown in your inventory grid behind this window."
      size="md"
    >
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Source branch</label>
          <select
            v-model="copyTemplatesSourceStoreId"
            class="w-full rounded-sm border border-gray-200/90 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:!bg-dashboard-card dark:text-gray-100 dark:focus:border-primary-500/40"
          >
            <option value="" disabled>Select a branch…</option>
            <option
              v-for="s in otherBranchesForTemplateCopy"
              :key="s.id"
              :value="s.id"
            >
              {{ branchDisplayLabel(s) }}
            </option>
          </select>
        </div>
        <div v-if="copyTemplatesSourceStoreId" class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Folders to copy</label>
            <div class="flex items-center gap-2">
              <span class="text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
                {{ copyTemplatesSelectedCount }} selected
              </span>
              <button
                type="button"
                class="text-[11px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-40"
                :disabled="copyTemplatesSourceFoldersList.length === 0 || loadingCopyTemplatesSourceFolders"
                @click="selectAllCopyTemplatesFolders"
              >
                All
              </button>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <button
                type="button"
                class="text-[11px] font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-40"
                :disabled="loadingCopyTemplatesSourceFolders"
                @click="clearCopyTemplatesFolderSelection"
              >
                None
              </button>
            </div>
          </div>
          <div
            class="max-h-[min(240px,calc(100vh-20rem))] overflow-y-auto overscroll-contain rounded-sm border border-gray-200/90 dark:border-gray-600"
          >
            <div v-if="loadingCopyTemplatesSourceFolders" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
              Loading folders…
            </div>
            <div
              v-else-if="copyTemplatesSourceFoldersList.length === 0"
              class="space-y-2 px-3 py-5 text-left text-[11px] leading-relaxed text-gray-500 dark:text-gray-400"
            >
              <p>
                No folder templates were found under
                <strong class="font-medium text-gray-700 dark:text-gray-300">{{ copyTemplatesSourceBranchLabel }}</strong>
                (<span class="whitespace-normal">your &ldquo;Source branch&rdquo;</span> above).
              </p>
              <p v-if="storesStore.currentStoreId && copyTemplatesSourceStoreId && copyTemplatesSourceStoreId !== storesStore.currentStoreId && inventoryViewBranchLabel">
                The folder tiles behind this modal are from
                <strong class="font-medium text-gray-700 dark:text-gray-300">{{ inventoryViewBranchLabel }}</strong>
                Switch &ldquo;Source branch&rdquo; to that branch if those are the folders you want to copy, or create folders first on {{ copyTemplatesSourceBranchLabel }}.
              </p>
            </div>
            <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700/90">
              <li
                v-for="f in copyTemplatesSourceFoldersList"
                :key="f.id"
                class="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-gray-50/90 dark:hover:bg-gray-900/35"
              >
                <Checkbox
                  :model-value="copyTemplatesSelectedFolderIds.includes(f.id)"
                  @update:model-value="(checked) => setCopyTemplatesFolderChecked(f.id, !!checked)"
                  size="sm"
                  wrapper-class="min-w-0 flex-1"
                  label-class="!ml-2.5 min-w-0"
                >
                  <span class="block truncate text-sm text-gray-900 dark:text-gray-100">{{ f.name || 'Untitled' }}</span>
                </Checkbox>
              </li>
            </ul>
          </div>
        </div>
        <fieldset class="space-y-2">
          <legend class="text-xs font-medium text-gray-700 dark:text-gray-300">When a folder name already exists here</legend>
          <label class="flex cursor-pointer items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input v-model="copyTemplatesNameCollision" type="radio" value="skip" class="mt-0.5" />
            <span>Skip that folder</span>
          </label>
          <label class="flex cursor-pointer items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input v-model="copyTemplatesNameCollision" type="radio" value="suffix" class="mt-0.5" />
            <span>Create with suffix &ldquo;(copy)&rdquo;, then &ldquo;(copy 2)&rdquo; if needed</span>
          </label>
        </fieldset>
        <p class="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          Department restrictions are not copied; set them again on this branch if you use them.
        </p>
      </div>
      <template #footer>
        <Button
          variant="outline"
          size="sm"
          type="button"
          extra-class="!rounded-2xl"
          @click="showCopyFolderTemplatesModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="button"
          extra-class="!rounded-2xl"
          :disabled="
            isCopyingFolderTemplates
              || !copyTemplatesSourceStoreId
              || !storesStore.currentStoreId
              || copyTemplatesSelectedCount === 0
              || loadingCopyTemplatesSourceFolders
          "
          @click="handleConfirmCopyFolderTemplates"
        >
          {{
            isCopyingFolderTemplates
              ? 'Copying…'
              : `Copy ${copyTemplatesSelectedCount || 0} folder${copyTemplatesSelectedCount === 1 ? '' : 's'}`
          }}
        </Button>
      </template>
    </Modal>

    <!-- Folder actions menu (teleported; not clipped by grid/card overflow) -->
    <Teleport to="body">
      <div
        v-if="openFolderMenuId && folderForOpenMenu && folderMenuFixedStyle"
        data-inventory-folder-menu
        class="frosted-glass fixed z-[1000] min-w-[120px] rounded-sm border border-gray-200/90 py-0.5 dark:border-gray-700/80"
        :style="folderMenuFixedStyle"
        @click.stop
      >
        <button
          v-if="canDuplicateByPlan"
          type="button"
          @click="handleDuplicateFolder(folderForOpenMenu); openFolderMenuId = null"
          class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/85 transition-colors"
        >
          <DocumentDuplicateIcon class="w-3.5 h-3.5 shrink-0 text-primary-500" />
          Duplicate
        </button>
        <button
          type="button"
          @click="handleEditFolder(folderForOpenMenu); openFolderMenuId = null"
          class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/85 transition-colors"
        >
          <PencilSquareIcon class="w-3.5 h-3.5 shrink-0" />
          Edit
        </button>
        <button
          type="button"
          @click="handleDeleteFolder(folderForOpenMenu); openFolderMenuId = null"
          class="w-full px-2.5 py-2 flex items-center gap-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/35 transition-colors"
        >
          <TrashIcon class="w-3.5 h-3.5 shrink-0" />
          Delete
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Store } from '~/composables/useStores'
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
  Squares2X2Icon,
  TableCellsIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import Button from '~/components/ui/Button.vue'
import DeleteFolderModal from '~/components/inventory/DeleteFolderModal.vue'
import DuplicateFeatureUpsellBanner from '~/components/inventory/DuplicateFeatureUpsellBanner.vue'
import InventoryFolderUiverseTile from '~/components/inventory/InventoryFolderUiverseTile.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import Pagination from '~/components/ui/Pagination.vue'
import DashboardFixedFooter from '~/components/ui/DashboardFixedFooter.vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useInventoryStore, type InventoryFolder, type Template, type TemplateField } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'
import { parseTemplateFieldsFromExcelArrayBuffer } from '~/utils/inventory-template-from-excel'

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

/** Capture-phase outside click so the menu closes reliably (bubble-only listener missed some cases). */
let folderMenuOutsideHandler: ((e: MouseEvent) => void) | null = null

function removeFolderMenuOutsideListener() {
  if (folderMenuOutsideHandler && import.meta.client) {
    document.removeEventListener('click', folderMenuOutsideHandler, true)
    folderMenuOutsideHandler = null
  }
}

const folderMenuFixedStyle = ref<Record<string, string> | null>(null)

function updateFolderMenuPosition() {
  const id = openFolderMenuId.value
  if (!id || !import.meta.client) {
    folderMenuFixedStyle.value = null
    return
  }
  const el = getVisibleMenuAnchorElement('data-folder-actions-anchor', id)
  if (!el) {
    folderMenuFixedStyle.value = null
    return
  }
  const r = el.getBoundingClientRect()
  /** Enough for Duplicate + Edit + Delete (or Edit + Delete only) */
  folderMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
    menuWidth: 120,
    estimatedMenuHeight: 132,
    margin: 4,
    viewportPadding: 8,
  })
}

function addFolderMenuPositionListeners() {
  if (!import.meta.client) return
  window.addEventListener('scroll', updateFolderMenuPosition, true)
  window.addEventListener('resize', updateFolderMenuPosition)
}

function removeFolderMenuPositionListeners() {
  if (!import.meta.client) return
  window.removeEventListener('scroll', updateFolderMenuPosition, true)
  window.removeEventListener('resize', updateFolderMenuPosition)
}

watch(openFolderMenuId, (id) => {
  removeFolderMenuOutsideListener()
  removeFolderMenuPositionListeners()
  folderMenuFixedStyle.value = null
  if (!id || !import.meta.client) return

  nextTick(() => {
    updateFolderMenuPosition()
    addFolderMenuPositionListeners()
  })

  folderMenuOutsideHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (t?.closest?.('[data-inventory-folder-menu]')) return
    openFolderMenuId.value = null
    removeFolderMenuOutsideListener()
  }

  nextTick(() => {
    setTimeout(() => {
      if (openFolderMenuId.value && folderMenuOutsideHandler) {
        document.addEventListener('click', folderMenuOutsideHandler, true)
      }
    }, 0)
  })
})

onBeforeUnmount(() => {
  removeFolderMenuOutsideListener()
  removeFolderMenuPositionListeners()
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

const getInitialFoldersView = (): 'grid' | 'table' => {
  if (import.meta.client) {
    try {
      const v = localStorage.getItem('inventory-folders-view')
      if (v === 'table' || v === 'grid') return v
    } catch {
      /* ignore */
    }
  }
  return 'grid'
}
const foldersViewMode = ref<'grid' | 'table'>(getInitialFoldersView())
watch(foldersViewMode, (m) => {
  openFolderMenuId.value = null
  if (!import.meta.client) return
  try {
    localStorage.setItem('inventory-folders-view', m)
  } catch {
    /* ignore */
  }
})
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
  // Same-tab sidebar toggles don’t fire `storage`; poll lightly (100ms was needlessly hot on heavy pages).
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
  }, 1000)
}

const authStore = useAuthStore()
const userStore = useUserStore()
const inventoryStore = useInventoryStore()
const departmentsStore = useDepartmentsStore()
const storesStore = useStoresStore()
const toast = useAppToast()
const { canCreateInventoryFolders } = usePermissions()
const { formatCurrency, preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol || '$')

// Duplicate folders/items only on Storvv Medium and Enterprise
const canDuplicateByPlan = computed(() => {
  const sub = userStore.userData?.subscription
  return sub === 'storvv_medium' || sub === 'storvv_enterprise'
})

// Copy folder templates between branches: Enterprise only
const canCopyFolderTemplatesFromBranchByPlan = computed(
  () => userStore.userData?.subscription === 'storvv_enterprise',
)

const otherBranchesForTemplateCopy = computed(() => {
  const id = storesStore.currentStoreId
  if (!id) return [] as Store[]
  return [...storesStore.stores]
    .filter(s => s.isActive && s.id !== id)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
})

const canShowCopyFolderTemplatesFromBranch = computed(
  () =>
    userStore.userData?.role === 'superAdmin'
    && canCopyFolderTemplatesFromBranchByPlan.value
    && canCreateInventoryFolders.value
    && storesStore.activeStores.length > 1
)

function branchDisplayLabel(s: Store) {
  return (s.name && s.name.trim()) || s.description?.trim?.() || s.id
}

/** Branch selected in modal "Source branch" dropdown (for copy checklist). */
const copyTemplatesSourceBranchLabel = computed(() => {
  const id = copyTemplatesSourceStoreId.value
  if (!id) return 'that branch'
  const s = storesStore.getStoreById(id)
  return s ? branchDisplayLabel(s) : id
})

/** Active app branch; matches inventory grid behind the modal. */
const inventoryViewBranchLabel = computed(() => {
  const id = storesStore.currentStoreId
  if (!id) return ''
  const s = storesStore.getStoreById(id)
  return s ? branchDisplayLabel(s) : id
})

const showCopyFolderTemplatesModal = ref(false)
const copyTemplatesSourceStoreId = ref('')
const copyTemplatesNameCollision = ref<'skip' | 'suffix'>('skip')
const isCopyingFolderTemplates = ref(false)
const copyTemplatesSourceFoldersList = ref<InventoryFolder[]>([])
const copyTemplatesSelectedFolderIds = ref<string[]>([])
const loadingCopyTemplatesSourceFolders = ref(false)

const copyTemplatesSelectedCount = computed(() => copyTemplatesSelectedFolderIds.value.length)

async function refreshCopyTemplatesFolderList() {
  const storeId = copyTemplatesSourceStoreId.value
  if (!storeId) {
    copyTemplatesSourceFoldersList.value = []
    copyTemplatesSelectedFolderIds.value = []
    return
  }
  loadingCopyTemplatesSourceFolders.value = true
  copyTemplatesSelectedFolderIds.value = []
  try {
    const list = await inventoryStore.fetchFolderTemplatesForStore(storeId)
    copyTemplatesSourceFoldersList.value = list
    copyTemplatesSelectedFolderIds.value = list.map((folder) => folder.id)
  } catch (error: unknown) {
    copyTemplatesSourceFoldersList.value = []
    copyTemplatesSelectedFolderIds.value = []
    const msg = error instanceof Error ? error.message : 'Failed to load folders from branch'
    toast.error(msg)
  } finally {
    loadingCopyTemplatesSourceFolders.value = false
  }
}

function setCopyTemplatesFolderChecked(folderId: string, checked: boolean) {
  const ids = copyTemplatesSelectedFolderIds.value
  const has = ids.includes(folderId)
  if (checked && !has) {
    copyTemplatesSelectedFolderIds.value = [...ids, folderId]
  } else if (!checked && has) {
    copyTemplatesSelectedFolderIds.value = ids.filter((id) => id !== folderId)
  }
}

function selectAllCopyTemplatesFolders() {
  copyTemplatesSelectedFolderIds.value = copyTemplatesSourceFoldersList.value.map((f) => f.id)
}

function clearCopyTemplatesFolderSelection() {
  copyTemplatesSelectedFolderIds.value = []
}

watch(showCopyFolderTemplatesModal, async (open) => {
  if (!open || import.meta.server) return
  try {
    await storesStore.fetchStores()
    if (!copyTemplatesSourceStoreId.value && otherBranchesForTemplateCopy.value.length > 0) {
      copyTemplatesSourceStoreId.value = otherBranchesForTemplateCopy.value[0]!.id
    }
  } catch {
    // ignore prefetch errors; user can retry
  }
})

watch([showCopyFolderTemplatesModal, copyTemplatesSourceStoreId], async ([open, storeId]) => {
  if (import.meta.server) return
  if (!open) {
    copyTemplatesSourceFoldersList.value = []
    copyTemplatesSelectedFolderIds.value = []
    return
  }
  if (!storeId) return
  await refreshCopyTemplatesFolderList()
})

function openCopyFolderTemplatesFromBranchModal() {
  if (!canCopyFolderTemplatesFromBranchByPlan.value) {
    toast.error('Copying folder templates between branches requires the Storvv Enterprise plan.')
    return
  }
  if (userStore.userData?.role !== 'superAdmin') {
    toast.error('Only the account owner can copy folder templates between branches.')
    return
  }
  if (storesStore.activeStores.length < 2) {
    toast.warning('You need at least two active branches to copy folder templates.')
    return
  }
  copyTemplatesNameCollision.value = 'skip'
  copyTemplatesSourceStoreId.value = otherBranchesForTemplateCopy.value[0]?.id ?? ''
  if (!copyTemplatesSourceStoreId.value) {
    toast.warning('Could not find another branch to copy from.')
    return
  }
  showCopyFolderTemplatesModal.value = true
}

async function handleConfirmCopyFolderTemplates() {
  const targetStoreId = storesStore.currentStoreId
  const sourceStoreId = copyTemplatesSourceStoreId.value
  const selectedIds = [...copyTemplatesSelectedFolderIds.value]
  if (!targetStoreId || !sourceStoreId || selectedIds.length === 0) return
  isCopyingFolderTemplates.value = true
  try {
    const { createdCount, skippedCount } = await inventoryStore.duplicateFolderTemplatesBetweenStores(
      sourceStoreId,
      targetStoreId,
      {
        onExistingName: copyTemplatesNameCollision.value,
        folderIds: selectedIds,
      },
    )
    if (createdCount === 0) {
      if (skippedCount > 0) {
        toast.warning(`No new folders added. Skipped ${skippedCount} duplicate name(s), or nothing to copy from the selected branch.`)
      } else {
        toast.warning('The source branch has no folders to copy.')
      }
    } else {
      toast.success(
        `Copied ${createdCount} folder template(s) into this branch.${skippedCount ? ` Skipped ${skippedCount} duplicate name(s).` : ''}`,
      )
    }
    showCopyFolderTemplatesModal.value = false
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    toast.error(msg || 'Failed to copy folder templates')
  } finally {
    isCopyingFolderTemplates.value = false
  }
}

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
      label: 'Product',
      type: 'text',
      required: true,
    },
    {
      id: `field-price-${Date.now()}`,
      name: 'price',
      label: 'Unit price',
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
  'quantity',
  'stock',
  'qty',
])

const STOCK_LIKE_FIELD_NAMES = new Set(['stock', 'quantity', 'qty'])

function templateFieldIsStockLike(f: TemplateField): boolean {
  return STOCK_LIKE_FIELD_NAMES.has(f.name.toLowerCase())
}

/** Bulk folders: one quantity field drives availability (counts units in this row). */
function ensureBulkQuantityTemplateField(fields: TemplateField[]): void {
  if (fields.some(templateFieldIsStockLike)) return
  fields.push({
    id: `field-quantity-${Date.now()}`,
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    required: true,
  })
}

function stripStockLikeTemplateFields(fields: TemplateField[]): TemplateField[] {
  return fields.filter((f) => !templateFieldIsStockLike(f))
}

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
    
    if (folderForm.hasSerialNumbers) {
      editableFields.value = stripStockLikeTemplateFields(editableFields.value)
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
    } else {
      ensureBulkQuantityTemplateField(editableFields.value)
    }
  }
})

// Watch hasSerialNumbers: serial mode → serial + product model, no quantity; bulk → quantity, no serial columns
watch(() => folderForm.hasSerialNumbers, (hasSerial) => {
  if (hasSerial) {
    editableFields.value = stripStockLikeTemplateFields(editableFields.value)
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
    editableFields.value = editableFields.value.filter(f =>
      f.name !== 'serialNo' &&
      f.name !== 'serialNumber' &&
      f.name !== 'brand' &&
      f.name !== 'model'
    )
    ensureBulkQuantityTemplateField(editableFields.value)
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

const folderForOpenMenu = computed(() => {
  const id = openFolderMenuId.value
  if (!id) return null
  return filteredFolders.value.find(f => f.id === id) ?? null
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
  openFolderMenuId.value = null
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

const formatFolderTypeLabel = (type: string | undefined) => {
  if (!type || !String(type).trim()) {
    return '-'
  }
  const t = String(type).replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const folderDepartmentsSummary = (folder: InventoryFolder) => {
  const allowed = folder.allowedDepartments
  if (!allowed || allowed.length === 0) return 'All departments'
  const names = allowed.map((id) => getDepartmentName(id))
  if (names.length <= 2) return names.join(', ')
  return `${names[0]}, +${names.length - 1} more`
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

  if (folderForm.hasSerialNumbers) {
    editableFields.value = stripStockLikeTemplateFields(editableFields.value)
  } else {
    ensureBulkQuantityTemplateField(editableFields.value)
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

const isFolderDrawerValid = computed(() => {
  if (!folderForm.name.trim()) return false
  if (!folderForm.type) return false
  if (editableFields.value.length === 0) return false
  return editableFields.value.every((field) => !!field.label?.trim())
})

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
}

const folderTemplateExcelInput = ref<HTMLInputElement | null>(null)
const importingFolderTemplate = ref(false)

const triggerFolderTemplateExcelPicker = () => {
  folderTemplateExcelInput.value?.click()
}

const handleImportFolderTemplateExcel = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importingFolderTemplate.value = true
  try {
    const buf = await file.arrayBuffer()
    const fields = parseTemplateFieldsFromExcelArrayBuffer(buf, {
      hasSerialNumbers: folderForm.hasSerialNumbers,
    })
    editableFields.value = fields
    if (folderForm.hasSerialNumbers) {
      editableFields.value = stripStockLikeTemplateFields(editableFields.value)
    } else {
      ensureBulkQuantityTemplateField(editableFields.value)
    }
    await nextTick()
    editableFields.value.forEach((f) => {
      if (!isLockedTemplateField(f)) {
        syncTemplateFieldNameFromLabel(f)
      }
    })
    toast.success(
      `Imported ${fields.length} column${fields.length !== 1 ? 's' : ''} from "${file.name}".`
    )
  } catch (err: any) {
    toast.error(err?.message || 'Could not read that Excel file.')
  } finally {
    importingFolderTemplate.value = false
    input.value = ''
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
  
  // console.log('[InventoryPage] onMounted - Starting load process')
  
  const loadData = async () => {
    // console.log('[InventoryPage] loadData - Checking auth state')
    
    // Wait for auth to finish loading with timeout
    let attempts = 0
    while (authStore.loading && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
      if (attempts % 10 === 0) {
        // console.log('[InventoryPage] Still waiting for auth...', attempts)
      }
    }
    
    if (attempts >= 100) {
      console.warn('[InventoryPage] Auth loading timeout, proceeding anyway')
    }
    
    // Check if user is authenticated
    if (!authStore.currentUser) {
      // console.log('[InventoryPage] No authenticated user, skipping fetch')
      return
    }
    
    // console.log('[InventoryPage] User authenticated:', authStore.currentUser.uid)
    
    // Fetch user data first (needed to determine if staff)
    try {
      if (!userStore.userData) {
        // console.log('[InventoryPage] Fetching user data...')
        await userStore.fetchUserData(authStore.currentUser.uid)
        const userData = userStore.userData
        // console.log('[InventoryPage] User data fetched:', userData ? (userData as any).role : 'unknown')
      } else {
        const userData = userStore.userData
      
      // Load stores and departments when any store member needs filters (not only super admin)
      if (authStore.currentUser) {
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
        // console.log('[InventoryPage] User data already loaded:', userData ? (userData as any).role : 'unknown')
      }
      
      // Now fetch folders
      // console.log('[InventoryPage] Fetching folders...')
      await inventoryStore.fetchFolders()
      // console.log('[InventoryPage] Folders fetched:', inventoryStore.folders.length)
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
    // console.log('[InventoryPage] User data changed, fetching folders...')
    try {
      await inventoryStore.fetchFolders()
      // console.log('[InventoryPage] Folders fetched after user data change:', inventoryStore.folders.length)
    } catch (error: any) {
      console.error('[InventoryPage] Error fetching folders:', error.message || error)
    }
  }
}, { immediate: false })

// Watch for auth state changes
watch(() => authStore.currentUser, async (user) => {
  if (user && inventoryStore.folders.length === 0) {
    // console.log('[InventoryPage] Auth user changed, fetching user data and folders...')
    try {
      // Fetch user data first
      if (!userStore.userData) {
        await userStore.fetchUserData(user.uid)
      }
      // Then fetch folders
      await inventoryStore.fetchFolders()
      // console.log('[InventoryPage] Folders fetched after auth change:', inventoryStore.folders.length)
    } catch (error: any) {
      console.error('[InventoryPage] Error fetching folders:', error.message || error)
    }
  }
}, { immediate: false })

// Watch for store changes and refetch folders
watch(() => storesStore.currentStoreId, async (newStoreId, oldStoreId) => {
  if (newStoreId && newStoreId !== oldStoreId && authStore.currentUser) {
    // console.log('[InventoryPage] Store changed, refetching folders...')
    try {
      // Reset department filter when store changes
      selectedDepartmentId.value = ''
      // Refetch folders for new store
      await inventoryStore.fetchFolders()
      // Refetch departments for new store
      if (authStore.currentUser) {
        await departmentsStore.fetchDepartments()
      }
      // console.log('[InventoryPage] Folders refetched after store change:', inventoryStore.folders.length)
    } catch (error: any) {
      console.error('[InventoryPage] Error refetching folders after store change:', error.message || error)
    }
  }
}, { immediate: false })
</script>

<style scoped>
/* Grid / table view switch */
.folders-view-enter-active,
.folders-view-leave-active {
  transition:
    opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.folders-view-enter-from,
.folders-view-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .folders-view-enter-active,
  .folders-view-leave-active {
    transition-duration: 0.01ms;
  }

  .folders-view-enter-from,
  .folders-view-leave-to {
    transform: none;
  }
}
</style>
