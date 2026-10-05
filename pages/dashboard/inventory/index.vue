<template>
  <div
    data-inventory-categories
    class="ds-root s-c s-page s-inventory"
  >
    <SPageHeader :title="branchPageTitle('Categories')">
      <template #eyebrow>
        <p class="s-page-header__eyebrow">Inventory</p>
      </template>
      <template #actions>
        <SButton
          v-if="inventoryStore.lowStockFolders.length > 0"
          :loading="reorderExporting"
          @click="handleExportReorderList"
        >
          <template #leading><Download :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
          Export reorder list
        </SButton>
        <template v-if="canCreateInventoryFolders">
          <SButton
            v-if="canShowCopyFolderTemplatesFromBranch"
            @click="openCopyFolderTemplatesFromBranchModal"
          >
            <template #leading><ArrowLeftRight :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
            Copy from branch
          </SButton>
          <SButton variant="primary" @click="openCreateFolderModal">
            <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
            New category
          </SButton>
        </template>
      </template>
    </SPageHeader>

    <div
      v-if="inventoryStore.loading && inventoryStore.folders.length === 0"
      class="s-metrics"
      aria-hidden="true"
    >
      <div v-for="i in 4" :key="i" class="s-metrics__item">
        <SSkeleton width="64px" height="12px" />
        <SSkeleton width="96px" height="24px" />
      </div>
    </div>
    <dl
      v-else-if="!inventoryStore.loading && inventoryStore.folders.length > 0"
      class="s-metrics"
      aria-label="Category summary"
    >
      <div v-for="metric in categoryHeaderMetrics" :key="metric.key" class="s-metrics__item">
        <dt class="s-metrics__label">{{ metric.label }}</dt>
        <dd
          class="s-metrics__value"
          :class="metric.tone && `s-metrics__value--${metric.tone}`"
        >
          {{ metric.value }}
        </dd>
      </div>
    </dl>

    <template v-if="!inventoryStore.loading && inventoryStore.folders.length > 0">
      <STabs
        v-model="categoryFilter"
        :tabs="categoryFilterTabs"
        label="Filter categories"
      />

      <div
        v-if="canCreateInventoryFolders && selectedFoldersForBulk.length > 0"
        class="s-toolbar s-toolbar--selection"
        role="region"
        aria-label="Bulk actions"
      >
        <SCheckbox
          :model-value="allFoldersOnPageSelected"
          :label="`${selectedFoldersForBulk.length} selected`"
          @update:model-value="toggleSelectAllFolders"
        />
        <div class="s-toolbar__end">
          <SButton variant="ghost" size="sm" @click="selectedFoldersForBulk = []">Clear</SButton>
          <SButton variant="danger" size="sm" @click="openBulkDeleteFoldersModal">
            <template #leading><Trash2 :size="14" :stroke-width="2" aria-hidden="true" /></template>
            Delete
          </SButton>
        </div>
      </div>
      <div v-else class="s-toolbar">
        <SSearch
          v-model="searchQuery"
          class="s-toolbar__search"
          placeholder="Search categories"
        />
        <div v-if="!isStaff" class="s-toolbar__filter">
          <SSelect
            v-model="selectedDepartmentId"
            :options="departmentFilterOptions"
            aria-label="Department"
          />
        </div>
        <div class="s-toolbar__filter">
          <SSelect v-model="sortBy" :options="categorySortSelectOptions" aria-label="Sort by" />
        </div>
        <div class="s-toolbar__end">
          <div class="s-toggle-group" role="group" aria-label="Layout">
            <button
              type="button"
              class="s-toggle-group__btn"
              :aria-pressed="foldersViewMode === 'grid'"
              aria-label="Grid view"
              @click="foldersViewMode = 'grid'"
            >
              <LayoutGrid :size="16" :stroke-width="1.75" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="s-toggle-group__btn"
              :aria-pressed="foldersViewMode === 'table'"
              aria-label="Table view"
              @click="foldersViewMode = 'table'"
            >
              <List :size="16" :stroke-width="1.75" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-if="inventoryStore.loading && inventoryStore.folders.length === 0">
      <div class="s-category-grid" role="status" aria-label="Loading categories">
        <div v-for="i in 8" :key="i" class="s-category-card" aria-hidden="true">
          <SSkeleton width="40px" height="40px" />
          <SSkeleton width="70%" height="16px" />
          <SSkeleton width="45%" height="12px" />
        </div>
      </div>
    </template>


    <section
      v-if="!inventoryStore.loading && inventoryStore.folders.length > 0"
      class="s-inventory__section"
      aria-label="Categories"
    >
      <SCard v-if="paginatedFolders.length === 0">
        <SEmptyState
          :title="filteredCategoriesEmptyTitle"
          :description="filteredCategoriesEmptyDescription"
        >
          <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
          <template v-if="hasActiveCategoryFilters" #actions>
            <SButton @click="clearCategoryFilters">Clear filters</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <div v-else-if="foldersViewMode === 'grid'" class="s-category-grid">
        <InventoryCategoryCard
          v-for="folder in paginatedFolders"
          :key="folder.id"
          :name="folder.name"
          :description="folderCategoryDescription(folder)"
          :type="folder.type"
          :item-count="folderDisplayStats(folder).itemCount"
          :child-count="getChildFolders(folders, folder.id).length"
          :low-stock-count="folderDisplayStats(folder).lowStockCount"
          :total-value="folderDisplayStats(folder).totalValue"
          :value-label="formatCurrency(folderDisplayStats(folder).totalValue ?? 0)"
          :selected="isFolderSelected(folder)"
          :has-serial-numbers="folder.hasSerialNumbers"
          :allowed-department-ids="folder.allowedDepartments"
          :resolve-department-name="getDepartmentName"
          :show-departments="!isStaff"
          :availability-stats="inventoryStore.folderAvailabilityStats[folder.id] ?? null"
          :stats-loading="inventoryStore.availabilityStatsLoading"
          :track-profit="folder.trackProfit === true"
          :gross-profit-on-hand="folderGrossProfitOnHand(folder.id)"
          :show-profit="canViewProfitAndCost && folder.trackProfit === true"
          :has-overlays="canCreateInventoryFolders"
          @click="navigateToFolder(folder.id)"
        >
          <template v-if="canCreateInventoryFolders" #checkbox>
            <SCheckbox
              :model-value="isFolderSelected(folder)"
              :aria-label="`Select ${folder.name}`"
              @update:model-value="(checked) => toggleFolderSelection(folder, checked)"
            />
          </template>
          <template v-if="canCreateInventoryFolders" #menu>
            <SIconButton
              label="Category options"
              size="sm"
              :data-folder-actions-anchor="folder.id"
              aria-haspopup="menu"
              :aria-expanded="openFolderMenuId === folder.id"
              @click="toggleFolderMenu(folder.id)"
            >
              <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
            </SIconButton>
          </template>
        </InventoryCategoryCard>
      </div>

      <div v-else class="s-table-wrap">
        <table class="s-table">
          <thead>
            <tr>
              <th v-if="canCreateInventoryFolders" scope="col" class="s-table__check">
                <SCheckbox
                  :model-value="allFoldersOnPageSelected"
                  aria-label="Select all categories on this page"
                  @update:model-value="toggleSelectAllFolders"
                />
              </th>
              <th scope="col">Category</th>
              <th scope="col" class="s-hide-sm">Type</th>
              <th scope="col" class="s-table__num">Products</th>
              <th scope="col" class="s-table__num s-hide-sm">Value</th>
              <th v-if="canViewProfitAndCost" scope="col" class="s-table__num s-hide-md">Profit</th>
              <th scope="col" class="s-hide-md">Tracking</th>
              <th v-if="!isStaff" scope="col" class="s-hide-lg">Departments</th>
              <th v-if="canCreateInventoryFolders" scope="col" class="s-table__actions">
                <span class="ds-sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="folder in paginatedFolders"
              :key="folder.id"
              class="s-table__row--interactive"
              :class="{ 's-table__row--selected': isFolderSelected(folder) }"
              tabindex="0"
              @click="navigateToFolder(folder.id)"
              @keydown.enter.self="navigateToFolder(folder.id)"
            >
              <td v-if="canCreateInventoryFolders" class="s-table__check" @click.stop>
                <SCheckbox
                  :model-value="isFolderSelected(folder)"
                  :aria-label="`Select ${folder.name}`"
                  @update:model-value="(checked) => toggleFolderSelection(folder, checked)"
                />
              </td>
              <td>
                <div class="s-category-cell">
                  <span class="s-category-cell__mark" aria-hidden="true">
                    <component
                      :is="getChildFolders(folders, folder.id).length > 0 ? FolderTree : FolderClosed"
                      :size="16"
                      :stroke-width="1.75"
                      fill="currentColor"
                      fill-opacity="0.14"
                    />
                  </span>
                  <div class="s-category-cell__text">
                    <span class="s-table__primary">{{ folder.name }}</span>
                    <span v-if="folderCategoryDescription(folder)" class="s-table__secondary">
                      {{ folderCategoryDescription(folder) }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="s-hide-sm">
                <SBadge>{{ formatFolderTypeLabel(folder.type) }}</SBadge>
              </td>
              <td class="s-table__num">
                <span class="s-table__primary">{{ folderDisplayStats(folder).itemCount }}</span>
                <span
                  v-if="folderDisplayStats(folder).lowStockCount > 0"
                  class="s-table__secondary s-table__warning"
                >
                  {{ folderDisplayStats(folder).lowStockCount }} low stock
                </span>
              </td>
              <td class="s-table__num s-hide-sm">
                {{ formatCurrency(folderDisplayStats(folder).totalValue ?? 0) }}
              </td>
              <td v-if="canViewProfitAndCost" class="s-table__num s-hide-md">
                <span v-if="folder.trackProfit" :class="folderProfitToneClass(folder.id)">
                  {{ formatFolderProfit(folder.id) }}
                </span>
                <span v-else class="s-table__muted">–</span>
              </td>
              <td class="s-hide-md">
                <SBadge :tone="folder.hasSerialNumbers ? 'accent' : 'neutral'">
                  {{ folder.hasSerialNumbers ? 'Serial' : 'Quantity' }}
                </SBadge>
              </td>
              <td v-if="!isStaff" class="s-hide-lg">
                <span class="s-table__secondary">{{ folderDepartmentsSummary(folder) }}</span>
              </td>
              <td v-if="canCreateInventoryFolders" class="s-table__actions" @click.stop>
                <SIconButton
                  label="Category options"
                  size="sm"
                  :data-folder-actions-anchor="folder.id"
                  aria-haspopup="menu"
                  :aria-expanded="openFolderMenuId === folder.id"
                  @click="toggleFolderMenu(folder.id)"
                >
                  <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                </SIconButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SPagination
        :current-page="currentPage"
        :page-size="itemsPerPage"
        :total="foldersForCategoryList.length"
        label="Categories pagination"
        @page-change="handlePageChange"
      />
    </section>

    <!-- Empty state (no categories at all) -->
    <SCard v-if="!inventoryStore.loading && inventoryStore.folders.length === 0">
      <SEmptyState :title="noCategoriesTitle" :description="noCategoriesDescription">
        <template #icon><FolderPlus :size="24" :stroke-width="1.75" /></template>
        <template
          v-if="(canCreateInventoryFolders && !selectedDepartmentId && !searchQuery) || selectedDepartmentId"
          #actions
        >
          <SButton
            v-if="canCreateInventoryFolders && !selectedDepartmentId && !searchQuery"
            variant="primary"
            @click="openCreateFolderModal"
          >
            <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
            New category
          </SButton>
          <SButton v-else @click="selectedDepartmentId = ''">Clear filter</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <!-- Bulk Delete Folders Modal -->
    <BulkDeleteConfirmModal
      v-model="showBulkDeleteFoldersModal"
      v-model:confirmed="bulkDeleteFoldersConfirmed"
      title="Delete selected categories"
      entity-label="category"
      entity-label-plural="categories"
      :count="selectedFoldersForBulk.length"
      :item-names="selectedFoldersForBulk.map((f) => f.name)"
      warning="This permanently deletes the selected categories and every product inside them. This cannot be undone."
      :impact-summary="
        `Delete ${selectedFoldersForBulk.length} ${
          selectedFoldersForBulk.length === 1 ? 'category' : 'categories'
        } and all products inside`
      "
      confirm-label="I understand these categories and their products will be permanently deleted."
      :loading="isBulkDeletingFolders"
      @update:model-value="(v) => { if (!v) bulkDeleteFoldersConfirmed = false }"
      @confirm="handleConfirmBulkDeleteFolders"
    />
    <!-- Delete Folder Modal -->
    <DeleteFolderModal
      v-model="showDeleteFolderModal"
      :folder="selectedFolderForDelete"
      @deleted="handleConfirmDeleteFolder"
    />

    <!-- Create Folder (slide-over) -->
    <SDialog
      placement="right"
      v-model:open="showCreateFolderModal"
      size="lg"
      :title="editingFolder ? 'Edit category' : 'Create new category'"
    >
      <SForm id="folder-drawer-form" @submit="handleSaveFolder">
        <SFormSection title="Basic info">
          <SField label="Category name" required>
            <SInput v-model="folderForm.name" required placeholder="e.g. Chairs" />
          </SField>
          <SField label="Type" required>
            <SSelect v-model="folderForm.type" required>
              <option value="">Select type</option>
              <option value="general">General</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing & Apparel</option>
              <option value="automotive">Automotive</option>
              <option value="food">Food & Beverage</option>
              <option value="office">Office Supplies</option>
              <option value="other">Other</option>
            </SSelect>
          </SField>
          <p v-if="editingFolder && isSubfolder(editingFolder)" class="s-form-meta">
            Subcategory of
            {{
              folders.find((entry) => entry.id === editingFolder?.parentId)?.name ||
              'parent category'
            }}.
          </p>
          <SField label="Description">
            <STextarea
              v-model="folderForm.description"
              :rows="2"
              placeholder="Optional: purpose of this category"
            />
          </SField>
        </SFormSection>

        <SFormSection
          v-if="showUsesSubcategoriesOption && !isSubfolderDrawer"
        >
          <SCheckbox
            v-model="folderForm.usesSubcategories"
            label="Organize with subcategories"
            description="Products go inside subcategories (e.g. Corolla, Camry under Toyota) instead of directly in this category."
            :disabled="usesSubcategoriesLocked"
          />
        </SFormSection>

        <SFormSection
          v-if="!(editingFolder && isSubfolder(editingFolder))"
        >
          <SCheckbox
            v-model="folderForm.hasSerialNumbers"
            label="Use serial numbers"
            description="On: one row per serial. Off: quantity field tracks stock."
          />
        </SFormSection>

        <SFormSection
          v-if="canViewProfitAndCost && !isSubfolderDrawer"
        >
          <SCheckbox
            v-model="folderForm.trackProfit"
            label="Track profit"
            description="Adds a cost price column and shows gross profit per category and for the store."
          />
        </SFormSection>

        <SFormSection
          v-if="canCreateInventoryFolders && !isSubfolderDrawer && !isStaff"
          title="Department access"
        >
          <p :class="drawerHintClass">
            Leave all unchecked for every department. Check to limit access.
          </p>
          <p v-if="departmentsStore.loading" :class="drawerHintClass" role="status">
            Loading departments…
          </p>
          <p v-else-if="currentStoreDepartments.length === 0" class="s-callout">
            No departments yet. Category stays open to everyone.
            <NuxtLink
              v-if="currentStoreId"
              :to="`/dashboard/stores/${currentStoreId}/departments`"
              class="s-link"
            >
              Add departments
            </NuxtLink>
          </p>
          <div v-else :class="[pickListClass, 's-inv-pick']">
            <ul :class="pickListScrollClass">
              <li v-for="dept in currentStoreDepartments" :key="dept.id" :class="pickRowClass">
                <SCheckbox
                  :model-value="folderForm.allowedDepartments.includes(dept.id)"
                  :label="dept.name"
                  :description="dept.description || undefined"
                  @update:model-value="(checked) => toggleDepartmentAccess(dept.id, !!checked)"
                />
              </li>
            </ul>
          </div>
        </SFormSection>

        <SFormSection v-if="!isSubfolderDrawer" title="Table template">
          <p :class="drawerHintClass">Columns for products in this category.</p>
          <input
            v-if="selectedTemplate"
            ref="folderTemplateExcelInput"
            type="file"
            accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            class="ds-sr-only"
            tabindex="-1"
            aria-hidden="true"
            :disabled="importingFolderTemplate"
            @change="handleImportFolderTemplateExcel"
          />

          <div v-if="selectedTemplate && editableFields.length > 0" class="s-inv-fields">
            <div class="s-inv-fields__head" aria-hidden="true">
              <span>Label</span>
              <span>Type</span>
              <span class="s-inv-fields__head-end">Options</span>
            </div>
            <div
              v-for="(field, index) in editableFields"
              :key="field.id"
              class="s-inv-fields__row"
            >
              <SInput
                v-model="field.label"
                required
                placeholder="Column title"
                :aria-label="`Column ${index + 1} label`"
                @input="syncTemplateFieldNameFromLabel(field)"
              />
              <SSelect
                v-model="field.type"
                required
                :aria-label="`Column ${index + 1} type`"
                :options="templateFieldTypeOptions"
              />
              <div class="s-inv-fields__end">
                <SCheckbox v-model="field.required" label="Required" />
                <SIconButton
                  v-if="!isLockedTemplateField(field)"
                  :label="`Remove column ${field.label || index + 1}`"
                  @click="handleRemoveField(index)"
                >
                  <Trash2 :size="16" :stroke-width="1.75" aria-hidden="true" />
                </SIconButton>
                <SBadge v-else title="Built-in column">Default</SBadge>
              </div>
            </div>
          </div>
          <div v-else-if="selectedTemplate" :class="emptyStateClass">
            <LayoutGrid :size="24" :stroke-width="1.75" aria-hidden="true" />
            <p class="s-inv-empty__title">No fields yet</p>
            <p>Add a column or import from Excel</p>
          </div>

          <div v-if="selectedTemplate" class="s-inv-actions">
            <SButton size="sm" @click="handleAddField">
              <template #leading>
                <Plus :size="16" :stroke-width="2" aria-hidden="true" />
              </template>
              Add column
            </SButton>
            <SButton
              size="sm"
              variant="ghost"
              :disabled="importingFolderTemplate"
              @click="triggerFolderTemplateExcelPicker"
            >
              <template #leading>
                <SSpinner v-if="importingFolderTemplate" :size="16" />
                <Upload v-else :size="16" :stroke-width="2" aria-hidden="true" />
              </template>
              {{ importingFolderTemplate ? 'Importing…' : 'Import Excel' }}
            </SButton>
          </div>
        </SFormSection>
      </SForm>

      <template #footer>
        <SDialogActions
          :primary-label="`${editingFolder ? 'Update' : 'Create'} category`"
          :primary-loading="isSavingFolder"
          :primary-disabled="!isFolderDrawerValid || isSavingFolder"
          @cancel="handleCancelFolder"
          @primary="handleSaveFolder"
        />
      </template>
    </SDialog>

    <SDialog
      v-model:open="showProfitSkipConfirmModal"
      title="Create without profit tracking?"
      description="You can turn this on later, but cost and margin won't be tracked until you do."
      size="md"
    >
      <div class="s-inventory__dialog-copy">
        <p>
          <strong>Track profit</strong>
          adds a <strong>Cost price</strong> column to this category and
          calculates gross profit (unit price minus cost) for each product.
        </p>
        <p>
          You'll see per-category profit on category cards, a store-wide
          <strong>Total profit</strong> summary, and margin on item rows -
          visible only to super admins.
        </p>
        <p>
          Without it, you can still record selling prices, but Storvv won't calculate margins or
          roll up profit for this category.
        </p>
      </div>
      <template #footer>
        <SDialogActions
          cancel-label="Go back"
          primary-label="Continue without profit"
          @cancel="showProfitSkipConfirmModal = false"
          @primary="confirmCreateWithoutProfitTracking"
        />
      </template>
    </SDialog>

    <SDialog
      v-model:open="showSubfolderSyncModal"
      title="Apply changes to subcategories?"
      :description="
        subfolderSyncCount === 1
          ? 'This category has 1 subcategory.'
          : `This category has ${subfolderSyncCount} subcategories.`
      "
      size="md"
      @update:open="
        (open: boolean) => {
          if (!open) pendingParentFolderSave = null
        }
      "
    >
      <div class="s-inventory__dialog-copy">
        <p>
          You changed columns, tracking, or access settings on
          <strong>{{
            editingFolder?.name || 'this category'
          }}</strong
          >.
        </p>
        <p>
          Subcategories normally inherit these settings. Apply the same changes to all
          subcategories, or keep this update on the parent category only.
        </p>
        <p class="s-inventory__dialog-note">
          Names and descriptions for each subcategory stay unchanged either way.
        </p>
      </div>
      <template #footer>
        <SDialogActions
          cancel-label="Parent only"
          primary-label="Apply to subcategories"
          :primary-loading="isSavingFolder"
          :cancel-disabled="isSavingFolder"
          @cancel="confirmParentFolderSave(false)"
          @primary="confirmParentFolderSave(true)"
        />
      </template>
    </SDialog>

    <!-- Duplicate category -->
    <SDialog
      placement="right"
      v-model:open="showDuplicateFolderModal"
      title="Duplicate category"
      description="Create copies with the same template and settings. Enter one or more category names."
      size="md"
      @update:open="(v: boolean) => { showDuplicateFolderModal = v }"
    >
      <form :class="drawerFillClass" @submit.prevent="handleConfirmDuplicateFolder">
        <div :class="[drawerFillFixedClass, 's-inv-row-head']">
          <p class="s-field__label">Category names</p>
          <SButton size="sm" @click="addDuplicateFolderName">
            <template #leading>
              <Plus :size="16" :stroke-width="2" aria-hidden="true" />
            </template>
            Add name
          </SButton>
        </div>
        <div :class="[drawerFillScrollClass, 's-inv-stack']">
          <p v-if="duplicateFolderNames.length === 0" :class="emptyStateClass">
            Select “Add name” to enter one or more category names.
          </p>
          <div
            v-for="(name, index) in duplicateFolderNames"
            :key="index"
            class="s-inline-field"
          >
            <div class="s-inline-field__grow">
              <SInput
                v-model="duplicateFolderNames[index]"
                placeholder="New category name"
                :aria-label="`Category name ${index + 1}`"
              />
            </div>
            <SIconButton
              :label="`Remove category name ${index + 1}`"
              @click="removeDuplicateFolderName(index)"
            >
              <Trash2 :size="16" :stroke-width="1.75" aria-hidden="true" />
            </SIconButton>
          </div>
        </div>
        <p v-if="duplicateFolderNamesError" class="s-field__error" role="alert">
          {{ duplicateFolderNamesError }}
        </p>
      </form>
      <template #footer>
        <SDialogActions
          :primary-label="
            isDuplicatingFolder
              ? 'Duplicating…'
              : `Duplicate ${validDuplicateFolderNamesCount} ${
                  validDuplicateFolderNamesCount === 1 ? 'category' : 'categories'
                }`
          "
          :primary-disabled="isDuplicatingFolder || !hasValidDuplicateFolderNames"
          @cancel="
            () => {
              showDuplicateFolderModal = false
              clearDuplicateFolderModal()
            }
          "
          @primary="handleConfirmDuplicateFolder"
        />
      </template>
    </SDialog>

    <!-- Copy selected folder templates from another branch -->
    <SDialog
      placement="right"
      v-model:open="showCopyFolderTemplatesModal"
      title="Copy category templates from another branch"
      description="Pick a source branch, select top-level categories, then choose whether to include subcategories."
      size="md"
    >
      <div :class="drawerFillClass">
        <SSelect
          v-model="copyTemplatesSourceStoreId"
          label="Source branch"
          placeholder="Select a branch…"
          :options="
            otherBranchesForTemplateCopy.map((s) => ({ value: s.id, label: branchDisplayLabel(s) }))
          "
        />
        <section v-if="copyTemplatesSourceStoreId" class="s-form-section">
          <div class="s-inv-row-head">
            <h3 class="s-form-section__title">Categories to copy</h3>
            <div class="s-inv-row-head__actions">
              <span class="s-form-meta" aria-live="polite">
                {{ copyTemplatesSelectedCount }} selected
              </span>
              <SButton
                size="sm"
                variant="ghost"
                :disabled="
                  copyTemplatesRootFoldersList.length === 0 || loadingCopyTemplatesSourceFolders
                "
                @click="selectAllCopyTemplatesFolders"
              >
                Select all
              </SButton>
              <SButton
                size="sm"
                variant="ghost"
                :disabled="loadingCopyTemplatesSourceFolders"
                @click="clearCopyTemplatesFolderSelection"
              >
                Clear
              </SButton>
            </div>
          </div>
          <p v-if="loadingCopyTemplatesSourceFolders" :class="emptyStateClass" role="status">
            Loading categories…
          </p>
          <div v-else-if="copyTemplatesRootFoldersList.length === 0" class="s-callout">
            <p>
              No category templates were found under
              <strong>{{ copyTemplatesSourceBranchLabel }}</strong>
              (your &ldquo;Source branch&rdquo; above).
            </p>
            <p
              v-if="
                storesStore.currentStoreId &&
                copyTemplatesSourceStoreId &&
                copyTemplatesSourceStoreId !== storesStore.currentStoreId &&
                inventoryViewBranchLabel
              "
            >
              The category tiles behind this panel are from
              <strong>{{ inventoryViewBranchLabel }}</strong>.
              Switch &ldquo;Source branch&rdquo; to that branch if those are the categories you
              want to copy, or create categories first on {{ copyTemplatesSourceBranchLabel }}.
            </p>
          </div>
          <div v-else :class="[pickListClass, 's-inv-pick']">
            <ul :class="pickListScrollClass">
              <li
                v-for="f in copyTemplatesRootFoldersList"
                :key="f.id"
                :class="[
                  pickRowClass,
                  copyTemplatesSelectedFolderIds.includes(f.id) ? pickRowSelectedClass : '',
                ]"
              >
                <SCheckbox
                  :model-value="copyTemplatesSelectedFolderIds.includes(f.id)"
                  :label="f.name || 'Untitled'"
                  :description="
                    copyTemplatesSubfolderCount(f.id) > 0
                      ? `${copyTemplatesSubfolderCount(f.id)} subcategor${
                          copyTemplatesSubfolderCount(f.id) === 1 ? 'y' : 'ies'
                        }`
                      : undefined
                  "
                  @update:model-value="(checked) => setCopyTemplatesFolderChecked(f.id, !!checked)"
                />
              </li>
            </ul>
          </div>
          <SCheckbox
            v-if="copyTemplatesSelectedHasSubfolders"
            v-model="copyTemplatesIncludeSubfolders"
            label="Also copy subcategories into selected categories"
            :description="
              copyTemplatesIncludeSubfolders && copyTemplatesSubfolderPreview
                ? `Includes: ${copyTemplatesSubfolderPreview}`
                : undefined
            "
          />
        </section>
        <fieldset class="s-form-section">
          <legend class="s-form-section__title">When a category name already exists here</legend>
          <div
            class="s-c s-choice-grid"
            role="radiogroup"
            aria-label="When a category name already exists here"
          >
            <button
              type="button"
              role="radio"
              class="s-choice"
              :aria-checked="copyTemplatesNameCollision === 'skip'"
              @click="copyTemplatesNameCollision = 'skip'"
            >
              <span class="s-choice__head">
                <span class="s-choice__title">Skip it</span>
                <span class="s-choice__radio" aria-hidden="true" />
              </span>
              <span class="s-choice__description">Leave that category out of the copy.</span>
            </button>
            <button
              type="button"
              role="radio"
              class="s-choice"
              :aria-checked="copyTemplatesNameCollision === 'suffix'"
              @click="copyTemplatesNameCollision = 'suffix'"
            >
              <span class="s-choice__head">
                <span class="s-choice__title">Add a suffix</span>
                <span class="s-choice__radio" aria-hidden="true" />
              </span>
              <span class="s-choice__description">
                Create it as &ldquo;(copy)&rdquo;, then &ldquo;(copy 2)&rdquo; if needed.
              </span>
            </button>
          </div>
        </fieldset>
        <p class="s-form-meta">
          Department restrictions are not copied; set them again on this branch if you use them.
        </p>
      </div>
      <template #footer>
        <SDialogActions
          :primary-label="
            isCopyingFolderTemplates
              ? 'Copying…'
              : `Copy ${copyTemplatesEffectiveCount || 0} ${
                  copyTemplatesEffectiveCount === 1 ? 'category' : 'categories'
                }`
          "
          :primary-disabled="
            isCopyingFolderTemplates ||
            !copyTemplatesSourceStoreId ||
            !storesStore.currentStoreId ||
            copyTemplatesSelectedCount === 0 ||
            loadingCopyTemplatesSourceFolders
          "
          @cancel="showCopyFolderTemplatesModal = false"
          @primary="handleConfirmCopyFolderTemplates"
        />
      </template>
    </SDialog>

    <!-- Folder actions menu (teleported; not clipped by grid/card overflow) -->
    <SMenu
      :open="Boolean(openFolderMenuId && folderForOpenMenu && folderMenuFixedStyle)"
      :style="folderMenuFixedStyle"
      menu-id="inventory-folder"
      label="Category actions"
      @close="closeFolderMenu"
    >
      <SMenuItem
        v-if="canDuplicateByPlan"
        label="Duplicate"
        :icon="Copy"
        @select="runFolderMenuAction(handleDuplicateFolder)"
      />
      <SMenuItem label="Edit" :icon="Pencil" @select="runFolderMenuAction(handleEditFolder)" />
      <SMenuItem
        label="Delete"
        :icon="Trash2"
        danger
        @select="runFolderMenuAction(handleDeleteFolder)"
      />
    </SMenu>
  </div>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import STextarea from '~/components/s/STextarea.vue'
