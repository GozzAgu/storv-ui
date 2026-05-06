<template>
  <div
    class="w-full max-w-none space-y-5 overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:space-y-6 sm:pb-32"
  >
    <Breadcrumbs :items="inventoryBreadcrumbs" class="text-[11px] text-gray-500 dark:text-gray-400" />

    <!-- Loading: table shell -->
    <template v-if="isLoadingFolder">
      <div
        class="overflow-hidden rounded-sm bg-white dark:!bg-dashboard-card"
      >
        <div class="border-b border-gray-100/90 px-4 py-3 dark:border-gray-800/80 sm:px-5">
          <div class="flex flex-wrap gap-2">
            <div class="h-9 flex-1 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10 sm:max-w-xs"></div>
            <div class="h-9 w-24 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
          </div>
        </div>
        <div class="space-y-2.5 p-4 sm:p-5">
          <div v-for="i in 8" :key="i" class="flex gap-3">
            <div class="h-4 flex-1 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
            <div class="h-4 w-20 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
            <div class="h-4 w-16 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Mobile / tablet toolbar -->
    <div v-else class="flex flex-col gap-2.5 lg:hidden">
      <div
        class="flex items-start gap-2 rounded-sm border border-gray-200/80 bg-white px-3 py-2.5 dark:border-gray-700/80 dark:!bg-dashboard-card"
      >
        <button
          type="button"
          class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-gray-200/90 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          title="Back to folders"
          @click="navigateTo('/dashboard/inventory')"
        >
          <ArrowLeftIcon class="h-4 w-4" stroke-width="1.75" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h2 class="truncate text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              {{ folder?.name || 'Folder' }}
            </h2>
            <DuplicateFeatureUpsellBanner :loading="isLoadingFolder" />
          </div>
          <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span class="tabular-nums font-medium text-gray-700 dark:text-gray-300">{{ folder?.itemCount ?? 0 }} items</span>
            <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
            <span class="tabular-nums">{{ formatCurrency(totalInventoryValue) }} total value</span>
            <template v-if="isSearchActive && sortedFilteredItems.length !== baseItems.length">
              <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
              <span>{{ sortedFilteredItems.length }} shown</span>
            </template>
          </p>
        </div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div class="relative min-w-0 flex-1">
          <MagnifyingGlassIcon
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, SKU…"
            class="w-full rounded-sm border border-gray-200/90 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-500/40"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="canManageInventoryItems && selectedItemsForBulk.length > 0">
            <Button
              variant="outline"
              size="sm"
              :icon="TagIcon"
              class="shrink-0 !rounded-2xl !px-2.5 !py-2.5 !text-xs sm:!px-3"
              @click="openBulkDiscountModal"
            >
              <span class="hidden sm:inline">Discount</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              :icon="TrashIcon"
              class="shrink-0 !rounded-2xl !border-red-200/80 !px-2.5 !py-2.5 !text-xs dark:!border-red-800/40 sm:!px-3"
              @click="openBulkDeleteModal"
            >
              <span class="hidden sm:inline">Delete</span>
            </Button>
          </template>
          <Button
            v-if="canManageInventoryItems"
            variant="outline"
            size="sm"
            class="shrink-0 !rounded-2xl !px-2.5 !py-2.5 sm:!px-3"
            :icon="ArrowDownTrayIcon"
            :loading="isImporting"
            :disabled="isExporting"
            aria-label="Import from Excel"
            title="Import from Excel"
            @click="fileInputRef?.click()"
          />
          <Button
            v-if="canManageInventoryItems"
            variant="outline"
            size="sm"
            class="shrink-0 !rounded-2xl !px-2.5 !py-2.5 sm:!px-3"
            :icon="ArrowUpTrayIcon"
            :loading="isExporting"
            :disabled="isImporting || (folder?.itemCount ?? 0) === 0"
            aria-label="Export to Excel"
            title="Export to Excel"
            @click="handleExportToExcel"
          />
          <Button
            v-if="canManageInventoryItems"
            variant="primary"
            class="shrink-0 !rounded-2xl !px-2.5 !py-2.5 text-sm sm:!px-3"
            :icon="PlusIcon"
            aria-label="Add product"
            @click="openAddItemModal"
          >
            <span class="hidden sm:inline">Add</span>
          </Button>
          <select
            v-model="sortBy"
            class="min-w-[120px] flex-1 cursor-pointer rounded-sm border border-gray-200/90 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 sm:flex-none dark:focus:border-primary-500/40"
            @change="handleSortByChange"
          >
            <option value="name">Name</option>
            <option value="price">Unit price</option>
            <option value="sku">SKU</option>
            <option value="dateIn">Date In</option>
            <option value="availability">Status</option>
          </select>
          <Button variant="outline" class="shrink-0 !rounded-2xl" :icon="ArrowPathIcon" @click="resetFilters" />
        </div>
      </div>
    </div>

    <!-- Enhanced Items Table (teleport to body in expanded view; same pattern as receipts) -->
    <template v-if="!isLoadingFolder">
      <Teleport to="body" :disabled="!isFullscreen">
        <div
          data-dashboard-teleport
          :class="[ 'transition-colors duration-200 ease-out', isFullscreen ? 'fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden bg-white dark:!bg-dashboard-card' : 'relative', ]"
        >
          <!-- Fullscreen header -->
          <div
            v-if="isFullscreen"
            class="shrink-0 border-b border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-gray-800/80 dark:!bg-dashboard-card/95 sm:px-6 lg:px-8"
            style="padding-top: max(0.75rem, env(safe-area-inset-top, 0px))"
          >
            <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div class="flex min-w-0 items-start justify-between gap-3 lg:items-center">
                <div class="min-w-0">
                  <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                    Expanded view
                  </p>
                  <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h2 class="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-lg">
                      {{ folder?.name || 'Inventory Products' }}
                    </h2>
                    <span class="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                      {{ folder?.itemCount ?? 0 }} items · {{ formatCurrency(totalInventoryValue) }}
                      <template v-if="isSearchActive && sortedFilteredItems.length !== baseItems.length">
                        · {{ sortedFilteredItems.length }} shown
                      </template>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded-sm border border-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100 lg:hidden"
                  title="Exit expanded view"
                  aria-label="Exit expanded view"
                  @click="isFullscreen = false"
                >
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:max-w-none lg:justify-end">
                <div class="relative min-w-0 w-full sm:max-w-[min(100%,20rem)] lg:w-56 lg:max-w-[16rem] lg:flex-initial">
                  <MagnifyingGlassIcon
                    class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search…"
                    class="w-full rounded-sm border border-gray-200/90 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-500/40"
                  />
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <select
                    v-model="sortBy"
                    class="min-w-[7.5rem] cursor-pointer rounded-sm border border-gray-200/90 bg-white px-3 py-2 text-sm font-medium text-gray-800 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
                    @change="handleSortByChange"
                  >
                    <option value="name">Name</option>
                    <option value="price">Unit price</option>
                    <option value="sku">SKU</option>
                    <option value="dateIn">Date In</option>
                    <option value="availability">Status</option>
                  </select>
                  <button
                    type="button"
                    class="rounded-sm border border-gray-200/90 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-400 dark:hover:bg-gray-800"
                    title="Reset filters"
                    @click="resetFilters"
                  >
                    <ArrowPathIcon class="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    class="hidden rounded-sm border border-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100 lg:inline-flex"
                    title="Exit expanded view"
                    aria-label="Exit expanded view"
                    @click="isFullscreen = false"
                  >
                    <XMarkIcon class="h-5 w-5" />
                  </button>
                  <template v-if="canManageInventoryItems">
                    <template v-if="selectedItemsForBulk.length > 0">
                      <Button
                        variant="outline"
                        size="sm"
                        :icon="TagIcon"
                        extra-class="!rounded-2xl"
                        @click="openBulkDiscountModal"
                      >
                        Discount
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        :icon="TrashIcon"
                        extra-class="!rounded-2xl !border-red-200/80 dark:!border-red-800/40"
                        @click="openBulkDeleteModal"
                      >
                        Delete
                      </Button>
                    </template>
                    <Button
                      variant="outline"
                      size="sm"
                      :icon="ArrowDownTrayIcon"
                      :loading="isImporting"
                      :disabled="isExporting"
                      title="Import from Excel"
                      extra-class="!rounded-2xl"
                      aria-label="Import from Excel"
                      @click="fileInputRef?.click()"
                    >
                      Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      :icon="ArrowUpTrayIcon"
                      :loading="isExporting"
                      :disabled="isImporting || (folder?.itemCount ?? 0) === 0"
                      title="Export to Excel"
                      extra-class="!rounded-2xl"
                      aria-label="Export to Excel"
                      @click="handleExportToExcel"
                    >
                      Export
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      :icon="PlusIcon"
                      extra-class="!rounded-2xl"
                      aria-label="Add product"
                      @click="openAddItemModal"
                    >
                      Add product
                    </Button>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div
            :class="[ isFullscreen ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'data-table-shell', ]"
          >
        <!-- Desktop toolbar -->
        <DataTableToolbar v-if="!isFullscreen" class="hidden lg:block">
          <template #heading>
            <div class="flex min-w-0 flex-1 items-start gap-2">
              <button
                type="button"
                class="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-gray-200/90 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white lg:inline-flex"
                title="Back to folders"
                @click="navigateTo('/dashboard/inventory')"
              >
                <ArrowLeftIcon class="h-4 w-4" stroke-width="1.75" />
              </button>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <h2 class="truncate text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
                    {{ folder?.name || 'Folder' }}
                  </h2>
                  <DuplicateFeatureUpsellBanner :loading="isLoadingFolder" />
                </div>
                <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span class="tabular-nums font-medium text-gray-600 dark:text-gray-300">{{ folder?.itemCount ?? 0 }} items</span>
                  <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                  <span class="tabular-nums">{{ formatCurrency(totalInventoryValue) }} total value</span>
                      <template v-if="isSearchActive && sortedFilteredItems.length !== baseItems.length">
                    <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                    <span>{{ sortedFilteredItems.length }} shown</span>
                  </template>
                </p>
              </div>
            </div>
          </template>
          <template #filters>
            <div class="relative">
              <MagnifyingGlassIcon
                class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search…"
                class="w-40 rounded-sm border border-gray-200/90 bg-white py-1.5 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-100 sm:w-48 dark:focus:border-primary-500/40"
              />
            </div>
            <select
              v-model="sortBy"
              class="min-w-[100px] cursor-pointer rounded-sm border border-gray-200/90 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-gray-800 focus:border-primary-400/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700/80 dark:!bg-dashboard-card dark:text-gray-200 dark:focus:border-primary-500/40"
              @change="handleSortByChange"
            >
              <option value="name">Name</option>
              <option value="price">Unit price</option>
              <option value="sku">SKU</option>
              <option value="dateIn">Date In</option>
              <option value="availability">Status</option>
            </select>
            <button
              type="button"
              class="rounded-sm p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200"
              title="Reset filters"
              @click="resetFilters"
            >
              <ArrowPathIcon class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="hidden rounded-sm p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-200 lg:inline-flex"
              :title="isFullscreen ? 'Exit expanded view' : 'Expanded table'"
              @click="isFullscreen = !isFullscreen"
            >
              <ArrowsPointingOutIcon class="h-4 w-4" />
            </button>
          </template>
          <template #actions>
            <template v-if="canManageInventoryItems && selectedItemsForBulk.length > 0">
              <Button
                variant="outline"
                size="sm"
                :icon="TagIcon"
                extra-class="!rounded-2xl max-sm:!px-2 max-sm:!py-1.5"
                @click="openBulkDiscountModal"
              >
                <span class="hidden sm:inline">Discount</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                :icon="TrashIcon"
                extra-class="!rounded-2xl max-sm:!px-2 max-sm:!py-1.5 !border-red-200/80 dark:!border-red-800/40"
                @click="openBulkDeleteModal"
              >
                <span class="hidden sm:inline">Delete</span>
              </Button>
            </template>
            <Button
              v-if="canManageInventoryItems"
              variant="outline"
              size="sm"
              :icon="ArrowDownTrayIcon"
              :loading="isImporting"
              :disabled="isExporting"
              title="Import from Excel"
              extra-class="!rounded-2xl max-sm:!px-2 max-sm:!py-1.5"
              aria-label="Import from Excel"
              @click="fileInputRef?.click()"
            >
              <span class="hidden sm:inline">Import</span>
            </Button>
            <Button
              v-if="canManageInventoryItems"
              variant="outline"
              size="sm"
              :icon="ArrowUpTrayIcon"
              :loading="isExporting"
              :disabled="isImporting || (folder?.itemCount ?? 0) === 0"
              title="Export to Excel"
              extra-class="!rounded-2xl max-sm:!px-2 max-sm:!py-1.5"
              aria-label="Export to Excel"
              @click="handleExportToExcel"
            >
              <span class="hidden sm:inline">Export</span>
            </Button>
            <Button
              v-if="canManageInventoryItems"
              variant="primary"
              size="sm"
              :icon="PlusIcon"
              aria-label="Add product"
              extra-class="!rounded-2xl max-sm:!px-2 max-sm:!py-1.5"
              @click="openAddItemModal"
            >
              <span class="hidden sm:inline">Add product</span>
            </Button>
          </template>
        </DataTableToolbar>
      <!-- Empty state inside table card -->
      <div
        v-if="sortedFilteredItems.length === 0"
        class="mx-3 mb-4 flex min-h-[220px] flex-col items-center justify-center rounded-sm bg-white px-5 py-14 text-center dark:!bg-dashboard-card sm:mx-5 sm:px-8"
      >
        <div
          class="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-gray-50 dark:bg-gray-800"
        >
          <CubeIcon class="h-7 w-7 text-gray-400 dark:text-gray-500" stroke-width="1.35" />
        </div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500"
        >
          {{ searchQuery ? 'No match' : 'Empty folder' }}
        </p>
        <h3 class="mt-2 max-w-md text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          {{ searchQuery ? 'No products found' : 'No products in this folder' }}
        </h3>
        <p class="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {{
            searchQuery
              ? 'Try a different term or reset filters to see everything in this folder.'
              : 'Add your first product to start tracking inventory in this folder.'
          }}
        </p>
        <Button
          v-if="canManageInventoryItems"
          variant="primary"
          size="sm"
          :icon="PlusIcon"
          extra-class="!rounded-2xl mt-5"
          @click="openAddItemModal"
        >
          Add product
        </Button>
      </div>
      <template v-else>
      <div :class="isFullscreen ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'contents'">
      <!-- Mobile: card list when has items -->
      <div
        class="block space-y-3 sm:hidden"
        :class="isFullscreen ? 'min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-8' : 'px-1'"
      >
        <div
          v-for="item in paginatedItems"
          :key="item.id"
          class="rounded-sm bg-white p-3.5 dark:!bg-dashboard-card"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1 flex items-start gap-2">
              <Checkbox
                v-if="canManageInventoryItems && !isItemSold(item)"
                :model-value="selectedItemsForBulk.some(i => i.id === item.id)"
                @update:model-value="(checked) => toggleItemSelection(item, checked)"
                size="sm"
                wrapper-class="justify-center pt-0.5"
                @click.stop
              />
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate" :title="getItemPrimaryLabel(item)">
                  {{ getItemPrimaryLabel(item) }}
                </p>
                <div class="mt-1 flex items-center justify-between gap-2 flex-wrap">
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {{ item.discountedPrice !== undefined ? formatCurrency(item.discountedPrice) : formatCurrency(item.price ?? item.originalPrice ?? 0) }}
                  </span>
                  <span
                    :class="[ 'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[9px] font-semibold tracking-wide', getItemAvailability(item).class, ]"
                  >
                    {{ getItemAvailability(item).label }}
                  </span>
                </div>
                <p v-if="item.sku || item.serialNumber || item.serialNo" class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {{ item.sku || item.serialNumber || item.serialNo }}
                </p>
              </div>
            </div>
            <div class="relative shrink-0" data-inventory-item-menu @click.stop>
              <button
                type="button"
                :data-item-actions-anchor="item.id"
                @click="toggleItemMenu(item.id)"
                :disabled="isItemSold(item)"
                :class="[ 'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors', isItemSold(item) ? 'cursor-not-allowed opacity-40' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-800 dark:hover:text-gray-200' ]"
                title="Actions"
                aria-label="Item actions"
                aria-haspopup="menu"
                :aria-expanded="openItemMenuId === item.id"
              >
                <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Desktop: table when has items -->
      <div
        class="hidden sm:block"
        :class="isFullscreen ? 'min-h-0 flex-1 overflow-auto px-4 pb-2 pt-2 lg:px-8' : 'overflow-x-auto'"
      >
        <table class="min-w-full border-separate border-spacing-0">
          <thead
            class="border-b border-gray-200/90 bg-gray-50/95 dark:border-gray-800/80 dark:!bg-dashboard-card/90"
            :class="isFullscreen ? 'sticky top-0 z-10' : ''"
          >
              <tr>
              <th
                v-if="canManageInventoryItems"
                class="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4"
              >
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
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[ 'px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:px-4', column.sortable && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100', ]"
                @click="column.sortable && toggleSort(column.key)"
              >
                <div class="flex items-center gap-1.5">
                  {{ column.label }}
                  <template v-if="column.sortable">
                    <ChevronUpIcon
                      v-if="currentSort.key === column.key && currentSort.order === 'asc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <ChevronDownIcon
                      v-else-if="currentSort.key === column.key && currentSort.order === 'desc'"
                      class="w-3 h-3 text-primary-500 dark:text-primary-400"
                    />
                    <BarsArrowUpIcon v-else class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50" />
                  </template>
                </div>
              </th>
              <th
                v-if="canManageInventoryItems"
                class="w-12 px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 sm:w-[4.5rem] sm:px-4"
              >
                Actions
              </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:!bg-dashboard-card/35">
              <tr
                v-for="(item, index) in paginatedItems"
                :key="item.id"
                class="border-b border-gray-100/90 transition-colors duration-300 even:bg-gray-50/40 hover:bg-gray-50/95 dark:border-gray-800/70 dark:even:bg-gray-900/25 dark:hover:bg-gray-900/70"
              >
              <td v-if="canManageInventoryItems" class="px-3 py-2.5 sm:px-4 text-center">
                <Checkbox
                  :model-value="selectedItemsForBulk.some(i => i.id === item.id)"
                  @update:model-value="(checked) => toggleItemSelection(item, checked)"
                  :disabled="isItemSold(item)"
                  size="sm"
                  wrapper-class="justify-center"
                  :title="isItemSold(item) ? 'Cannot select sold products for bulk operations' : ''"
                />
              </td>
              <td
                v-for="(column, colIndex) in columns"
                :key="column.key"
                class="px-3 py-2.5 sm:px-4 align-top"
              >
                <!-- Inline edit mode (large screens only); click outside saves -->
                <div
                  v-if="isLargeScreen && canManageInventoryItems && !isItemSold(item) && isColumnEditable(column) && isEditingCell(item, column.key)"
                  ref="inlineEditCellRef"
                  class="min-w-[80px]"
                >
                  <input
                    ref="inlineEditInputRef"
                    v-model="inlineEditValue"
                    type="text"
                    :inputmode="(column.type === 'currency' || column.type === 'number' || column.key.toLowerCase().includes('price')) ? 'decimal' : 'text'"
                    class="w-full min-w-0 px-2 py-1 text-[10px] border border-primary-400/50 dark:border-primary-500/50 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400/60 outline-none"
                    @blur="saveInlineEdit"
                    @keydown.enter="saveInlineEdit"
                    @keydown.esc="cancelInlineEdit"
                    @click.stop
                  />
                </div>
                <!-- Display mode -->
                <div
                  v-else
                  :class="[ 'flex items-center gap-1.5 min-h-[22px]', isLargeScreen && canManageInventoryItems && !isItemSold(item) && isColumnEditable(column) && 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-1 -mx-1 transition-colors' ]"
                  @click="startInlineEdit(item, column)"
                >
                  <template v-if="colIndex === 0">
                    <span class="text-[10px] font-medium text-gray-900 dark:text-gray-100">
                      {{ getItemPrimaryLabel(item) }}
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
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-semibold tracking-wide"
                        :class="getItemAvailability(item).class"
                      >
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
              <td v-if="canManageInventoryItems" class="px-3 py-2.5 sm:px-4 text-right">
                <div class="relative inline-flex justify-end" data-inventory-item-menu @click.stop>
                  <button
                    type="button"
                    :data-item-actions-anchor="item.id"
                    @click="toggleItemMenu(item.id)"
                    :disabled="isItemSold(item)"
                    :class="[ 'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors', isItemSold(item) ? 'cursor-not-allowed opacity-40' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-800 dark:hover:text-gray-200' ]"
                    title="Actions"
                    aria-label="Item actions"
                    aria-haspopup="menu"
                    :aria-expanded="openItemMenuId === item.id"
                  >
                    <EllipsisVerticalIcon class="w-4 h-4" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
      </template>

      <!-- Fullscreen: pagination pinned inside overlay -->
      <div
        v-if="isFullscreen && paginationTotal > 0"
        class="shrink-0 border-t border-gray-200/25 bg-gray-100/95 backdrop-blur-sm dark:border-white/[0.05] dark:bg-[#07080c]/95 dark:backdrop-blur-sm"
        style="padding-bottom: env(safe-area-inset-bottom, 0px)"
      >
        <div
          class="w-full min-w-0 max-w-full overflow-x-hidden px-3 py-1 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-1.5 lg:px-7"
        >
          <Pagination
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :total="paginationTotal"
            @page-change="handlePageChange"
          />
        </div>
      </div>
          </div>
        </div>
      </Teleport>
    </template>

    <DashboardFixedFooter v-if="paginationTotal > 0 && !isFullscreen" :sidebar-collapsed="sidebarCollapsed">
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="paginationTotal"
        @page-change="handlePageChange"
      />
    </DashboardFixedFooter>

    <!-- Hidden file input for import -->
    <input
      v-if="canManageInventoryItems"
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls"
      class="hidden"
      @change="handleFileImport"
    />

    <!-- Enhanced Add/Edit Item (slide-over) -->
    <SidePanel
      v-model="showAddItemModal"
      :title="editingItem ? 'Edit Product' : (folder?.hasSerialNumbers && !editingItem ? 'Add Products with Serial Numbers' : 'Add New Product')"
      :subtitle="folder?.hasSerialNumbers && !editingItem ? 'Enter shared details, then add serial numbers' : (editingItem ? 'Update product details' : 'Add a new product to this folder')"
      content-padding="p-3"
    >
      <form @submit.prevent="handleSaveItem" class="space-y-2">
        <!-- Bulk Add Mode for Serial Numbers -->
        <div v-if="folder?.hasSerialNumbers && !editingItem" class="space-y-2">
          <div class="p-2 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200/50 dark:ring-primary-800/40 rounded-sm">
            <p class="text-[11px] text-blue-800 dark:text-blue-200">
              <strong>Bulk Add Mode:</strong> Enter details once, then add serial numbers below. Each serial creates a separate product.
            </p>
          </div>

          <!-- Common Fields (shared); side by side -->
          <div class="space-y-2">
            <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Product details (shared)</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <!-- Product model (brand) -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product model *</label>
                <input
                  v-model="itemForm.brand"
                  type="text"
                  required
                  class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  placeholder="Enter product model"
                />
              </div>
              <!-- Template fields (Product, Price, etc.) -->
              <template
              v-for="field in effectiveTemplateFields.filter(f => f.name !== 'serialNo' && f.name !== 'serialNumber' && f.name !== 'brand' && f.name !== 'model')"
              :key="field.id"
            >
                <div v-if="field.type !== 'boolean' && field.type !== 'date'" class="min-w-0">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ field.label || field.name }} {{ field.required ? '*' : '' }}
                </label>
                <input
                  v-if="field.type === 'text'"
                  v-model="itemForm[field.name]"
                  type="text"
                  :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                />
                <input
                  v-else-if="field.type === 'number'"
                  v-model.number="itemForm[field.name]"
                  type="number"
                  :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                />
                <div v-else-if="field.type === 'currency'" class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                  <input
                    v-model.number="itemForm[field.name]"
                    type="number"
                    step="0.01"
                    min="0"
                    :required="field.required"
                      class="w-full pl-7 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    :placeholder="field.placeholder || '0.00'"
                  />
                </div>
                <select
                  v-else-if="field.type === 'select' && field.options"
                  v-model="itemForm[field.name]"
                  :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                >
                  <option value="">Select {{ field.label || field.name }}</option>
                    <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
                </select>
                  <input
                    v-else
                    v-model="itemForm[field.name]"
                    type="text"
                    :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                  />
                </div>
                <div v-else class="col-span-2 sm:col-span-1">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{{ field.label || field.name }} {{ field.required ? '*' : '' }}</label>
                  <input
                    v-if="field.type === 'date'"
                    v-model="itemForm[field.name]"
                    type="date"
                    :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  />
                <Checkbox
                  v-else-if="field.type === 'boolean'"
                  v-model="itemForm[field.name]"
                  :label="field.label || field.name"
                  size="sm"
                />
              </div>
              </template>
            </div>
          </div>

          <!-- Serial Numbers -->
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300">Serial numbers</h4>
              <Button variant="outline" size="sm" :icon="PlusIcon" @click="addSerialNumber" class="!py-1.5 !text-xs">
                Add Serial Number
              </Button>
            </div>
            <div v-if="serialNumbers.length === 0" class="text-center py-2 text-[11px] text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-sm">
              No serial numbers added. Click "Add Serial Number" to start.
            </div>
            <div v-else class="space-y-1.5 max-h-52 overflow-y-auto">
              <div
                v-for="(serial, index) in serialNumbers"
                :key="index"
                class="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-sm border border-gray-200 dark:border-gray-600"
              >
                <input
                  v-model="serialNumbers[index]"
                  type="text"
                  :placeholder="`Serial ${index + 1}`"
                  class="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500"
                />
                <button
                  type="button"
                  @click="removeSerialNumber(index)"
                  class="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Remove serial number"
                >
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Single Item Mode (normal or edit); fields side by side -->
        <div v-else>
          <div v-if="effectiveTemplateFields.length > 0" class="space-y-2">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <template v-for="field in effectiveTemplateFields" :key="field.id">
                <div v-if="field.type !== 'boolean' && field.type !== 'date'" class="min-w-0">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ field.label || field.name }} {{ field.required ? '*' : '' }}
                </label>
                <input
                  v-if="field.type === 'text'"
                  v-model="itemForm[field.name]"
                  type="text"
                  :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                />
                  <input
                    v-else-if="field.type === 'number'"
                    v-model.number="itemForm[field.name]"
                    type="number"
                    :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                  />
                  <div v-else-if="field.type === 'currency'" class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                    <input
                      v-model.number="itemForm[field.name]"
                      type="number"
                      step="0.01"
                      min="0"
                      :required="field.required"
                      class="w-full pl-7 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                      :placeholder="field.placeholder || '0.00'"
                    />
              </div>
                  <select
                    v-else-if="field.type === 'select' && field.options"
                    v-model="itemForm[field.name]"
                    :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  >
                    <option value="">Select {{ field.label || field.name }}</option>
                    <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
                  </select>
                  <input
                    v-else
                    v-model="itemForm[field.name]"
                    type="text"
                    :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                  />
            </div>
                <div v-else class="col-span-2 sm:col-span-1 min-w-0">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ field.label || field.name }} {{ field.required ? '*' : '' }}
                  </label>
                  <input
                    v-if="field.type === 'date'"
                    v-model="itemForm[field.name]"
                    type="date"
                    :required="field.required"
                    class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  />
                  <Checkbox
                    v-else-if="field.type === 'boolean'"
                    v-model="itemForm[field.name]"
                    :label="field.label || field.name"
                    size="sm"
                  />
          </div>
              </template>
            </div>
          </div>
          <div v-else class="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
            No template fields defined for this folder. Please edit the folder to add fields.
          </div>
        </div>
      </form>

      <template #footer>
        <Button variant="outline" size="sm" @click="handleCancelItem" class="w-full sm:w-auto !rounded-2xl">Cancel</Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          :disabled="!isItemDrawerValid"
          @click="handleSaveItem"
          class="w-full sm:w-auto !rounded-2xl"
        >
          {{ editingItem ? 'Update Product' : (folder?.hasSerialNumbers && !editingItem ? `Add ${serialNumbers.length || 0} Product${serialNumbers.length !== 1 ? 's' : ''}` : 'Add Product') }}
        </Button>
      </template>
    </SidePanel>

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

    <!-- Bulk Delete Modal -->
    <Modal
      v-model="showBulkDeleteModal"
      @update:model-value="(v: boolean) => { showBulkDeleteModal = v; if (!v) bulkDeleteConfirmed = false }"
      size="md"
    >
      <template #header>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-sm bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected products</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedItemsForBulk.length }} product{{ selectedItemsForBulk.length !== 1 ? 's' : '' }} selected</p>
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-sm">
          <p class="text-xs text-red-800 dark:text-red-200">This will permanently delete the selected products from inventory. This action cannot be undone.</p>
        </div>
        <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
          <Checkbox
            v-model="bulkDeleteConfirmed"
            label="I understand that these products will be permanently deleted."
            size="sm"
            wrapper-class="items-start"
            label-class="text-xs text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="outline" size="sm" @click="showBulkDeleteModal = false; bulkDeleteConfirmed = false" class="!rounded-2xl">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteConfirmed || isBulkDeleting"
          :icon="TrashIcon"
          class="!rounded-2xl"
          @click="handleConfirmBulkDelete"
        >
          {{ isBulkDeleting ? 'Deleting...' : `Delete ${selectedItemsForBulk.length} product${selectedItemsForBulk.length !== 1 ? 's' : ''}` }}
        </Button>
      </template>
    </Modal>

    <!-- Duplicate Item Modal (multiple serial numbers) -->
    <Modal
      v-model="showDuplicateModal"
      title="Duplicate product"
      subtitle="Add one or more new serial numbers. Each will create a copy of this product; serial numbers must be unique."
      size="sm"
      @update:model-value="(v: boolean) => { if (!v) clearDuplicateModal() }"
    >
      <form @submit.prevent="handleConfirmDuplicate" class="space-y-4">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">New serial numbers</label>
            <Button
              variant="outline"
              size="sm"
              type="button"
              :icon="PlusIcon"
              @click="addDuplicateSerialNumber"
              class="!rounded-2xl"
            >
              Add
            </Button>
          </div>
          <div v-if="duplicateSerialNumbers.length === 0" class="text-center py-3 text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-sm">
            No serial numbers. Click "Add" to enter one or more.
          </div>
          <div v-else class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="(serial, index) in duplicateSerialNumbers"
              :key="index"
              class="flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-sm border border-gray-200 dark:border-gray-600"
            >
              <input
                v-model="duplicateSerialNumbers[index]"
                type="text"
                :placeholder="`Serial ${index + 1}`"
                class="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500"
              />
              <button
                type="button"
                @click="removeDuplicateSerialNumber(index)"
                class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
                title="Remove"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" type="button" @click="showDuplicateModal = false; clearDuplicateModal()" class="!rounded-2xl">Cancel</Button>
          <Button variant="primary" size="sm" type="submit" :disabled="isDuplicating || !hasValidDuplicateSerials" class="!rounded-2xl">
            {{ isDuplicating ? 'Duplicating...' : `Duplicate ${validDuplicateSerialsCount} product${validDuplicateSerialsCount !== 1 ? 's' : ''}` }}
          </Button>
        </div>
      </form>
    </Modal>

    <!-- Item Timeline Modal -->
    <ItemTimelineModal
      v-model="showTimelineModal"
      :item="selectedItemForTimeline"
      :folder-name="folder?.name"
    />

    <!-- Item actions menu (teleported; not clipped by table overflow) -->
    <Teleport to="body">
      <div
        v-if="openItemMenuId && itemForOpenMenu && itemMenuFixedStyle"
        data-inventory-item-menu
        class="frosted-glass fixed z-[1000] min-w-[11rem] overflow-hidden rounded-sm border border-gray-200/90 py-1 dark:border-gray-700/80"
        role="menu"
        :style="itemMenuFixedStyle"
      >
        <button
          type="button"
          role="menuitem"
          @click="handleViewTimeline(itemForOpenMenu); openItemMenuId = null"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/85"
        >
          <ClockIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
          <span>History</span>
        </button>
        <button
          type="button"
          role="menuitem"
          @click="handleApplyDiscount(itemForOpenMenu); openItemMenuId = null"
          :disabled="isItemSold(itemForOpenMenu)"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-primary-50/80 dark:text-gray-200 dark:hover:bg-primary-950/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <TagIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
          <span>{{ itemForOpenMenu.discountedPrice !== undefined ? 'Discount' : 'Add discount' }}</span>
        </button>
        <button
          type="button"
          role="menuitem"
          @click="handleEditItem(itemForOpenMenu); openItemMenuId = null"
          :disabled="isItemSold(itemForOpenMenu)"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PencilSquareIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
          <span>Edit</span>
        </button>
        <button
          v-if="canDuplicateByPlan"
          type="button"
          role="menuitem"
          @click="handleDuplicateItem(itemForOpenMenu); openItemMenuId = null"
          :disabled="isItemSold(itemForOpenMenu)"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <DocumentDuplicateIcon class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" stroke-width="1.75" />
          <span>Duplicate</span>
        </button>
        <button
          type="button"
          role="menuitem"
          @click="handleDeleteItem(itemForOpenMenu); openItemMenuId = null"
          :disabled="isItemSold(itemForOpenMenu)"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/45 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <TrashIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
          <span>Delete</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ArrowLeftIcon,
  PlusIcon,
  CubeIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
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
  DocumentDuplicateIcon,
} from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import Breadcrumbs from '~/components/ui/Breadcrumbs.vue'
import Modal from '~/components/ui/Modal.vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import Pagination from '~/components/ui/Pagination.vue'
import DashboardFixedFooter from '~/components/ui/DashboardFixedFooter.vue'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useInventoryStore, type InventoryFolder, type TemplateField, INVENTORY_FIRESTORE_PAGE_SIZE } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useAppToast } from '~/composables/useAppToast'
import { usePreferences } from '~/composables/usePreferences'
import { useCopy } from '~/composables/useCopy'
import { getVisibleMenuAnchorElement } from '~/utils/menuAnchor'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import * as XLSX from 'xlsx'
import DiscountModal from '~/components/inventory/DiscountModal.vue'
import BulkDiscountModal from '~/components/inventory/BulkDiscountModal.vue'
import DeleteItemModal from '~/components/inventory/DeleteItemModal.vue'
import ItemTimelineModal from '~/components/inventory/ItemTimelineModal.vue'
import DuplicateFeatureUpsellBanner from '~/components/inventory/DuplicateFeatureUpsellBanner.vue'

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
const userStore = useUserStore()
const storesStore = useStoresStore()
const { canManageInventoryItems } = usePermissions()
const toast = useAppToast()

