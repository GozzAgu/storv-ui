<template>
  <SDialog
    :open="props.modelValue"
    role="alertdialog"
    size="sm"
    :title="`Delete ${folder?.name || 'this category'}?`"
    :description="impactText"
    :dismissible="!isProcessing"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div class="s-confirm">
      <dl v-if="folder" class="s-record-summary s-record-summary--stack">
        <div class="s-record-row">
          <dt>Category name</dt>
          <dd class="s-record-row__value">{{ folder.name }}</dd>
        </div>
        <div v-if="folder.description" class="s-record-row">
          <dt>Description</dt>
          <dd class="s-record-row__value">{{ folder.description }}</dd>
        </div>
        <div class="s-record-row">
          <dt>Products</dt>
          <dd class="s-record-row__value">
            {{ folder.itemCount || 0 }} product{{ (folder.itemCount || 0) !== 1 ? 's' : '' }}
          </dd>
        </div>
        <div
          v-if="folder.allowedDepartments && folder.allowedDepartments.length > 0"
          class="s-record-row"
        >
          <dt>Departments</dt>
          <dd class="s-record-row__value">
            {{ folder.allowedDepartments.length }} department{{
              folder.allowedDepartments.length !== 1 ? 's' : ''
            }}
          </dd>
        </div>
        <div v-if="folder.hasSerialNumbers" class="s-record-row">
          <dt>Serial numbers</dt>
          <dd class="s-record-row__value">Enabled</dd>
        </div>
      </dl>

      <ul class="s-confirm__consequences" aria-label="What will happen">
        <li>Category permanently deleted from inventory</li>
        <li>All products in this category permanently deleted</li>
        <li>Action cannot be undone</li>
      </ul>

      <div class="s-confirm__ack">
        <SCheckbox
          v-model="confirmed"
          label="I understand that this action cannot be undone and will permanently delete this category and all products in it."
        />
      </div>
    </div>

    <template #footer>
      <SDialogActions
        primary-variant="danger"
        :primary-label="isProcessing ? 'Deleting…' : 'Delete category'"
        :primary-icon="Trash2"
        :primary-disabled="!confirmed || isProcessing"
        @cancel="handleCancel"
        @primary="handleConfirmDelete"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import { computed, ref, watch } from 'vue'
import { Trash2 } from '@lucide/vue'
import type { InventoryFolder } from '~/stores/inventory'
import { useInventoryStore } from '~/stores/inventory'
import { folderHasChildren, getChildFolders } from '~/utils/inventory-folder-tree'

interface Props {
  modelValue: boolean
  folder: InventoryFolder | null
}

const props = defineProps<Props>()
const inventoryStore = useInventoryStore()

const childFolderCount = computed(() =>
  props.folder ? getChildFolders(inventoryStore.folders, props.folder.id).length : 0
)

const isParentFolder = computed(() =>
  props.folder ? folderHasChildren(inventoryStore.folders, props.folder.id) : false
)

const impactText = computed(() => {
  const items = props.folder?.itemCount || 0
  const products = `${items} product${items !== 1 ? 's' : ''}`
  const children = isParentFolder.value
    ? `, its ${childFolderCount.value} subcategor${childFolderCount.value === 1 ? 'y' : 'ies'},`
    : ''
  return `This can't be undone. The category${children} and all ${products} inside it will be permanently deleted.`
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  deleted: [folder: InventoryFolder]
}>()

const confirmed = ref(false)
const isProcessing = ref(false)

const handleCancel = () => {
  confirmed.value = false
  emit('update:modelValue', false)
}

const handleConfirmDelete = async () => {
  if (!props.folder || !confirmed.value || isProcessing.value) return

  isProcessing.value = true

  try {
    emit('deleted', props.folder)
    handleCancel()
  } catch (error: any) {
    console.error('Delete error:', error)
  } finally {
    isProcessing.value = false
  }
}

// Reset form when modal opens/closes
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      confirmed.value = false
      isProcessing.value = false
    }
  }
)
</script>
