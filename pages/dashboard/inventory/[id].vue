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
            <div
              :class="[
                'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                getFolderColorClass(folder?.color || 'blue')
              ]"
            >
              <FolderIcon class="w-7 h-7 text-white" />
            </div>
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
      </div>
    </div>

    <!-- Enhanced Stats Cards -->
    <div v-if="!isLoadingFolder" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              ${{ formatCurrency(folder?.totalValue || 0) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Inventory value</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CurrencyDollarIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ folder?.lowStockCount || 0 }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Need restocking</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ExclamationTriangleIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">In Stock</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ (folder?.itemCount || 0) - (folder?.lowStockCount || 0) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">Items available</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CheckCircleIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
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

    <!-- Enhanced Filters Section -->
    <Card v-else padding="md">
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
          v-model="stockFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <select
          v-model="sortBy"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="name">Sort by Name</option>
          <option value="stock">Sort by Stock</option>
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
      <div class="overflow-x-auto mb-6">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300',
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
              <th v-if="canManage" class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
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
                class="px-6 py-4 whitespace-nowrap"
              >
                <div v-if="colIndex === 0" class="flex items-center gap-3">
                  <!-- First column shows avatar and value -->
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {{ getItemDisplayValue(item[column.key])?.toString().charAt(0).toUpperCase() || '?' }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ getItemDisplayValue(item[column.key]) }}
                    </div>
                    <div v-if="columns.length > 1 && columns[1]" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ getItemDisplayValue(item[columns[1].key]) }}
                    </div>
                  </div>
                </div>
                <div v-else>
                  <div v-if="'type' in column && column.type === 'currency'" class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    ${{ formatCurrency(item[column.key] || 0) }}
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
                  <div v-else-if="'type' in column && column.type === 'boolean'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="item[column.key] ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'">
                    {{ item[column.key] ? 'Yes' : 'No' }}
                  </div>
                  <div v-else class="text-sm text-gray-600 dark:text-gray-300">
                    {{ getItemDisplayValue(item[column.key]) }}
                  </div>
                </div>
              </td>
              <td v-if="canManage" class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="handleEditItem(item)"
                    class="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <PencilIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="handleDeleteItem(item)"
                    class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <TrashIcon class="w-5 h-5" />
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
                    {{ searchQuery || stockFilter !== 'all' ? 'No items found' : 'No items in this folder' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {{ searchQuery || stockFilter !== 'all' ? 'Try adjusting your filters' : 'Add items to get started' }}
                  </p>
                  <Button
                    v-if="!searchQuery && stockFilter === 'all'"
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

    <!-- Floating Action Button -->
    <button
      v-if="sortedFilteredItems.length > 0"
      @click="openAddItemModal"
      class="fixed bottom-24 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Add new item"
    >
      <PlusIcon class="w-6 h-6" />
    </button>

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
                <label v-else-if="field.type === 'boolean'" class="flex items-center gap-3 cursor-pointer">
                  <input
                    v-model="itemForm[field.name]"
                    type="checkbox"
                    class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ field.label || field.name }}</span>
                </label>
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
              <label v-else-if="field.type === 'boolean'" class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="itemForm[field.name]"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ field.label || field.name }}</span>
              </label>
            </div>
          </div>
          <div v-if="!folder?.template?.fields || folder.template.fields.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            No template fields defined for this folder. Please edit the folder to add fields.
          </div>
        </div>
      </form>

      <template #footer>
        <Button variant="outline" @click="handleCancelItem">Cancel</Button>
        <Button variant="primary" type="submit" @click="handleSaveItem">
          {{ editingItem ? 'Update' : (folder?.hasSerialNumbers && !editingItem ? `Add ${serialNumbers.length || 0} Item${serialNumbers.length !== 1 ? 's' : ''}` : 'Add') }} Item{{ folder?.hasSerialNumbers && !editingItem && serialNumbers.length !== 1 ? 's' : '' }}
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import {
  ArrowLeftIcon,
  FolderIcon,
  PlusIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BarsArrowUpIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Modal from '~/components/ui/Modal.vue'
import Pagination from '~/components/ui/Pagination.vue'
import { useInventoryStore, type InventoryFolder } from '~/stores/inventory'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const folderId = computed(() => route.params.id as string)

// Import InventoryItem from store
import type { InventoryItem } from '~/stores/inventory'

const inventoryStore = useInventoryStore()
const authStore = useAuthStore()
const { canManage } = usePermissions()

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
const stockFilter = ref('all')
const sortBy = ref('name')
const showAddItemModal = ref(false)
const editingItem = ref<InventoryItem | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)