// Duplicate items only on Storvv Medium and Enterprise
const canDuplicateByPlan = computed(() => {
  const sub = userStore.userData?.subscription
  return sub === 'storvv_medium' || sub === 'storvv_enterprise'
})
const { formatCurrency, preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol || '$')
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
/** Full folder list for search filter (client-side); not stored in Pinia. */
const folderSearchItems = ref<InventoryItem[] | null>(null)
const isSearchItemsLoading = ref(false)
let searchItemsLoadToken = 0
let searchLoadTimer: ReturnType<typeof setTimeout> | null = null
/** Full folder list for serial duplicate UI checks when modals are open. */
const fullItemsForSerialDup = ref<InventoryItem[] | null>(null)

const isSearchActive = computed(() => searchQuery.value.trim().length > 0)

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
const itemsPerPage = ref(INVENTORY_FIRESTORE_PAGE_SIZE)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const isExporting = ref(false)

const currentSort = ref<{ key: string; order: 'asc' | 'desc' }>({ key: 'name', order: 'asc' })
const isFullscreen = ref(false)
const openItemMenuId = ref<string | null>(null)

watch(currentPage, () => {
  openItemMenuId.value = null
})

watch(searchQuery, () => {
  const trimmed = searchQuery.value.trim()
  const fid = folderId.value

  if (!trimmed) {
    if (searchLoadTimer) {
      clearTimeout(searchLoadTimer)
      searchLoadTimer = null
    }
    folderSearchItems.value = null
    isSearchItemsLoading.value = false
    if (!isLoadingFolder.value && fid) {
      inventoryStore.fetchItemsPage(fid, currentPage.value, itemsPerPage.value, { force: true }).catch((err) => {
        console.warn('[inventory] Refetch page after clearing search failed:', err)
      })
    }
    return
  }

  if (searchLoadTimer) clearTimeout(searchLoadTimer)
  searchLoadTimer = setTimeout(async () => {
    const t = searchQuery.value.trim()
    const folderKey = folderId.value
    if (!t || !folderKey) return
    isSearchItemsLoading.value = true
    const token = ++searchItemsLoadToken
    try {
      const list = await inventoryStore.fetchItemsAllChunked(folderKey)
      if (token === searchItemsLoadToken) folderSearchItems.value = list
    } catch (e) {
      console.warn('[inventory] Search load failed:', e)
      if (token === searchItemsLoadToken) folderSearchItems.value = []
    } finally {
      if (token === searchItemsLoadToken) isSearchItemsLoading.value = false
    }
  }, 350)
})

