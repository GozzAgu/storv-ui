<template>
  <div class="s-c s-folder-drill" role="group">
    <div v-if="browseParent" class="s-folder-drill__nav">
      <button type="button" class="s-folder-drill__back" @click="goBack">
        <ChevronLeft :size="14" :stroke-width="2" aria-hidden="true" />
        All categories
      </button>
      <p class="s-folder-drill__parent">{{ browseParent.name }}</p>
    </div>

    <div v-if="modelValue && selectedFolder" class="s-folder-drill__selected">
      <span class="s-folder-drill__selected-label">Selected</span>
      <span class="s-folder-drill__selected-name">{{ selectedPathLabel }}</span>
      <button type="button" class="s-folder-drill__clear" @click="clearSelection">Clear</button>
    </div>

    <p v-if="visibleFolders.length === 0" class="s-pick__empty">
      {{
        browseParent
          ? 'No subcategories in this category.'
          : emptyLabel
      }}
    </p>

    <div v-else :class="pickListClass">
      <div :class="[pickListScrollClass, 's-folder-drill__scroll']">
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
          <div class="s-folder-drill__text">
            <p :class="pickRowTitleClass">{{ folder.name }}</p>
            <p :class="pickRowMetaClass">
              {{
                hasChildren(folder)
                  ? `${childCount(folder)} subcategor${childCount(folder) === 1 ? 'y' : 'ies'}`
                  : 'Select to use this category'
              }}
            </p>
          </div>
          <ChevronRight
            v-if="hasChildren(folder)"
            class="s-folder-drill__icon"
            :size="16"
            :stroke-width="1.75"
            aria-hidden="true"
          />
          <CircleCheck
            v-else-if="modelValue === folder.id"
            class="s-folder-drill__icon s-folder-drill__icon--selected"
            :size="16"
            :stroke-width="2"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, CircleCheck } from '@lucide/vue'
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
