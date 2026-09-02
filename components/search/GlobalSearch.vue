<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="searchStore.isOpen" class="fixed inset-0 z-[100]" data-dashboard-teleport role="presentation">
        <!-- Dismiss on overlay click -->
        <div
          data-global-search-backdrop
          class="absolute inset-0 bg-gray-900/25 backdrop-blur-[2px] dark:bg-black/40"
          aria-hidden="true"
          @click="searchStore.closeSearch()"
        />

        <div
          class="pointer-events-none fixed inset-0 flex justify-center overflow-y-auto px-3 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 sm:px-4 sm:pt-[12vh]"
        >
          <div
            class="pointer-events-auto relative flex max-h-[min(72vh,calc(100dvh-2.5rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border-0 bg-white text-gray-900 shadow-[0_20px_60px_-20px_rgb(15_23_42/0.22)] dark:!bg-dashboard-card dark:text-gray-100 dark:shadow-[0_24px_70px_-20px_rgb(0_0_0/0.55)] sm:max-h-[min(78vh,calc(100dvh-3rem))]"
            @click.stop
          >
            <!-- Search -->
            <div class="shrink-0 px-4 pb-3 pt-4">
              <div class="ios-search-input-wrap relative">
                <MagnifyingGlassIcon
                  class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  ref="searchInput"
                  v-model="searchStore.query"
                  type="text"
                  placeholder="Search sales, inventory, customers…"
                  class="app-field w-full rounded-lg py-0 pl-9 pr-12 text-sm placeholder:text-gray-400 dark:!bg-white/[0.04]"
                  @input="handleSearchInput"
                  @keydown.esc="searchStore.closeSearch()"
                  @keydown.enter="handleEnter"
                  @keydown.down.prevent="navigateResults(1)"
                  @keydown.up.prevent="navigateResults(-1)"
                />
                <kbd
                  class="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md bg-gray-100/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-white/[0.06] dark:text-gray-400 sm:inline-block"
                >
                  Esc
                </kbd>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-1">
                <button
                  v-for="entityType in entityTypes"
                  :key="entityType.value"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors duration-150"
                  :class="
                    isEntityTypeSelected(entityType.value)
                      ? 'bg-primary-500/10 text-primary-800 dark:bg-primary-400/15 dark:text-primary-200'
                      : 'text-gray-600 hover:bg-gray-100/90 dark:text-gray-400 dark:hover:bg-white/[0.05]'
                  "
                  @click="toggleEntityType(entityType.value)"
                >
                  <component :is="entityType.icon" class="h-3.5 w-3.5 shrink-0 opacity-80" />
                  {{ entityType.label }}
                </button>
                <button
                  v-if="searchStore.hasActiveFilters"
                  type="button"
                  class="rounded-lg px-2 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50/90 dark:text-red-400 dark:hover:bg-red-500/10"
                  @click="searchStore.resetFilters()"
                >
                  Clear
                </button>
              </div>

              <button
                type="button"
                class="mt-2.5 flex w-full items-center justify-between rounded-lg px-1 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                @click="showAdvancedFilters = !showAdvancedFilters"
              >
                <span class="inline-flex items-center gap-1.5">
                  <FunnelIcon class="h-3.5 w-3.5" />
                  Filters
                </span>
                <ChevronDownIcon
                  class="h-3.5 w-3.5 transition-transform duration-200"
                  :class="showAdvancedFilters ? 'rotate-180' : ''"
                />
              </button>
            </div>

            <!-- Advanced Filters -->
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-96"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 max-h-96"
              leave-to-class="opacity-0 max-h-0"
            >
              <div
                v-if="showAdvancedFilters"
                class="shrink-0 space-y-3 border-0 bg-gray-50/60 px-4 py-3 dark:bg-white/[0.02]"
              >
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      class="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400"
                      >Start</label
                    >
                    <input
                      v-model="startDate"
                      type="date"
                      class="app-field w-full rounded-lg text-xs"
                      @change="updateDateRange"
                    />
                  </div>
                  <div>
                    <label
                      class="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400"
                      >End</label
                    >
                    <input
                      v-model="endDate"
                      type="date"
                      class="app-field w-full rounded-lg text-xs"
                      @change="updateDateRange"
                    />
                  </div>
                </div>

                <div
                  v-if="
                    searchStore.filters.entityTypes.includes('receipts') ||
                    searchStore.filters.entityTypes.includes('all')
                  "
                >
                  <label
                    class="mb-1.5 block text-[11px] font-medium text-gray-600 dark:text-gray-400"
                    >Status</label
                  >
                  <div class="flex flex-wrap gap-1">
                    <button
                      v-for="status in receiptStatuses"
                      :key="status.value"
                      type="button"
                      class="rounded-lg px-2 py-1 text-[11px] font-medium transition-colors duration-150"
                      :class="
                        isStatusSelected(status.value)
                          ? 'bg-primary-500/10 text-primary-800 dark:bg-primary-400/15 dark:text-primary-200'
                          : 'text-gray-600 hover:bg-gray-100/90 dark:text-gray-400 dark:hover:bg-white/[0.05]'
                      "
                      @click="toggleStatus(status.value)"
                    >
                      {{ status.label }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Results -->
            <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <!-- Loading State -->
              <div
                v-if="searchStore.loading"
                class="flex flex-col items-center justify-center px-6 py-14"
              >
                <div
                  class="h-5 w-5 animate-spin rounded-full border-2 border-primary-500/20 border-t-primary-600 dark:border-t-primary-400"
                />
                <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">Searching…</p>
              </div>

              <!-- No Results -->
              <div
                v-else-if="!searchStore.hasResults && searchStore.query.trim()"
                class="dash-empty-state dash-empty-state--compact flex flex-col items-center justify-center px-6 py-14 text-center"
              >
                <div class="dash-empty-state__mark">
                  <MagnifyingGlassIcon
                    class="dash-empty-state__icon h-8 w-8 text-gray-300 dark:text-gray-600"
                    stroke-width="1.5"
                  />
                </div>
                <p class="dash-empty-state__title text-sm font-medium text-gray-900 dark:text-gray-100">
                  No results found
                </p>
                <p
                  class="dash-empty-state__desc mt-1 max-w-[16rem] text-xs leading-relaxed text-gray-500 dark:text-gray-400"
                >
                  Try a different term or clear filters
                </p>
              </div>

              <!-- Empty State -->
              <div
                v-else-if="!searchStore.query.trim() && !searchStore.hasActiveFilters"
                class="px-4 py-4 sm:py-5"
              >
                <div class="dash-empty-state dash-empty-state--compact py-8 text-center">
                  <div class="dash-empty-state__mark mx-auto">
                    <MagnifyingGlassIcon
                      class="dash-empty-state__icon h-8 w-8 text-gray-400 dark:text-gray-500"
                      stroke-width="1.5"
                    />
                  </div>
                  <p class="dash-empty-state__title text-sm font-medium tracking-tight text-gray-900 dark:text-gray-50">
                    Search your workspace
                  </p>
                  <p class="dash-empty-state__desc mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Sales, inventory, customers, and more
                  </p>
                </div>

                <div v-if="savedSearches.length > 0" class="mt-2 space-y-0.5 border-0 pt-2">
                  <div class="mb-1.5 flex items-center justify-between px-1">
                    <h3 class="text-[11px] font-medium text-gray-500 dark:text-gray-400">Recent</h3>
                    <button
                      type="button"
                      class="text-[11px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      @click="showSavedSearchesModal = true"
                    >
                      Manage
                    </button>
                  </div>
                  <button
                    v-for="saved in savedSearches.slice(0, 5)"
                    :key="saved.id"
                    type="button"
                    class="group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50/90 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                    @click="loadSavedSearch(saved.id)"
                  >
                    <div class="flex min-w-0 flex-1 items-center gap-2">
                      <ClockIcon class="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                      <span class="truncate">{{ saved.name }}</span>
                    </div>
                    <ArrowRightIcon
                      class="h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500"
                    />
                  </button>
                </div>
              </div>

              <!-- Results List -->
              <div v-else class="px-2 pb-2">
                <button
                  v-for="(result, index) in searchStore.results"
                  :key="result.id"
                  type="button"
                  class="flex w-full rounded-lg px-2 py-2 text-left transition-colors duration-150 sm:px-2.5 sm:py-2.5"
                  :class="
                    selectedIndex === index
                      ? 'bg-primary-500/8 dark:bg-primary-400/10'
                      : 'hover:bg-gray-50/90 dark:hover:bg-white/[0.04]'
                  "
                  @click="handleResultClick(result)"
                >
                  <div class="flex items-start gap-2.5 sm:gap-3">
                    <div
                      :class="[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',
                        getEntityTypeColor(result.type),
                      ]"
                    >
                      <component
                        :is="getEntityIcon(result.icon)"
                        class="h-4 w-4 text-white sm:h-[1.125rem] sm:w-[1.125rem]"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                        <p class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {{ result.title }}
                        </p>
                        <span
                          :class="[
                            'px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded',
                            getEntityTypeBadgeColor(result.type),
                          ]"
                        >
                          {{ getEntityTypeLabel(result.type) }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-600 dark:text-gray-400 truncate mb-0.5 sm:mb-1">
                        {{ result.subtitle }}
                      </p>
                      <p
                        v-if="result.description"
                        class="text-xs text-gray-500 dark:text-gray-500 line-clamp-1"
                      >
                        {{ result.description }}
                      </p>
                    </div>
                    <ArrowRightIcon
                      class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
                    />
                  </div>
                </button>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex shrink-0 items-center justify-between gap-3 bg-gray-50/70 px-4 py-2.5 dark:bg-white/[0.02]"
            >
              <div
                class="hidden items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500 sm:flex"
              >
                <span class="inline-flex items-center gap-0.5">
                  <ArrowUpIcon class="h-3 w-3" />
                  <ArrowDownIcon class="h-3 w-3" />
                  Navigate
                </span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span>↵ Select</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="inline-flex items-center gap-1">
                  <kbd
                    class="rounded bg-white/80 px-1 py-px font-sans text-[9px] dark:bg-white/[0.06]"
                    >/</kbd
                  >
                  Save
                </span>
              </div>
              <p class="text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                {{ searchStore.results.length }}
                {{ searchStore.results.length === 1 ? 'result' : 'results' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Saved Searches Modal -->
    <SavedSearchesModal v-model="showSavedSearchesModal" @load="loadSavedSearch" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  FolderIcon,
  CubeIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  UserIcon,
  InboxIcon,
  FunnelIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '~/utils/app-icons'
import { useSearchStore, type SearchEntityType } from '~/stores/search'
import { useInventoryStore } from '~/stores/inventory'
import { useUserStore } from '~/stores/user'
import SavedSearchesModal from '~/components/search/SavedSearchesModal.vue'

const router = useRouter()
const searchStore = useSearchStore()
const userStore = useUserStore()
const { canUse: canUseBusinessCapability } = useBusinessCapabilities()
const searchInput = ref<HTMLInputElement | null>(null)
const showAdvancedFilters = ref(false)
const showSavedSearchesModal = ref(false)
const selectedIndex = ref(-1)
const startDate = ref('')
const endDate = ref('')

// Check if user is staff to filter entity types
const isStaff = computed(() => userStore.userData?.role === 'staff')

const entityTypes = computed(() => {
  const baseTypes: Array<{ value: SearchEntityType; label: string; icon: any }> = [
    { value: 'all', label: 'All', icon: MagnifyingGlassIcon },
    { value: 'receipts', label: 'Sales', icon: ReceiptPercentIcon },
    { value: 'inventory', label: 'Inventory', icon: CubeIcon },
    { value: 'customers', label: 'Customers', icon: UserCircleIcon },
    { value: 'leads', label: 'Leads', icon: InboxIcon },
    { value: 'departments', label: 'Departments', icon: BuildingOfficeIcon },
    { value: 'staff', label: 'Staff', icon: UserIcon },
  ]

  // Remove departments and staff from search for staff users or solo/simple experience
  if (isStaff.value) {
    return baseTypes.filter((t) => t.value !== 'departments' && t.value !== 'staff')
  }

  if (!canUseBusinessCapability('staffManagement')) {
    return baseTypes.filter((t) => t.value !== 'departments' && t.value !== 'staff')
  }

  return baseTypes
})

const receiptStatuses = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'refunded', label: 'Refunded' },
]

const savedSearches = computed(() => searchStore.savedSearches)

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const performSearchDebounced = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchStore.performSearch()
  }, 300)
}

