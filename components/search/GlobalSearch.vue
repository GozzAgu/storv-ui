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
      <div
        v-if="searchStore.isOpen"
        class="fixed inset-0 z-[100]"
        role="presentation"
      >
        <!-- Dismiss on overlay click -->
        <div
          class="absolute inset-0 bg-slate-950/50 backdrop-blur-md dark:bg-black/70"
          aria-hidden="true"
          @click="searchStore.closeSearch()"
        />

        <div
          class="pointer-events-none fixed inset-0 flex justify-center overflow-y-auto px-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4 sm:px-4 sm:pt-20 sm:pb-6 md:pt-24"
        >
          <div
            class="frosted-glass pointer-events-auto relative flex max-h-[min(70vh,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-gray-200/90 text-gray-900 dark:border-gray-800 dark:text-gray-100 sm:max-h-[min(80vh,calc(100dvh-3rem))] sm:rounded-sm"
            @click.stop
          >
        <!-- Search Input -->
        <div class="border-b border-gray-200/90 bg-transparent p-3 dark:border-gray-800 sm:p-4">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
            <input
              ref="searchInput"
              v-model="searchStore.query"
              type="text"
              placeholder="Search receipts, inventory, customers..."
              class="w-full rounded-sm border border-gray-200/90 bg-gray-50 py-2 pl-9 pr-14 text-xs text-gray-900 placeholder-gray-400 focus:border-primary-400/40 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-primary-500/35"
              @input="handleSearchInput"
              @keydown.esc="searchStore.closeSearch()"
              @keydown.enter="handleEnter"
              @keydown.down.prevent="navigateResults(1)"
              @keydown.up.prevent="navigateResults(-1)"
            />
            <div class="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 sm:gap-2">
              <kbd
                class="hidden rounded-sm border border-gray-200/90 bg-gray-100/90 px-2 py-1 text-[10px] font-semibold text-gray-500 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-400 sm:inline-block"
              >
                Esc
              </kbd>
            </div>
          </div>

          <!-- Quick Filters -->
          <div class="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <button
              v-for="entityType in entityTypes"
              :key="entityType.value"
              @click="toggleEntityType(entityType.value)"
              :class="[ 'rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors', isEntityTypeSelected(entityType.value) ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'border border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700' ]"
            >
              <component :is="entityType.icon" class="w-3.5 h-3.5 inline-block mr-1" />
              <span>{{ entityType.label }}</span>
            </button>
            <button
              v-if="searchStore.hasActiveFilters"
              @click="searchStore.resetFilters()"
              class="px-2.5 py-1 text-[11px] font-medium rounded-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Advanced Filters Toggle -->
        <div class="border-b border-gray-200/90 bg-transparent px-3 py-2 dark:border-gray-800 sm:px-4">
          <button
            @click="showAdvancedFilters = !showAdvancedFilters"
            class="flex items-center justify-between w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <span class="flex items-center gap-2">
              <FunnelIcon class="w-3.5 h-3.5" />
              Advanced Filters
            </span>
            <ChevronDownIcon :class="['w-3.5 h-3.5 transition-transform', showAdvancedFilters ? 'rotate-180' : '']" />
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
            class="space-y-3 border-b border-gray-200/90 bg-transparent px-3 py-3 dark:border-gray-800 sm:px-4"
          >
            <!-- Date Range -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  @change="updateDateRange"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  @change="updateDateRange"
                />
              </div>
            </div>

            <!-- Status Filter (for receipts) -->
            <div v-if="searchStore.filters.entityTypes.includes('receipts') || searchStore.filters.entityTypes.includes('all')">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="status in receiptStatuses"
                  :key="status.value"
                  @click="toggleStatus(status.value)"
                  :class="[ 'px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors', isStatusSelected(status.value) ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' ]"
                >
                  {{ status.label }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Results -->
        <div class="min-h-0 flex-1 overflow-y-auto bg-transparent">
          <!-- Loading State -->
          <div v-if="searchStore.loading" class="p-6 text-center">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Searching...</p>
          </div>

          <!-- No Results -->
          <div v-else-if="!searchStore.hasResults && searchStore.query.trim()" class="p-6 text-center">
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-sm bg-gray-100 dark:bg-slate-800"
            >
              <MagnifyingGlassIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">No results found</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Try adjusting your search query or filters</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="!searchStore.query.trim() && !searchStore.hasActiveFilters" class="p-4 sm:p-6">
            <div class="mb-4 text-center">
              <div
                class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-sm bg-primary-100/80 dark:bg-primary-500/15"
              >
                <MagnifyingGlassIcon class="w-6 h-6 text-primary-500 dark:text-primary-400" />
              </div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Start typing to search</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Search across receipts, inventory, customers & more</p>
            </div>

            <!-- Saved Searches -->
            <div v-if="savedSearches.length > 0" class="space-y-2">
              <div class="flex items-center justify-between px-2 mb-2">
                <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Saved Searches</h3>
                <button
                  @click="showSavedSearchesModal = true"
                  class="text-xs text-primary-500 dark:text-primary-400 hover:underline"
                >
                  Manage
                </button>
              </div>
              <button
                v-for="saved in savedSearches.slice(0, 5)"
                :key="saved.id"
                @click="loadSavedSearch(saved.id)"
                class="group flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800/90"
              >
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <ClockIcon class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span class="truncate">{{ saved.name }}</span>
                </div>
                <ArrowRightIcon class="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            </div>
          </div>

          <!-- Results List -->
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800/90">
            <button
              v-for="(result, index) in searchStore.results"
              :key="result.id"
              @click="handleResultClick(result)"
              :class="[ 'w-full px-3 py-2 text-left transition-colors sm:px-4 sm:py-3', selectedIndex === index ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/60' ]"
            >
              <div class="flex items-start gap-2 sm:gap-3">
                <div :class="[ 'w-8 h-8 sm:w-10 sm:h-10 rounded-sm flex items-center justify-center flex-shrink-0', getEntityTypeColor(result.type) ]">
                  <component :is="getEntityIcon(result.icon)" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <p class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {{ result.title }}
                    </p>
                    <span :class="[ 'px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded', getEntityTypeBadgeColor(result.type) ]">
                      {{ getEntityTypeLabel(result.type) }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 truncate mb-0.5 sm:mb-1">
                    {{ result.subtitle }}
                  </p>
                  <p v-if="result.description" class="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                    {{ result.description }}
                  </p>
                </div>
                <ArrowRightIcon class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between border-t border-gray-200/90 bg-transparent px-3 py-2.5 dark:border-gray-800 sm:px-4"
        >
          <div class="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span class="hidden sm:flex items-center gap-1">
              <ArrowUpIcon class="w-3 h-3" />
              <ArrowDownIcon class="w-3 h-3" />
              Navigate
            </span>
            <span class="hidden sm:flex items-center gap-1">
              <span class="text-xs">↵</span>
              Select
            </span>
            <span class="hidden sm:flex items-center gap-1">
              <kbd class="rounded-sm bg-gray-200/90 px-1.5 py-0.5 dark:bg-slate-800 dark:text-gray-300">/</kbd>
              Save
            </span>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ searchStore.results.length }} result{{ searchStore.results.length !== 1 ? 's' : '' }}
          </div>
        </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Saved Searches Modal -->
    <SavedSearchesModal
      v-model="showSavedSearchesModal"
      @load="loadSavedSearch"
    />
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
  FunnelIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/vue/24/outline'
