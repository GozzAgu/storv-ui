<template>
  <div class="space-y-6 pb-24">
    <!-- Enhanced Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-4 flex-1">
        <button
          @click="navigateTo('/dashboard/inventory')"
          class="mt-1 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          title="Back to folders"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <div class="flex-1">
              <h1 v-if="isLoadingFolder" class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Loading...
              </h1>
              <h1 v-else class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ folder?.name || 'Folder' }}
              </h1>
              <p v-if="!isLoadingFolder" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ folder?.description || 'No description' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-2">
              <CalendarIcon class="w-4 h-4" />
              <span>Created {{ formatDate(folder?.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CubeIcon class="w-4 h-4" />
              <span>{{ folder?.itemCount || 0 }} items</span>
            </div>
          </div>
        </div>
        
        <!-- Bulk Discount Button (if items selected) -->
        <div v-if="!isLoadingFolder && canManageInventoryItems && selectedItemsForBulk.length > 0" class="flex items-center gap-2">
          <button
            @click="openBulkDiscountModal"
            class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Apply bulk discount"
          >
            <TagIcon class="w-5 h-5" />
            <span class="hidden sm:inline">Bulk Discount ({{ selectedItemsForBulk.length }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Enhanced Stats Cards - Hidden on large screens -->
    <div v-if="!isLoadingFolder" class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ folder?.itemCount || 0 }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Items in this folder</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <CubeIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
{{ formatCurrency(totalInventoryValue) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Inventory value</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CurrencyDollarIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

    </div>

    <!-- Loading State -->
    <Card v-if="isLoadingFolder" padding="md">
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading folder...</p>
      </div>
    </Card>

    <!-- Enhanced Filters Section - Hidden on large screens -->
    <Card v-else padding="md" class="lg:hidden">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, SKU..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          v-model="sortBy"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="sku">Sort by SKU</option>
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

    <!-- Enhanced Items Table -->
    <Card padding="none">
      <!-- Compact Header (Visible only on large screens) -->
      <div v-if="!isLoadingFolder" class="hidden lg:block border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <!-- Compact Stats -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <CubeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Items:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ folder?.itemCount || 0 }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CurrencyDollarIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Value:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(totalInventoryValue) }}</span>
            </div>
          </div>
          <!-- Compact Filters -->
          <div class="flex items-center gap-3">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-48"
              />
            </div>
            <select
              v-model="sortBy"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="sku">Sort by SKU</option>
            </select>
            <button
              @click="resetFilters"
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div class="overflow-x-auto mb-6">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
                  column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                ]"
                @click="column.sortable && toggleSort(column.key)"
              >
                <div class="flex items-center gap-2">
                  {{ column.label }}
                  <template v-if="column.sortable">
                    <ChevronUpIcon
                      v-if="currentSort.key === column.key && currentSort.order === 'asc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === column.key && currentSort.order === 'desc'"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th v-if="canManageInventoryItems" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                <Checkbox
                  :model-value="(() => {
                    const availableItems = filteredItems.filter(item => !isItemSold(item))
                    return selectedItemsForBulk.length === availableItems.length && availableItems.length > 0
                  })()"
                  @update:model-value="(checked) => toggleSelectAll(checked)"
                  size="sm"
                  wrapper-class="justify-center"
                />
              </th>
              <th v-if="canManageInventoryItems" class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 min-w-[140px]">
                    Actions
                  </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(item, index) in paginatedItems"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td
                v-for="(column, colIndex) in columns"
                :key="column.key"
                class="px-3 py-2 whitespace-nowrap"
              >
                <div v-if="colIndex === 0" class="flex items-center gap-3">
                  <!-- First column shows avatar and value -->
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {{ getItemDisplayValue(item[column.key])?.toString().charAt(0).toUpperCase() || '?' }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ getItemDisplayValue(item[column.key]) }}
                      </div>
                      <span
                        v-if="item.swapIn"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        title="Swapped-in item"
                      >
                        Swap-In
                      </span>
                    </div>
                    <div v-if="columns.length > 1 && columns[1]" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ getItemDisplayValue(item[columns[1].key]) }}
                    </div>
                  </div>
                </div>
                <div v-else>
                  <div v-if="'type' in column && column.type === 'currency'" class="text-sm">
                    <div v-if="item.discountedPrice !== undefined" class="flex flex-col">
                      <span class="font-semibold text-green-600 dark:text-green-400">
                        {{ formatCurrency(item.discountedPrice) }}
                      </span>
                      <span class="text-xs text-gray-400 dark:text-gray-500 line-through">
                        {{ formatCurrency(item.originalPrice || item[column.key] || 0) }}
                      </span>
                      <span class="text-xs text-red-600 dark:text-red-400 font-medium">
                        {{ item.discountPercentage ? `-${item.discountPercentage}%` : `-${formatCurrency(item.discountAmount || 0)}` }}
                      </span>
                    </div>
                    <span v-else class="font-semibold text-gray-900 dark:text-gray-100">
                      {{ formatCurrency(item[column.key] || 0) }}
                    </span>
                  </div>
                  <div v-else-if="'type' in column && column.type === 'number'" class="text-sm text-gray-600 dark:text-gray-300">
                    {{ formatNumber(item[column.key]) }}
                  </div>
                  <div v-else-if="'type' in column && column.type === 'date'" class="text-sm text-gray-600 dark:text-gray-300">
                    <span v-if="item[column.key]">
                      {{ formatItemDate(item[column.key]) }}
                    </span>
                    <span v-else class="text-gray-400 dark:text-gray-500 italic">
                      -
                    </span>
                  </div>
                  <div v-else-if="column.key === 'dateIn' || column.key === 'dateOut'" class="text-sm text-gray-600 dark:text-gray-300">
                    <span v-if="item[column.key]">
                      {{ formatItemDate(item[column.key]) }}
                    </span>
                    <span v-else class="text-gray-400 dark:text-gray-500 italic">
                      -
                    </span>
                  </div>
                  <div v-else-if="column.key === 'availability'" class="text-sm">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getItemAvailability(item).class">
                      {{ getItemAvailability(item).label }}
                    </span>
                  </div>
                  <div v-else-if="'type' in column && column.type === 'boolean'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="item[column.key] ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'">
                    {{ item[column.key] ? 'Yes' : 'No' }}
                  </div>
                  <div v-else class="text-sm text-gray-600 dark:text-gray-300">
                    {{ getItemDisplayValue(item[column.key]) }}
                  </div>
                </div>
              </td>
              <td v-if="canManageInventoryItems" class="px-3 py-2 whitespace-nowrap text-center">
                <Checkbox
                  :model-value="selectedItemsForBulk.some(i => i.id === item.id)"
                  @update:model-value="(checked) => toggleItemSelection(item, checked)"
                  :disabled="isItemSold(item)"
                  size="sm"
                  wrapper-class="justify-center"
                  :title="isItemSold(item) ? 'Cannot select sold items for bulk operations' : ''"
                />
              </td>
                  <td v-if="canManageInventoryItems" class="px-3 py-2 whitespace-nowrap text-right min-w-[140px]">
                <div class="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    @click="handleApplyDiscount(item)"
                    :disabled="isItemSold(item)"
                    :class="[
                      'flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-colors',
                      isItemSold(item)
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    ]"
                    :title="isItemSold(item) ? 'Cannot apply discount to sold item' : (item.discountedPrice ? 'Edit discount' : 'Apply discount')"
                  >
                    <TagIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    v-if="item.discountedPrice"
                    @click="handleRemoveDiscount(item)"
                    :disabled="isItemSold(item)"
                    :class="[
                      'flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-colors',
                      isItemSold(item)
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                    ]"
                    :title="isItemSold(item) ? 'Cannot remove discount from sold item' : 'Remove discount'"
                  >
                    <XMarkIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    @click="handleEditItem(item)"
                    class="flex-shrink-0 p-1.5 sm:p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <PencilSquareIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    @click="handleDeleteItem(item)"
                    class="flex-shrink-0 p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <TrashIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="sortedFilteredItems.length === 0">
              <td :colspan="columns.length + 1" class="px-6 py-12">
                <div class="text-center">
                  <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <CubeIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {{ searchQuery ? 'No items found' : 'No items in this folder' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {{ searchQuery ? 'Try adjusting your filters' : 'Add items to get started' }}
                  </p>
                  <Button
                    v-if="!searchQuery && canManageInventoryItems"
                    variant="primary"
                    :icon="PlusIcon"
                    @click="openAddItemModal"
                  >
                    Add Your First Item
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Fixed Pagination -->
    <div
      v-if="sortedFilteredItems.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300"
      :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'"
    >
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="sortedFilteredItems.length"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Hidden file input for import -->
    <input
      v-if="canManageInventoryItems"
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls"
      class="hidden"
      @change="handleFileImport"
    />

    <!-- Floating Action Buttons -->
    <div v-if="!isLoadingFolder && canManageInventoryItems" class="fixed bottom-24 right-6 flex flex-col gap-2 z-40">
    <button
        @click="() => fileInputRef?.click()"
        :disabled="isImporting"
        :class="[
          'w-11 h-11 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110',
          (isImporting || isExporting) ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        title="Import from Excel"
      >
        <ArrowDownTrayIcon v-if="!isImporting" class="w-5 h-5" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </button>
      <button
        @click="handleExportToExcel"
        :disabled="isExporting || items.length === 0"
        :class="[
          'w-11 h-11 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110',
          (isExporting || isImporting || items.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        title="Export to Excel"
      >
        <ArrowUpTrayIcon v-if="!isExporting" class="w-5 h-5" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </button>
      <button
        @click="openAddItemModal"
        class="w-11 h-11 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        title="Add new item"
      >
        <PlusIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Enhanced Add/Edit Item Modal -->
    <Modal
      v-model="showAddItemModal"
      :title="editingItem ? 'Edit Item' : (folder?.hasSerialNumbers && !editingItem ? 'Add Items with Serial Numbers' : 'Add New Item')"
      size="lg"
    >
      <form @submit.prevent="handleSaveItem" class="space-y-6">
        <!-- Bulk Add Mode for Serial Numbers -->
        <div v-if="folder?.hasSerialNumbers && !editingItem" class="space-y-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>Bulk Add Mode:</strong> Enter the item details once, then add multiple serial numbers below. Each serial number will create a separate item with the same details.
            </p>
          </div>

          <!-- Common Fields (all items share these) -->
          <div class="space-y-4">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Item Details (Shared)</h4>
            <div
              v-for="field in folder?.template?.fields?.filter(f => f.name !== 'serialNo') || []"
              :key="field.id"
              :class="['grid gap-4', field.type === 'boolean' || field.type === 'date' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2']"
            >
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ field.label || field.name }} {{ field.required ? '*' : '' }}
                </label>
                <!-- Text Input -->
                <input
                  v-if="field.type === 'text'"
                  v-model="itemForm[field.name]"
                  type="text"
                  :required="field.required"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                />
                <!-- Number Input -->
                <input
                  v-else-if="field.type === 'number'"
                  v-model.number="itemForm[field.name]"
                  type="number"
                  :required="field.required"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                />
                <!-- Currency Input -->
                <div v-else-if="field.type === 'currency'" class="relative">
                  <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    v-model.number="itemForm[field.name]"
                    type="number"
                    step="0.01"
                    min="0"
                    :required="field.required"
                    class="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    :placeholder="field.placeholder || '0.00'"
                  />
                </div>
                <!-- Date Input -->
                <input
                  v-else-if="field.type === 'date'"
                  v-model="itemForm[field.name]"
                  type="date"
                  :required="field.required"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
                <!-- Select Input -->
                <select
                  v-else-if="field.type === 'select' && field.options"
                  v-model="itemForm[field.name]"
                  :required="field.required"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="">Select {{ field.label || field.name }}</option>
                  <option v-for="option in field.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
                <!-- Boolean Input -->
                <Checkbox
                  v-else-if="field.type === 'boolean'"
                  v-model="itemForm[field.name]"
                  :label="field.label || field.name"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <!-- Serial Numbers List -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Serial Numbers</h4>
              <Button
                variant="outline"
                size="sm"
                :icon="PlusIcon"
                @click="addSerialNumber"
              >
                Add Serial Number
              </Button>
            </div>
            <div v-if="serialNumbers.length === 0" class="text-center py-4 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
              No serial numbers added. Click "Add Serial Number" to start.
            </div>
            <div v-else class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="(serial, index) in serialNumbers"
                :key="index"
                class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
              >
                <input
                  v-model="serialNumbers[index]"
                  type="text"
                  :placeholder="`Serial Number ${index + 1}`"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  @click="removeSerialNumber(index)"
                  class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove serial number"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Single Item Mode (normal or edit) -->
        <div v-else>
          <div
            v-for="field in folder?.template?.fields || []"
            :key="field.id"
            :class="['grid grid-cols-2 gap-4', field.type === 'boolean' || field.type === 'date' ? 'grid-cols-1' : '']"
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ field.label || field.name }} {{ field.required ? '*' : '' }}
              </label>
              <!-- Text Input -->
              <input
                v-if="field.type === 'text'"
                v-model="itemForm[field.name]"
                type="text"
                :required="field.required"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
              />
              <!-- Number Input -->
              <input
                v-else-if="field.type === 'number'"
                v-model.number="itemForm[field.name]"
                type="number"
                :required="field.required"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
              />
              <!-- Currency Input -->
              <div v-else-if="field.type === 'currency'" class="relative">
                <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                <input
                  v-model.number="itemForm[field.name]"
                  type="number"
                  step="0.01"
                  min="0"
                  :required="field.required"
                  class="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || '0.00'"
                />
              </div>
              <!-- Date Input -->
              <input
                v-else-if="field.type === 'date'"
                v-model="itemForm[field.name]"
                type="date"
                :required="field.required"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
              <!-- Select Input -->
              <select
                v-else-if="field.type === 'select' && field.options"
                v-model="itemForm[field.name]"
                :required="field.required"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="">Select {{ field.label || field.name }}</option>
                <option v-for="option in field.options" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
              <!-- Boolean Input -->
              <Checkbox
                v-else-if="field.type === 'boolean'"
                v-model="itemForm[field.name]"
                :label="field.label || field.name"
                size="sm"
              />
            </div>
          </div>
          <div v-if="!folder?.template?.fields || folder.template.fields.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            No template fields defined for this folder. Please edit the folder to add fields.
          </div>
        </div>
      </form>

      <template #footer>
        <Button variant="outline" @click="handleCancelItem" class="w-full sm:w-auto">Cancel</Button>
        <Button variant="primary" type="submit" @click="handleSaveItem" class="w-full sm:w-auto">
          {{ editingItem ? 'Update' : (folder?.hasSerialNumbers && !editingItem ? `Add ${serialNumbers.length || 0} Item${serialNumbers.length !== 1 ? 's' : ''}` : 'Add') }} Item{{ folder?.hasSerialNumbers && !editingItem && serialNumbers.length !== 1 ? 's' : '' }}
        </Button>
      </template>
    </Modal>

    <!-- Discount Modal -->
    <DiscountModal
      v-model="showDiscountModal"
      :item="selectedItemForDiscount"
      :folder-id="folderId"
      @discount-applied="handleDiscountApplied"
    />

    <!-- Bulk Discount Modal -->
    <BulkDiscountModal
      v-model="showBulkDiscountModal"
      :selected-items="selectedItemsForBulk"
      :folder-id="folderId"
      @discount-applied="handleBulkDiscountApplied"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import {
  ArrowLeftIcon,
  PlusIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BarsArrowUpIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Modal from '~/components/ui/Modal.vue'
import Pagination from '~/components/ui/Pagination.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useInventoryStore, type InventoryFolder } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { useToast } from '~/composables/useToast'
import { usePreferences } from '~/composables/usePreferences'
import * as XLSX from 'xlsx'
import DiscountModal from '~/components/inventory/DiscountModal.vue'
import BulkDiscountModal from '~/components/inventory/BulkDiscountModal.vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const folderId = computed(() => route.params.id as string)

// Import InventoryItem from store
import type { InventoryItem } from '~/stores/inventory'

const inventoryStore = useInventoryStore()
const receiptsStore = useReceiptsStore()
const authStore = useAuthStore()
const { canManage, canManageInventoryItems } = usePermissions()
const toast = useToast()
const { formatCurrency } = usePreferences()

const folder = ref<InventoryFolder | null>(null)
const isLoadingFolder = ref(true)
const isLoadingItems = ref(false)
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
const searchQuery = ref('')
const sortBy = ref('name')
const showAddItemModal = ref(false)
const editingItem = ref<InventoryItem | null>(null)
// Load pagination state from localStorage - use folder ID in key for uniqueness
const getInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const folderId = route.params.id as string
      if (folderId) {
        const saved = localStorage.getItem(`inventory-page-${folderId}`)
        return saved ? parseInt(saved, 10) : 1
      }
    } catch (e) {
      return 1
    }
  }
  return 1
}
const currentPage = ref(getInitialPage())
const itemsPerPage = ref(20)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const isExporting = ref(false)