const handleSearchInput = () => {
  selectedIndex.value = -1
  performSearchDebounced()
}

const handleEnter = () => {
  if (selectedIndex.value >= 0 && searchStore.results[selectedIndex.value]) {
    handleResultClick(searchStore.results[selectedIndex.value])
  } else if (searchStore.results.length > 0) {
    handleResultClick(searchStore.results[0])
  }
}

const navigateResults = (direction: number) => {
  const maxIndex = searchStore.results.length - 1
  selectedIndex.value = Math.max(-1, Math.min(maxIndex, selectedIndex.value + direction))
}

const handleResultClick = (result: any) => {
  searchStore.closeSearch()
  router.push(result.url)
}

const toggleEntityType = (type: SearchEntityType) => {
  const currentTypes = searchStore.filters.entityTypes
  if (type === 'all') {
    searchStore.setFilters({ entityTypes: ['all'] })
  } else {
    const newTypes = currentTypes.includes('all')
      ? [type]
      : currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes.filter((t) => t !== 'all'), type]

    if (newTypes.length === 0) {
      searchStore.setFilters({ entityTypes: ['all'] })
    } else {
      searchStore.setFilters({ entityTypes: newTypes })
    }
  }
  performSearchDebounced()
}

const isEntityTypeSelected = (type: SearchEntityType) => {
  if (type === 'all') {
    return searchStore.filters.entityTypes.includes('all')
  }
  return searchStore.filters.entityTypes.includes(type)
}