import BulkDeleteConfirmModal from '~/components/dashboard/BulkDeleteConfirmModal.vue'
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Store } from '~/composables/useStores'
import {
  ArrowLeftRight,
  Copy,
  Download,
  EllipsisVertical,
  FolderClosed,
  FolderPlus,
  FolderTree,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  Upload,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SInput from '~/components/s/SInput.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import STabs from '~/components/s/STabs.vue'
import DeleteFolderModal from '~/components/inventory/DeleteFolderModal.vue'
import InventoryCategoryCard from '~/components/inventory/InventoryCategoryCard.vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { resolveEffectiveSubscriptionPlan } from '~/types/subscription'
import {
  useInventoryStore,
  type InventoryFolder,
  type Template,
  type TemplateField,
} from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import {
  expandFolderTemplatesToCopy,
  filterRootFolders,
  folderHasChildren,
  folderUsesSubcategoryHub,
  getChildFolders,
  getRootFolders,
  inheritableFolderSettingsChanged,
  isSubfolder,
  pickInheritableFolderUpdates,
  rollupFolderStats,
  type InheritableFolderSettings,
} from '~/utils/inventory-folder-tree'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import {
  getVisibleMenuAnchorElement,
  computeFixedAnchoredMenuStyle,
  isInsideAnchoredMenu,
} from '~/utils/menuAnchor'
import { parseTemplateFieldsFromExcelArrayBuffer } from '~/utils/inventory-template-from-excel'
import {
  COST_PRICE_FIELD_NAME,
  ensureCostPriceTemplateField,
  removeCostPriceTemplateField,
} from '~/utils/inventory-folder-profit'
import { runDashboardShellBootstrap } from '~/composables/useDashboardShellBootstrap'
import { useDashboardPageRefreshRegister } from '~/composables/useDashboardPageRefresh'
import { isNativePerfContext, scheduleNativeIdleWork } from '~/utils/capacitor-native-perf'

definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Inventory categories - Storvv',
})