const toggleItemMenu = (itemId: string) => {
  openItemMenuId.value = openItemMenuId.value === itemId ? null : itemId
}

/** Capture-phase outside click; same pattern as inventory folder list (index). */
let itemMenuOutsideHandler: ((e: MouseEvent) => void) | null = null

function removeItemMenuOutsideListener() {
  if (itemMenuOutsideHandler && import.meta.client) {
    document.removeEventListener('click', itemMenuOutsideHandler, true)
    itemMenuOutsideHandler = null
  }
}

const itemMenuFixedStyle = ref<Record<string, string> | null>(null)

function updateItemMenuPosition() {
  const id = openItemMenuId.value
  if (!id || !import.meta.client) {
    itemMenuFixedStyle.value = null
    return
  }
  /** Mobile + desktop both use the same id; querySelector alone picks the hidden row → 0×0 rect → top-left. */
  const el = getVisibleMenuAnchorElement('data-item-actions-anchor', id)
  if (!el) {
    itemMenuFixedStyle.value = null
    return
  }
  const r = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const viewportPadding = 8
  const sideGap = 6
  const menuWidth = 176
  /** Enough for History + discount + edit + optional Duplicate + delete */
  const estimatedMenuHeight = canDuplicateByPlan.value ? 300 : 260

  // Prefer opening beside the clicked action button (to the left on desktop right-edge tables).
  let left = r.left - menuWidth - sideGap
  // If not enough space on the left, open to the right.
  if (left < viewportPadding) {
    left = r.right + sideGap
  }
  // Keep inside viewport horizontally.
  left = Math.max(viewportPadding, Math.min(left, vw - menuWidth - viewportPadding))

  // Vertically anchor around the clicked row/button.
  let top = r.top - 4
  const maxTop = vh - viewportPadding - estimatedMenuHeight
  top = Math.max(viewportPadding, Math.min(top, maxTop))

  itemMenuFixedStyle.value = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
  }
}