import { useSearchStore, type SearchEntityType } from '~/stores/search'
import { useUserStore } from '~/stores/user'
import SavedSearchesModal from '~/components/search/SavedSearchesModal.vue'

const router = useRouter()
const searchStore = useSearchStore()
const userStore = useUserStore()
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
    { value: 'receipts', label: 'Receipts', icon: ReceiptPercentIcon },
    { value: 'inventory', label: 'Inventory', icon: CubeIcon },
    { value: 'customers', label: 'Customers', icon: UserCircleIcon },
    { value: 'departments', label: 'Departments', icon: BuildingOfficeIcon },
    { value: 'staff', label: 'Staff', icon: UserIcon },
  ]
  
  // Remove departments and staff from search for staff users
  if (isStaff.value) {
    return baseTypes.filter(t => t.value !== 'departments' && t.value !== 'staff')
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
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes.filter(t => t !== 'all'), type]
    
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
    ? currentStatuses.filter(s => s !== status)
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
  }
  return icons[iconName] || MagnifyingGlassIcon
}

const getEntityTypeColor = (type: SearchEntityType) => {
  const colors: Record<string, string> = {
    receipts: 'bg-green-500',
    inventory: 'bg-blue-500',
    customers: 'bg-primary-400',
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
    receipts: 'Receipt',
    inventory: 'Product',
    customers: 'Customer',
    departments: 'Department',
    staff: 'Staff',
  }
  return labels[type] || type
}

// Watch for modal open to focus input
watch(() => searchStore.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    searchInput.value?.focus()
    await searchStore.loadSavedSearches()
  }
})

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