const currentSort = ref<{ key: string; order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' })

const itemForm = reactive<Record<string, any>>({})
const serialNumbers = ref<string[]>([])

// Discount modal state
const showDiscountModal = ref(false)
const showBulkDiscountModal = ref(false)
const selectedItemForDiscount = ref<InventoryItem | null>(null)
const selectedItemsForBulk = ref<InventoryItem[]>([])

// Folder will be loaded from Firestore via inventoryStore

// Generate columns based on folder template
const columns = computed(() => {
  const templateColumns: Array<{ key: string; label: string; sortable: boolean; type?: string }> = []
  
  if (folder.value?.template?.fields && folder.value.template.fields.length > 0) {
    // Generate columns from template fields
    templateColumns.push(...folder.value.template.fields.map(field => ({
      key: field.name,
      label: field.label || field.name,
      sortable: true,
      type: field.type,
    })))
  } else {
    // Fallback to default columns if no template
    templateColumns.push(
      { key: 'name', label: 'Item', sortable: true },
      { key: 'sku', label: 'SKU', sortable: true },
      { key: 'price', label: 'Price', sortable: true }
    )
  }
  
  // Always add Date In, Date Out, and Availability columns at the end
  templateColumns.push(
    { key: 'dateIn', label: 'Date In', sortable: true, type: 'date' },
    { key: 'dateOut', label: 'Date Out', sortable: true, type: 'date' },
    { key: 'availability', label: 'Availability', sortable: true, type: 'availability' }
  )
  
  return templateColumns
})

const items = computed(() => {
  return inventoryStore.items[folderId.value] || []
})

// Calculate total inventory value from all items
const totalInventoryValue = computed(() => {
  const folderItems = items.value
  if (folderItems.length === 0) return 0
  
  // Find the price field name from template
  const priceField = folder.value?.template?.fields?.find(f => 
    f.name.toLowerCase() === 'price' || 
    f.type === 'currency'
  )?.name || 'price'
  
  // Find a quantity field name from template (if exists - no default stock field)
  const quantityField = folder.value?.template?.fields?.find(f => 
    f.name.toLowerCase() === 'quantity' ||
    f.name.toLowerCase() === 'qty'
  )?.name
  
  let total = 0
  folderItems.forEach(item => {
    const price = typeof item[priceField] === 'number' 
      ? item[priceField] 
      : parseFloat(item[priceField]) || 0
    
    // For serial number items, quantity is always 1
    let quantity = 1
    // Only use quantity if it's a custom field and not serial numbers (serial numbers are individual items)
    if (!folder.value?.hasSerialNumbers && quantityField && item[quantityField] !== undefined) {
      quantity = typeof item[quantityField] === 'number' 
        ? item[quantityField] 
        : parseFloat(item[quantityField]) || 0
    }
    
    // Only count available items (not sold) in the total value
    if (!item.dateOut) {
      total += price * quantity
    }
  })
  
  return total
})

// Check if an item has been sold
const isItemSold = (item: InventoryItem) => {
  // Check if item has dateOut (was sold via receipt)
  if (item.dateOut) {
    const dateOutValue = item.dateOut
    const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
    return hasDateOut
  }
  return false
}

// Determine item availability status
const getItemAvailability = (item: InventoryItem) => {
  // Check if item is in a refunded receipt (highest priority - returned takes precedence)
  const refundedReceipts = receiptsStore.receipts.filter(r => 
    r.status === 'refunded' && r.itemIds?.includes(item.id)
  )
  
  if (refundedReceipts.length > 0) {
    return { status: 'returned', label: 'Returned', class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' }
  }
  
  // Check if item has dateOut (was sold via receipt)
  if (isItemSold(item)) {
      return { status: 'sold', label: 'Sold', class: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' }
  }
  
  // Item is available (not sold, not returned)
  return { status: 'available', label: 'Available', class: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' }
}

const filteredItems = computed(() => {
  let result = [...items.value]

  // Filter by search query - search across all template fields
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => {
      // Search in all item values
      return Object.values(item).some(value => {
        const strValue = value?.toString().toLowerCase() || ''
        return strValue.includes(query)
      })
    })
  }


  return result
})

const sortedFilteredItems = computed(() => {
  const result = [...filteredItems.value]
  
  result.sort((a, b) => {
    // Handle availability column sorting
    if (currentSort.value.key === 'availability') {
      const aAvail = getItemAvailability(a).status
      const bAvail = getItemAvailability(b).status
      const order = ['available', 'sold', 'returned']
      const aIndex = order.indexOf(aAvail)
      const bIndex = order.indexOf(bAvail)
      
      return currentSort.value.order === 'asc'
        ? aIndex - bIndex
        : bIndex - aIndex
    }
    
    let aValue = a[currentSort.value.key]
    let bValue = b[currentSort.value.key]
    
    // Handle undefined/null values
    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return currentSort.value.order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    // Try to convert to numbers for comparison
    const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue) || 0
    const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue) || 0
    
    return currentSort.value.order === 'asc'
      ? aNum - bNum
      : bNum - aNum
  })
  
  return result
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedFilteredItems.value.slice(start, end)
})