function addItemMenuPositionListeners() {
  if (!import.meta.client) return
  window.addEventListener('scroll', updateItemMenuPosition, true)
  window.addEventListener('resize', updateItemMenuPosition)
}

function removeItemMenuPositionListeners() {
  if (!import.meta.client) return
  window.removeEventListener('scroll', updateItemMenuPosition, true)
  window.removeEventListener('resize', updateItemMenuPosition)
}

watch(openItemMenuId, (id) => {
  removeItemMenuOutsideListener()
  removeItemMenuPositionListeners()
  itemMenuFixedStyle.value = null
  if (!id || !import.meta.client) return

  nextTick(() => {
    updateItemMenuPosition()
    addItemMenuPositionListeners()
  })

  itemMenuOutsideHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (t?.closest?.('[data-inventory-item-menu]')) return
    openItemMenuId.value = null
    removeItemMenuOutsideListener()
  }

  nextTick(() => {
    setTimeout(() => {
      if (openItemMenuId.value && itemMenuOutsideHandler) {
        document.addEventListener('click', itemMenuOutsideHandler, true)
      }
    }, 0)
  })
})

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

const isItemDrawerValid = computed(() => {
  const fieldsToValidate =
    effectiveTemplateFields.value.length > 0
      ? effectiveTemplateFields.value
      : folder.value?.template?.fields ?? []

  // In serial-number bulk add, product model is required.
  if (folder.value?.hasSerialNumbers && !editingItem.value) {
    if (!itemForm.brand || String(itemForm.brand).trim() === '') return false
  }

  // Validate required template fields (same exclusions as submit handler).
  if (fieldsToValidate.length) {
    const requiredFields = fieldsToValidate.filter(
      (f) =>
        f.required &&
        f.name !== 'serialNo' &&
        f.name !== 'brand' &&
        f.name !== 'model' &&
        f.id !== SYNTH_STOCK_FIELD_ID,
    )

    for (const field of requiredFields) {
      const value = itemForm[field.name]
      if (value === undefined || value === null) return false
      if (typeof value === 'string' && value.trim() === '') return false
    }
  }

  // Serial-number bulk add requires at least one non-empty serial.
  if (folder.value?.hasSerialNumbers && !editingItem.value) {
    const validSerials = serialNumbers.value.filter((sn) => sn && sn.trim() !== '')
    if (validSerials.length === 0) return false
  }

  return true
})

