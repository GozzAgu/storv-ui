<template>
  <div class="pb-24 sm:pb-20 overflow-x-hidden">
    <!-- Breadcrumbs -->
    <Breadcrumbs :items="inventoryBreadcrumbs" class="mb-4" />

    <!-- Hero header: back + title + description + meta -->
    <div class="mb-4 sm:mb-6">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div class="flex items-start gap-2.5 min-w-0 flex-1">
          <button
            @click="navigateTo('/dashboard/inventory')"
            class="mt-0.5 p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            title="Back to folders"
          >
            <ArrowLeftIcon class="w-4 h-4" stroke-width="1.75" />
          </button>
          <div class="min-w-0 flex-1">
            <h1 v-if="isLoadingFolder" class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Loading...
            </h1>
            <h1 v-else class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate">
              {{ folder?.name || 'Folder' }}
            </h1>
            <p v-if="!isLoadingFolder" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {{ folder?.description || 'No description' }}
            </p>
            <div class="flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1.5">
                <CalendarIcon class="w-4 h-4" />
                Created {{ formatDate(folder?.createdAt) }}
              </span>
              <span class="flex items-center gap-1.5">
                <CubeIcon class="w-4 h-4" />
                {{ folder?.itemCount || 0 }} items
              </span>
            </div>
          </div>
        </div>
        <div v-if="!isLoadingFolder && canManageInventoryItems && selectedItemsForBulk.length > 0" class="flex items-center shrink-0">
          <Button
            variant="primary"
            @click="openBulkDiscountModal"
            :icon="TagIcon"
            class="rounded-full"
          >
            Bulk discount ({{ selectedItemsForBulk.length }})
          </Button>
        </div>
      </div>
    </div>

    <!-- Stats cards - modern, no borders -->
    <div v-if="!isLoadingFolder" class="grid grid-cols-2 gap-2 mb-4 lg:hidden">
      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 p-3 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Items</p>
          <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">
            {{ folder?.itemCount || 0 }}
          </p>
        </div>
        <div class="w-8 h-8 rounded-lg bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <CubeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" stroke-width="1.75" />
        </div>
      </div>
      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 p-3 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Value</p>
          <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100 truncate">
            {{ formatCurrency(totalInventoryValue) }}
          </p>
        </div>
        <div class="w-8 h-8 rounded-lg bg-green-100/80 dark:bg-green-900/30 flex items-center justify-center shrink-0">
          <CurrencyDollarIcon class="w-4 h-4 text-green-600 dark:text-green-400" stroke-width="1.75" />
        </div>
      </div>
    </div>

    <!-- Loading State - Skeleton -->
    <template v-if="isLoadingFolder">
      <div class="grid grid-cols-2 gap-4 mb-6 lg:hidden">
        <div v-for="i in 2" :key="i" class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-4 sm:p-5 flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 mb-2 animate-pulse"></div>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0"></div>
        </div>
      </div>
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-6 mb-6">
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-3/4 mb-4 animate-pulse"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 mt-3 animate-pulse"></div>
      </div>
      <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden min-h-[320px]">
        <div class="p-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <div class="flex gap-3">
            <div class="h-10 flex-1 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div class="h-10 w-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
        </div>
        <div class="p-4 space-y-3">
          <div v-for="i in 6" :key="i" class="flex gap-4">
            <div class="h-4 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div class="h-4 w-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div class="h-4 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Toolbar: search + filters (mobile) -->
    <div v-else class="lg:hidden flex flex-col sm:flex-row gap-3 mb-6">
      <div class="relative flex-1 min-w-0">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, SKU..."
          class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white dark:focus:bg-gray-800 transition-colors"
        />
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="sortBy"
          @change="handleSortByChange"
          class="flex-1 sm:flex-none px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[120px]"
        >
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="sku">SKU</option>
          <option value="dateIn">Date In</option>
          <option value="availability">Status</option>
        </select>
        <Button variant="outline" @click="resetFilters" :icon="ArrowPathIcon" class="shrink-0 rounded-full" />
        <button
          @click="isFullscreen = !isFullscreen"
          class="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        >
          <ArrowsPointingOutIcon v-if="!isFullscreen" class="w-5 h-5" />
          <XMarkIcon v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Enhanced Items Table -->
    <div
      v-if="!isLoadingFolder"
      :class="[
        'transition-all duration-300',
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto'
          : 'relative'
      ]"
    >
      <!-- Fullscreen Header -->
      <div v-if="isFullscreen" class="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/80 px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ folder?.name || 'Inventory Items' }}</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ filteredItems.length }} items · {{ formatCurrency(totalInventoryValue) }} total value
            </p>
          </div>
          <button
            @click="isFullscreen = false"
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Exit fullscreen"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="flex items-center gap-1.5 mt-3">
          <div class="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <select
            v-model="sortBy"
            @change="handleSortByChange"
            class="px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[100px]"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="sku">SKU</option>
            <option value="dateIn">Date In</option>
            <option value="availability">Status</option>
          </select>
          <button
            @click="resetFilters"
            class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Reset filters"
          >
            <ArrowPathIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        :class="[
          isFullscreen ? 'shadow-none' : 'rounded-xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden',
          !isFullscreen && 'border border-gray-200/50 dark:border-gray-700/50'
        ]"
      >
        <!-- Desktop toolbar (stats + filters) -->
        <div v-if="!isFullscreen" class="hidden lg:flex items-center justify-between gap-3 px-3 sm:px-5 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5">
              <CubeIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" stroke-width="1.75" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Items:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ folder?.itemCount || 0 }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <CurrencyDollarIcon class="w-4 h-4 text-green-600 dark:text-green-400" stroke-width="1.75" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Value:</span>
              <span class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ formatCurrency(totalInventoryValue) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border-0 ring-1 ring-gray-200/80 dark:ring-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-40"
              />
            </div>
            <select
              v-model="sortBy"
              @change="handleSortByChange"
              class="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border-0 ring-1 ring-gray-200/80 dark:ring-gray-700/80 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 min-w-[100px]"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="sku">SKU</option>
              <option value="dateIn">Date In</option>
              <option value="availability">Status</option>
            </select>
            <button
              @click="resetFilters"
              class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon class="w-4 h-4" />
            </button>
            <button
              @click="isFullscreen = !isFullscreen"
              class="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors"
              :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
            >
              <ArrowsPointingOutIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      <div :class="['overflow-x-auto', isFullscreen ? 'p-6' : '']">
        <table class="min-w-full">
          <thead :class="[isFullscreen ? 'border-b border-gray-200 dark:border-gray-700' : 'bg-white/60 dark:bg-gray-800/60']">
              <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'px-3 sm:px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500',
                  column.sortable && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100'
                ]"
                @click="column.sortable && toggleSort(column.key)"
              >
                <div class="flex items-center gap-1.5">
                  {{ column.label }}
                  <template v-if="column.sortable">
                    <ChevronUpIcon
                      v-if="currentSort.key === column.key && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-600 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === column.key && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-600 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th v-if="canManageInventoryItems" class="px-3 sm:px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
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
              <th v-if="canManageInventoryItems" class="px-3 sm:px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
                Action
              </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200/80 dark:divide-gray-700/80 bg-white dark:bg-gray-800/40">
              <tr
                v-for="(item, index) in paginatedItems"
                :key="item.id"
                class="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
              >
              <td
                v-for="(column, colIndex) in columns"
                :key="column.key"
                class="px-3 sm:px-4 py-2 align-top"
              >
                <!-- Inline edit mode (large screens only) -->
                <div
                  v-if="isLargeScreen && canManageInventoryItems && !isItemSold(item) && isColumnEditable(column) && isEditingCell(item, column.key)"
                  class="min-w-[80px]"
                >
                  <input
                    ref="inlineEditInputRef"
                    v-model="inlineEditValue"
                    type="text"
                    :inputmode="(column.type === 'currency' || column.type === 'number' || column.key.toLowerCase().includes('price')) ? 'decimal' : 'text'"
                    class="w-full min-w-0 px-2 py-1 text-[10px] border border-primary-500 dark:border-primary-400 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    @blur="saveInlineEdit"
                    @keydown.enter="saveInlineEdit"
                    @keydown.esc="cancelInlineEdit"
                    @click.stop
                  />
                </div>
                <!-- Display mode -->
                <div
                  v-else
                  :class="[
                    'flex items-center gap-1.5 min-h-[22px]',
                    isLargeScreen && canManageInventoryItems && !isItemSold(item) && isColumnEditable(column) && 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-1 -mx-1 transition-colors'
                  ]"
                  @click="startInlineEdit(item, column)"
                >
                  <template v-if="colIndex === 0">
                    <span class="text-[10px] font-medium text-gray-900 dark:text-gray-100">
                      {{ getItemDisplayValue(item[column.key]) }}
                    </span>
                  </template>
                  <template v-else>
                    <!-- Check if column is a price field (by key or type) -->
                    <div v-if="('type' in column && column.type === 'currency') || column.key.toLowerCase() === 'price' || column.key.toLowerCase().includes('price')" class="text-[10px]">
                      <div v-if="item.discountedPrice !== undefined" class="flex flex-col">
                        <span class="font-semibold text-green-600 dark:text-green-400">
                          {{ formatCurrency(item.discountedPrice) }}
                        </span>
                        <span class="text-[9px] text-gray-400 dark:text-gray-500 line-through">
                          {{ formatCurrency(item.originalPrice || item[column.key] || 0) }}
                        </span>
                        <span class="text-[9px] text-red-600 dark:text-red-400 font-medium">
                          {{ item.discountPercentage ? `-${item.discountPercentage}%` : `-${formatCurrency(item.discountAmount || 0)}` }}
                        </span>
                      </div>
                      <span v-else class="font-semibold text-gray-900 dark:text-gray-100">
                        {{ formatCurrency(item[column.key] || 0) }}
                      </span>
                    </div>
                    <div v-else-if="'type' in column && column.type === 'number'" class="text-[10px] text-gray-600 dark:text-gray-300">
                      {{ formatNumber(item[column.key]) }}
                    </div>
                    <div v-else-if="'type' in column && column.type === 'date'" class="text-[10px] text-gray-600 dark:text-gray-300">
                      <span v-if="item[column.key]">
                        {{ formatItemDate(item[column.key]) }}
                      </span>
                      <span v-else class="text-gray-400 dark:text-gray-500 italic">
                        -
                      </span>
                    </div>
                    <div v-else-if="column.key === 'dateIn' || column.key === 'dateOut'" class="text-[10px] text-gray-600 dark:text-gray-300">
                      <span v-if="item[column.key]">
                        {{ formatItemDate(item[column.key]) }}
                      </span>
                      <span v-else class="text-gray-400 dark:text-gray-500">
                        -
                      </span>
                    </div>
                    <div v-else-if="column.key === 'availability'" class="text-[10px]">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium"
                        :class="getItemAvailability(item).class">
                        {{ getItemAvailability(item).label }}
                      </span>
                    </div>
                    <div v-else-if="'type' in column && column.type === 'boolean'" class="inline-flex items-center px-2 py-0.5 text-[9px] font-medium"
                      :class="item[column.key] ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'">
                      {{ item[column.key] ? 'Yes' : 'No' }}
                    </div>
                    <div v-else class="text-[10px] text-gray-600 dark:text-gray-300">
                      <span 
                        v-if="getItemDisplayValue(item[column.key]) && typeof getItemDisplayValue(item[column.key]) === 'string' && getItemDisplayValue(item[column.key]).length > 30"
                        class="block truncate max-w-xs"
                        :title="getItemDisplayValue(item[column.key])"
                      >
                        {{ getItemDisplayValue(item[column.key]) }}
                      </span>
                      <span v-else>
                        {{ getItemDisplayValue(item[column.key]) }}
                      </span>
                    </div>
                  </template>
                </div>
              </td>
              <td v-if="canManageInventoryItems" class="px-3 sm:px-4 py-2 text-center">
                <Checkbox
                  :model-value="selectedItemsForBulk.some(i => i.id === item.id)"
                  @update:model-value="(checked) => toggleItemSelection(item, checked)"
                  :disabled="isItemSold(item)"
                  size="sm"
                  wrapper-class="justify-center"
                  :title="isItemSold(item) ? 'Cannot select sold items for bulk operations' : ''"
                />
              </td>
              <td v-if="canManageInventoryItems" class="px-3 sm:px-4 py-2">
                <!-- Desktop: Show all action buttons -->
                <div class="hidden sm:flex items-center justify-end gap-1.5 flex-shrink-0" @click.stop>
                  <button
                    @click="handleViewTimeline(item)"
                    class="p-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex-shrink-0"
                    title="View item history"
                  >
                    <ClockIcon class="w-3.5 h-3.5 flex-shrink-0" />
                  </button>
                  <button
                    @click="handleEditItem(item)"
                    :disabled="isItemSold(item)"
                    :class="[
                      'p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0',
                      isItemSold(item) && 'cursor-not-allowed opacity-40'
                    ]"
                    :title="isItemSold(item) ? 'Cannot edit sold item' : 'Edit item'"
                  >
                    <PencilSquareIcon class="w-3.5 h-3.5 flex-shrink-0" />
                  </button>
                  <button
                    @click="handleDeleteItem(item)"
                    :disabled="isItemSold(item)"
                    :class="[
                      'p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0',
                      isItemSold(item) && 'cursor-not-allowed opacity-40'
                    ]"
                    :title="isItemSold(item) ? 'Cannot delete sold item' : 'Delete item'"
                  >
                    <TrashIcon class="w-3.5 h-3.5 flex-shrink-0" />
                  </button>
                </div>
                <!-- Mobile: Show 3-dot menu -->
                <div class="sm:hidden relative" @click.stop>
                  <button
                    @click="toggleItemMenu(item.id)"
                    :disabled="isItemSold(item)"
                    :class="[
                      'p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0',
                      isItemSold(item) && 'cursor-not-allowed opacity-40'
                    ]"
                    title="Actions"
                  >
                    <EllipsisVerticalIcon class="w-4 h-4 flex-shrink-0" />
                  </button>
                  <!-- Dropdown Menu -->
                  <div
                    v-if="openItemMenuId === item.id"
                    class="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 min-w-[44px]"
                  >
                    <button
                      @click="handleViewTimeline(item); openItemMenuId = null"
                      class="w-full px-3 py-2.5 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="View item history"
                    >
                      <ClockIcon class="w-5 h-5" />
                    </button>
                    <button
                      @click="handleEditItem(item); openItemMenuId = null"
                      :disabled="isItemSold(item)"
                      class="w-full px-3 py-2.5 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      :title="isItemSold(item) ? 'Cannot edit sold item' : 'Edit item'"
                    >
                      <PencilSquareIcon class="w-5 h-5" />
                    </button>
                    <button
                      @click="handleDeleteItem(item); openItemMenuId = null"
                      :disabled="isItemSold(item)"
                      class="w-full px-3 py-2.5 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      :title="isItemSold(item) ? 'Cannot delete sold item' : 'Delete item'"
                    >
                      <TrashIcon class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="sortedFilteredItems.length === 0">
              <td :colspan="columns.length + (canManageInventoryItems ? 2 : 0)" class="px-6 py-16">
                <div class="text-center">
                  <div class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <CubeIcon class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                    {{ searchQuery ? 'No items found' : 'No items in this folder' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    {{ searchQuery ? 'Try adjusting your search or filters' : 'Add items to start tracking inventory' }}
                  </p>
                  <Button
                    v-if="!searchQuery && canManageInventoryItems"
                    variant="primary"
                    :icon="PlusIcon"
                    @click="openAddItemModal"
                    class="rounded-full"
                  >
                    Add your first item
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>

    <!-- Bottom bar: Load More / Pagination -->
    <div
      v-if="sortedFilteredItems.length > 0 && !isFullscreen"
      class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)] z-30 transition-[left] duration-300 safe-area-inset-bottom rounded-t-2xl"
      :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
    >
      <div class="px-4 sm:px-6 py-4">
        <div v-if="showLoadMore" class="flex justify-center">
          <Button variant="outline" size="sm" @click="loadMoreItems" extra-class="!rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            Load more ({{ displayedItemsCount }} of {{ sortedFilteredItems.length }})
          </Button>
        </div>
        <Pagination
          v-else-if="usePagination"
          :current-page="currentPage"
          :items-per-page="50"
          :total="sortedFilteredItems.length"
          @page-change="handlePageChange"
        />
        <div v-else class="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Showing all {{ sortedFilteredItems.length }} items
        </div>
      </div>
    </div>

    <!-- Fullscreen mode: bottom bar -->
    <div v-if="isFullscreen && sortedFilteredItems.length > 0" class="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200/80 dark:border-gray-700/80 px-6 py-4 z-10 rounded-t-2xl">
      <div v-if="showLoadMore" class="flex justify-center">
        <Button variant="outline" size="sm" @click="loadMoreItems" extra-class="!rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          Load more ({{ displayedItemsCount }} of {{ sortedFilteredItems.length }})
        </Button>
      </div>
      <Pagination
        v-else-if="usePagination"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="sortedFilteredItems.length"
        @page-change="handlePageChange"
      />
      <div v-else class="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Showing all {{ sortedFilteredItems.length }} items
      </div>
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

    <!-- Floating Action Buttons - Mobile Optimized -->
    <div v-if="!isLoadingFolder && canManageInventoryItems" class="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 flex flex-col gap-2.5 sm:gap-2 z-40">
    <button
        @click="() => fileInputRef?.click()"
        :disabled="isImporting"
        :class="[
          'w-12 h-12 sm:w-11 sm:h-11 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation',
          (isImporting || isExporting) ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        title="Import from Excel"
      >
        <ArrowDownTrayIcon v-if="!isImporting" class="w-5 h-5 sm:w-5 sm:h-5" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </button>
      <button
        @click="handleExportToExcel"
        :disabled="isExporting || items.length === 0"
        :class="[
          'w-12 h-12 sm:w-11 sm:h-11 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation',
          (isExporting || isImporting || items.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        title="Export to Excel"
      >
        <ArrowUpTrayIcon v-if="!isExporting" class="w-5 h-5 sm:w-5 sm:h-5" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </button>
      <button
        @click="openAddItemModal"
        class="w-14 h-14 sm:w-11 sm:h-11 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
        title="Add new item"
      >
        <PlusIcon class="w-6 h-6 sm:w-5 sm:h-5 text-white" />
      </button>
    </div>

    <!-- Enhanced Add/Edit Item Modal -->
    <Modal
      v-model="showAddItemModal"
      :title="editingItem ? 'Edit Item' : (folder?.hasSerialNumbers && !editingItem ? 'Add Items with Serial Numbers' : 'Add New Item')"
      size="lg"
    >
      <form @submit.prevent="handleSaveItem" class="space-y-3 sm:space-y-4">
        <!-- Bulk Add Mode for Serial Numbers -->
        <div v-if="folder?.hasSerialNumbers && !editingItem" class="space-y-3">
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p class="text-xs text-blue-800 dark:text-blue-200">
              <strong>Bulk Add Mode:</strong> Enter the item details once, then add multiple serial numbers below. Each serial number will create a separate item with the same details.
            </p>
          </div>

          <!-- Common Fields (all items share these) -->
          <div class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Item Details (Shared)</h4>
            
            <!-- Brand and Model Fields (default when serial numbers enabled) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Brand *
                </label>
                <input
                  v-model="itemForm.brand"
                  type="text"
                  required
                  class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Model *
                </label>
                <input
                  v-model="itemForm.model"
                  type="text"
                  required
                  class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  placeholder="Enter model name"
                />
              </div>
            </div>
            
            <div
              v-for="field in folder?.template?.fields?.filter(f => f.name !== 'serialNo' && f.name !== 'brand' && f.name !== 'model') || []"
              :key="field.id"
              :class="['grid gap-3', field.type === 'boolean' || field.type === 'date' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2']"
            >
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {{ field.label || field.name }} {{ field.required ? '*' : '' }}
                </label>
                <!-- Text Input -->
                <input
                  v-if="field.type === 'text'"
                  v-model="itemForm[field.name]"
                  type="text"
                  :required="field.required"
                  class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                />
                <!-- Number Input -->
                <input
                  v-else-if="field.type === 'number'"
                  v-model.number="itemForm[field.name]"
                  type="number"
                  :required="field.required"
                  class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                />
                <!-- Currency Input -->
                <div v-else-if="field.type === 'currency'" class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">$</span>
                  <input
                    v-model.number="itemForm[field.name]"
                    type="number"
                    step="0.01"
                    min="0"
                    :required="field.required"
                    class="w-full pl-7 pr-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    :placeholder="field.placeholder || '0.00'"
                  />
                </div>
                <!-- Date Input -->
                <input
                  v-else-if="field.type === 'date'"
                  v-model="itemForm[field.name]"
                  type="date"
                  :required="field.required"
                  class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
                <!-- Select Input -->
                <select
                  v-else-if="field.type === 'select' && field.options"
                  v-model="itemForm[field.name]"
                  :required="field.required"
                  class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
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
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300">Serial Numbers</h4>
              <Button
                variant="outline"
                size="sm"
                :icon="PlusIcon"
                @click="addSerialNumber"
              >
                Add Serial Number
              </Button>
            </div>
            <div v-if="serialNumbers.length === 0" class="text-center py-3 text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
              No serial numbers added. Click "Add Serial Number" to start.
            </div>
            <div v-else class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="(serial, index) in serialNumbers"
                :key="index"
                class="flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <input
                  v-model="serialNumbers[index]"
                  type="text"
                  :placeholder="`Serial Number ${index + 1}`"
                  class="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500"
                />
                <button
                  type="button"
                  @click="removeSerialNumber(index)"
                  class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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
          <div v-if="folder?.template?.fields && folder.template.fields.length > 0" class="space-y-3">
            <div v-for="field in folder.template.fields" :key="field.id" :class="['grid gap-3', field.type === 'boolean' || field.type === 'date' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2']">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {{ field.label || field.name }} {{ field.required ? '*' : '' }}
                </label>
                <input
                  v-if="field.type === 'text'"
                  v-model="itemForm[field.name]"
                  type="text"
                  :required="field.required"
                  class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                />
                <!-- Additional input types here -->
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
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

    <!-- Delete Item Modal -->
    <DeleteItemModal
      v-model="showDeleteItemModal"
      :item="selectedItemForDelete"
      :item-name="selectedItemForDelete ? getItemDisplayName(selectedItemForDelete) : ''"
      @deleted="handleConfirmDeleteItem"
    />

    <!-- Item Timeline Modal -->
    <ItemTimelineModal
      v-model="showTimelineModal"
      :item="selectedItemForTimeline"
      :folder-name="folder?.name"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ArrowLeftIcon,
  PlusIcon,
  CubeIcon,
  FolderIcon,
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
  ArrowsPointingOutIcon,
  EllipsisVerticalIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import Breadcrumbs from '~/components/ui/Breadcrumbs.vue'
import Modal from '~/components/ui/Modal.vue'
import Pagination from '~/components/ui/Pagination.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useInventoryStore, type InventoryFolder } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useAuthStore } from '~/stores/auth'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useToast } from '~/composables/useToast'
import { usePreferences } from '~/composables/usePreferences'
import { useCopy } from '~/composables/useCopy'
import * as XLSX from 'xlsx'
import DiscountModal from '~/components/inventory/DiscountModal.vue'
import BulkDiscountModal from '~/components/inventory/BulkDiscountModal.vue'
import DeleteItemModal from '~/components/inventory/DeleteItemModal.vue'
import ItemTimelineModal from '~/components/inventory/ItemTimelineModal.vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const folderId = computed(() => route.params.id as string)

const inventoryBreadcrumbs = computed(() => [
  { label: 'Inventory', href: '/dashboard/inventory', icon: CubeIcon },
  { label: folder.value?.name || 'Folder', icon: FolderIcon },
])

// Import InventoryItem from store
import type { InventoryItem } from '~/stores/inventory'

const inventoryStore = useInventoryStore()
const receiptsStore = useReceiptsStore()
const authStore = useAuthStore()
const storesStore = useStoresStore()
const { canManage, canManageInventoryItems } = usePermissions()
const toast = useToast()
const { formatCurrency } = usePreferences()
const { copyToClipboard } = useCopy()

const copyItemId = (itemId: string) => {
  copyToClipboard(itemId, 'Item ID')
}

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
// Hybrid pagination: Load More (20 → 50) then switch to pagination
const displayedItemsCount = ref(20)
const usePagination = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const isExporting = ref(false)

const currentSort = ref<{ key: string; order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' })
const isFullscreen = ref(false)
const openItemMenuId = ref<string | null>(null)

const toggleItemMenu = (itemId: string) => {
  openItemMenuId.value = openItemMenuId.value === itemId ? null : itemId
}

// Sync sortBy dropdown with currentSort
watch(() => currentSort.value.key, (newKey) => {
  if (sortBy.value !== newKey) {
    sortBy.value = newKey
  }
}, { immediate: true })

// Handle ESC key to exit fullscreen and close menus
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isFullscreen.value) {
      isFullscreen.value = false
    }
    openItemMenuId.value = null
  }
}

