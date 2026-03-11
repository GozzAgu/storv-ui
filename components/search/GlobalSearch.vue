<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="searchStore.isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        @click="searchStore.closeSearch()"
      ></div>
    </Transition>

    <!-- Search Modal -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 scale-95 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-4"
    >
      <div
        v-if="searchStore.isOpen"
        class="fixed inset-x-2 top-16 sm:inset-x-4 sm:top-20 md:top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-gray-200/60 dark:ring-gray-700/60 shadow-2xl z-50 flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Search Input -->
        <div class="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/60">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              ref="searchInput"
              v-model="searchStore.query"
              type="text"
              placeholder="Search receipts, inventory, customers..."
              class="w-full pl-9 pr-14 py-2 text-xs rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              @input="handleSearchInput"
              @keydown.esc="searchStore.closeSearch()"
              @keydown.enter="handleEnter"
              @keydown.down.prevent="navigateResults(1)"
              @keydown.up.prevent="navigateResults(-1)"
            />
            <div class="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 sm:gap-2">
              <kbd class="px-2 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200/70 dark:border-gray-600/70 rounded-md hidden sm:inline-block">Esc</kbd>
            </div>
          </div>

          <!-- Quick Filters -->
          <div class="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <button
              v-for="entityType in entityTypes"
              :key="entityType.value"
              @click="toggleEntityType(entityType.value)"
              :class="[
                'px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors',
                isEntityTypeSelected(entityType.value)
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
            >
              <component :is="entityType.icon" class="w-3.5 h-3.5 inline-block mr-1" />
              <span>{{ entityType.label }}</span>
            </button>
            <button
              v-if="searchStore.hasActiveFilters"
              @click="searchStore.resetFilters()"
              class="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Advanced Filters Toggle -->
        <div class="px-3 sm:px-4 py-2 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
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
          <div v-if="showAdvancedFilters" class="px-3 sm:px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
            <!-- Date Range -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="w-full px-3 py-2 text-xs rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  @change="updateDateRange"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="w-full px-3 py-2 text-xs rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
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
                  :class="[
                    'px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors',
                    isStatusSelected(status.value)
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  ]"
                >
                  {{ status.label }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Results -->
        <div class="flex-1 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="searchStore.loading" class="p-6 text-center">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Searching...</p>
          </div>

          <!-- No Results -->
          <div v-else-if="!searchStore.hasResults && searchStore.query.trim()" class="p-6 text-center">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <MagnifyingGlassIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">No results found</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Try adjusting your search query or filters</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="!searchStore.query.trim() && !searchStore.hasActiveFilters" class="p-4 sm:p-6">
            <div class="text-center mb-4">
              <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <MagnifyingGlassIcon class="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
                  class="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Manage
                </button>
              </div>
              <button
                v-for="saved in savedSearches.slice(0, 5)"
                :key="saved.id"
                @click="loadSavedSearch(saved.id)"
                class="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between group"
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
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <button
              v-for="(result, index) in searchStore.results"
              :key="result.id"
              @click="handleResultClick(result)"
              :class="[
                'w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                selectedIndex === index ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              ]"
            >
              <div class="flex items-start gap-2 sm:gap-3">
                <div :class="[
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  getEntityTypeColor(result.type)
                ]">
                  <component :is="getEntityIcon(result.icon)" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <p class="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {{ result.title }}
                    </p>
                    <span :class="[
                      'px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded',
                      getEntityTypeBadgeColor(result.type)
                    ]">
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
        <div class="px-3 sm:px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between">
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
              <kbd class="px-1.5 py-0.5 bg-gray-200/70 dark:bg-gray-700 rounded-md">/</kbd>
              Save
            </span>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ searchStore.results.length }} result{{ searchStore.results.length !== 1 ? 's' : '' }}
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
    customers: 'bg-primary-500',
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
    inventory: 'Item',
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