// Discount modal state
const showDiscountModal = ref(false)
const showBulkDiscountModal = ref(false)
const selectedItemForDiscount = ref<InventoryItem | null>(null)
const selectedItemsForBulk = ref<InventoryItem[]>([])
const showDeleteItemModal = ref(false)
const selectedItemForDelete = ref<InventoryItem | null>(null)
const showBulkDeleteModal = ref(false)
const bulkDeleteConfirmed = ref(false)
const isBulkDeleting = ref(false)
const showTimelineModal = ref(false)
const selectedItemForTimeline = ref<InventoryItem | null>(null)
const showDuplicateModal = ref(false)
const duplicateSourceItem = ref<InventoryItem | null>(null)
const duplicateSerialNumbers = ref<string[]>([''])
const isDuplicating = ref(false)

watch([showAddItemModal, showDuplicateModal], async ([addOpen, dupOpen]) => {
  const fid = folderId.value
  if (!folder.value?.hasSerialNumbers || !fid) {
    fullItemsForSerialDup.value = null
    return
  }
  if (addOpen || dupOpen) {
    try {
      fullItemsForSerialDup.value = await inventoryStore.fetchItemsAllChunked(fid)
    } catch {
      fullItemsForSerialDup.value = null
    }
  } else {
    fullItemsForSerialDup.value = null
  }
})

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

