<template>
  <Teleport to="body">
    <Transition name="s-dialog">
      <div
        v-if="searchStore.isOpen"
        class="s-c s-dialog-layer s-palette-layer"
        data-dashboard-teleport
      >
        <div
          data-global-search-backdrop
          class="s-dialog__scrim"
          aria-hidden="true"
          @click="searchStore.closeSearch()"
        />

        <div
          ref="paletteRef"
          class="s-dialog s-dialog--md s-palette"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          @click.stop
          @keydown.esc="searchStore.closeSearch()"
        >
          <div class="s-palette__head">
            <div class="s-palette__search">
              <div class="s-control s-control--lg s-palette__control">
                <span class="s-control__affix">
                  <MagnifyingGlassIcon :size="16" :stroke-width="1.75" aria-hidden="true" />
                </span>
                <input
                  v-model="searchStore.query"
                  type="text"
                  class="s-control__input"
                  placeholder="Search sales, inventory, customers…"
                  aria-label="Search"
                  role="combobox"
                  aria-autocomplete="list"
                  :aria-expanded="orderedResults.length > 0"
                  :aria-controls="listboxId"
                  :aria-activedescendant="activeOptionId"
                  autocomplete="off"
                  @input="handleSearchInput"
                  @keydown.enter="handleEnter"
                  @keydown.down.prevent="navigateResults(1)"
                  @keydown.up.prevent="navigateResults(-1)"
                />
                <kbd class="s-kbd s-palette__esc" aria-hidden="true">Esc</kbd>
              </div>
              <SButton
                class="s-palette__cancel"
                variant="ghost"
                @click="searchStore.closeSearch()"
              >
                Cancel
              </SButton>
            </div>

            <div class="s-palette__chips" role="group" aria-label="Search in">
              <button
                v-for="entityType in entityTypes"
                :key="entityType.value"
                type="button"
                class="s-palette__chip"
                :aria-pressed="isEntityTypeSelected(entityType.value)"
                @click="toggleEntityType(entityType.value)"
              >
                <component :is="entityType.icon" :size="14" :stroke-width="1.75" aria-hidden="true" />
                {{ entityType.label }}
              </button>
              <button
                v-if="searchStore.hasActiveFilters"
                type="button"
                class="s-palette__chip s-palette__chip--clear"
                @click="searchStore.resetFilters()"
              >
                Clear
              </button>
              <button
                type="button"
                class="s-palette__chip s-palette__filters-toggle"
                :aria-expanded="showAdvancedFilters"
                aria-controls="global-search-filters"
                @click="showAdvancedFilters = !showAdvancedFilters"
              >
                <FunnelIcon :size="14" :stroke-width="1.75" aria-hidden="true" />
                Filters
                <ChevronDownIcon
                  class="s-palette__chevron"
                  :class="{ 's-palette__chevron--open': showAdvancedFilters }"
                  :size="14"
                  :stroke-width="1.75"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <div v-if="showAdvancedFilters" id="global-search-filters" class="s-palette__filters">
            <div class="s-form-pair">
              <SInput
                v-model="startDate"
                label="Start"
                type="date"
                @change="updateDateRange"
              />
              <SInput
                v-model="endDate"
                label="End"
                type="date"
                @change="updateDateRange"
              />
            </div>

            <div
              v-if="
                searchStore.filters.entityTypes.includes('receipts') ||
                searchStore.filters.entityTypes.includes('all')
              "
              class="s-palette__status"
              role="group"
              :aria-labelledby="statusLabelId"
            >
              <p :id="statusLabelId" class="s-palette__caption">Status</p>
              <div class="s-palette__chips">
                <button
                  v-for="status in receiptStatuses"
                  :key="status.value"
                  type="button"
                  class="s-palette__chip"
                  :aria-pressed="isStatusSelected(status.value)"
                  @click="toggleStatus(status.value)"
                >
                  {{ status.label }}
                </button>
              </div>
            </div>
          </div>

          <div ref="resultsEl" class="s-palette__body">
            <div v-if="searchStore.loading" class="s-palette__loading" role="status">
              <SSpinner :size="20" />
              <p>Searching…</p>
            </div>

            <SEmptyState
              v-else-if="!searchStore.hasResults && searchStore.query.trim()"
              class="s-palette__empty"
              title="No results found"
              description="Try a different term or clear filters"
            >
              <template #icon>
                <MagnifyingGlassIcon :size="20" :stroke-width="1.75" />
              </template>
            </SEmptyState>

            <template v-else-if="!searchStore.query.trim() && !searchStore.hasActiveFilters">
              <section class="s-palette__group" aria-labelledby="global-search-suggested">
                <h3 id="global-search-suggested" class="s-palette__caption">Suggested</h3>
                <button
                  v-for="action in suggestedActions"
                  :key="action.href"
                  type="button"
                  class="s-palette__row"
                  @click="runSuggestedAction(action.href)"
                >
                  <span class="s-palette__icon" aria-hidden="true">
                    <component :is="action.icon" :size="16" :stroke-width="1.75" />
                  </span>
                  <span class="s-palette__text">
                    <span class="s-palette__title">{{ action.label }}</span>
                  </span>
                  <ArrowRightIcon class="s-palette__go" :size="16" :stroke-width="1.75" aria-hidden="true" />
                </button>
              </section>

              <section
                v-if="savedSearches.length > 0"
                class="s-palette__group"
                aria-labelledby="global-search-recent"
              >
                <div class="s-palette__group-head">
                  <h3 id="global-search-recent" class="s-palette__caption">Recent</h3>
                  <button
                    type="button"
                    class="s-palette__link"
                    @click="showSavedSearchesModal = true"
                  >
                    Manage
                  </button>
                </div>
                <button
                  v-for="saved in savedSearches.slice(0, 5)"
                  :key="saved.id"
                  type="button"
                  class="s-palette__row"
                  @click="loadSavedSearch(saved.id)"
                >
                  <span class="s-palette__icon" aria-hidden="true">
                    <ClockIcon :size="16" :stroke-width="1.75" />
                  </span>
                  <span class="s-palette__text">
                    <span class="s-palette__title">{{ saved.name }}</span>
                  </span>
                  <ArrowRightIcon class="s-palette__go" :size="16" :stroke-width="1.75" aria-hidden="true" />
                </button>
              </section>
            </template>

            <div v-else :id="listboxId" role="listbox" aria-label="Search results">
              <section
                v-for="group in resultGroups"
                :key="group.type"
                class="s-palette__group"
                role="group"
                :aria-labelledby="`${listboxId}-${group.type}`"
              >
                <h3 :id="`${listboxId}-${group.type}`" class="s-palette__caption">
                  {{ getEntityGroupLabel(group.type) }}
                </h3>
                <button
                  v-for="entry in group.items"
                  :id="`${listboxId}-opt-${entry.index}`"
                  :key="entry.result.id"
                  type="button"
                  role="option"
                  class="s-palette__row"
                  :class="{ 's-palette__row--active': selectedIndex === entry.index }"
                  :aria-selected="selectedIndex === entry.index"
                  :data-index="entry.index"
                  @click="handleResultClick(entry.result)"
                >
                  <span
                    class="s-palette__icon"
                    :class="`s-palette__icon--${getEntityTone(entry.result.type)}`"
                    aria-hidden="true"
                  >
                    <component :is="getEntityIcon(entry.result.icon)" :size="16" :stroke-width="1.75" />
                  </span>
                  <span class="s-palette__text">
                    <span class="s-palette__title">{{ entry.result.title }}</span>
                    <span v-if="entry.result.subtitle" class="s-palette__meta">
                      {{ entry.result.subtitle }}
                    </span>
                    <span v-if="entry.result.description" class="s-palette__meta">
                      {{ entry.result.description }}
                    </span>
                  </span>
                  <ArrowRightIcon class="s-palette__go" :size="16" :stroke-width="1.75" aria-hidden="true" />
                </button>
              </section>
            </div>
          </div>

          <footer class="s-palette__foot">
            <p class="s-palette__hints" aria-hidden="true">
              <span class="s-palette__hint">
                <kbd class="s-kbd"><ArrowUpIcon :size="12" :stroke-width="2" /></kbd>
                <kbd class="s-kbd"><ArrowDownIcon :size="12" :stroke-width="2" /></kbd>
                Navigate
              </span>
              <span class="s-palette__hint"><kbd class="s-kbd">↵</kbd> Open</span>
              <span class="s-palette__hint"><kbd class="s-kbd">Esc</kbd> Close</span>
            </p>
            <p class="s-palette__count" aria-live="polite">
              {{ searchStore.results.length }}
              {{ searchStore.results.length === 1 ? 'result' : 'results' }}
            </p>
          </footer>
        </div>
      </div>
    </Transition>

    <SavedSearchesModal v-model="showSavedSearchesModal" @load="loadSavedSearch" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, useId } from 'vue'
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
  ChartBarIcon,
  CreditCardIcon,
} from '~/utils/app-icons'
import { useSearchStore, type SearchEntityType } from '~/stores/search'
import { useInventoryStore } from '~/stores/inventory'
import { useUserStore } from '~/stores/user'
import SavedSearchesModal from '~/components/search/SavedSearchesModal.vue'
import SButton from '~/components/s/SButton.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SInput from '~/components/s/SInput.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { isCapacitorNative } from '~/utils/capacitor-env'

