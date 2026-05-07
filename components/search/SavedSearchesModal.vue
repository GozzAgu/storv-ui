<template>
  <Modal
    v-model="isOpen"
    title="Saved Searches"
    subtitle="Load or save search filters."
    size="md"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Saved Searches</h3>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Load or save search filters</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-sm transition-colors"
        >
          + Save Current
        </button>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="searchStore.loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="searchStore.savedSearches.length === 0" class="text-center py-8">
        <div class="w-14 h-14 mx-auto mb-3 rounded-sm bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <MagnifyingGlassIcon class="w-7 h-7 text-primary-500 dark:text-primary-400" />
        </div>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No saved searches</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Save your frequently used searches for quick access</p>
        <Button variant="primary" size="sm" @click="showCreateModal = true">
          Save Current Search
        </Button>
      </div>

      <!-- Saved Searches List -->
      <div v-else class="space-y-2">
        <div
          v-for="saved in searchStore.savedSearches"
          :key="saved.id"
          class="group p-3 border border-gray-200 dark:border-gray-700 rounded-sm hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {{ saved.name }}
                </h4>
                <span class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                  {{ saved.filters.entityTypes.length }} type{{ saved.filters.entityTypes.length !== 1 ? 's' : '' }}
                </span>
              </div>
              <p v-if="saved.query" class="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
                "{{ saved.query }}"
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500">
                Saved {{ formatDate(saved.createdAt) }}
              </p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                @click="$emit('load', saved.id)"
                class="p-1.5 text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-sm transition-colors"
              >
                <ArrowRightIcon class="w-4 h-4" />
              </button>
              <button
                @click="handleDelete(saved.id)"
                class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Saved Search Modal -->
    <Modal
      v-model="showCreateModal"
      title="Save Search"
      subtitle="Name this search to load it later."
      size="sm"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search Name *</label>
          <input
            v-model="searchName"
            type="text"
            placeholder="e.g., High-value customers"
            class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            @keydown.enter="handleSave"
          />
        </div>
        <div class="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Query</p>
          <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ searchStore.query || '(empty)' }}</p>
          <p v-if="searchStore.hasActiveFilters" class="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Filters: {{ getFiltersSummary() }}</p>
        </div>
      </div>

      <template #footer>
        <Button variant="outline" size="sm" @click="showCreateModal = false" extra-class="!rounded-2xl">Cancel</Button>
        <Button variant="primary" size="sm" @click="handleSave" :disabled="!searchName.trim()" extra-class="!rounded-2xl">Save</Button>
      </template>
    </Modal>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MagnifyingGlassIcon, ArrowRightIcon, TrashIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { useSearchStore } from '~/stores/search'
import { useAppToast } from '~/composables/useAppToast'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'load': [searchId: string]
}>()

const searchStore = useSearchStore()
const toast = useAppToast()
const showCreateModal = ref(false)
const searchName = ref('')

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formatDate = (date: Date | any) => {
  if (!date) return 'Unknown'
  const dateObj = date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date))
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

const getFiltersSummary = () => {
  const parts: string[] = []
  if (searchStore.filters.entityTypes.length > 0 && !searchStore.filters.entityTypes.includes('all')) {
    parts.push(`${searchStore.filters.entityTypes.length} type(s)`)
  }
  if (searchStore.filters.dateRange?.start || searchStore.filters.dateRange?.end) {
    parts.push('date range')
  }
  if (searchStore.filters.status && searchStore.filters.status.length > 0) {
    parts.push(`${searchStore.filters.status.length} status(es)`)
  }
  return parts.join(', ') || 'none'
}

const handleSave = async () => {
  if (!searchName.value.trim()) {
    toast.error('Please enter a search name')
    return
  }

  try {
    await searchStore.saveSearch(searchName.value.trim())
    toast.success('Search saved successfully')
    searchName.value = ''
    showCreateModal.value = false
  } catch (error: any) {
    toast.error(error.message || 'Failed to save search')
  }
}

const handleDelete = async (searchId: string) => {
  if (!confirm('Are you sure you want to delete this saved search?')) {
    return
  }

  try {
    await searchStore.deleteSavedSearch(searchId)
    toast.success('Search deleted successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete search')
  }
}
</script>
