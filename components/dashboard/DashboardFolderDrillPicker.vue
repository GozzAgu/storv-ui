<template>
  <div class="dash-folder-drill">
    <div v-if="browseParent" class="dash-folder-drill__nav">
      <button type="button" class="dash-folder-drill__back" @click="goBack">
        <ChevronLeftIcon class="h-3.5 w-3.5 shrink-0" stroke-width="2" aria-hidden="true" />
        All categories
      </button>
      <p class="dash-folder-drill__parent">{{ browseParent.name }}</p>
    </div>

    <div v-if="modelValue && selectedFolder" class="dash-folder-drill__selected">
      <span class="dash-folder-drill__selected-label">Selected</span>
      <span class="dash-folder-drill__selected-name">{{ selectedPathLabel }}</span>
      <button type="button" class="dash-folder-drill__clear" @click="clearSelection">Clear</button>
    </div>

    <div v-if="visibleFolders.length === 0" class="dash-folder-drill__empty">
      {{
        browseParent
          ? 'No subcategories in this category.'
          : emptyLabel
      }}
    </div>

    <div v-else :class="pickListClass">
      <div :class="[pickListScrollClass, 'dash-folder-drill__scroll']">
        <button
          v-for="folder in visibleFolders"
          :key="folder.id"
          type="button"
          :class="[
            pickRowClass,
            modelValue === folder.id ? pickRowSelectedClass : '',
          ]"
          @click="onPick(folder)"
        >
          <div class="min-w-0 flex-1 text-left">
            <p :class="pickRowTitleClass">{{ folder.name }}</p>
            <p :class="pickRowMetaClass">
              {{
                hasChildren(folder)
                  ? `${childCount(folder)} subcategor${childCount(folder) === 1 ? 'y' : 'ies'}`
                  : 'Select to use this category'
              }}
            </p>
          </div>
          <ChevronRightIcon
            v-if="hasChildren(folder)"
            class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
            stroke-width="1.75"
            aria-hidden="true"
          />
          <CheckCircleIcon
            v-else-if="modelValue === folder.id"
            class="h-4 w-4 shrink-0 text-primary-500"
            stroke-width="2"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '~/utils/app-icons'
import type { InventoryFolder } from '~/stores/inventory'
import {
  folderHasChildren,
  folderUsesSubcategoryHub,
  getChildFolders,
  getRootFolders,
} from '~/utils/inventory-folder-tree'
import { useDashboardDrawerChrome } from '~/composables/useDashboardDrawerChrome'

const props = withDefaults(
  defineProps<{
    folders: InventoryFolder[]
    modelValue: string
    emptyLabel?: string
  }>(),
  {
    emptyLabel: 'No categories on this branch yet.',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const {
  pickListClass,
  pickListScrollClass,
  pickRowClass,
  pickRowSelectedClass,
  pickRowTitleClass,
  pickRowMetaClass,
} = useDashboardDrawerChrome()

const browseParentId = ref<string | null>(null)

const browseParent = computed(
  () => props.folders.find((folder) => folder.id === browseParentId.value) ?? null
)

const visibleFolders = computed(() => {
  const list = browseParentId.value
    ? getChildFolders(props.folders, browseParentId.value)
    : getRootFolders(props.folders)
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
})

const selectedFolder = computed(
  () => props.folders.find((folder) => folder.id === props.modelValue) ?? null
)

const selectedPathLabel = computed(() => {
  const selected = selectedFolder.value
  if (!selected) return ''
  const parent = selected.parentId
    ? props.folders.find((folder) => folder.id === selected.parentId)
    : null
  return parent ? `${parent.name} / ${selected.name}` : selected.name
})

function hasChildren(folder: InventoryFolder) {
  return (
    folderHasChildren(props.folders, folder.id) ||
    folderUsesSubcategoryHub(folder, props.folders)
  )
}

function childCount(folder: InventoryFolder) {
  return getChildFolders(props.folders, folder.id).length
}

function setValue(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
}

function onPick(folder: InventoryFolder) {
  if (hasChildren(folder)) {
    browseParentId.value = folder.id
    return
  }
  setValue(folder.id)
}

function goBack() {
  browseParentId.value = null
}

function clearSelection() {
  setValue('')
}

watch(
  () => props.folders,
  () => {
    if (browseParentId.value && !props.folders.some((folder) => folder.id === browseParentId.value)) {
      browseParentId.value = null
    }
  }
)

watch(
  () => props.modelValue,
  (id) => {
    if (!id) {
      browseParentId.value = null
      return
    }
    const folder = props.folders.find((entry) => entry.id === id)
    if (!folder) return
    // Keep drill context aligned with selection when set externally
    if (folder.parentId && folderHasChildren(props.folders, folder.parentId)) {
      browseParentId.value = folder.parentId
    }
  }
)

defineExpose({ goBack, clearSelection })
</script>

<style scoped>
.dash-folder-drill {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.dash-folder-drill__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
}

.dash-folder-drill__back {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgb(72 118 199);
  cursor: pointer;
}

.dash-folder-drill__back:hover {
  text-decoration: underline;
}

html.dark .dash-folder-drill__back {
  color: rgb(154 181 227);
}

.dash-folder-drill__parent {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(15 23 42);
}

html.dark .dash-folder-drill__parent {
  color: rgb(248 250 252);
}

.dash-folder-drill__selected {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.5rem;
  border-radius: 0.625rem;
  background: rgb(248 250 252 / 0.9);
  padding: 0.5rem 0.75rem;
  font-size: 0.6875rem;
}

html.dark .dash-folder-drill__selected {
  background: rgb(255 255 255 / 0.04);
}

.dash-folder-drill__selected-label {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

html.dark .dash-folder-drill__selected-label {
  color: rgb(148 163 184);
}

.dash-folder-drill__selected-name {
  min-width: 0;
  flex: 1 1 auto;
  font-weight: 600;
  color: rgb(15 23 42);
}

html.dark .dash-folder-drill__selected-name {
  color: rgb(248 250 252);
}

.dash-folder-drill__clear {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgb(100 116 139);
  cursor: pointer;
}

.dash-folder-drill__clear:hover {
  color: rgb(15 23 42);
  text-decoration: underline;
}

html.dark .dash-folder-drill__clear:hover {
  color: rgb(226 232 240);
}

.dash-folder-drill__empty {
  border: 1px dashed rgb(15 23 42 / 0.12);
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: rgb(100 116 139);
  text-align: center;
}

html.dark .dash-folder-drill__empty {
  border-color: rgb(255 255 255 / 0.1);
  color: rgb(148 163 184);
}

.dash-folder-drill__scroll {
  max-height: min(28vh, 14rem);
}
</style>