// When user clicks outside the inline-edit cell, stop editing and save
const inlineEditCellRef = ref<HTMLDivElement | HTMLDivElement[] | null>(null)
function getEditCellEl(): HTMLElement | null {
  const r = inlineEditCellRef.value
  if (!r) return null
  return Array.isArray(r) ? (r[0] ?? null) : r
}
const handleClickOutsideInlineEdit = (e: MouseEvent) => {
  if (!editingCell.value) return
  const target = e.target as Node
  const cell = getEditCellEl()
  if (cell?.contains(target)) return
    saveInlineEdit()
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

const inlineEditInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(null)
function getEditInputEl(): HTMLInputElement | null {
  const r = inlineEditInputRef.value
  if (!r) return null
  return Array.isArray(r) ? (r[0] ?? null) : r
}

const startInlineEdit = async (item: InventoryItem, column: { key: string; type?: string }) => {
  if (!canManageInventoryItems.value || isItemSold(item) || !isColumnEditable(column)) return
  if (!isLargeScreen.value) return
  let val = item[column.key]
  // For price columns with discount, show the effective (discounted) price
  if ((column.type === 'currency' || column.key.toLowerCase().includes('price')) && item.discountedPrice !== undefined) {
    val = item.discountedPrice
  }
  if (val !== undefined && val !== null) {
    if (column.key === 'dateIn' || column.key === 'dateOut' || column.type === 'date') {
      const d = val && typeof val === 'object' && 'toISOString' in val ? ((val as Date).toISOString().split('T')[0] ?? '') : (typeof val === 'string' && val.includes('T') ? (val.split('T')[0] ?? '') : String(val))
      inlineEditValue.value = d
    } else {
      inlineEditValue.value = String(val)
    }
  } else {
    inlineEditValue.value = ''
  }
  editingCell.value = { itemId: item.id, columnKey: column.key }
  await nextTick()
  getEditInputEl()?.focus()
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
  if (
    colType === 'number' ||
    columnKey.toLowerCase().includes('quantity') ||
    columnKey.toLowerCase() === 'stock' ||
    columnKey.toLowerCase() === 'qty' ||
    columnKey.toLowerCase() === 'sku'
  ) {
    const num = parseFloat(rawValue)
    parsedValue = isNaN(num) ? rawValue : num
  } else if (colType === 'currency' || columnKey.toLowerCase().includes('price')) {
    const num = parseFloat(rawValue.replace(/[^0-9.-]/g, ''))
    parsedValue = isNaN(num) ? 0 : num
  } else if (colType === 'boolean') {
    parsedValue = ['true', '1', 'yes'].includes(rawValue.toLowerCase())
  } else if (columnKey === 'dateIn' || columnKey === 'dateOut' || colType === 'date') {
    parsedValue = rawValue ? rawValue : ''
  }
  const previousValue = item[columnKey]
  const prevDateStr = previousValue && (typeof previousValue === 'object' && 'toISOString' in previousValue)
    ? (previousValue as Date).toISOString().split('T')[0]
    : (typeof previousValue === 'string' && previousValue.includes('T') ? previousValue.split('T')[0] : previousValue)
  const previousDiscounted = item.discountedPrice
  const isPriceField = colType === 'currency' || columnKey.toLowerCase().includes('price')
  const isDateField = columnKey === 'dateIn' || columnKey === 'dateOut' || colType === 'date'
  const hasChanged = isPriceField && item.discountedPrice !== undefined
    ? parsedValue !== previousDiscounted && String(parsedValue) !== String(previousDiscounted)
    : isDateField
      ? String(parsedValue).trim() !== String(prevDateStr ?? '').trim()
    : parsedValue !== previousValue && String(parsedValue) !== String(previousValue)
  if (!hasChanged) {
    cancelInlineEdit()
    return
  }
  isSavingInline.value = true
  const indexBeforeSave = displayItems.value.findIndex((i) => i.id === itemId)
  if (indexBeforeSave >= 0) {
    lastInlineEditedId.value = itemId
    lastInlineEditedIndex.value = indexBeforeSave
  }
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

const STOCK_LIKE_NAMES = ['stock', 'quantity', 'qty'] as const

function templateFieldsHaveStockLike(fields: TemplateField[] | undefined): boolean {
  if (!fields?.length) return false
  return fields.some((f) =>
    STOCK_LIKE_NAMES.includes(f.name.toLowerCase() as (typeof STOCK_LIKE_NAMES)[number]),
  )
}

const SYNTH_STOCK_FIELD_ID = 'storvv-synthetic-stock'

/** Template fields shown in forms/table. Serial folders: no quantity/stock fields. Bulk: quantity drives availability. */
const effectiveTemplateFields = computed((): TemplateField[] => {
  const raw = folder.value?.template?.fields
  if (!raw?.length) return []
  let fields = raw.map((f) => ({ ...f }))

  if (folder.value?.hasSerialNumbers) {
    return fields.filter(
      (f) =>
        !STOCK_LIKE_NAMES.includes(f.name.toLowerCase() as (typeof STOCK_LIKE_NAMES)[number]),
    )
  }

  if (templateFieldsHaveStockLike(fields)) {
    return fields
  }
  const synthetic: TemplateField = {
    id: SYNTH_STOCK_FIELD_ID,
    name: 'stock',
    label: 'Quantity',
    type: 'number',
    required: false,
  }
  const dateIdx = fields.findIndex((f) => f.type === 'date')
  if (dateIdx >= 0) {
    fields.splice(dateIdx, 0, synthetic)
  } else {
    fields.push(synthetic)
  }
  return fields
})

function quantityFieldKeyForFolder(): string | undefined {
  const tmpl = folder.value?.template?.fields
  const hit = tmpl?.find((f) =>
    STOCK_LIKE_NAMES.includes(f.name.toLowerCase() as (typeof STOCK_LIKE_NAMES)[number]),
  )?.name
  if (hit) return hit
  if (!folder.value?.hasSerialNumbers) return 'stock'
  return undefined
}

/** Ensure bulk (non-serial) rows always persist a positive quantity key expected by receipts. */
function normalizeNonSerialItemPayload(data: Record<string, any>) {
  if (folder.value?.hasSerialNumbers) return
  const qk = quantityFieldKeyForFolder()
  if (!qk) return
  const raw = data[qk]
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').trim())
  if (!Number.isFinite(n) || n < 1) {
    data[qk] = 1
  } else {
    data[qk] = Math.floor(n)
  }
}

// Generate columns based on folder template (exclude Model column; show Brand as Product model)
const columns = computed(() => {
  const templateColumns: Array<{ key: string; label: string; sortable: boolean; type?: string }> = []

  const fieldSource =
    effectiveTemplateFields.value.length > 0
      ? effectiveTemplateFields.value
      : folder.value?.template?.fields && folder.value.template.fields.length > 0
        ? folder.value.template.fields
        : []

  if (fieldSource.length > 0) {
    const mapped = fieldSource
      .filter((field) => field.name !== 'model')
      .map((field) => ({
        key: field.name,
        label:
          field.name === 'brand'
            ? 'Product model'
            : field.name.toLowerCase() === 'price'
              ? 'Unit price'
              : field.label || field.name,
        sortable: true,
        type:
          field.type === 'currency' || field.name.toLowerCase() === 'price' ? 'currency' : field.type,
      }))
    templateColumns.push(...mapped)
  } else {
    // Fallback to default columns if no template
    templateColumns.push(
      { key: 'name', label: 'Product', sortable: true },
      { key: 'sku', label: 'SKU', sortable: true },
      { key: 'price', label: 'Unit price', sortable: true, type: 'currency' },
    )
    if (!folder.value?.hasSerialNumbers) {
      templateColumns.push({ key: 'stock', label: 'Quantity', sortable: true, type: 'number' })
    }
  }

  // Always add Date In, Date Out, and Availability columns at the end
  templateColumns.push(
    { key: 'dateIn', label: 'Date In', sortable: true, type: 'date' },
    { key: 'dateOut', label: 'Date Out', sortable: true, type: 'date' },
    { key: 'availability', label: 'Availability', sortable: true, type: 'availability' },
  )

  return templateColumns
})

function getItemPrimaryLabel(item: InventoryItem): string {
  const first = columns.value[0]
  if (first?.key) {
    const v = item[first.key]
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v)
    }
  }
  return getInventoryItemDisplayName(item)
}

const items = computed(() => {
  return inventoryStore.items[folderId.value] || []
})

const baseItems = computed(() => {
  if (isSearchActive.value) {
    return folderSearchItems.value ?? []
  }
  return items.value
})

const totalUnitsInFolder = computed(() => {
  const list = items.value
  if (!folder.value || list.length === 0) return 0
  if (folder.value.hasSerialNumbers) {
    return list.length
  }
  const qf = quantityFieldKeyForFolder()
  if (!qf) return list.length
  return list.reduce((sum, item) => {
    const raw = item[qf]
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
    const add = Number.isFinite(n) && n > 0 ? n : 0
    return sum + add
  }, 0)
})

/** Composite key: serial + product (brand + model). Same serial can exist for different product models. */
const getSerialProductKey = (serial: string, brand: string, model: string) =>
  `${String(serial).trim()}|${String(brand ?? '').trim()}|${String(model ?? '').trim()}`

/** Set of (serial + product model) keys that already exist in this folder. Used to block duplicate/add when same serial + product exists. */
const existingSerialProductKeysInFolder = computed(() => {
  const set = new Set<string>()
  const folderItems = fullItemsForSerialDup.value ?? items.value
  folderItems.forEach((item: InventoryItem) => {
    const serial = item.serialNo ?? item.serialNumber
    if (serial != null && String(serial).trim() !== '') {
      set.add(getSerialProductKey(String(serial), item.brand, item.model))
    }
  })
  return set
})

// Folder aggregate from Firestore (correct across all pages; not just the loaded page).
const totalInventoryValue = computed(() => folder.value?.totalValue ?? 0)

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
    return {
      status: 'returned',
      label: 'Returned',
      class:
        'ring-1 ring-inset ring-amber-500/25 bg-amber-500/10 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/30',
    }
  }

  if (isItemSold(item)) {
    return {
      status: 'sold',
      label: 'Sold',
      class:
        'ring-1 ring-inset ring-orange-500/25 bg-orange-500/10 text-orange-900 dark:bg-orange-400/10 dark:text-orange-200 dark:ring-orange-400/30',
    }
  }

  return {
    status: 'available',
    label: 'Available',
    class:
      'ring-1 ring-inset ring-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/30',
  }
}

const filteredItems = computed(() => {
  let result = [...baseItems.value]

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

// Display list: sorted list, with edited row kept at same position after inline save
const displayItems = ref<InventoryItem[]>([])
const lastInlineEditedId = ref<string | null>(null)
const lastInlineEditedIndex = ref<number>(-1)

const doSort = (list: InventoryItem[]) => {
  list.sort((a, b) => {
    if (currentSort.value.key === 'availability') {
      const aAvail = getItemAvailability(a).status
      const bAvail = getItemAvailability(b).status
      const order = ['available', 'sold', 'returned']
      const aIndex = order.indexOf(aAvail)
      const bIndex = order.indexOf(bAvail)
      return currentSort.value.order === 'asc' ? aIndex - bIndex : bIndex - aIndex
    }
    let aValue = a[currentSort.value.key]
    let bValue = b[currentSort.value.key]
    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return currentSort.value.order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue) || 0
    const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue) || 0
    return currentSort.value.order === 'asc' ? aNum - bNum : bNum - aNum
  })
}

watch([filteredItems, currentSort], () => {
  const list = [...filteredItems.value]
  doSort(list)
  if (lastInlineEditedId.value != null && lastInlineEditedIndex.value >= 0) {
    const id = lastInlineEditedId.value
    const idx = lastInlineEditedIndex.value
    const i = list.findIndex((item) => item.id === id)
    if (i >= 0) {
      const [item] = list.splice(i, 1)
      if (item) list.splice(Math.min(idx, list.length), 0, item)
    }
    lastInlineEditedId.value = null
    lastInlineEditedIndex.value = -1
  }
  displayItems.value = list
}, { immediate: true })

const sortedFilteredItems = computed(() => displayItems.value)

const itemForOpenMenu = computed(() => {
  const id = openItemMenuId.value
  if (!id) return null
  return sortedFilteredItems.value.find(i => i.id === id) ?? null
})

/** Total rows for pagination (server count when not searching; filtered count when searching). */
const paginationTotal = computed(() => {
  if (isSearchActive.value) {
    return sortedFilteredItems.value.length
  }
  const fid = folderId.value
  const fromStore = fid ? inventoryStore.itemsPagination[fid]?.total : undefined
  return fromStore ?? folder.value?.itemCount ?? 0
})

const paginatedItems = computed(() => {
  const list = sortedFilteredItems.value
  if (isSearchActive.value) {
    const start = (currentPage.value - 1) * itemsPerPage.value
    return list.slice(start, start + itemsPerPage.value)
  }
  return list
})