const toggleStatus = (status: string) => {
  const currentStatuses = searchStore.filters.status || []
  const newStatuses = currentStatuses.includes(status)
    ? currentStatuses.filter((s) => s !== status)
    : [...currentStatuses, status]
  searchStore.setFilters({ status: newStatuses })
  performSearchDebounced()
}

const isStatusSelected = (status: string) => {
  return (searchStore.filters.status || []).includes(status)
}

const updateDateRange = () => {
  searchStore.setFilters({
    dateRange: {
      start: startDate.value ? new Date(startDate.value) : null,
      end: endDate.value ? new Date(endDate.value) : null,
    },
  })
  performSearchDebounced()
}

const loadSavedSearch = async (searchId: string) => {
  await searchStore.loadSavedSearch(searchId)
  showSavedSearchesModal.value = false
  // Update date inputs if date range exists
  if (searchStore.filters.dateRange?.start) {
    startDate.value = searchStore.filters.dateRange.start.toISOString().split('T')[0] || ''
  }
  if (searchStore.filters.dateRange?.end) {
    endDate.value = searchStore.filters.dateRange.end.toISOString().split('T')[0] || ''
  }
}

const getEntityIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    ReceiptPercentIcon,
    FolderIcon,
    CubeIcon,
    UserCircleIcon,
    BuildingOfficeIcon,
    UserIcon,
    InboxIcon,
  }
  return icons[iconName] || MagnifyingGlassIcon
}