const router = useRouter()
const searchStore = useSearchStore()
const userStore = useUserStore()
const { canUse: canUseBusinessCapability } = useBusinessCapabilities()
const paletteRef = ref<HTMLElement | null>(null)
const resultsEl = ref<HTMLElement | null>(null)
const showAdvancedFilters = ref(false)
const showSavedSearchesModal = ref(false)
const selectedIndex = ref(-1)
const startDate = ref('')
const endDate = ref('')
const uid = useId()
const listboxId = `global-search-${uid}-results`
const statusLabelId = `global-search-${uid}-status`

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

const suggestedActions = computed(() => {
  const actions = [
    {
      label: 'Record a sale',
      href: '/dashboard/receipts',
      icon: ReceiptPercentIcon,
    },
    {
      label: 'Browse inventory',
      href: '/dashboard/inventory',
      icon: CubeIcon,
    },
    {
      label: 'Open analytics',
      href: '/dashboard/analytics',
      icon: ChartBarIcon,
    },
    {
      label: 'Payment links',
      href: '/dashboard/payment-links',
      icon: CreditCardIcon,
    },
  ]
  return actions
})

/** Results grouped by entity type; keyboard order follows the visual order. */
const resultGroups = computed(() => {
  const groups = new Map<string, any[]>()
  for (const result of searchStore.results) {
    const list = groups.get(result.type)
    if (list) list.push(result)
    else groups.set(result.type, [result])
  }
  let index = 0
  return Array.from(groups, ([type, results]) => ({
    type: type as SearchEntityType,
    items: results.map((result) => ({ result, index: index++ })),
  }))
})

