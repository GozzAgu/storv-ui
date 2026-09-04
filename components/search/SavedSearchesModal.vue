<template>
  <Modal v-model="isOpen" title="Saved Searches" subtitle="Load or save search filters." size="md">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Saved Searches</h3>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Load or save search filters</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-sm transition-colors"
        >
          <BookmarkSquareIcon class="h-3.5 w-3.5 shrink-0 opacity-80" :stroke-width="1.75" />
          Save current
        </button>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Loading State -->
      <div v-if="searchStore.loading" class="text-center py-8">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"
        ></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="searchStore.savedSearches.length === 0" class="text-center py-8">
        <div
          class="w-14 h-14 mx-auto mb-3 rounded-sm bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center"
        >
          <MagnifyingGlassIcon class="w-7 h-7 text-gray-700 dark:text-gray-300" />
        </div>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No saved searches</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Save your frequently used searches for quick access
        </p>
        <Button variant="neutral" size="sm" :icon="BookmarkSquareIcon" @click="showCreateModal = true">
          Save Current Search
        </Button>
      </div>

      <!-- Saved Searches List -->
      <div v-else class="space-y-2">
        <div
          v-for="saved in searchStore.savedSearches"
          :key="saved.id"
          class="group p-3 rounded-sm hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {{ saved.name }}
                </h4>
                <span
                  class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  {{ saved.filters.entityTypes.length }} type{{
                    saved.filters.entityTypes.length !== 1 ? 's' : ''
                  }}
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
                class="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-sm transition-colors"
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
      <IosForm layout="default" scroll>
        <IosFormSection fixed>
          <IosFormField label="Search Name" required>
            <IosFormInput
              v-model="searchName"
              placeholder="e.g., High-value customers"
              @keydown.enter="handleSave"
            />
          </IosFormField>
          <IosFormField label="Query">
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
              {{ searchStore.query || '(empty)' }}
            </p>
            <p v-if="searchStore.hasActiveFilters" class="dash-drawer-hint mt-1.5">
              Filters: {{ getFiltersSummary() }}
            </p>
          </IosFormField>
        </IosFormSection>
      </IosForm>

      <template #footer>
        <IosDrawerActions
          primary-label="Save"
          :primary-disabled="!searchName.trim()"
          @cancel="showCreateModal = false"
          @primary="handleSave"
        />
      </template>
    </Modal>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BookmarkSquareIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  TrashIcon,
} from '~/utils/app-icons'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import { IosForm, IosFormSection, IosFormField, IosFormInput } from '~/components/ios/forms'
import { useSearchStore } from '~/stores/search'
import { useAppToast } from '~/composables/useAppToast'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  load: [searchId: string]
}>()

const searchStore = useSearchStore()
const toast = useAppToast()
const showCreateModal = ref(false)
const searchName = ref('')

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const formatDate = (date: Date | any) => {
  if (!date) return 'Unknown'
  const dateObj = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date(date)
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
  if (
    searchStore.filters.entityTypes.length > 0 &&
    !searchStore.filters.entityTypes.includes('all')
  ) {
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