const currentSort = ref<{ key: string; order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' })

const itemForm = reactive<Record<string, any>>({})
const serialNumbers = ref<string[]>([])

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
      { key: 'stock', label: 'Stock', sortable: true },
      { key: 'price', label: 'Price', sortable: true }
    )
  }
  
  // Always add Date In and Date Out columns at the end
  templateColumns.push(
    { key: 'dateIn', label: 'Date In', sortable: true, type: 'date' },
    { key: 'dateOut', label: 'Date Out', sortable: true, type: 'date' }
  )
  
  return templateColumns
})

const items = computed(() => {
  return inventoryStore.items[folderId.value] || []
})

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

  // Filter by stock status (if folder has a stock/quantity field)
  if (stockFilter.value !== 'all' && folder.value?.template) {
    // Find a field that might represent stock/quantity
    const stockField = folder.value.template.fields.find(f => 
      f.name.toLowerCase().includes('stock') || 
      f.name.toLowerCase().includes('quantity') ||
      f.name.toLowerCase().includes('qty')
    )
    
    if (stockField) {
      result = result.filter(item => {
        const stockValue = item[stockField.name] || 0
        const stockNum = typeof stockValue === 'number' ? stockValue : parseFloat(stockValue) || 0
        if (stockFilter.value === 'in-stock') return stockNum >= 20
        if (stockFilter.value === 'low-stock') return stockNum < 20 && stockNum > 0
        if (stockFilter.value === 'out-of-stock') return stockNum === 0
        return true
      })
    }
  }

  return result
})

const sortedFilteredItems = computed(() => {
  const result = [...filteredItems.value]
  
  result.sort((a, b) => {
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

const getFolderColorClass = (color?: string) => {
  if (!color) return 'bg-gradient-to-br from-gray-500 to-gray-600'
  
  // If color is a hex value, use it directly
  if (color.startsWith('#')) {
    return `bg-[${color}]`
  }
  
  const colorMap: Record<string, string> = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
    red: 'bg-gradient-to-br from-red-500 to-red-600',
    pink: 'bg-gradient-to-br from-pink-500 to-pink-600',
    indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
  }
  return colorMap[color] || 'bg-gradient-to-br from-gray-500 to-gray-600'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

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
  stockFilter.value = 'all'
  sortBy.value = 'name'
  currentSort.value = { key: 'name', order: 'asc' }
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

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
  // Copy all item data to form
  Object.keys(itemForm).forEach(key => delete itemForm[key])
  Object.keys(item).forEach(key => {
    if (!['id', 'folderId', 'createdAt', 'updatedAt', 'createdBy'].includes(key)) {
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
      alert(error.message || 'Failed to delete item')
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
        alert(`Please fill in the required field: ${field.label || field.name}`)
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
          alert('Please add at least one serial number')
          return
        }

        // Check for duplicate serial numbers
        const uniqueSerials = new Set(validSerialNumbers)
        if (uniqueSerials.size !== validSerialNumbers.length) {
          alert('Duplicate serial numbers are not allowed. Please ensure each serial number is unique.')
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

        alert(`Successfully created ${createdCount} item${createdCount !== 1 ? 's' : ''}`)
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
    alert(error.message || 'Failed to save item')
  }
}

const handleCancelItem = () => {
  showAddItemModal.value = false
  editingItem.value = null
  serialNumbers.value = []
  Object.keys(itemForm).forEach(key => delete itemForm[key])
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
    await inventoryStore.fetchItems(folderId.value)
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
    alert(error.message || 'Failed to load items')
  } finally {
    isLoadingItems.value = false
  }
}
</script>
