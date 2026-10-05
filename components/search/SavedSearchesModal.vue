<template>
  <SDialog v-model:open="isOpen" title="Saved searches" description="Load or save search filters." size="md">
    <div v-if="searchStore.loading" class="s-saved__loading">
      <SSpinner :size="24" label="Loading saved searches" />
      <span>Loading…</span>
    </div>

    <SEmptyState
      v-else-if="searchStore.savedSearches.length === 0"
      title="No saved searches"
      description="Save your frequently used searches for quick access."
    >
      <template #icon>
        <Search :size="20" :stroke-width="1.75" />
      </template>
    </SEmptyState>

    <ul v-else class="s-list s-saved__list" aria-label="Saved searches">
      <li v-for="saved in searchStore.savedSearches" :key="saved.id" class="s-list__item">
        <span class="s-list__main">
          <span class="s-list__primary">{{ saved.name }}</span>
          <span class="s-list__secondary">
            <template v-if="saved.query">"{{ saved.query }}" · </template>Saved
            {{ formatDate(saved.createdAt) }}
          </span>
        </span>
        <SBadge>
          {{ saved.filters.entityTypes.length }} type{{
            saved.filters.entityTypes.length !== 1 ? 's' : ''
          }}
        </SBadge>
        <span class="s-saved__actions">
          <SIconButton :label="`Load ${saved.name}`" @click="$emit('load', saved.id)">
            <ArrowRight :size="18" :stroke-width="1.75" aria-hidden="true" />
          </SIconButton>
          <SIconButton
            class="s-saved__delete"
            :label="`Delete ${saved.name}`"
            @click="handleDelete(saved.id)"
          >
            <Trash2 :size="18" :stroke-width="1.75" aria-hidden="true" />
          </SIconButton>
        </span>
      </li>
    </ul>

    <template #footer>
      <SDialogActions
        cancel-label="Close"
        primary-label="Save current search"
        :primary-icon="Bookmark"
        @cancel="isOpen = false"
        @primary="showCreateModal = true"
      />
    </template>

    <SDialog
      v-model:open="showCreateModal"
      title="Save search"
      description="Name this search to load it later."
      size="sm"
    >
      <SForm>
        <SFormSection>
          <SField label="Search name" required>
            <SInput
              v-model="searchName"
              placeholder="e.g., High-value customers"
              @keydown.enter="handleSave"
            />
          </SField>
          <div class="s-callout s-saved__query">
            <span>Query: <strong>{{ searchStore.query || '(empty)' }}</strong></span>
            <span v-if="searchStore.hasActiveFilters">Filters: {{ getFiltersSummary() }}</span>
          </div>
        </SFormSection>
      </SForm>

      <template #footer>
        <SDialogActions
          primary-label="Save"
          :primary-disabled="!searchName.trim()"
          @cancel="showCreateModal = false"
          @primary="handleSave"
        />
      </template>
    </SDialog>
  </SDialog>
</template>

<script setup lang="ts">
import SBadge from '~/components/s/SBadge.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SInput from '~/components/s/SInput.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { ref, computed } from 'vue'
import { ArrowRight, Bookmark, Search, Trash2 } from '@lucide/vue'
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