const orderedResults = computed(() =>
  resultGroups.value.flatMap((group) => group.items.map((entry) => entry.result))
)

const activeOptionId = computed(() =>
  selectedIndex.value >= 0 && orderedResults.value[selectedIndex.value]
    ? `${listboxId}-opt-${selectedIndex.value}`
    : undefined
)

function runSuggestedAction(href: string) {
  searchStore.closeSearch()
  void router.push(href)
}

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
  const results = orderedResults.value
  if (selectedIndex.value >= 0 && results[selectedIndex.value]) {
    handleResultClick(results[selectedIndex.value])
  } else if (results.length > 0) {
    handleResultClick(results[0])
  }
}

const navigateResults = (direction: number) => {
  const maxIndex = orderedResults.value.length - 1
  selectedIndex.value = Math.max(-1, Math.min(maxIndex, selectedIndex.value + direction))
  void nextTick(() => {
    resultsEl.value
      ?.querySelector<HTMLElement>(`[data-index="${selectedIndex.value}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  })
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

const getEntityTone = (type: SearchEntityType) => {
  const tones: Record<string, string> = {
    receipts: 'success',
    inventory: 'info',
    customers: 'accent',
    leads: 'accent',
    departments: 'warning',
    staff: 'neutral',
  }
  return tones[type] || 'neutral'
}

const getEntityGroupLabel = (type: SearchEntityType) => {
  const labels: Record<string, string> = {
    receipts: 'Sales',
    inventory: 'Products',
    customers: 'Customers',
    leads: 'Leads',
    departments: 'Departments',
    staff: 'Staff',
  }
  return labels[type] || type
}

watch(
  () => searchStore.results,
  () => {
    if (selectedIndex.value > orderedResults.value.length - 1) selectedIndex.value = -1
  }
)

// Focus the palette (not the input) on open so the keyboard only appears when the user taps the field.
watch(
  () => searchStore.isOpen,
  async (isOpen) => {
    if (isOpen) {
      const inventoryStore = useInventoryStore()
      if (inventoryStore.folders.length === 0) {
        void inventoryStore.fetchFolders()
      }
      await nextTick()
      paletteRef.value?.focus({ preventScroll: true })
      await searchStore.loadSavedSearches()
    }
  }
)

// The web dashboard layout owns Cmd+K; only native shells (hardware keyboards) rely on this one.
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchStore.toggleSearch()
  }
}

onMounted(() => {
  if (isCapacitorNative()) window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