// Reset to first page when filters change; resync server page when not in search mode
watch([searchQuery, currentSort], () => {
  currentPage.value = 1
  const fid = folderId.value
  if (fid && !searchQuery.value.trim() && !isLoadingFolder.value) {
    inventoryStore.fetchItemsPage(fid, 1, itemsPerPage.value, { force: true }).catch((err) => {
      console.warn('[inventory] Refetch page 1 after sort/filter change failed:', err)
    })
  }
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

const resetFilters = () => {
  const hadSearch = searchQuery.value.trim().length > 0
  searchQuery.value = ''
  sortBy.value = 'name'
  currentSort.value = { key: 'name', order: 'asc' }
  currentPage.value = 1
  if (import.meta.client) {
    try {
      const lsId = route.params.id as string
      if (lsId) {
        localStorage.setItem(`inventory-page-${lsId}`, '1')
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  const fid = folderId.value
  if (!hadSearch && fid && !isLoadingFolder.value) {
    inventoryStore.fetchItemsPage(fid, 1, itemsPerPage.value, { force: true }).catch((err) => {
      console.warn('[inventory] Reset filters refetch failed:', err)
    })
  }
}

const handlePageChange = async (page: number) => {
  currentPage.value = page
  // Save to localStorage with folder ID
  if (import.meta.client) {
    try {
      const lsFolderId = route.params.id as string
      if (lsFolderId) {
        localStorage.setItem(`inventory-page-${lsFolderId}`, page.toString())
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  const fid = folderId.value
  if (fid && !searchQuery.value.trim()) {
    isLoadingItems.value = true
    try {
      await inventoryStore.fetchItemsPage(fid, page, itemsPerPage.value, { force: true })
    } catch (err) {
      console.warn('[inventory] Page change fetch failed:', err)
    } finally {
      isLoadingItems.value = false
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
  folderSearchItems.value = null
  if (searchLoadTimer) {
    clearTimeout(searchLoadTimer)
    searchLoadTimer = null
  }
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
  
  // Initialize form for template + injected Quantity (stock) on bulk folders
  const fields = effectiveTemplateFields.value.length
    ? effectiveTemplateFields.value
    : folder.value?.template?.fields ?? []
  fields.forEach((field) => {
    if (folder.value?.hasSerialNumbers && (field.name === 'brand' || field.name === 'model')) {
      return
    }

    if (field.type === 'number' || field.type === 'currency') {
      itemForm[field.name] = field.id === SYNTH_STOCK_FIELD_ID ? 1 : 0
    } else if (field.type === 'boolean') {
      itemForm[field.name] = false
    } else if (field.type === 'date') {
      itemForm[field.name] = new Date().toISOString().split('T')[0]
    } else {
      itemForm[field.name] = ''
    }
  })
  const folderTitle = folder.value?.name?.trim()
  if (folder.value?.hasSerialNumbers && folderTitle && fields.some((f) => f.name === 'name')) {
    itemForm.name = folderTitle
  }
  showAddItemModal.value = true
}

const handleEditItem = (item: InventoryItem) => {
  cancelInlineEdit()
  editingItem.value = item
  serialNumbers.value = []
  // Copy all item data to form; dates (dateIn, dateOut) are not editable
  const systemFields = ['id', 'folderId', 'createdAt', 'updatedAt', 'createdBy', 'dateOut', 'dateIn', 'swapIn', 'swapInReceiptId', 'discountPercentage', 'discountAmount', 'originalPrice', 'discountedPrice']
  Object.keys(itemForm).forEach(key => delete itemForm[key])
  Object.keys(item).forEach(key => {
    if (!systemFields.includes(key)) {
      itemForm[key] = item[key]
    }
  })
  const qk = quantityFieldKeyForFolder()
  if (
    qk &&
    !folder.value?.hasSerialNumbers &&
    (itemForm[qk] === undefined || itemForm[qk] === null || itemForm[qk] === '' || Number(itemForm[qk]) < 1)
  ) {
    itemForm[qk] = 1
  }
  showAddItemModal.value = true
}

const getItemDisplayName = (item: InventoryItem) => {
  return getItemPrimaryLabel(item)
}

const handleDeleteItem = (item: InventoryItem) => {
  selectedItemForDelete.value = item
  showDeleteItemModal.value = true
}

const handleDuplicateItem = (item: InventoryItem) => {
  if (!canDuplicateByPlan.value) {
    toast.error('Duplicating products is available on Storvv Medium and Enterprise plans.')
    return
  }
  cancelInlineEdit()
  openItemMenuId.value = null
  if (folder.value?.hasSerialNumbers) {
    duplicateSourceItem.value = item
    duplicateSerialNumbers.value = ['']
    showDuplicateModal.value = true
  } else {
    // No serial numbers: open add form with prefilled data so user can save as new item
    editingItem.value = null
    serialNumbers.value = []
    Object.keys(itemForm).forEach(key => delete itemForm[key])
    const systemFields = ['id', 'folderId', 'createdAt', 'updatedAt', 'createdBy', 'dateIn', 'dateOut', 'swapIn', 'swapInReceiptId']
    Object.keys(item).forEach(key => {
      if (!systemFields.includes(key)) {
        itemForm[key] = item[key]
      }
    })
    showAddItemModal.value = true
  }
}

const clearDuplicateModal = () => {
  duplicateSourceItem.value = null
  duplicateSerialNumbers.value = []
}

const validDuplicateSerials = computed(() => {
  const trimmed = duplicateSerialNumbers.value.map(s => s?.trim()).filter(Boolean)
  return [...new Set(trimmed)]
})

const validDuplicateSerialsCount = computed(() => validDuplicateSerials.value.length)

const hasValidDuplicateSerials = computed(() => validDuplicateSerialsCount.value > 0)

const addDuplicateSerialNumber = () => {
  duplicateSerialNumbers.value.push('')
}

const removeDuplicateSerialNumber = (index: number) => {
  duplicateSerialNumbers.value.splice(index, 1)
}

const handleConfirmDuplicate = async () => {
  if (!canDuplicateByPlan.value) {
    toast.error('Duplicating products is available on Storvv Medium and Enterprise plans.')
    return
  }
  const source = duplicateSourceItem.value
  const serials = validDuplicateSerials.value
  if (!source || serials.length === 0 || !folderId.value) return
  const trimmedInputs = duplicateSerialNumbers.value.map(s => s?.trim()).filter(Boolean)
  if (trimmedInputs.length !== serials.length) {
    toast.error('Duplicate serial numbers are not allowed. Please ensure each serial number is unique.')
    return
  }
  const existing = existingSerialProductKeysInFolder.value
  const productLabel = [source.brand, source.model].filter(Boolean).join(' ') || 'this product'
  const alreadyExist = serials.filter(sn =>
    existing.has(getSerialProductKey(sn, source.brand, source.model))
  )
  if (alreadyExist.length > 0) {
    toast.error(
      alreadyExist.length === 1
        ? `Serial number "${alreadyExist[0]}" for ${productLabel} already exists in this folder. Use a different serial number.`
        : `These serial numbers for ${productLabel} already exist: ${alreadyExist.join(', ')}. Use different serial numbers.`
    )
    return
  }
  isDuplicating.value = true
  try {
    const systemFields = ['id', 'folderId', 'createdAt', 'updatedAt', 'createdBy', 'dateIn', 'dateOut', 'swapIn', 'swapInReceiptId']
    const baseData: Record<string, any> = {}
    Object.keys(source).forEach(key => {
      if (!systemFields.includes(key)) {
        baseData[key] = source[key]
      }
    })
    delete baseData.serialNo
    const itemsToCreate = serials.map(serialNo => ({ ...baseData, serialNo }))
    await inventoryStore.createItemsBatch(folderId.value, itemsToCreate)
    if (folder.value) {
      folder.value.itemCount = (folder.value.itemCount || 0) + serials.length
    }
    refreshCurrentItemsPage().catch(() => {})
    showDuplicateModal.value = false
    clearDuplicateModal()
    toast.success(`${serials.length} product${serials.length !== 1 ? 's' : ''} duplicated`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to duplicate. A serial number may already exist.')
  } finally {
    isDuplicating.value = false
  }
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

const openBulkDeleteModal = () => {
  bulkDeleteConfirmed.value = false
  showBulkDeleteModal.value = true
}

const handleConfirmBulkDelete = async () => {
  if (!bulkDeleteConfirmed.value || selectedItemsForBulk.value.length === 0) return
  isBulkDeleting.value = true
  const ids = selectedItemsForBulk.value.map(i => i.id)
  const count = ids.length
  try {
    for (const id of ids) {
      await inventoryStore.deleteItem(folderId.value, id)
    }
    selectedItemsForBulk.value = []
    showBulkDeleteModal.value = false
    bulkDeleteConfirmed.value = false
    if (folder.value) {
      await inventoryStore.fetchFolder(folderId.value)
      folder.value = inventoryStore.getFolderById(folderId.value) || folder.value
    }
    await inventoryStore.fetchFolders()
    toast.success(`${count} product${count !== 1 ? 's' : ''} deleted`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete some products')
  } finally {
    isBulkDeleting.value = false
  }
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
      toast.warning('Please enter a product model')
      return
    }
  }
  
  // Validate required fields (include synthetic Quantity when injected)
  const fieldsToValidate =
    effectiveTemplateFields.value.length > 0
      ? effectiveTemplateFields.value
      : folder.value?.template?.fields ?? []
  if (fieldsToValidate.length) {
    const requiredFields = fieldsToValidate.filter(
      (f) =>
        f.required &&
        f.name !== 'serialNo' &&
        f.name !== 'brand' &&
        f.name !== 'model' &&
        f.id !== SYNTH_STOCK_FIELD_ID,
    )
    for (const field of requiredFields) {
      if (!itemForm[field.name] || itemForm[field.name].toString().trim() === '') {
        toast.warning(`Please fill in the required field: ${field.label || field.name}`)
        return
      }
    }
  }

  try {
    if (editingItem.value) {
      // Capture id, folder, and form snapshot before closing modal (handleCancelItem clears editingItem and itemForm)
      const itemId = editingItem.value.id
      const currentFolderId = folderId.value
      const updates = { ...itemForm }
      normalizeNonSerialItemPayload(updates)
      // Close modal immediately for better UX
      handleCancelItem()
      toast.success('Updating product...')
      
      // CRITICAL: Wait for item update to complete (ensures data is saved to Firestore)
      await inventoryStore.updateItem(currentFolderId, itemId, updates)
      
      // Refresh items list in background (non-blocking) - only for UI sync
      // Item is already updated in local state, so this is just to ensure consistency
      refreshCurrentItemsPage().catch((err) => {
        console.warn('Background items refresh failed (non-critical):', err)
        // Item is already updated in local state, so this is just a sync issue
      })
      
      toast.success('Product updated successfully!')
    } else {
        // Check if we're in bulk add mode (hasSerialNumbers and serialNumbers array has items)
        if (folder.value?.hasSerialNumbers && serialNumbers.value.length > 0) {
          // Validate serial numbers
          const validSerialNumbers = serialNumbers.value.filter(sn => sn && sn.trim() !== '')
          if (validSerialNumbers.length === 0) {
            toast.warning('Please add at least one serial number')
            return
          }

          // Check for duplicate serial numbers within the list
          const uniqueSerials = new Set(validSerialNumbers)
          if (uniqueSerials.size !== validSerialNumbers.length) {
            toast.error('Duplicate serial numbers are not allowed. Please ensure each serial number is unique.')
            return
          }

          // Check that none of the (serial + product model) combinations already exist in this folder
          const existing = existingSerialProductKeysInFolder.value
          const productLabel = [itemForm.brand, itemForm.model].filter(Boolean).join(' ') || 'this product'
          const alreadyExist = validSerialNumbers
            .map(sn => sn.trim())
            .filter(sn => existing.has(getSerialProductKey(sn, itemForm.brand, itemForm.model)))
          if (alreadyExist.length > 0) {
            toast.error(
              alreadyExist.length === 1
                ? `Serial number "${alreadyExist[0]}" for ${productLabel} already exists in this folder. It cannot be added again.`
                : `These serial numbers for ${productLabel} already exist in this folder: ${alreadyExist.join(', ')}. They cannot be added again.`
            )
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
          refreshCurrentItemsPage().catch((err) => {
            console.warn('Background items refresh failed (non-critical):', err)
            // Item is already created and in local state, so this is just a sync issue
          })

          toast.success(`Successfully created ${validSerialNumbers.length} product${validSerialNumbers.length !== 1 ? 's' : ''}`)
        } else {
          // Create single item (normal mode); snapshot form BEFORE cancel clears it
          const newItemPayload = { ...itemForm }
          normalizeNonSerialItemPayload(newItemPayload)
          handleCancelItem()

          await inventoryStore.createItem(folderId.value, newItemPayload)

          // Update folder stats locally (optimistic update)
          if (folder.value) {
            folder.value.itemCount = (folder.value.itemCount || 0) + 1
          }

          // Refresh items list in background (non-blocking) - only for UI sync
          // Item is already in local state, so this is just to ensure consistency
          refreshCurrentItemsPage().catch((err) => {
            console.warn('Background items refresh failed (non-critical):', err)
            // Item is already created and in local state, so this is just a sync issue
          })

          toast.success('Product created successfully!')
        }
      }
  } catch (error: any) {
    toast.error(error.message || 'Failed to save product')
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
    toast.error('Cannot apply discount to sold products')
    return
  }
  selectedItemForDiscount.value = item
  showDiscountModal.value = true
}

const handleRemoveDiscount = async (item: InventoryItem) => {
  // Prevent removing discount from sold items
  if (isItemSold(item)) {
    toast.error('Cannot modify discount on sold products')
    return
  }
  if (confirm(`Remove discount from this product?`)) {
    try {
      await inventoryStore.removeDiscount(folderId.value, item.id)
      // Reload items to refresh the display
      await refreshCurrentItemsPage()
      toast.success('Discount removed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove discount')
    }
  }
}

const handleDiscountApplied = async () => {
  // Reload items to refresh the display
  await refreshCurrentItemsPage()
  showDiscountModal.value = false
  selectedItemForDiscount.value = null
}

const handleBulkDiscountApplied = async () => {
  // Reload items to refresh the display
  await refreshCurrentItemsPage()
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
    const folderItems =
      folderId.value != null
        ? await inventoryStore.fetchItemsAllChunked(folderId.value, { force: true })
        : []
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
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Products')

    // Generate filename
    const folderName = folder.value.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = `${folderName}_inventory_${new Date().toISOString().split('T')[0]}.xlsx`

    // Write and download file
    XLSX.writeFile(wb, filename)
    
    toast.success(`Successfully exported ${folderItems.length} product(s) to ${filename}`)
  } catch (error: any) {
    console.error('Export error:', error)
    toast.error(`Failed to export products: ${error.message || 'Unknown error'}`)
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
    toast.error('Folder template not found. Cannot import products.')
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
        // console.log('[Import] ========== DUPLICATE CHECK START ==========')
        // console.log('[Import] Current folder ID:', currentFolderId)
        
        // Force fetch items for this folder (this ensures we get fresh data)
        let existingItems = await inventoryStore.fetchItemsAllChunked(currentFolderId, { force: true })
        
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
        
        // console.log('[Import] Existing items in THIS folder only:', existingItems.length)
        
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
            // console.log(`[Import] Found existing serial in folder ${currentFolderId}: "${serialNo.toString().trim()}"`)
          }
        })
        
        // console.log('[Import] Total unique serial numbers already in folder:', existingSerialNumbers.size)
        // console.log('[Import] Existing serial numbers:', Array.from(existingSerialNumbers))
        
        const totalItemsFromExcel = itemsToImport.length
        // console.log('[Import] Items from Excel to check:', totalItemsFromExcel)
        
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
              // console.log(`[Import] Row ${rowNumber}: Missing serial number - will skip as validation error`)
              return // Skip this item due to validation error
            }
            // If serial numbers are not required, add item without checking duplicates
            itemsToImportFiltered.push(itemEntry)
            // console.log(`[Import] Row ${rowNumber}: No serial number - adding without duplicate check`)
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
            // console.log(`[Import] Row ${rowNumber}: SKIPPING - Serial "${serialNoTrimmed}" already exists in folder ${folderId.value}`)
            return // Skip this duplicate
          }
          
          // SECOND: Check if this serial number appears earlier in the import batch
          if (importBatchSerialNumbers.has(serialNoLower)) {
            // Duplicate within the same import file - SKIP it (keep first occurrence)
            duplicateSerialNumbers.push(serialNoTrimmed)
            skippedDuplicates++
            // console.log(`[Import] Row ${rowNumber}: SKIPPING - Serial "${serialNoTrimmed}" is duplicated in import file (first seen at row ${importBatchSerialNumbers.get(serialNoLower)})`)
            return // Skip this duplicate
          }
          
          // Serial number is UNIQUE - ADD to import list
          itemsToImportFiltered.push(itemEntry)
          importBatchSerialNumbers.set(serialNoLower, rowNumber)
          // console.log(`[Import] Row ${rowNumber}: ✓ ADDING - Serial "${serialNoTrimmed}" is unique and will be imported`)
        })
        
        // console.log('[Import] ========== DUPLICATE CHECK SUMMARY ==========')
        // console.log('[Import] Folder:', currentFolderId)
        // console.log('[Import] Total items from Excel:', totalItemsFromExcel)
        // console.log('[Import] Items skipped (duplicates in folder):', skippedDuplicates)
        // console.log('[Import] Items that will be IMPORTED (unique):', itemsToImportFiltered.length)
        // console.log('[Import] Items with validation errors:', errors.length)
        // console.log('[Import] ===========================================')
        
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
        // console.log('[Import] No serial number field or data detected - importing all items without duplicate check')
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
    
    // console.log('[Import] Items to import:', itemsToImport.length)
    // console.log('[Import] Skipped duplicates:', skippedDuplicates)
    // console.log('[Import] Validation errors:', errors.length)

    // Import items
    let successCount = 0
    let failCount = 0

    for (const itemEntry of itemsToImport) {
      try {
        await inventoryStore.createItem(folderId.value, itemEntry.data)
        successCount++
      } catch (error: any) {
        console.error('Error importing item:', error)
        errors.push(`Row ${itemEntry.rowNumber}: Failed to create product - ${error.message || 'Unknown error'}`)
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
    removeItemMenuOutsideListener()
    removeItemMenuPositionListeners()
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

// Watch for store changes and redirect to folders list (only when user actually switches store, not on initial load/refresh)
watch(() => storesStore.currentStoreId, async (newStoreId, oldStoreId) => {
  const hadStore = oldStoreId != null && oldStoreId !== ''
  const storeChanged = hadStore && newStoreId != null && newStoreId !== oldStoreId
  if (storeChanged && folderId.value && authStore.currentUser) {
    // User switched store - folders are store-specific, so redirect to folders list
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

const refreshCurrentItemsPage = () => {
  const fid = folderId.value
  if (!fid) return Promise.resolve()
  return inventoryStore.fetchItemsPage(fid, currentPage.value, itemsPerPage.value, { force: true })
}

const loadItems = async () => {
  if (!folderId.value || typeof folderId.value !== 'string') {
    return
  }

  isLoadingItems.value = true
  try {
    // Fetch items and receipts in parallel
    await Promise.all([
      inventoryStore.fetchItemsPage(folderId.value, currentPage.value, itemsPerPage.value, {
        force: true,
      }),
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