const toggleSort = (key: string) => {
  if (currentSort.value.key === key) {
    currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.key = key
    currentSort.value.order = 'asc'
  }
}


// formatCurrency is now imported from usePreferences for currency conversion

const formatNumber = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return value?.toString() || '-'
  return new Intl.NumberFormat('en-US').format(num)
}

const formatItemDate = (date: string | Date | any) => {
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
    
    // Handle string representation of Timestamp objects like "Timestamp(seconds=1764553673, nanoseconds=602000000)"
    if (typeof date === 'string' && date.includes('Timestamp') && date.includes('seconds=')) {
      try {
        const secondsMatch = date.match(/seconds=(\d+)/)
        const nanosecondsMatch = date.match(/nanoseconds=(\d+)/)
        if (secondsMatch && secondsMatch[1]) {
          const seconds = parseInt(secondsMatch[1], 10)
          const nanoseconds = (nanosecondsMatch && nanosecondsMatch[1]) ? parseInt(nanosecondsMatch[1], 10) : 0
          const timestamp = seconds * 1000 + (nanoseconds / 1000000)
          const dateObj = new Date(timestamp)
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          }
        }
      } catch (e) {
        // Fall through to next check
      }
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    
    // Handle string dates or ISO date strings
    if (typeof date === 'string') {
      // Skip if it looks like a Timestamp string that we couldn't parse
      if (date.includes('Timestamp')) {
        return '-'
      }
      const dateObj = new Date(date)
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }
    }
    
    return '-'
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    return '-'
  }
}