const {
  pickListClass,
  pickListScrollClass,
  pickRowClass,
  pickRowSelectedClass,
  emptyStateClass,
  drawerHintClass,
  drawerFillClass,
  drawerFillFixedClass,
  drawerFillScrollClass,
} = useDashboardDrawerChrome()

const templateFieldTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'boolean', label: 'Yes / no' },
  { value: 'currency', label: 'Currency' },
]

const searchQuery = ref('')
const categoryFilter = ref<'all' | 'low-stock'>('all')

const categoryFilterOptions = computed(() => [
  { value: 'all', label: 'All categories' },
  {
    value: 'low-stock',
    label: 'Low stock',
    badge: inventoryStore.lowStockFolders.length || undefined,
  },
])

const inventorySortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'items', label: 'Products' },
  { value: 'date', label: 'Date' },
] as const

const sortBy = ref('name')
const showCreateFolderModal = ref(false)
const preserveFolderDrawerDraft = ref(false)
const folderDrawerClosingViaCancel = ref(false)
const isSavingFolder = ref(false)
const showProfitSkipConfirmModal = ref(false)
const profitSkipConfirmed = ref(false)
const showSubfolderSyncModal = ref(false)
const pendingParentFolderSave = ref<{
  name: string
  description: string
  inheritable: InheritableFolderSettings
  usesSubcategories?: boolean
} | null>(null)
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
    if (isInsideAnchoredMenu(t)) return
    if (t?.closest?.('[data-folder-actions-anchor]')) return
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
      if (window.matchMedia('(max-width: 639px)').matches) {
        return 'table'
      }
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
const { canManageBranches } = useBusinessCapabilities()
const inventoryStore = useInventoryStore()
const departmentsStore = useDepartmentsStore()
const storesStore = useStoresStore()
const toast = useAppToast()
const { exporting: reorderExporting, exportReorderListExcel } = useReorderListExport()

