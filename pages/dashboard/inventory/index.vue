<template>
 <div
 data-inventory-categories
 class="dashboard-page-with-footer inventory-categories-page flex min-h-[calc(100svh-4rem)] w-full max-w-none flex-col space-y-5 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:space-y-6 sm:pb-32"
 >
 <DashboardPageHeader>
 <template #eyebrow>
 <nav :class="eyebrowClass" aria-label="Breadcrumb">
 <span>Inventory</span>
 <span class="mx-1.5 text-gray-300 dark:text-gray-600">/</span>
 <span class="text-gray-600 dark:text-gray-400">Categories</span>
 </nav>
 </template>
 <template #title>
 <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
 <h1 :class="titleClass">Categories</h1>
 <DuplicateFeatureUpsellBanner
 :loading="inventoryStore.loading && inventoryStore.folders.length === 0"
 />
 </div>
 </template>
 <template #actions>
 <template v-if="canCreateInventoryFolders">
 <Button
 v-if="canShowCopyFolderTemplatesFromBranch"
 variant="outline"
 size="sm"
 :icon="ArrowsRightLeftIcon"
 :extra-class="headerBtnClass"
 @click="openCopyFolderTemplatesFromBranchModal"
 >
 <span class="hidden sm:inline">Copy from branch</span>
 <span class="sm:hidden">Copy</span>
 </Button>
 <Button
 variant="primary"
 size="sm"
 :icon="PlusIcon"
 :extra-class="headerBtnClass"
 @click="openCreateFolderModal"
 >
 New category
 </Button>
 </template>
 </template>
 <template v-if="!inventoryStore.loading" #toolbar>
 <DashboardToolbarSearch v-model="searchQuery" placeholder="Search categories…" />
 <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
 <DashboardToolbarSelect
 v-model="selectedDepartmentId"
 wrapper-class="min-w-[7.5rem] flex-1 sm:flex-none sm:min-w-[8.5rem]"
 >
 <option value="">All departments</option>
 <option v-for="dept in currentStoreDepartments" :key="dept.id" :value="dept.id">
 {{ dept.name }}
 </option>
 </DashboardToolbarSelect>
 <DashboardToolbarSelect v-model="sortBy" min-width-class="min-w-[5.5rem]">
 <option value="name">Name</option>
 <option value="items">Products</option>
 <option value="date">Date</option>
 </DashboardToolbarSelect>
 <DashboardToolbarMeta>
 {{ filteredFolders.length }}
 {{ filteredFolders.length === 1 ? 'category' : 'categories' }}
 </DashboardToolbarMeta>
 <div
 class="flex h-8 shrink-0 items-center rounded-lg bg-gray-50/50 p-0.5 dark:bg-white/[0.03]"
 role="group"
 aria-label="Category layout"
 >
 <button
 type="button"
 class="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
 :class="
 foldersViewMode === 'grid'
 ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
 : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
 "
 :aria-pressed="foldersViewMode === 'grid'"
 @click="foldersViewMode = 'grid'"
 >
 <Squares2X2Icon class="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 <button
 type="button"
 class="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
 :class="
 foldersViewMode === 'table'
 ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
 : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
 "
 :aria-pressed="foldersViewMode === 'table'"
 @click="foldersViewMode = 'table'"
 >
 <TableCellsIcon class="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </div>
 </div>
 <div
 v-if="canCreateInventoryFolders && paginatedFolders.length > 0"
 :class="bulkActionsClass"
 >
 <Checkbox
 :model-value="allFoldersOnPageSelected"
 size="sm"
 wrapper-class="!h-8 items-center"
 label-class="!text-xs !ml-2 !font-normal !leading-none text-gray-500 dark:text-gray-500"
 @update:model-value="toggleSelectAllFolders"
 >
 {{ allFoldersOnPageSelected ? 'All selected' : 'Select all' }}
 </Checkbox>
 <template v-if="selectedFoldersForBulk.length > 0">
 <span
 class="inline-flex h-8 items-center text-xs font-medium tabular-nums text-gray-600 dark:text-gray-400"
 >
 {{ selectedFoldersForBulk.length }} selected
 </span>
 <Button
 variant="outline"
 size="sm"
 :icon="TrashIcon"
 :extra-class="headerBtnClass + '-red-200/70 !text-red-600 hover:!bg-red-50/80 dark:!border-red-900/40 dark:!text-red-400 dark:hover:!bg-red-950/30'"
 @click="openBulkDeleteFoldersModal"
 >
 Delete
 </Button>
 </template>
 </div>
 </template>
 </DashboardPageHeader>

 <!-- Content area: show only one of skeleton, folders, or empty -->
 <!-- Loading skeleton -->
 <div
 v-if="inventoryStore.loading && inventoryStore.folders.length === 0"
 class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5"
 >
 <div
 v-for="i in 12"
 :key="i"
 class="animate-pulse rounded-xl bg-white p-2.5 dark:bg-[#141820] dark:ring-white/[0.06]"
 >
 <div class="mb-2 flex justify-between">
 <div class="h-4 w-4 rounded bg-gray-200 dark:bg-white/10" />
 <div class="h-4 w-12 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
 </div>
 <div class="h-3 w-[75%] rounded bg-gray-200 dark:bg-white/10" />
 <div class="mt-1 h-2.5 w-full rounded bg-gray-100 dark:bg-white/[0.05]" />
 <div class="mt-2 space-y-1 border-t border-gray-100 pt-2 dark:border-white/[0.06]">
 <div class="h-2 w-[85%] rounded bg-gray-100 dark:bg-white/[0.06]" />
 <div class="h-2 w-[60%] rounded bg-gray-100 dark:bg-white/[0.06]" />
 </div>
 <div class="mt-2 flex gap-1.5 border-t border-gray-100 pt-2 dark:border-white/[0.06]">
 <div class="h-7 w-7 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
 <div class="flex-1 pt-0.5">
 <div class="h-2.5 w-12 rounded bg-gray-200 dark:bg-white/10" />
 </div>
 </div>
 </div>
 </div>

 <Transition name="folders-view" mode="out-in">
 <!-- Folders grid -->
 <div
 v-if="paginatedFolders.length > 0 && foldersViewMode === 'grid'"
 key="grid"
 class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5"
 >
 <InventoryCategoryCard
 v-for="folder in paginatedFolders"
 :key="folder.id"
 :name="folder.name"
 :description="folder.description"
 :type="folder.type"
 :item-count="folder.itemCount"
 :low-stock-count="folder.lowStockCount"
 :total-value="folder.totalValue"
 :has-serial-numbers="folder.hasSerialNumbers"
 :allowed-department-ids="folder.allowedDepartments"
 :resolve-department-name="getDepartmentName"
 :availability-stats="inventoryStore.folderAvailabilityStats[folder.id] ?? null"
 :stats-loading="inventoryStore.availabilityStatsLoading"
 :has-overlays="canCreateInventoryFolders"
 @click="navigateToFolder(folder.id)"
 >
 <template v-if="canCreateInventoryFolders" #checkbox>
 <Checkbox
 :model-value="selectedFoldersForBulk.some(f => f.id === folder.id)"
 @update:model-value="(checked) => toggleFolderSelection(folder, checked)"
 size="sm"
 wrapper-class="justify-center"
 />
 </template>
 <template v-if="canCreateInventoryFolders" #menu>
 <div data-inventory-folder-menu>
 <button
 type="button"
 :data-folder-actions-anchor="folder.id"
 @click="toggleFolderMenu(folder.id)"
 class="rounded-sm p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-500 dark:hover:bg-gray-800/90 dark:hover:text-gray-200"
 aria-label="Category options"
 >
 <EllipsisVerticalIcon class="h-3.5 w-3.5" stroke-width="2" />
 </button>
 </div>
 </template>
 </InventoryCategoryCard>
 </div>

 <!-- Folders table (styling aligned with folder item table on /inventory/[id]) -->
 <!-- `data-table-shell`: pairs with main.css so theme toggle doesn’t animate hundreds of row backgrounds (folders page-only lag). -->
 <div
 v-else-if="paginatedFolders.length > 0 && foldersViewMode === 'table'"
 key="table"
 class="data-table-shell"
 >
 <div class="overflow-x-auto">
 <table class="dashboard-table min-w-full">
 <thead>
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
 Category
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
 <tbody>
 <tr
 v-for="folder in paginatedFolders"
 :key="folder.id"
 class="cursor-pointer"
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
 aria-label="Category options"
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
 <DashboardTableEmptyState
 v-if="!inventoryStore.loading && paginatedFolders.length === 0"
 :icon="FolderIcon"
 :title="
 selectedDepartmentId
 ? `No categories in ${getDepartmentName(selectedDepartmentId)}`
 : searchQuery
 ? 'No categories found'
 : 'No categories yet'
 "
 :description="
 selectedDepartmentId
 ? 'Try another department or clear the filter to see all categories.'
 : searchQuery
 ? 'Try a different search term.'
 : 'Categories group products so your team can find stock faster.'
 "
 :tips="
 selectedDepartmentId
 ? ['Categories can be shared across departments or restricted', 'Clear the department filter to browse everything']
 : searchQuery
 ? ['Search matches category names and descriptions', 'Create a new category if the one you need is missing']
 : ['Open a category to add products and custom fields', 'Use departments to control who sees each category']
 "
 extra-class="rounded-sm bg-white dark:!bg-dashboard-card sm:min-h-[min(48vh,22rem)]"
 >
 <Button
 v-if="selectedDepartmentId"
 variant="outline"
 size="sm"
 extra-class="!text-xs !py-1.5 !px-3"
 @click="selectedDepartmentId = ''"
 >
 Clear filter
 </Button>
 </DashboardTableEmptyState>

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
 <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected categories</h3>
 <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedFoldersForBulk.length }} {{ selectedFoldersForBulk.length === 1 ? 'category' : 'categories' }} selected</p>
 </div>
 </div>
 </template>
 <div class="space-y-3">
 <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-sm">
 <p class="text-xs text-red-800 dark:text-red-200">This will permanently delete the selected categories and all products inside them. This action cannot be undone.</p>
 </div>
 <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
 <Checkbox
 v-model="bulkDeleteFoldersConfirmed"
 label="I understand that these categories and their products will be permanently deleted."
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
 {{ isBulkDeletingFolders ? 'Deleting...' : `Delete ${selectedFoldersForBulk.length} ${selectedFoldersForBulk.length === 1 ? 'category' : 'categories'}` }}
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
 size="xl"
 dense
 eyebrow="Inventory"
 :title="editingFolder ? 'Edit category' : 'Create new category'"
 :subtitle="editingFolder ? 'Update details and column template.' : 'Name the category and define table columns.'"
 >
 <form
 id="folder-drawer-form"
 class="divide-y divide-gray-100/90 dark:divide-gray-800/80"
 @submit.prevent="handleSaveFolder"
 >
 <section :class="drawerSectionClass">
 <p :class="sectionLabelClass">Basic info</p>
 <div class="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
 <div>
 <label :class="drawerLabelClass">Category name *</label>
 <input
 v-model="folderForm.name"
 type="text"
 required
 :class="drawerInputClass"
 placeholder="e.g. Chairs"
 />
 </div>
 <div>
 <label :class="drawerLabelClass">Type *</label>
 <select v-model="folderForm.type" required :class="[drawerInputClass, 'cursor-pointer']">
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
 <div class="mt-2.5">
 <label :class="drawerLabelClass">Description</label>
 <textarea
 v-model="folderForm.description"
 rows="2"
 :class="[drawerTextareaClass, 'resize-none']"
 placeholder="Optional: purpose of this category"
 />
 </div>
 </section>

 <section :class="drawerSectionClass">
 <Checkbox v-model="folderForm.hasSerialNumbers" size="sm" wrapper-class="items-start gap-2.5">
 <div class="min-w-0 flex-1">
 <span class="text-xs font-medium text-gray-800 dark:text-gray-200">Use serial numbers</span>
 <p :class="[drawerHintClass, 'mt-0.5']">
 On: one row per serial. Off: quantity field tracks stock.
 </p>
 </div>
 </Checkbox>
 </section>

 <section v-if="canCreateInventoryFolders" :class="drawerSectionClass">
 <p :class="sectionLabelClass">
 Department access
 <span class="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
 </p>
 <p :class="[drawerHintClass, 'mt-1']">
 Leave all unchecked for every department. Check to limit access.
 </p>
 <div v-if="departmentsStore.loading" :class="[drawerHintClass, 'mt-2']">Loading departments…</div>
 <div
 v-else-if="currentStoreDepartments.length === 0"
 class="mt-2 rounded-lg bg-gray-50/50 px-2.5 py-2 dark:bg-white/[0.02]"
 >
 <p :class="drawerHintClass">
 No departments yet. Category stays open to everyone.
 </p>
 <NuxtLink
 v-if="currentStoreId"
 :to="`/dashboard/stores/${currentStoreId}/departments`"
 class="mt-1.5 inline-block text-[11px] font-medium text-primary-600 hover:underline dark:text-primary-400"
 >
 Add departments →
 </NuxtLink>
 </div>
 <div
 v-else
 :class="[pickListClass, 'mt-2 max-h-36']"
 >
 <ul :class="pickListScrollClass">
 <li v-for="dept in currentStoreDepartments" :key="dept.id">
 <label :class="[pickRowClass, 'cursor-pointer gap-2.5 !py-2']">
 <input
 type="checkbox"
 :checked="folderForm.allowedDepartments.includes(dept.id)"
 class="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500/20"
 @change="toggleDepartmentAccess(dept.id, ($event.target as HTMLInputElement).checked)"
 />
 <span class="min-w-0 flex-1">
 <span :class="pickRowTitleClass">{{ dept.name }}</span>
 <span v-if="dept.description" :class="[pickRowMetaClass, 'mt-0.5 block truncate']">{{ dept.description }}</span>
 </span>
 </label>
 </li>
 </ul>
 </div>
 </section>

 <section :class="drawerSectionClass">
 <div class="flex flex-wrap items-center justify-between gap-2">
 <div>
 <p :class="sectionLabelClass">Table template</p>
 <p :class="[drawerHintClass, 'mt-0.5']">Columns for products in this category.</p>
 </div>
 <div v-if="selectedTemplate" class="flex flex-wrap items-center gap-1.5">
 <input
 ref="folderTemplateExcelInput"
 type="file"
 accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
 class="sr-only"
 :disabled="importingFolderTemplate"
 @change="handleImportFolderTemplateExcel"
 />
 <Button
 type="button"
 variant="outline"
 size="sm"
 :icon="ArrowUpTrayIcon"
 :loading="importingFolderTemplate"
 :disabled="importingFolderTemplate"
 :extra-class="headerBtnClass"
 @click="triggerFolderTemplateExcelPicker"
 >
 Import Excel
 </Button>
 <Button
 type="button"
 variant="outline"
 size="sm"
 :extra-class="headerBtnClass"
 @click="handleAddField"
 >
 Add field
 </Button>
 </div>
 </div>

 <div
 v-if="selectedTemplate && editableFields.length > 0"
 class="mt-2.5 overflow-hidden rounded-lg dark:border-white/[0.06]"
 >
 <div
 class="hidden grid-cols-12 gap-2 border-b border-gray-100/90 bg-gray-50/80 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:border-gray-800/80 dark:bg-white/[0.03] dark:text-gray-500 sm:grid"
 >
 <span class="col-span-5">Label</span>
 <span class="col-span-3">Type</span>
 <span class="col-span-4 text-right">Options</span>
 </div>
 <div class="max-h-52 divide-y divide-gray-100/90 overflow-y-auto dark:divide-gray-800/80">
 <div
 v-for="(field, index) in editableFields"
 :key="field.id"
 class="grid grid-cols-1 items-center gap-2 px-2.5 py-2 sm:grid-cols-12 sm:gap-2"
 >
 <div class="min-w-0 sm:col-span-5">
 <label :class="[drawerLabelClass, 'sm:sr-only']">Label</label>
 <input
 v-model="field.label"
 type="text"
 required
 :class="drawerInputClass"
 placeholder="Column title"
 @input="syncTemplateFieldNameFromLabel(field)"
 />
 </div>
 <div class="min-w-0 sm:col-span-3">
 <label :class="[drawerLabelClass, 'sm:sr-only']">Type</label>
 <select v-model="field.type" required :class="[drawerInputClass, 'cursor-pointer']">
 <option value="text">Text</option>
 <option value="number">Number</option>
 <option value="date">Date</option>
 <option value="select">Select</option>
 <option value="boolean">Boolean</option>
 <option value="currency">Currency</option>
 </select>
 </div>
 <div class="flex items-center justify-between gap-2 sm:col-span-4 sm:justify-end">
 <label class="flex cursor-pointer items-center gap-1.5">
 <input
 v-model="field.required"
 type="checkbox"
 class="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500/20"
 />
 <span class="text-[11px] text-gray-500 dark:text-gray-400">Required</span>
 </label>
 <button
 v-if="!isLockedTemplateField(field)"
 type="button"
 class="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
 aria-label="Remove field"
 @click="handleRemoveField(index)"
 >
 <TrashIcon class="h-3.5 w-3.5" />
 </button>
 <span
 v-else
 class="text-[10px] font-medium text-gray-400 dark:text-gray-500"
 title="Built-in column"
 >
 Default
 </span>
 </div>
 </div>
 </div>
 </div>
 <div
 v-else-if="selectedTemplate"
 :class="[emptyStateClass, '!py-6']"
 >
 <Squares2X2Icon class="mb-2 h-7 w-7 text-gray-400 dark:text-gray-500" />
 <p class="text-xs font-medium text-gray-700 dark:text-gray-300">No fields yet</p>
 <p :class="[drawerHintClass, 'mt-0.5']">Add a field or import from Excel</p>
 </div>
 </section>
 </form>

 <template #footer>
 <Button
 variant="outline"
 size="sm"
 :extra-class="footerBtnOutlineClass"
 @click="handleCancelFolder"
 >
 Cancel
 </Button>
 <Button
 variant="primary"
 size="sm"
 type="submit"
 form="folder-drawer-form"
 :disabled="!isFolderDrawerValid"
 :extra-class="footerBtnPrimaryClass"
 @click="handleSaveFolder"
 >
 {{ editingFolder ? 'Update' : 'Create' }} category
 </Button>
 </template>
 </SidePanel>

 <!-- Duplicate category -->
 <SidePanel
 v-model="showDuplicateFolderModal"
 title="Duplicate category"
 subtitle="Create copies with the same template and settings. Enter one or more category names."
 size="md"
 @update:model-value="(v: boolean) => { if (!v) clearDuplicateFolderModal() }"
 >
 <form @submit.prevent="handleConfirmDuplicateFolder" class="space-y-4">
 <div class="flex items-center justify-between">
 <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Category name(s)</label>
 <Button variant="outline" size="sm" type="button" @click="addDuplicateFolderName" extra-class="!rounded-2xl">
 + Add name
 </Button>
 </div>
 <div class="space-y-2 max-h-48 overflow-y-auto">
 <div v-if="duplicateFolderNames.length === 0" class="text-center py-4 text-sm text-gray-500 dark:text-gray-400 rounded-sm bg-gray-50/50 dark:bg-gray-800/30">
 Click "+ Add name" to enter category name(s)
 </div>
 <div
 v-for="(name, index) in duplicateFolderNames"
 :key="index"
 class="flex items-center gap-2"
 >
 <input
 v-model="duplicateFolderNames[index]"
 type="text"
 class="flex-1 min-w-0 px-3 py-2 text-sm rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
 placeholder="New category name"
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
 <Button variant="outline" size="sm" type="button" :class="footerBtnOutlineClass" @click="showDuplicateFolderModal = false; clearDuplicateFolderModal()">Cancel</Button>
 <Button variant="primary" size="sm" type="button" :class="footerBtnPrimaryClass" @click="handleConfirmDuplicateFolder" :disabled="isDuplicatingFolder || !hasValidDuplicateFolderNames">
 {{ isDuplicatingFolder ? 'Duplicating…' : `Duplicate ${validDuplicateFolderNamesCount} ${validDuplicateFolderNamesCount === 1 ? 'category' : 'categories'}` }}
 </Button>
 </template>
 </SidePanel>

 <!-- Copy selected folder templates from another branch -->
 <SidePanel
 v-model="showCopyFolderTemplatesModal"
 title="Copy category templates from another branch"
 subtitle="Pick a source branch, then select categories to copy into the branch you're viewing."
 size="lg"
 >
 <div class="flex min-h-0 flex-col gap-4 text-left">
 <div>
 <p :class="sectionLabelClass">Source branch</p>
 <select
 v-model="copyTemplatesSourceStoreId"
 class="mt-1.5 w-full rounded-lg bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/15 dark:!bg-dashboard-card dark:text-gray-100"
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
 <p :class="sectionLabelClass">Categories to copy</p>
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
 <div :class="pickListClass">
 <div v-if="loadingCopyTemplatesSourceFolders" class="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
 Loading categories…
 </div>
 <div
 v-else-if="copyTemplatesSourceFoldersList.length === 0"
 :class="[emptyStateClass, '!items-start !py-6 !text-left']"
 >
 <p>
 No category templates were found under
 <strong class="font-medium text-gray-700 dark:text-gray-300">{{ copyTemplatesSourceBranchLabel }}</strong>
 (<span class="whitespace-normal">your &ldquo;Source branch&rdquo;</span> above).
 </p>
 <p v-if="storesStore.currentStoreId && copyTemplatesSourceStoreId && copyTemplatesSourceStoreId !== storesStore.currentStoreId && inventoryViewBranchLabel">
 The category tiles behind this modal are from
 <strong class="font-medium text-gray-700 dark:text-gray-300">{{ inventoryViewBranchLabel }}</strong>
 Switch &ldquo;Source branch&rdquo; to that branch if those are the categories you want to copy, or create categories first on {{ copyTemplatesSourceBranchLabel }}.
 </p>
 </div>
 <ul v-else :class="[pickListScrollClass, '!max-h-[min(40vh,22rem)]']">
 <li
 v-for="f in copyTemplatesSourceFoldersList"
 :key="f.id"
 :class="[pickRowClass, copyTemplatesSelectedFolderIds.includes(f.id) ? pickRowSelectedClass : '']"
 >
 <Checkbox
 :model-value="copyTemplatesSelectedFolderIds.includes(f.id)"
 @update:model-value="(checked) => setCopyTemplatesFolderChecked(f.id, !!checked)"
 size="sm"
 wrapper-class="min-w-0 flex-1"
 label-class="!ml-2.5 min-w-0"
 >
 <span :class="pickRowTitleClass">{{ f.name || 'Untitled' }}</span>
 </Checkbox>
 </li>
 </ul>
 </div>
 </div>
 <fieldset class="space-y-2">
 <legend :class="sectionLabelClass">When a category name already exists here</legend>
 <label class="flex cursor-pointer items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
 <input v-model="copyTemplatesNameCollision" type="radio" value="skip" class="mt-0.5" />
 <span>Skip that category</span>
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
 :class="footerBtnOutlineClass"
 @click="showCopyFolderTemplatesModal = false"
 >
 Cancel
 </Button>
 <Button
 variant="primary"
 size="sm"
 type="button"
 :class="footerBtnPrimaryClass"
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
 : `Copy ${copyTemplatesSelectedCount || 0} ${copyTemplatesSelectedCount === 1 ? 'category' : 'categories'}`
 }}
 </Button>
 </template>
 </SidePanel>

 <!-- Folder actions menu (teleported; not clipped by grid/card overflow) -->
 <Teleport to="body">
 <div
 v-if="openFolderMenuId && folderForOpenMenu && folderMenuFixedStyle"
 data-inventory-folder-menu
 class="frosted-glass fixed z-[1000] min-w-[120px] rounded-sm py-0.5"
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
import InventoryCategoryCard from '~/components/inventory/InventoryCategoryCard.vue'
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
 title: 'Inventory categories - Storvv',
})

const { eyebrowClass, titleClass, headerBtnClass, bulkActionsClass } = useDashboardPageChrome()
const {
 sectionLabelClass,
 pickListClass,
 pickListScrollClass,
 pickRowClass,
 pickRowSelectedClass,
 pickRowTitleClass,
 pickRowMetaClass,
 emptyStateClass,
 drawerSectionClass,
 drawerLabelClass,
 drawerInputClass,
 drawerTextareaClass,
 drawerHintClass,
 footerBtnOutlineClass,
 footerBtnPrimaryClass,
} = useDashboardDrawerChrome()

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
 await inventoryStore.fetchFolderAvailabilityStats()
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
 await inventoryStore.fetchFolderAvailabilityStats()
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