const getItemDisplayValue = (value: any) => {
  if (value === undefined || value === null || value === '') return '-'
  
  // Handle Firestore Timestamp objects (with toDate method)
  if (value && typeof value === 'object' && typeof value.toDate === 'function') {
    return formatItemDate(value)
  }
  
  // Handle Firestore Timestamp objects (with seconds property)
  if (value && typeof value === 'object' && 'seconds' in value) {
    return formatItemDate(value)
  }
  
  // Check if it's a Timestamp string representation that should be formatted
  if (typeof value === 'string' && (value.includes('Timestamp') || value.includes('seconds='))) {
    const formatted = formatItemDate(value)
    return formatted !== '-' ? formatted : value
  }
  
  return value
}

const formatDate = (date?: Date | string) => {
  if (!date) return 'Unknown'
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'Unknown'
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value = 'name'
  currentSort.value = { key: 'name', order: 'asc' }
  currentPage.value = 1
  // Clear pagination from localStorage when filters are reset
  if (import.meta.client) {
    try {
      const folderId = route.params.id as string
      if (folderId) {
        localStorage.setItem(`inventory-page-${folderId}`, '1')
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Save to localStorage with folder ID
  if (import.meta.client) {
    try {
      const folderId = route.params.id as string
      if (folderId) {
        localStorage.setItem(`inventory-page-${folderId}`, page.toString())
      }
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
      const folderId = route.params.id as string
      if (folderId) {
        localStorage.setItem(`inventory-page-${folderId}`, newPage.toString())
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

// Watch for folder ID changes and restore pagination
watch(() => route.params.id, (newFolderId) => {
  if (import.meta.client && newFolderId) {
    try {
      const saved = localStorage.getItem(`inventory-page-${newFolderId}`)
      if (saved) {
        currentPage.value = parseInt(saved, 10)
      } else {
        currentPage.value = 1
      }
    } catch (e) {
      currentPage.value = 1
    }
  }
}, { immediate: false })

const openAddItemModal = () => {
  editingItem.value = null
  serialNumbers.value = []
  // Initialize form with empty values for all template fields
  if (folder.value?.template?.fields) {
    Object.keys(itemForm).forEach(key => delete itemForm[key])
    folder.value.template.fields.forEach(field => {
      if (field.type === 'number' || field.type === 'currency') {
        itemForm[field.name] = 0
      } else if (field.type === 'boolean') {
        itemForm[field.name] = false
      } else if (field.type === 'date') {
        itemForm[field.name] = new Date().toISOString().split('T')[0]
      } else {
        itemForm[field.name] = ''
      }
    })
  }
  showAddItemModal.value = true
}

const handleEditItem = (item: InventoryItem) => {
  editingItem.value = item
  serialNumbers.value = []
  // Copy all item data to form, excluding system fields
  Object.keys(itemForm).forEach(key => delete itemForm[key])
  Object.keys(item).forEach(key => {
    // Exclude system/managed fields that shouldn't be edited
    const systemFields = ['id', 'folderId', 'createdAt', 'updatedAt', 'createdBy', 'dateOut', 'dateIn', 'swapIn', 'swapInReceiptId', 'discountPercentage', 'discountAmount', 'originalPrice', 'discountedPrice']
    if (!systemFields.includes(key)) {
      itemForm[key] = item[key]
    }
  })
  showAddItemModal.value = true
}

const handleDeleteItem = async (item: InventoryItem) => {
  const firstColumn = columns.value[0]
  const itemName = firstColumn ? (item[firstColumn.key] || 'this item') : 'this item'
  if (confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
    try {
      await inventoryStore.deleteItem(folderId.value, item.id)
      // Reload folder to update stats
      if (folder.value) {
        await inventoryStore.fetchFolder(folderId.value)
        folder.value = inventoryStore.getFolderById(folderId.value) || folder.value
      }
      // Refresh folder list to update item counts on the folders page
      await inventoryStore.fetchFolders()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item')
    }
  }
}

const addSerialNumber = () => {
  serialNumbers.value.push('')
}

const removeSerialNumber = (index: number) => {
  serialNumbers.value.splice(index, 1)
}

const handleSaveItem = async () => {
  // Validate required fields based on template
  if (folder.value?.template?.fields) {
    const requiredFields = folder.value.template.fields.filter(f => f.required && f.name !== 'serialNo')
    for (const field of requiredFields) {
      if (!itemForm[field.name] || itemForm[field.name].toString().trim() === '') {
        toast.warning(`Please fill in the required field: ${field.label || field.name}`)
        return
      }
    }
  }

  try {
    if (editingItem.value) {
      // Update existing item
      await inventoryStore.updateItem(folderId.value, editingItem.value.id, itemForm)
      // Reload folder to update stats
      if (folder.value) {
        await inventoryStore.fetchFolder(folderId.value)
        folder.value = inventoryStore.getFolderById(folderId.value) || folder.value
      }
    } else {
      // Check if we're in bulk add mode (hasSerialNumbers and serialNumbers array has items)
      if (folder.value?.hasSerialNumbers && serialNumbers.value.length > 0) {
        // Validate serial numbers
        const validSerialNumbers = serialNumbers.value.filter(sn => sn && sn.trim() !== '')
        if (validSerialNumbers.length === 0) {
          toast.warning('Please add at least one serial number')
          return
        }

        // Check for duplicate serial numbers
        const uniqueSerials = new Set(validSerialNumbers)
        if (uniqueSerials.size !== validSerialNumbers.length) {
          toast.error('Duplicate serial numbers are not allowed. Please ensure each serial number is unique.')
          return
        }

        // Create multiple items with different serial numbers
        const baseItemData = { ...itemForm }
        // Remove serialNo from base data if it exists (we'll add it per item)
        delete baseItemData.serialNo

        let createdCount = 0
        for (const serialNo of validSerialNumbers) {
          const itemData = {
            ...baseItemData,
            serialNo: serialNo.trim(),
          }
          await inventoryStore.createItem(folderId.value, itemData)
          createdCount++
        }

        // Reload folder to update stats
        if (folder.value) {
          await inventoryStore.fetchFolder(folderId.value)
          folder.value = inventoryStore.getFolderById(folderId.value) || folder.value
        }
        // Refresh folder list to update item counts on the folders page
        await inventoryStore.fetchFolders()

        toast.success(`Successfully created ${createdCount} item${createdCount !== 1 ? 's' : ''}`)
      } else {
        // Create single item (normal mode)
        await inventoryStore.createItem(folderId.value, itemForm)
        // Reload folder to update stats
        if (folder.value) {
          await inventoryStore.fetchFolder(folderId.value)
          folder.value = inventoryStore.getFolderById(folderId.value) || folder.value
        }
        // Refresh folder list to update item counts on the folders page
        await inventoryStore.fetchFolders()
      }
    }
    handleCancelItem()
  } catch (error: any) {
    toast.error(error.message || 'Failed to save item')
  }
}

const handleCancelItem = () => {
  showAddItemModal.value = false
  editingItem.value = null
  serialNumbers.value = []
  Object.keys(itemForm).forEach(key => delete itemForm[key])
}

// Discount handlers
const handleApplyDiscount = (item: InventoryItem) => {
  // Prevent applying discount to sold items
  if (isItemSold(item)) {
    toast.error('Cannot apply discount to sold items')
    return
  }
  selectedItemForDiscount.value = item
  showDiscountModal.value = true
}

const handleRemoveDiscount = async (item: InventoryItem) => {
  // Prevent removing discount from sold items
  if (isItemSold(item)) {
    toast.error('Cannot modify discount on sold items')
    return
  }
  if (confirm(`Remove discount from this item?`)) {
    try {
      await inventoryStore.removeDiscount(folderId.value, item.id)
      // Reload items to refresh the display
      await inventoryStore.fetchItems(folderId.value)
      toast.success('Discount removed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove discount')
    }
  }
}

const handleDiscountApplied = async () => {
  // Reload items to refresh the display
  await inventoryStore.fetchItems(folderId.value)
  showDiscountModal.value = false
  selectedItemForDiscount.value = null
}

const handleBulkDiscountApplied = async () => {
  // Reload items to refresh the display
  await inventoryStore.fetchItems(folderId.value)
  showBulkDiscountModal.value = false
  selectedItemsForBulk.value = []
}

const toggleItemSelection = (item: InventoryItem, checked?: boolean) => {
  // Prevent selecting sold items
  if (isItemSold(item)) {
    // Remove if already selected
    const index = selectedItemsForBulk.value.findIndex(i => i.id === item.id)
    if (index > -1) {
      selectedItemsForBulk.value.splice(index, 1)
    }
    return
  }

  // If called from checkbox component, use the checked value; otherwise toggle
  if (checked !== undefined) {
    if (checked) {
      if (!selectedItemsForBulk.value.find(i => i.id === item.id)) {
        selectedItemsForBulk.value.push(item)
      }
    } else {
      const index = selectedItemsForBulk.value.findIndex(i => i.id === item.id)
      if (index > -1) {
        selectedItemsForBulk.value.splice(index, 1)
      }
    }
  } else {
    const index = selectedItemsForBulk.value.findIndex(i => i.id === item.id)
    if (index > -1) {
      selectedItemsForBulk.value.splice(index, 1)
    } else {
      selectedItemsForBulk.value.push(item)
    }
  }
}

const toggleSelectAll = (checked?: boolean) => {
  // Filter out sold items when selecting all
  const availableItems = filteredItems.value.filter(item => !isItemSold(item))
  
  // If called from checkbox component, use the checked value; otherwise toggle
  if (checked !== undefined) {
    selectedItemsForBulk.value = checked ? [...availableItems] : []
  } else {
    if (selectedItemsForBulk.value.length === availableItems.length) {
      selectedItemsForBulk.value = []
    } else {
      selectedItemsForBulk.value = [...availableItems]
    }
  }
}

const openBulkDiscountModal = () => {
  if (selectedItemsForBulk.value.length === 0) {
    toast.warning('Please select at least one item to apply bulk discount')
    return
  }
  showBulkDiscountModal.value = true
}

// Export inventory items to Excel
const handleExportToExcel = async () => {
  if (!folder.value || !folder.value.template) {
    toast.error('Folder template not found. Cannot export items.')
    return
  }

  isExporting.value = true
  try {
    const folderItems = items.value
    if (folderItems.length === 0) {
      toast.warning('No items to export.')
      isExporting.value = false
      return
    }

    // Get template fields to determine columns
    const templateFields = folder.value.template.fields || []
    
    // Create worksheet data
    const worksheetData: any[] = []
    
    // Add header row with field labels
    const headers: string[] = templateFields.map(field => field.label || field.name)
    worksheetData.push(headers)

    // Add data rows
    folderItems.forEach((item) => {
      const row: any[] = []
      templateFields.forEach((field) => {
        let value = item[field.name]
        
        // Format values based on type
        if (value === null || value === undefined) {
          value = ''
        } else if (field.type === 'date' && value) {
          // Format date
          const date = value instanceof Date ? value : new Date(value)
          value = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
        } else if (field.type === 'boolean') {
          value = value ? 'Yes' : 'No'
        } else if (field.type === 'currency' || field.type === 'number') {
          value = typeof value === 'number' ? value : parseFloat(value) || 0
        }
        
        row.push(value)
      })
      worksheetData.push(row)
    })

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const colWidths = templateFields.map((field) => ({
      wch: Math.max(field.label?.length || field.name.length || 10, 15)
    }))
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Items')

    // Generate filename
    const folderName = folder.value.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = `${folderName}_inventory_${new Date().toISOString().split('T')[0]}.xlsx`

    // Write and download file
    XLSX.writeFile(wb, filename)
    
    toast.success(`Successfully exported ${folderItems.length} item(s) to ${filename}`)
  } catch (error: any) {
    console.error('Export error:', error)
    toast.error(`Failed to export items: ${error.message || 'Unknown error'}`)
  } finally {
    isExporting.value = false
  }
}

// Import inventory items from Excel
const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) {
    return
  }

  if (!folder.value || !folder.value.template) {
    toast.error('Folder template not found. Cannot import items.')
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
    return
  }

  isImporting.value = true
  
  try {
    // Read the file
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    
    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      toast.error('Excel file does not contain any worksheets.')
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
      isImporting.value = false
      return
    }
    const worksheet = workbook.Sheets[firstSheetName]
    if (!worksheet) {
      toast.error('Could not read worksheet from Excel file.')
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
      isImporting.value = false
      return
    }
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (jsonData.length < 2) {
      toast.error('Excel file must contain at least a header row and one data row.')
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
      isImporting.value = false
      return
    }

    // Get template fields
    const templateFields = folder.value.template.fields || []
    
    // Parse header row
    const headers = jsonData[0] as string[]
    
    // Map headers to field names (match by label or name)
    const headerToFieldMap = new Map<string, string>()
    headers.forEach((header, index) => {
      const field = templateFields.find(
        f => f.label?.toLowerCase() === header?.toString().toLowerCase() || 
        f.name.toLowerCase() === header?.toString().toLowerCase()
      )
      if (field) {
        headerToFieldMap.set(header.toString(), field.name)
      }
    })

    // Validate required fields
    const requiredFields = templateFields.filter(f => f.required)
    const missingRequiredFields = requiredFields.filter(
      field => !headerToFieldMap.has(field.label || field.name)
    )
    
    if (missingRequiredFields.length > 0) {
      toast.error(`Missing required columns: ${missingRequiredFields.map(f => f.label || f.name).join(', ')}`)
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
      isImporting.value = false
      return
    }

    // Process data rows
    const itemsToImport: Array<{ data: any; rowNumber: number }> = []
    const errors: string[] = []

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
        continue // Skip empty rows
      }

      const itemData: any = {}
      let hasError = false

      templateFields.forEach((field) => {
        // Find column index for this field
        const headerIndex = headers.findIndex(
          h => field.label?.toLowerCase() === h?.toString().toLowerCase() ||
          field.name.toLowerCase() === h?.toString().toLowerCase()
        )

        if (headerIndex === -1) {
          if (field.required) {
            errors.push(`Row ${i + 1}: Missing required field "${field.label || field.name}"`)
            hasError = true
          }
          return
        }

        let value = row[headerIndex]

        // Handle empty values
        if (value === null || value === undefined || value === '') {
          if (field.required) {
            errors.push(`Row ${i + 1}: Required field "${field.label || field.name}" is empty`)
            hasError = true
          } else {
            // Set default value based on type
            if (field.type === 'number' || field.type === 'currency') {
              itemData[field.name] = 0
            } else if (field.type === 'boolean') {
              itemData[field.name] = false
            }
          }
          return
        }

        // Parse value based on field type
        try {
          switch (field.type) {
            case 'number':
            case 'currency':
              value = typeof value === 'number' ? value : parseFloat(value)
              if (isNaN(value)) {
                errors.push(`Row ${i + 1}: Invalid number for "${field.label || field.name}"`)
                hasError = true
                return
              }
              break
            case 'date':
              if (typeof value === 'number') {
                // Excel date serial number
                const excelEpoch = new Date(1900, 0, 1)
                value = new Date(excelEpoch.getTime() + (value - 2) * 86400000)
              } else {
                value = new Date(value)
              }
              if (isNaN(value.getTime())) {
                errors.push(`Row ${i + 1}: Invalid date for "${field.label || field.name}"`)
                hasError = true
                return
              }
              value = value.toISOString().split('T')[0] // Store as YYYY-MM-DD
              break
            case 'boolean':
              value = value === true || value === 'Yes' || value === 'yes' || value === 'TRUE' || value === 'true' || value === '1'
              break
            case 'select':
              if (field.options && !field.options.includes(value)) {
                errors.push(`Row ${i + 1}: Invalid option "${value}" for "${field.label || field.name}". Must be one of: ${field.options.join(', ')}`)
                hasError = true
                return
              }
              break
            default:
              value = value.toString()
          }
          
          itemData[field.name] = value
        } catch (error: any) {
          errors.push(`Row ${i + 1}: Error parsing "${field.label || field.name}": ${error.message}`)
          hasError = true
        }
      })

      if (!hasError) {
        itemsToImport.push({ data: itemData, rowNumber: i + 1 })
      }
    }

    // Check for duplicate serial numbers - always check if items have serial numbers
    let skippedDuplicates = 0
    const duplicateSerialNumbers: string[] = []
    
    if (itemsToImport.length > 0) {
      // Find serialNo field name from template - check multiple possible field names
      const serialNoField = templateFields.find(
        f => f.name.toLowerCase() === 'serialno' || 
        f.name.toLowerCase() === 'serialnumber' ||
        f.name.toLowerCase() === 'serial_no' ||
        f.name.toLowerCase() === 'serial_number' ||
        f.label?.toLowerCase() === 'serial number' ||
        f.label?.toLowerCase() === 'serial no' ||
        f.label?.toLowerCase() === 'serial'
      )
      
      // Also check if any items in the import have serial number data (even if field not in template)
      const hasSerialNumberData = itemsToImport.some(itemEntry => {
        const itemData = itemEntry.data
        return itemData['serialNo'] || 
               itemData['serialNumber'] ||
               itemData['serialno'] ||
               itemData['serialnumber'] ||
               itemData['serial_no'] ||
               itemData['serial_number']
      })
      
      // Check for duplicates if we have serial number field or data
      if (serialNoField || hasSerialNumberData) {
        // STEP 1: Fetch items ONLY from the current folder
        const currentFolderId = folderId.value
        console.log('[Import] ========== DUPLICATE CHECK START ==========')
        console.log('[Import] Current folder ID:', currentFolderId)
        
        // Force fetch items for this folder (this ensures we get fresh data)
        let existingItems = await inventoryStore.fetchItems(currentFolderId)
        
        // STEP 2: Filter to ONLY items from this folder (extra safety check)
        existingItems = existingItems.filter(item => {
          const matches = item.folderId === currentFolderId
          if (!matches) {
            console.warn('[Import] WARNING: Item from wrong folder detected and filtered out:', {
              itemId: item.id,
              itemFolderId: item.folderId,
              expectedFolderId: currentFolderId
            })
          }
          return matches
        })
        
        console.log('[Import] Existing items in THIS folder only:', existingItems.length)
        
        // STEP 3: Extract serial numbers from items in THIS folder only
        const existingSerialNumbers = new Set<string>()
        existingItems.forEach(item => {
          // Double-check folder ID
          if (item.folderId !== currentFolderId) {
            console.error('[Import] ERROR: Item has wrong folderId!', item.id, item.folderId, 'expected:', currentFolderId)
            return
          }
          
          // Extract serial number from existing item - try multiple possible field names
          let serialNo: any = null
          if (serialNoField) {
            serialNo = item[serialNoField.name]
          }
          if (!serialNo) {
            serialNo = item['serialNo'] || 
                      item['serialNumber'] ||
                      item['serialno'] ||
                      item['serialnumber'] ||
                      item['serial_no'] ||
                      item['serial_number']
          }
          if (serialNo) {
            const serialNoNormalized = serialNo.toString().trim().toLowerCase()
            existingSerialNumbers.add(serialNoNormalized)
            console.log(`[Import] Found existing serial in folder ${currentFolderId}: "${serialNo.toString().trim()}"`)
          }
        })
        
        console.log('[Import] Total unique serial numbers already in folder:', existingSerialNumbers.size)
        console.log('[Import] Existing serial numbers:', Array.from(existingSerialNumbers))
        
        const totalItemsFromExcel = itemsToImport.length
        console.log('[Import] Items from Excel to check:', totalItemsFromExcel)
        
        // Filter out items with duplicate serial numbers
        const itemsToImportFiltered: Array<{ data: any; rowNumber: number }> = []
        const importBatchSerialNumbers = new Map<string, number>() // Track serial numbers and their first occurrence row
        
        itemsToImport.forEach((itemEntry) => {
          const itemData = itemEntry.data
          const rowNumber = itemEntry.rowNumber
          
          // Extract serial number - try multiple possible field names
          const serialNo = (serialNoField ? itemData[serialNoField.name] : null) ||
                          itemData['serialNo'] || 
                          itemData['serialNumber'] ||
                          itemData['serialno'] ||
                          itemData['serialnumber'] ||
                          itemData['serial_no'] ||
                          itemData['serial_number']
          
          // If no serial number found, skip duplicate check for this item (but still import it)
          if (!serialNo || serialNo.toString().trim() === '') {
            // Only add to errors if serial number was required (folder has serial numbers enabled)
            if (folder.value?.hasSerialNumbers) {
              errors.push(`Row ${rowNumber}: Serial number is required but missing`)
              console.log(`[Import] Row ${rowNumber}: Missing serial number - will skip as validation error`)
              return // Skip this item due to validation error
            }
            // If serial numbers are not required, add item without checking duplicates
            itemsToImportFiltered.push(itemEntry)
            console.log(`[Import] Row ${rowNumber}: No serial number - adding without duplicate check`)
            return
          }
          
          const serialNoTrimmed = serialNo.toString().trim()
          const serialNoLower = serialNoTrimmed.toLowerCase()
          
          // FIRST: Check if this serial number already exists in the CURRENT FOLDER's inventory
          const existsInInventory = existingSerialNumbers.has(serialNoLower)
          
          if (existsInInventory) {
            // This serial number already exists in THIS folder - SKIP it
            duplicateSerialNumbers.push(serialNoTrimmed)
            skippedDuplicates++
            console.log(`[Import] Row ${rowNumber}: SKIPPING - Serial "${serialNoTrimmed}" already exists in folder ${folderId.value}`)
            return // Skip this duplicate
          }
          
          // SECOND: Check if this serial number appears earlier in the import batch
          if (importBatchSerialNumbers.has(serialNoLower)) {
            // Duplicate within the same import file - SKIP it (keep first occurrence)
            duplicateSerialNumbers.push(serialNoTrimmed)
            skippedDuplicates++
            console.log(`[Import] Row ${rowNumber}: SKIPPING - Serial "${serialNoTrimmed}" is duplicated in import file (first seen at row ${importBatchSerialNumbers.get(serialNoLower)})`)
            return // Skip this duplicate
          }
          
          // Serial number is UNIQUE - ADD to import list
          itemsToImportFiltered.push(itemEntry)
          importBatchSerialNumbers.set(serialNoLower, rowNumber)
          console.log(`[Import] Row ${rowNumber}: ✓ ADDING - Serial "${serialNoTrimmed}" is unique and will be imported`)
        })
        
        console.log('[Import] ========== DUPLICATE CHECK SUMMARY ==========')
        console.log('[Import] Folder:', currentFolderId)
        console.log('[Import] Total items from Excel:', totalItemsFromExcel)
        console.log('[Import] Items skipped (duplicates in folder):', skippedDuplicates)
        console.log('[Import] Items that will be IMPORTED (unique):', itemsToImportFiltered.length)
        console.log('[Import] Items with validation errors:', errors.length)
        console.log('[Import] ===========================================')
        
        // Replace itemsToImport with filtered list (only unique items that will be imported)
        itemsToImport.length = 0
        itemsToImport.push(...itemsToImportFiltered)
        
        if (itemsToImportFiltered.length === 0 && totalItemsFromExcel > 0) {
          console.error('[Import] ⚠️ WARNING: All items were filtered out!')
          console.error('[Import] Original items from Excel:', totalItemsFromExcel)
          console.error('[Import] Items that passed filter:', itemsToImportFiltered.length)
          console.error('[Import] Skipped duplicates:', skippedDuplicates)
          console.error('[Import] Validation errors:', errors.length)
        }
      } else {
        // No serial number field or data found - import all items without duplicate check
        console.log('[Import] No serial number field or data detected - importing all items without duplicate check')
      }
    }

    // If no items to import after filtering duplicates and errors, show message and exit
    // Only show this if ALL items were duplicates or had errors
    if (itemsToImport.length === 0) {
      const reasons: string[] = []
      
      if (skippedDuplicates > 0) {
        reasons.push(`${skippedDuplicates} duplicate(s)`)
      }
      if (errors.length > 0) {
        reasons.push(`${errors.length} error(s)`)
      }
      
      if (reasons.length > 0) {
        toast.warning(`No new items to import. All items were skipped: ${reasons.join(', ')}.`, 5000)
      } else {
        toast.warning('No new items to import. Please check your Excel file and try again.', 5000)
      }
      
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
      isImporting.value = false
      return
    }

    // Show validation errors if any (before confirmation) - duplicates are handled separately
    if (errors.length > 0) {
      const errorCount = errors.length
      const errorPreview = errors.slice(0, 3).join('; ')
      const moreErrors = errorCount > 3 ? ` (and ${errorCount - 3} more)` : ''
      toast.warning(`Found ${errorCount} validation error(s) that will be skipped${moreErrors}. The import will continue with valid items.`, 6000)
    }

    // Show import summary in toast
    let summaryMessage = `Importing ${itemsToImport.length} new item(s)...`
    
    const summaryParts: string[] = []
    if (skippedDuplicates > 0) {
      summaryParts.push(`${skippedDuplicates} duplicate(s) skipped`)
    }
    if (errors.length > 0) {
      summaryParts.push(`${errors.length} error(s) skipped`)
    }
    
    if (summaryParts.length > 0) {
      summaryMessage += ` (${summaryParts.join(', ')})`
    }
    
    toast.info(summaryMessage, 4000)
    
    console.log('[Import] Items to import:', itemsToImport.length)
    console.log('[Import] Skipped duplicates:', skippedDuplicates)
    console.log('[Import] Validation errors:', errors.length)

    // Import items
    let successCount = 0
    let failCount = 0

    for (const itemEntry of itemsToImport) {
      try {
        await inventoryStore.createItem(folderId.value, itemEntry.data)
        successCount++
      } catch (error: any) {
        console.error('Error importing item:', error)
        errors.push(`Row ${itemEntry.rowNumber}: Failed to create item - ${error.message || 'Unknown error'}`)
        failCount++
      }
    }

    // Reload folder and items
    if (folder.value) {
      await inventoryStore.fetchFolder(folderId.value)
      folder.value = inventoryStore.getFolderById(folderId.value) || folder.value
    }
    await loadItems()
    await inventoryStore.fetchFolders()

    // Show result
    const resultParts: string[] = []
    
    if (successCount > 0) {
      resultParts.push(`Successfully imported: ${successCount} item(s)`)
    }
    
    if (failCount > 0) {
      resultParts.push(`Failed: ${failCount} item(s)`)
    }
    
    if (skippedDuplicates > 0) {
      resultParts.push(`Skipped duplicates: ${skippedDuplicates} item(s)`)
    }
    
    if (errors.length > 0) {
      resultParts.push(`Skipped errors: ${errors.length} row(s)`)
    }
    
    if (successCount > 0) {
      toast.success(resultParts.join('. '), 5000)
    } else if (failCount > 0 || skippedDuplicates > 0 || errors.length > 0) {
      toast.warning(resultParts.join('. '), 5000)
    } else {
      toast.info('Import completed.', 3000)
    }
  } catch (error: any) {
    console.error('Import error:', error)
    toast.error(`Failed to import items: ${error.message || 'Unknown error'}`)
  } finally {
    isImporting.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// Load folder from Firestore
onMounted(async () => {
  // Wait for auth to be ready
  if (authStore.loading) {
    const checkAuth = setInterval(() => {
      if (!authStore.loading) {
        clearInterval(checkAuth)
        if (authStore.currentUser) {
          loadFolderData()
        } else {
          // User not authenticated, redirect to signin
          navigateTo('/signin')
        }
      }
    }, 100)
    setTimeout(() => {
      clearInterval(checkAuth)
      if (!authStore.loading && authStore.currentUser) {
        loadFolderData()
      } else if (!authStore.loading && !authStore.currentUser) {
        navigateTo('/signin')
      }
    }, 5000)
  } else {
    if (authStore.currentUser) {
      await loadFolderData()
    } else {
      navigateTo('/signin')
    }
  }

  // Items will be loaded by loadFolderData
})

// Watch for auth state changes
watch(() => authStore.currentUser, async (user) => {
  if (user && isLoadingFolder.value && !folder.value) {
    await loadFolderData()
  }
}, { immediate: false })

// Watch for route parameter changes
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId && typeof newId === 'string') {
    // Clear previous data
    folder.value = null
    isLoadingFolder.value = true
    // Load new folder
    if (authStore.currentUser) {
      await loadFolderData()
    }
  }
}, { immediate: false })

const loadFolderData = async () => {
  if (!folderId.value || typeof folderId.value !== 'string') {
    console.error('Invalid folder ID:', folderId.value)
    navigateTo('/dashboard/inventory')
    return
  }

  isLoadingFolder.value = true
  try {
    const fetchedFolder = await inventoryStore.fetchFolder(folderId.value)
    if (fetchedFolder) {
      folder.value = fetchedFolder
      useHead({
        title: `${folder.value?.name || 'Folder'} - Inventory - Storv`,
      })
      // Load items for this folder
      await loadItems()
    } else {
      // Folder not found, redirect back
      navigateTo('/dashboard/inventory')
    }
  } catch (error: any) {
    console.error('Error loading folder:', error)
    alert(error.message || 'Failed to load folder')
    navigateTo('/dashboard/inventory')
  } finally {
    isLoadingFolder.value = false
  }
}

const loadItems = async () => {
  if (!folderId.value || typeof folderId.value !== 'string') {
    return
  }

  isLoadingItems.value = true
  try {
    // Fetch items and receipts in parallel
    await Promise.all([
      inventoryStore.fetchItems(folderId.value),
      receiptsStore.fetchReceipts()
    ])
    // Refresh folder list to update item counts
    await inventoryStore.fetchFolders()
    // Update local folder reference
    if (folder.value) {
      const updatedFolder = inventoryStore.getFolderById(folderId.value)
      if (updatedFolder) {
        folder.value = updatedFolder
      }
    }
  } catch (error: any) {
    console.error('Error loading items:', error)
    toast.error(error.message || 'Failed to load items')
  } finally {
    isLoadingItems.value = false
  }
}
</script>