// Watch fullscreen state to lock/unlock body scroll
watch(isFullscreen, (fullscreen) => {
  if (import.meta.client) {
    if (fullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

const itemForm = reactive<Record<string, any>>({})
const serialNumbers = ref<string[]>([])

// Discount modal state
const showDiscountModal = ref(false)
const showBulkDiscountModal = ref(false)
const selectedItemForDiscount = ref<InventoryItem | null>(null)
const selectedItemsForBulk = ref<InventoryItem[]>([])
const showDeleteItemModal = ref(false)
const selectedItemForDelete = ref<InventoryItem | null>(null)
const showTimelineModal = ref(false)
const selectedItemForTimeline = ref<InventoryItem | null>(null)

// Inline edit state (large screens only)
const editingCell = ref<{ itemId: string; columnKey: string } | null>(null)
const inlineEditValue = ref('')
const isSavingInline = ref(false)
const isLargeScreen = ref(false)

onMounted(() => {
  if (import.meta.client) {
    const mq = window.matchMedia('(min-width: 1024px)')
    isLargeScreen.value = mq.matches
    mq.addEventListener('change', (e) => { isLargeScreen.value = e.matches })
  }
})

// Close inline edit when clicking outside the cell
const handleClickOutsideInlineEdit = (e: MouseEvent) => {
  if (!editingCell.value) return
  const target = e.target as Node
  const input = inlineEditInputRef.value
  if (input && !input.contains(target)) {
    saveInlineEdit()
  }
}

watch(editingCell, (val) => {
  if (import.meta.client) {
    if (val) {
      document.addEventListener('mousedown', handleClickOutsideInlineEdit)
    } else {
      document.removeEventListener('mousedown', handleClickOutsideInlineEdit)
    }
  }
}, { immediate: true })

const isColumnEditable = (column: { key: string; type?: string }) => {
  return !['availability', 'dateIn', 'dateOut'].includes(column.key)
}

const isEditingCell = (item: InventoryItem, columnKey: string) => {
  return editingCell.value?.itemId === item.id && editingCell.value?.columnKey === columnKey
}

const inlineEditInputRef = ref<HTMLInputElement | null>(null)

const startInlineEdit = async (item: InventoryItem, column: { key: string; type?: string }) => {
  if (!canManageInventoryItems.value || isItemSold(item) || !isColumnEditable(column)) return
  if (!isLargeScreen.value) return
  let val = item[column.key]
  // For price columns with discount, show the effective (discounted) price
  if ((column.type === 'currency' || column.key.toLowerCase().includes('price')) && item.discountedPrice !== undefined) {
    val = item.discountedPrice
  }
  inlineEditValue.value = val !== undefined && val !== null ? String(val) : ''
  editingCell.value = { itemId: item.id, columnKey: column.key }
  await nextTick()
  inlineEditInputRef.value?.focus()
}

const cancelInlineEdit = () => {
  editingCell.value = null
  inlineEditValue.value = ''
}

const saveInlineEdit = async () => {
  if (!editingCell.value || isSavingInline.value) return
  const { itemId, columnKey } = editingCell.value
  const item = items.value.find((i) => i.id === itemId)
  if (!item || isItemSold(item)) {
    cancelInlineEdit()
    return
  }
  const column = columns.value.find((c) => c.key === columnKey)
  if (!column || !isColumnEditable(column)) {
    cancelInlineEdit()
    return
  }
  const rawValue = inlineEditValue.value.trim()
  let parsedValue: string | number | boolean = rawValue
  const colType = column.type || (column as any).type
  if (colType === 'number' || columnKey.toLowerCase().includes('quantity') || columnKey.toLowerCase() === 'sku') {
    const num = parseFloat(rawValue)
    parsedValue = isNaN(num) ? rawValue : num
  } else if (colType === 'currency' || columnKey.toLowerCase().includes('price')) {
    const num = parseFloat(rawValue.replace(/[^0-9.-]/g, ''))
    parsedValue = isNaN(num) ? 0 : num
  } else if (colType === 'boolean') {
    parsedValue = ['true', '1', 'yes'].includes(rawValue.toLowerCase())
  }
  const previousValue = item[columnKey]
  const previousDiscounted = item.discountedPrice
  const isPriceField = colType === 'currency' || columnKey.toLowerCase().includes('price')
  const hasChanged = isPriceField && item.discountedPrice !== undefined
    ? parsedValue !== previousDiscounted && String(parsedValue) !== String(previousDiscounted)
    : parsedValue !== previousValue && String(parsedValue) !== String(previousValue)
  if (!hasChanged) {
    cancelInlineEdit()
    return
  }
  isSavingInline.value = true
  try {
    const updates: Record<string, any> = { [columnKey]: parsedValue }
    // When editing price and item had discount, sync discountedPrice to new value
    if (isPriceField && item.discountedPrice !== undefined) {
      updates.discountedPrice = parsedValue
    }
    await inventoryStore.updateItem(folderId.value, itemId, updates)
    toast.success('Updated')
  } catch (err: any) {
    toast.error(err.message || 'Failed to update')
  } finally {
    isSavingInline.value = false
    cancelInlineEdit()
  }
}

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
      // Ensure price fields always have currency type
      type: field.type === 'currency' || field.name.toLowerCase() === 'price' ? 'currency' : field.type,
    })))
  } else {
    // Fallback to default columns if no template
    templateColumns.push(
      { key: 'name', label: 'Item', sortable: true },
      { key: 'sku', label: 'SKU', sortable: true },
      { key: 'price', label: 'Price', sortable: true, type: 'currency' }
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
    return { status: 'returned', label: 'Returned', class: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' }
  }
  
  // Check if item has dateOut (was sold via receipt)
  if (isItemSold(item)) {
      return { status: 'sold', label: 'Sold', class: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' }
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
  if (usePagination.value) {
    // Traditional pagination mode (50 items per page)
    const start = (currentPage.value - 1) * 50
    const end = start + 50
    return sortedFilteredItems.value.slice(start, end)
  } else {
    // Load More mode: show up to displayedItemsCount
    return sortedFilteredItems.value.slice(0, displayedItemsCount.value)
  }
})

// Check if we should show Load More button
const showLoadMore = computed(() => {
  return !usePagination.value && displayedItemsCount.value < sortedFilteredItems.value.length && displayedItemsCount.value < 50
})

// Check if we can load more (not at 50 yet)
const canLoadMore = computed(() => {
  return displayedItemsCount.value < 50 && displayedItemsCount.value < sortedFilteredItems.value.length
})

// Load more items
const loadMoreItems = () => {
  if (canLoadMore.value) {
    displayedItemsCount.value = Math.min(displayedItemsCount.value + 10, 50)
    // If we've reached 50, switch to pagination mode
    if (displayedItemsCount.value >= 50) {
      usePagination.value = true
      currentPage.value = 1
      itemsPerPage.value = 50
    }
  }
}

// Reset to Load More mode when filters change
watch([searchQuery, currentSort], () => {
  displayedItemsCount.value = 20
  usePagination.value = false
  currentPage.value = 1
  itemsPerPage.value = 20
})

const toggleSort = (key: string) => {
  if (currentSort.value.key === key) {
    currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.key = key
    currentSort.value.order = 'asc'
  }
  // Sync sortBy dropdown with currentSort
  sortBy.value = key
}

const handleSortByChange = () => {
  // Update currentSort when dropdown changes
  if (currentSort.value.key === sortBy.value) {
    // Toggle order if same key
    currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new key with ascending order
    currentSort.value.key = sortBy.value
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
            const day = dateObj.getDate()
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' })
            const year = dateObj.getFullYear()
            return `${day} ${month} ${year}`
          }
        }
      } catch (e) {
        // Fall through to next check
      }
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '-'
      const day = date.getDate()
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      const year = date.getFullYear()
      return `${day} ${month} ${year}`
    }
    
    // Handle string dates or ISO date strings
    if (typeof date === 'string') {
      // Skip if it looks like a Timestamp string that we couldn't parse
      if (date.includes('Timestamp')) {
        return '-'
      }
      const dateObj = new Date(date)
      if (!isNaN(dateObj.getTime())) {
        const day = dateObj.getDate()
        const month = dateObj.toLocaleDateString('en-US', { month: 'short' })
        const year = dateObj.getFullYear()
        return `${day} ${month} ${year}`
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
  displayedItemsCount.value = 20
  usePagination.value = false
  itemsPerPage.value = 20
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
  // Reset form
  Object.keys(itemForm).forEach(key => delete itemForm[key])
  
  // If serial numbers are enabled, initialize brand and model fields by default
  if (folder.value?.hasSerialNumbers) {
    itemForm.brand = ''
    itemForm.model = ''
  }
  
  // Initialize form with empty values for all template fields
  if (folder.value?.template?.fields) {
    folder.value.template.fields.forEach(field => {
      // Skip brand and model if serial numbers enabled (they're already added above)
      if (folder.value?.hasSerialNumbers && (field.name === 'brand' || field.name === 'model')) {
        return
      }
      
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
  cancelInlineEdit()
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

const getItemDisplayName = (item: InventoryItem) => {
  const firstColumn = columns.value[0]
  if (firstColumn && item[firstColumn.key]) {
    return String(item[firstColumn.key])
  }
  if (item.name || item.itemName) {
    return item.name || item.itemName
  }
  if (item.brand && item.model) {
    return `${item.brand} ${item.model}`
  }
  return 'this item'
}

const handleDeleteItem = (item: InventoryItem) => {
  selectedItemForDelete.value = item
  showDeleteItemModal.value = true
}

const handleViewTimeline = async (item: InventoryItem) => {
  selectedItemForTimeline.value = item
  showTimelineModal.value = true
  // Fetch receipts if empty so timeline can show sold/returned info
  if (receiptsStore.receipts.length === 0) {
    await receiptsStore.fetchReceipts()
  }
}

const handleConfirmDeleteItem = (item: InventoryItem) => {
  showDeleteItemModal.value = false
  selectedItemForDelete.value = null

  const removed = inventoryStore.removeItemOptimistically(folderId.value, item.id)
  if (!removed) return

  toast.deletedWithUndo(
    'Item deleted',
    () => {
      inventoryStore.restoreItem(folderId.value, item)
    },
    async () => {
      try {
        await inventoryStore.deleteItem(folderId.value, item.id)
        if (folder.value) {
          await inventoryStore.fetchFolder(folderId.value)
          folder.value = inventoryStore.getFolderById(folderId.value) || folder.value
        }
        await inventoryStore.fetchFolders()
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete item')
      }
    },
    5000
  )
}

const addSerialNumber = () => {
  serialNumbers.value.push('')
}

const removeSerialNumber = (index: number) => {
  serialNumbers.value.splice(index, 1)
}

const handleSaveItem = async () => {
  // Validate brand and model when serial numbers are enabled
  if (folder.value?.hasSerialNumbers && !editingItem.value) {
    if (!itemForm.brand || itemForm.brand.toString().trim() === '') {
      toast.warning('Please enter a brand name')
      return
    }
    if (!itemForm.model || itemForm.model.toString().trim() === '') {
      toast.warning('Please enter a model name')
      return
    }
  }
  
  // Validate required fields based on template
  if (folder.value?.template?.fields) {
    const requiredFields = folder.value.template.fields.filter(f => f.required && f.name !== 'serialNo' && f.name !== 'brand' && f.name !== 'model')
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
      // Close modal immediately for better UX
      handleCancelItem()
      toast.success('Updating item...')
      
      // CRITICAL: Wait for item update to complete (ensures data is saved to Firestore)
      await inventoryStore.updateItem(folderId.value, editingItem.value.id, itemForm)
      
      // Refresh items list in background (non-blocking) - only for UI sync
      // Item is already updated in local state, so this is just to ensure consistency
      inventoryStore.fetchItems(folderId.value).catch((err) => {
        console.warn('Background items refresh failed (non-critical):', err)
        // Item is already updated in local state, so this is just a sync issue
      })
      
      toast.success('Item updated successfully!')
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

          // Close modal immediately for better UX
          handleCancelItem()

          // Create items in batch for much better performance
          const itemsToCreate = validSerialNumbers.map(serialNo => ({
            ...baseItemData,
            serialNo: serialNo.trim(),
          }))

          // CRITICAL: Wait for item creation to complete (ensures data is saved to Firestore)
          await inventoryStore.createItemsBatch(folderId.value, itemsToCreate)

          // Update folder stats locally (optimistic update)
          if (folder.value) {
            folder.value.itemCount = (folder.value.itemCount || 0) + validSerialNumbers.length
          }

          // Refresh items list in background (non-blocking) - only for UI sync
          // Item is already in local state, so this is just to ensure consistency
          inventoryStore.fetchItems(folderId.value).catch((err) => {
            console.warn('Background items refresh failed (non-critical):', err)
            // Item is already created and in local state, so this is just a sync issue
          })

          toast.success(`Successfully created ${validSerialNumbers.length} item${validSerialNumbers.length !== 1 ? 's' : ''}`)
        } else {
          // Create single item (normal mode)
          // Close modal immediately for better UX
          handleCancelItem()

          // CRITICAL: Wait for item creation to complete (ensures data is saved to Firestore)
          await inventoryStore.createItem(folderId.value, itemForm)

          // Update folder stats locally (optimistic update)
          if (folder.value) {
            folder.value.itemCount = (folder.value.itemCount || 0) + 1
          }

          // Refresh items list in background (non-blocking) - only for UI sync
          // Item is already in local state, so this is just to ensure consistency
          inventoryStore.fetchItems(folderId.value).catch((err) => {
            console.warn('Background items refresh failed (non-critical):', err)
            // Item is already created and in local state, so this is just a sync issue
          })

          toast.success('Item created successfully!')
        }
      }
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
  // Add keyboard listener for ESC key
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        openItemMenuId.value = null
      }
    })
  }

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

// Cleanup keyboard listener and restore body overflow
onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('mousedown', handleClickOutsideInlineEdit)
    document.body.style.overflow = ''
  }
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

// Watch for store changes and redirect to folders list
watch(() => storesStore.currentStoreId, async (newStoreId, oldStoreId) => {
  if (newStoreId && newStoreId !== oldStoreId && folderId.value && authStore.currentUser) {
    // Store changed - folders are store-specific, so redirect to folders list
    // This prevents showing "folder not found" errors when switching stores
    console.log('[InventoryItems] Store changed, redirecting to folders list...', { oldStoreId, newStoreId })
    navigateTo('/dashboard/inventory')
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
        title: `${folder.value?.name || 'Folder'} - Inventory - Storvv`,
      })
      // Load items for this folder
      await loadItems()
    } else {
      // Folder not found, show error and redirect back
      toast.error('Folder not found or you do not have access to this folder')
      navigateTo('/dashboard/inventory')
    }
  } catch (error: any) {
    console.error('Error loading folder:', error)
    toast.error(error.message || 'Failed to load folder')
    // Don't redirect immediately - let user see the error
    setTimeout(() => {
      navigateTo('/dashboard/inventory')
    }, 2000)
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
