<template>
  <Modal
    v-model="isOpen"
    title="Saved Searches"
    size="md"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Saved Searches</h3>
        <button
          @click="showCreateModal = true"
          class="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
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
        <MagnifyingGlassIcon class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
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
          class="group p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
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
                class="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                title="Load search"
              >
                <ArrowRightIcon class="w-4 h-4" />
              </button>
              <button
                @click="handleDelete(saved.id)"
                class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete search"
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
      size="sm"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Name *
          </label>
          <input
            v-model="searchName"
            type="text"
            placeholder="e.g., High-value customers"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @keydown.enter="handleSave"
          />
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Query:</p>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ searchStore.query || '(empty)' }}
          </p>
          <p v-if="searchStore.hasActiveFilters" class="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Filters: {{ getFiltersSummary() }}
          </p>
        </div>
      </div>

      <template #footer>
        <Button variant="outline" @click="showCreateModal = false">Cancel</Button>
        <Button variant="primary" @click="handleSave" :disabled="!searchName.trim()">
          Save
        </Button>
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
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'load': [searchId: string]
}>()

const searchStore = useSearchStore()
const toast = useToast()
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