const getEntityTypeColor = (type: SearchEntityType) => {
  const colors: Record<string, string> = {
    receipts: 'bg-green-500',
    inventory: 'bg-blue-500',
    customers: 'bg-primary-400',
    leads: 'bg-violet-500',
    departments: 'bg-orange-500',
    staff: 'bg-pink-500',
  }
  return colors[type] || 'bg-gray-500'
}

const getEntityTypeBadgeColor = (type: SearchEntityType) => {
  const colors: Record<string, string> = {
    receipts: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    inventory: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    customers: 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300',
    departments: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    staff: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
  }
  return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
}

const getEntityTypeLabel = (type: SearchEntityType) => {
  const labels: Record<string, string> = {
    receipts: 'Sale',
    inventory: 'Product',
    customers: 'Customer',
    departments: 'Department',
    staff: 'Staff',
  }
  return labels[type] || type
}

// Watch for modal open to focus input
watch(
  () => searchStore.isOpen,
  async (isOpen) => {
    if (isOpen) {
      const inventoryStore = useInventoryStore()
      if (inventoryStore.folders.length === 0) {
        void inventoryStore.fetchFolders()
      }
      await nextTick()
      searchInput.value?.focus()
      await searchStore.loadSavedSearches()
    }
  }
)

// Keyboard shortcut handler
onMounted(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      searchStore.toggleSearch()
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  // Cleanup
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>