async function handleExportReorderList() {
  try {
    const { count } = await exportReorderListExcel()
    toast.success(`Reorder list exported (${count} ${count === 1 ? 'line' : 'lines'})`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed'
    toast.error(message)
  }
}
const { canCreateInventoryFolders, canViewProfitAndCost, isStaff } = usePermissions()
const { branchPageTitle } = useCurrentStoreLabel()

watch(
  () => storesStore.currentStoreId,
  () => {
    selectedFoldersForBulk.value = []
  }
)

watch(isStaff, (staff) => {
  if (staff) selectedDepartmentId.value = ''
}, { immediate: true })

const { formatCurrency, preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol || '$')

const canDuplicateByPlan = computed(() => {
  const sub = resolveEffectiveSubscriptionPlan(userStore.userData)
  return sub === 'storvv_medium' || sub === 'storvv_enterprise'
})

// Copy folder templates between branches: Enterprise only
const canCopyFolderTemplatesFromBranchByPlan = computed(
  () => resolveEffectiveSubscriptionPlan(userStore.userData) === 'storvv_enterprise'
)

const otherBranchesForTemplateCopy = computed(() => {
  if (!canManageBranches.value) return [] as Store[]
  const id = storesStore.currentStoreId
  if (!id) return [] as Store[]
  return [...storesStore.stores]
    .filter((s) => s.isActive && s.id !== id)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
})

const canShowCopyFolderTemplatesFromBranch = computed(
  () =>
    userStore.userData?.role === 'superAdmin' &&
    canManageBranches.value &&
    canCopyFolderTemplatesFromBranchByPlan.value &&
    canCreateInventoryFolders.value &&
    storesStore.activeStores.length > 1
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
const copyTemplatesIncludeSubfolders = ref(false)
const isCopyingFolderTemplates = ref(false)
const copyTemplatesSourceFoldersList = ref<InventoryFolder[]>([])
const copyTemplatesSelectedFolderIds = ref<string[]>([])
const loadingCopyTemplatesSourceFolders = ref(false)

const copyTemplatesRootFoldersList = computed(() =>
  getRootFolders(copyTemplatesSourceFoldersList.value)
)

const copyTemplatesSelectedCount = computed(() => copyTemplatesSelectedFolderIds.value.length)

const copyTemplatesSelectedHasSubfolders = computed(() => {
  const all = copyTemplatesSourceFoldersList.value
  return copyTemplatesSelectedFolderIds.value.some((id) => folderHasChildren(all, id))
})

const copyTemplatesEffectiveCount = computed(() => {
  const all = copyTemplatesSourceFoldersList.value
  const expanded = expandFolderTemplatesToCopy(
    all,
    copyTemplatesSelectedFolderIds.value,
    copyTemplatesIncludeSubfolders.value
  )
  return expanded.length
})

function copyTemplatesSubfolderCount(folderId: string): number {
  return getChildFolders(copyTemplatesSourceFoldersList.value, folderId).length
}

const copyTemplatesSubfolderPreview = computed(() => {
  if (!copyTemplatesIncludeSubfolders.value) return ''
  const all = copyTemplatesSourceFoldersList.value
  const names: string[] = []
  for (const id of copyTemplatesSelectedFolderIds.value) {
    for (const child of getChildFolders(all, id)) {
      names.push(child.name || 'Untitled')
    }
  }
  if (names.length === 0) return ''
  if (names.length <= 6) return names.join(', ')
  return `${names.slice(0, 6).join(', ')} +${names.length - 6} more`
})

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
    copyTemplatesSelectedFolderIds.value = getRootFolders(list).map((folder) => folder.id)
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
  copyTemplatesSelectedFolderIds.value = copyTemplatesRootFoldersList.value.map((f) => f.id)
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
    copyTemplatesIncludeSubfolders.value = false
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
  copyTemplatesIncludeSubfolders.value = false
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
    const { createdCount, skippedCount } =
      await inventoryStore.duplicateFolderTemplatesBetweenStores(sourceStoreId, targetStoreId, {
        onExistingName: copyTemplatesNameCollision.value,
        folderIds: selectedIds,
        includeSubfolders: copyTemplatesIncludeSubfolders.value,
      })
    if (createdCount === 0) {
      if (skippedCount > 0) {
        toast.warning(
          `No new folders added. Skipped ${skippedCount} duplicate name(s), or nothing to copy from the selected branch.`
        )
      } else {
        toast.warning('The source branch has no folders to copy.')
      }
    } else {
      toast.success(
        `Copied ${createdCount} folder template(s) into this branch.${
          skippedCount ? ` Skipped ${skippedCount} duplicate name(s).` : ''
        }`
      )
      await reloadInventoryCategories()
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
  trackProfit: false,
  allowedDepartments: [] as string[],
  parentId: '' as string,
  usesSubcategories: false,
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
  COST_PRICE_FIELD_NAME,
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
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '') || ''
  )
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

function resetNewFolderFormDefaults() {
  folderForm.name = ''
  folderForm.description = ''
  folderForm.type = ''
  folderForm.color = '#3B82F6'
  folderForm.hasSerialNumbers = false
  folderForm.trackProfit = false
  folderForm.allowedDepartments = []
  folderForm.parentId = ''
  folderForm.usesSubcategories = false
  profitSkipConfirmed.value = false
  editableFields.value = getDefaultFields()
  selectedTemplateId.value = 'custom'
  ensureBulkQuantityTemplateField(editableFields.value)
}

const isSubfolderDrawer = computed(
  () => !!editingFolder.value && isSubfolder(editingFolder.value)
)

const showUsesSubcategoriesOption = computed(() => {
  if (isSubfolderDrawer.value) return false
  if (editingFolder.value) {
    if ((editingFolder.value.itemCount ?? 0) > 0) return false
    return true
  }
  return true
})

const usesSubcategoriesLocked = computed(() => {
  if (!editingFolder.value) return false
  return getChildFolders(folders.value, editingFolder.value.id).length > 0
})

watch(showCreateFolderModal, (isOpen) => {
  if (isOpen) {
    if (!editingFolder.value && !preserveFolderDrawerDraft.value) {
      resetNewFolderFormDefaults()
    }
    return
  }
  if (folderDrawerClosingViaCancel.value || editingFolder.value) return
  preserveFolderDrawerDraft.value = true
})

watch(
  () => folderForm.trackProfit,
  (trackProfit) => {
    if (trackProfit) {
      ensureCostPriceTemplateField(editableFields.value)
    } else {
      editableFields.value = removeCostPriceTemplateField(editableFields.value)
    }
  }
)

// Watch hasSerialNumbers: serial mode → serial + product model, no quantity; bulk → quantity, no serial columns
watch(
  () => folderForm.hasSerialNumbers,
  (hasSerial) => {
    if (hasSerial) {
      editableFields.value = stripStockLikeTemplateFields(editableFields.value)
      const serialNoFieldExists = editableFields.value.some(
        (f) => f.name === 'serialNo' || f.name === 'serialNumber'
      )
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

      const brandFieldExists = editableFields.value.some((f) => f.name === 'brand')
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
      editableFields.value = editableFields.value.filter(
        (f) =>
          f.name !== 'serialNo' &&
          f.name !== 'serialNumber' &&
          f.name !== 'brand' &&
          f.name !== 'model'
      )
      ensureBulkQuantityTemplateField(editableFields.value)
    }
  }
)

const folders = computed(() => inventoryStore.folders)

// Get departments for current store only
const currentStoreDepartments = computed(() => {
  if (!currentStoreId.value) return departmentsStore.departments
  return departmentsStore.departments.filter((dept) => dept.storeId === currentStoreId.value)
})

const filteredFolders = computed(() => {
  let result = [...folders.value]

  // Filter by selected department (super admin / owner only)
  if (!isStaff.value && selectedDepartmentId.value) {
    result = result.filter((folder) => {
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
      (folder) =>
        folder.name.toLowerCase().includes(query) ||
        folder.description.toLowerCase().includes(query)
    )
  }

  if (categoryFilter.value === 'low-stock') {
    result = result.filter((folder) => {
      if (folderHasChildren(folders.value, folder.id)) {
        return rollupFolderStats(folder, folders.value).lowStockCount > 0
      }
      return (folder.lowStockCount ?? 0) > 0
    })
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

/** Top-level categories only - subcategories are opened inside their parent folder. */
const foldersForCategoryList = computed(() => {
  const all = filteredFolders.value
  const query = searchQuery.value.trim()
  if (query) return filterRootFolders(all, query)
  return getRootFolders(all)
})

function folderDisplayStats(folder: InventoryFolder) {
  if (folderHasChildren(folders.value, folder.id)) {
    return rollupFolderStats(folder, folders.value)
  }
  return {
    itemCount: folder.itemCount ?? 0,
    totalValue: folder.totalValue ?? 0,
    lowStockCount: folder.lowStockCount ?? 0,
  }
}

function folderCategoryDescription(folder: InventoryFolder): string {
  if (folderUsesSubcategoryHub(folder, folders.value)) {
    const subCount = getChildFolders(folders.value, folder.id).length
    if (subCount > 0) {
      const label = `${subCount} subcategor${subCount === 1 ? 'y' : 'ies'}`
      return folder.description?.trim() ? `${label} · ${folder.description}` : label
    }
    return folder.description?.trim() || 'Uses subcategories'
  }
  const subCount = getChildFolders(folders.value, folder.id).length
  if (subCount > 0) {
    const label = `${subCount} subcategor${subCount === 1 ? 'y' : 'ies'}`
    return folder.description?.trim() ? `${label} · ${folder.description}` : label
  }
  return folder.description
}

const filteredFoldersTotalValue = computed(() =>
  filteredFolders.value.reduce((sum, folder) => sum + (folder.totalValue ?? 0), 0)
)

const filteredFoldersTotalProfit = computed(() =>
  filteredFolders.value.reduce((sum, folder) => {
    if (!folder.trackProfit) return sum
    return sum + (inventoryStore.folderProfitStats[folder.id]?.grossProfitOnHand ?? 0)
  }, 0)
)

const categoryHeaderMetrics = computed(() => {
  const totalCategories = getRootFolders(inventoryStore.folders).length
  const shownCategories = foldersForCategoryList.value.length
  const categoriesValue =
    shownCategories !== totalCategories
      ? `${shownCategories} / ${totalCategories}`
      : String(totalCategories)

  const metrics: Array<{ key: string; label: string; value: string; tone?: string }> = [
    {
      key: 'categories',
      label: shownCategories !== totalCategories ? 'Categories shown' : 'Categories',
      value: categoriesValue,
    },
    {
      key: 'products',
      label: 'Products',
      value: String(inventoryStore.totalItems),
    },
    {
      key: 'value',
      label: 'Total value',
      value: formatCurrency(filteredFoldersTotalValue.value),
    },
  ]

  if (canViewProfitAndCost.value) {
    metrics.push({
      key: 'profit',
      label: 'Total profit',
      value: formatCurrency(filteredFoldersTotalProfit.value),
    })
  }

  metrics.push({
    key: 'low-stock',
    label: 'Low stock',
    value: String(inventoryStore.lowStockFolders.length),
    tone: inventoryStore.lowStockFolders.length > 0 ? 'warning' : undefined,
  })

  return metrics
})

function folderGrossProfitOnHand(folderId: string): number | null {
  const folder = inventoryStore.getFolderById(folderId)
  if (!folder?.trackProfit) return null
  const stats = inventoryStore.folderProfitStats[folderId]
  if (stats) return stats.grossProfitOnHand
  if ((folder.itemCount ?? 0) === 0) return 0
  return null
}

function formatFolderProfit(folderId: string): string {
  const profit = folderGrossProfitOnHand(folderId)
  if (profit === null) return '-'
  return formatCurrency(profit)
}


function folderProfitToneClass(folderId: string): string {
  const profit = folderGrossProfitOnHand(folderId)
  if (profit === null || profit === 0) return ''
  return profit > 0 ? 's-table__success' : 's-table__error'
}

const folderForOpenMenu = computed(() => {
  const id = openFolderMenuId.value
  if (!id) return null
  return foldersForCategoryList.value.find((f) => f.id === id) ?? null
})

function runFolderMenuAction(action: (folder: InventoryFolder) => unknown) {
  const folder = folderForOpenMenu.value
  if (folder) action(folder)
  openFolderMenuId.value = null
}

function closeFolderMenu() {
  const id = openFolderMenuId.value
  openFolderMenuId.value = null
  if (!id || !import.meta.client) return
  document.querySelector<HTMLElement>(`[data-folder-actions-anchor="${id}"]`)?.focus()
}

const categoryFilterTabs = computed(() =>
  categoryFilterOptions.value.map((option) => ({
    value: option.value,
    label: option.label,
    count: option.badge,
  }))
)

const departmentFilterOptions = computed(() => [
  { value: '', label: 'All departments' },
  ...currentStoreDepartments.value.map((dept) => ({ value: dept.id, label: dept.name })),
])

const categorySortSelectOptions = inventorySortOptions.map((option) => ({
  value: option.value,
  label: `Sort: ${option.label}`,
}))

function isFolderSelected(folder: InventoryFolder): boolean {
  return selectedFoldersForBulk.value.some((f) => f.id === folder.id)
}

const hasActiveCategoryFilters = computed(
  () => Boolean(selectedDepartmentId.value || searchQuery.value) || categoryFilter.value === 'low-stock'
)

function clearCategoryFilters() {
  searchQuery.value = ''
  selectedDepartmentId.value = ''
  categoryFilter.value = 'all'
}

const filteredCategoriesEmptyTitle = computed(() => {
  if (selectedDepartmentId.value) {
    return `No categories in ${getDepartmentName(selectedDepartmentId.value) ?? 'this department'}`
  }
  if (categoryFilter.value === 'low-stock') return 'No low-stock categories'
  if (searchQuery.value) return 'No categories found'
  return 'No categories on this page'
})

const filteredCategoriesEmptyDescription = computed(() => {
  if (selectedDepartmentId.value) return 'Try another department or clear the filter.'
  if (categoryFilter.value === 'low-stock') return 'All categories are above your low-stock threshold.'
  if (searchQuery.value) return 'Try a different search term.'
  return 'Adjust filters or go to another page.'
})

const noCategoriesTitle = computed(() => {
  if (isStaff.value && !searchQuery.value) return 'No categories in your department'
  if (selectedDepartmentId.value) {
    return `No categories in ${getDepartmentName(selectedDepartmentId.value) ?? 'this department'}`
  }
  if (searchQuery.value) return 'No categories found'
  return 'No categories yet'
})

const noCategoriesDescription = computed(() => {
  if (isStaff.value && !searchQuery.value) {
    return 'Categories shared with your department will appear here. Ask your admin if you need access.'
  }
  if (selectedDepartmentId.value) {
    return 'Try another department or clear the filter to see all categories.'
  }
  if (searchQuery.value) return 'Try a different search term.'
  return 'Create a category to organize products, then add stock inside it.'
})

const subfolderSyncCount = computed(() => {
  const id = editingFolder.value?.id
  if (!id) return 0
  return getChildFolders(folders.value, id).length
})

const paginatedFolders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return foldersForCategoryList.value.slice(start, start + itemsPerPage.value)
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
  if (isStaff.value) return
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

const getDepartmentName = (deptId: string) => {
  const dept = departmentsStore.getDepartmentById(deptId)
  return dept?.name
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
  const names = allowed
    .map((id) => getDepartmentName(id)?.trim())
    .filter((name): name is string => Boolean(name))
  if (names.length === 0) return 'All departments'
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
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }

    // Handle Firestore Timestamp objects (with seconds property)
    if (date && typeof date === 'object' && 'seconds' in date) {
      const timestamp = date.seconds * 1000 + (date.nanoseconds || 0) / 1000000
      const dateObj = new Date(timestamp)
      if (isNaN(dateObj.getTime())) return '-'
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
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
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
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
  if (!preserveFolderDrawerDraft.value) {
    resetNewFolderFormDefaults()
  }
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
  const trimmed = duplicateFolderNames.value.map((n) => n?.trim()).filter(Boolean)
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

  const trimmedInputs = duplicateFolderNames.value.map((n) => n?.trim()).filter(Boolean)
  if (trimmedInputs.length !== validDuplicateFolderNames.value.length) {
    duplicateFolderNamesError.value =
      'Duplicate names are not allowed. Please ensure each folder name is unique.'
    return
  }
  duplicateFolderNamesError.value = null

  isDuplicatingFolder.value = true
  try {
    const allowedDepartments =
      source.allowedDepartments && source.allowedDepartments.length > 0
        ? [...source.allowedDepartments]
        : []
    const template = source.template
      ? { ...source.template, fields: source.template.fields.map((f) => ({ ...f })) }
      : undefined

    for (const name of names) {
      await inventoryStore.createFolder({
        name,
        description: source.description || '',
        type: source.type || '',
        color: source.color || '#3B82F6',
        hasSerialNumbers: source.hasSerialNumbers ?? false,
        trackProfit: source.trackProfit === true,
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
  preserveFolderDrawerDraft.value = false
  editingFolder.value = folder
  folderForm.name = folder.name
  folderForm.description = folder.description || ''
  folderForm.type = folder.type || ''
  folderForm.color = folder.color || '#3B82F6'
  folderForm.hasSerialNumbers = folder.hasSerialNumbers || false
  folderForm.trackProfit = folder.trackProfit === true
  folderForm.allowedDepartments = folder.allowedDepartments ? [...folder.allowedDepartments] : []
  folderForm.parentId = folder.parentId || ''
  folderForm.usesSubcategories =
    folder.usesSubcategories === true ||
    getChildFolders(folders.value, folder.id).length > 0
  if (folder.template) {
    editableFields.value = folder.template.fields.map((f) => ({ ...f }))
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
  const existingFieldNames = editableFields.value.map((f) => f.name)
  const missingDefaults = defaultFieldNames.filter((name) => !existingFieldNames.includes(name))

  if (missingDefaults.length > 0) {
    const defaults = getDefaultFields()
    missingDefaults.forEach((fieldName) => {
      const defaultField = defaults.find((f) => f.name === fieldName)
      if (defaultField) {
        editableFields.value.unshift({ ...defaultField, id: `field-${fieldName}-${Date.now()}` })
      }
    })
  }

  // Ensure default fields are in the correct order (at the beginning)
  const defaultFields = editableFields.value.filter((f) => defaultFieldNames.includes(f.name))
  const customFields = editableFields.value.filter((f) => !defaultFieldNames.includes(f.name))
  editableFields.value = [
    ...defaultFields.sort((a, b) => {
      const indexA = defaultFieldNames.indexOf(a.name)
      const indexB = defaultFieldNames.indexOf(b.name)
      return indexA - indexB
    }),
    ...customFields,
  ]

  // If hasSerialNumbers is true, ensure serialNo and product model (brand) fields exist
  if (folderForm.hasSerialNumbers) {
    const serialNoFieldExists = editableFields.value.some(
      (f) => f.name === 'serialNo' || f.name === 'serialNumber'
    )
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

    const brandFieldExists = editableFields.value.some((f) => f.name === 'brand')
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

  if (folderForm.trackProfit) {
    ensureCostPriceTemplateField(editableFields.value)
  } else {
    editableFields.value = removeCostPriceTemplateField(editableFields.value)
  }

  nextTick(() => {
    editableFields.value.forEach((f) => {
      if (!isLockedTemplateField(f)) syncTemplateFieldNameFromLabel(f)
    })
  })
  showCreateFolderModal.value = true
}

const toggleFolderSelection = (folder: InventoryFolder, checked: boolean) => {
  const idx = selectedFoldersForBulk.value.findIndex((f) => f.id === folder.id)
  if (checked && idx === -1) selectedFoldersForBulk.value.push(folder)
  else if (!checked && idx !== -1) selectedFoldersForBulk.value.splice(idx, 1)
}
const allFoldersOnPageSelected = computed(
  () =>
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
  const ids = selectedFoldersForBulk.value.map((f) => f.id)
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
  if (isSavingFolder.value) return

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
  const existingFieldNames = editableFields.value.map((f) => f.name)
  const missingDefaults = defaultFieldNames.filter((name) => !existingFieldNames.includes(name))

  // Add any missing default fields
  if (missingDefaults.length > 0) {
    const defaults = getDefaultFields()
    missingDefaults.forEach((fieldName) => {
      const defaultField = defaults.find((f) => f.name === fieldName)
      if (defaultField) {
        editableFields.value.unshift({ ...defaultField, id: `field-${fieldName}-${Date.now()}` })
      }
    })
  }

  // Ensure default fields are in the correct order (at the beginning)
  const defaultFields = editableFields.value.filter((f) => defaultFieldNames.includes(f.name))
  const customFields = editableFields.value.filter((f) => !defaultFieldNames.includes(f.name))
  editableFields.value = [
    ...defaultFields.sort((a, b) => {
      const indexA = defaultFieldNames.indexOf(a.name)
      const indexB = defaultFieldNames.indexOf(b.name)
      return indexA - indexB
    }),
    ...customFields,
  ]

  if (editableFields.value.length === 0) {
    alert('Please add at least one field to the template')
    return
  }

  if (
    !editingFolder.value &&
    canViewProfitAndCost.value &&
    !folderForm.trackProfit &&
    !profitSkipConfirmed.value
  ) {
    showProfitSkipConfirmModal.value = true
    return
  }

  if (folderForm.trackProfit) {
    ensureCostPriceTemplateField(editableFields.value)
  } else {
    editableFields.value = removeCostPriceTemplateField(editableFields.value)
  }

  const trackProfit = canViewProfitAndCost.value ? folderForm.trackProfit : false

  const template: Template = {
    id: 'custom',
    name: 'Custom Template',
    description: 'Custom table structure',
    fields: editableFields.value.map((f) => ({ ...f })),
  }

  const allowedDepartments =
    folderForm.allowedDepartments.length > 0 ? [...folderForm.allowedDepartments] : []

  try {
    if (editingFolder.value) {
      if (isSubfolder(editingFolder.value)) {
        isSavingFolder.value = true
        await inventoryStore.updateFolder(editingFolder.value.id, {
          name: folderForm.name.trim(),
          description: folderForm.description.trim(),
        })
        toast.success('Category updated')
        handleCancelFolder()
        await inventoryStore.fetchFolderAvailabilityStats()
        return
      }

      const inheritable: InheritableFolderSettings = {
        type: folderForm.type,
        color: folderForm.color,
        hasSerialNumbers: folderForm.hasSerialNumbers,
        trackProfit,
        template,
        allowedDepartments,
      }

      const childCount = getChildFolders(folders.value, editingFolder.value.id).length
      if (
        childCount > 0 &&
        inheritableFolderSettingsChanged(editingFolder.value, inheritable)
      ) {
        pendingParentFolderSave.value = {
          name: folderForm.name.trim(),
          description: folderForm.description.trim(),
          inheritable,
          usesSubcategories: folderForm.usesSubcategories,
        }
        showSubfolderSyncModal.value = true
        return
      }

      isSavingFolder.value = true
      await commitParentFolderSave(
        {
          name: folderForm.name.trim(),
          description: folderForm.description.trim(),
          inheritable,
          usesSubcategories: folderForm.usesSubcategories,
        },
        false
      )
    } else {
      isSavingFolder.value = true
      await inventoryStore.createFolder({
        name: folderForm.name.trim(),
        description: folderForm.description.trim(),
        type: folderForm.type,
        color: folderForm.color,
        hasSerialNumbers: folderForm.hasSerialNumbers,
        trackProfit,
        template: template,
        allowedDepartments,
        parentId: null,
        usesSubcategories: folderForm.usesSubcategories,
      })
      handleCancelFolder()
      await inventoryStore.fetchFolderAvailabilityStats()
    }
  } catch (error: any) {
    alert(error.message || 'Failed to save folder')
  } finally {
    isSavingFolder.value = false
  }
}

async function commitParentFolderSave(
  payload: {
    name: string
    description: string
    inheritable: InheritableFolderSettings
    usesSubcategories?: boolean
  },
  applyToSubfolders: boolean
) {
  const parent = editingFolder.value
  if (!parent) return

  const updates: Record<string, unknown> = {
    name: payload.name,
    description: payload.description,
    ...pickInheritableFolderUpdates(payload.inheritable),
  }
  if (payload.usesSubcategories !== undefined) {
    updates.usesSubcategories = payload.usesSubcategories
  }

  await inventoryStore.updateFolder(parent.id, updates)

  if (applyToSubfolders) {
    const children = getChildFolders(folders.value, parent.id)
    const childUpdates = pickInheritableFolderUpdates(payload.inheritable)
    for (const child of children) {
      await inventoryStore.updateFolder(child.id, childUpdates)
    }
    toast.success(
      `Updated category and ${children.length} subcategor${children.length === 1 ? 'y' : 'ies'}`
    )
  } else {
    toast.success('Category updated')
  }

  handleCancelFolder()
  await inventoryStore.fetchFolderAvailabilityStats()
}

async function confirmParentFolderSave(applyToSubfolders: boolean) {
  const pending = pendingParentFolderSave.value
  if (!pending || isSavingFolder.value) return

  isSavingFolder.value = true
  try {
    await commitParentFolderSave(pending, applyToSubfolders)
    pendingParentFolderSave.value = null
    showSubfolderSyncModal.value = false
  } catch (error: any) {
    alert(error.message || 'Failed to save folder')
  } finally {
    isSavingFolder.value = false
  }
}

const handleCancelFolder = () => {
  folderDrawerClosingViaCancel.value = true
  preserveFolderDrawerDraft.value = false
  showCreateFolderModal.value = false
  showProfitSkipConfirmModal.value = false
  showSubfolderSyncModal.value = false
  pendingParentFolderSave.value = null
  profitSkipConfirmed.value = false
  isSavingFolder.value = false
  editingFolder.value = null
  resetNewFolderFormDefaults()
  nextTick(() => {
    folderDrawerClosingViaCancel.value = false
  })
}

const confirmCreateWithoutProfitTracking = () => {
  profitSkipConfirmed.value = true
  showProfitSkipConfirmModal.value = false
  void handleSaveFolder()
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

async function reloadInventoryCategories() {
  if (!authStore.currentUser) return
  await inventoryStore.fetchFolders({ force: true })
  await inventoryStore.fetchFolderAvailabilityStats({ force: true })
}

useDashboardPageRefreshRegister(reloadInventoryCategories)

// Load folders on mount
onMounted(async () => {
  if (import.meta.server) return
  if (!authStore.currentUser) return

  try {
    await runDashboardShellBootstrap()
    if (isNativePerfContext()) {
      scheduleNativeIdleWork(() => {
        void inventoryStore.fetchFolderAvailabilityStats()
      }, 700)
    } else {
      await inventoryStore.fetchFolderAvailabilityStats()
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[InventoryPage] Error loading data:', message)
  }
})

// Watch for user data changes and fetch folders when it becomes available
watch(
  () => userStore.userData,
  async (userData) => {
    if (userData && authStore.currentUser && inventoryStore.folders.length === 0) {
      // console.log('[InventoryPage] User data changed, fetching folders...')
      try {
        await inventoryStore.fetchFolders()
        // console.log('[InventoryPage] Folders fetched after user data change:', inventoryStore.folders.length)
      } catch (error: any) {
        console.error('[InventoryPage] Error fetching folders:', error.message || error)
      }
    }
  },
  { immediate: false }
)

// Watch for auth state changes
watch(
  () => authStore.currentUser,
  async (user) => {
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
  },
  { immediate: false }
)

// Watch for store changes and refetch folders
watch(
  () => storesStore.currentStoreId,
  async (newStoreId, oldStoreId) => {
    if (newStoreId && newStoreId !== oldStoreId && authStore.currentUser) {
      // console.log('[InventoryPage] Store changed, refetching folders...')
      try {
        // Reset department filter when store changes
        selectedDepartmentId.value = ''
        // Refetch folders for new store
        await inventoryStore.fetchFolders()
        if (isNativePerfContext()) {
          scheduleNativeIdleWork(() => {
            void inventoryStore.fetchFolderAvailabilityStats({ force: true })
          }, 500)
        } else {
          await inventoryStore.fetchFolderAvailabilityStats({ force: true })
        }
        // Refetch departments for new store (owner only)
        if (authStore.currentUser && !isStaff.value) {
          await departmentsStore.fetchDepartments()
        }
        // console.log('[InventoryPage] Folders refetched after store change:', inventoryStore.folders.length)
      } catch (error: any) {
        console.error(
          '[InventoryPage] Error refetching folders after store change:',
          error.message || error
        )
      }
    }
  },
  { immediate: false }
)
</script>
