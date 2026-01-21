<template>
  <Modal
    :model-value="props.modelValue"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
    size="lg"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <TrashIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Delete Folder
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ folder?.name || 'This folder' }}
          </p>
        </div>
      </div>
    </template>

    <div class="max-h-[calc(100vh-16rem)] overflow-y-auto space-y-4">
      <!-- Warning Message -->
      <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <div class="flex items-start gap-3">
          <ExclamationTriangleIcon class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-red-800 dark:text-red-200">
              Confirm Deletion
            </p>
            <p class="mt-1 text-xs text-red-700 dark:text-red-300">
              This action cannot be undone. Deleting this folder will permanently remove it from your inventory. The items in this folder will not be deleted, but they will no longer be organized under this folder.
            </p>
          </div>
        </div>
      </div>

      <!-- Folder Details -->
      <div v-if="folder" class="space-y-3">
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Folder Information</h4>
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1.5">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Folder Name:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ folder.name }}</span>
            </div>
            <div v-if="folder.description" class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Description:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ folder.description }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Items Count:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ folder.itemCount || 0 }} item{{ (folder.itemCount || 0) !== 1 ? 's' : '' }}</span>
            </div>
            <div v-if="folder.allowedDepartments && folder.allowedDepartments.length > 0" class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Departments:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ folder.allowedDepartments.length }} department{{ folder.allowedDepartments.length !== 1 ? 's' : '' }}</span>
            </div>
            <div v-if="folder.hasSerialNumbers" class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Serial Numbers:</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">Enabled</span>
            </div>
          </div>
        </div>
      </div>

      <!-- What Will Happen -->
      <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h4 class="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1.5">What will happen:</h4>
        <ul class="space-y-0.5 text-xs text-yellow-800 dark:text-yellow-200 list-disc list-inside">
          <li>This folder will be permanently deleted from inventory</li>
          <li>Items in this folder will not be deleted, but will no longer be organized under this folder</li>
          <li>All associated folder data will be removed</li>
          <li>This action cannot be undone</li>
        </ul>
      </div>

      <!-- Confirmation Checkbox -->
      <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <Checkbox
          v-model="confirmed"
          label="I understand that this action cannot be undone and will permanently delete this folder."
          size="sm"
          wrapper-class="items-start"
          label-class="text-sm text-gray-700 dark:text-gray-300"
        />
      </div>
    </div>

    <template #footer>
      <Button variant="outline" @click="handleCancel" class="w-full sm:w-auto">Cancel</Button>
      <Button
        variant="danger"
        :disabled="!confirmed || isProcessing"
        @click="handleConfirmDelete"
        :icon="TrashIcon"
        class="w-full sm:w-auto"
      >
        {{ isProcessing ? 'Deleting...' : 'Delete Folder' }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import type { InventoryFolder } from '~/stores/inventory'

interface Props {
  modelValue: boolean
  folder: InventoryFolder | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'deleted': [folder: InventoryFolder]
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
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    confirmed.value = false
    isProcessing.value = false
  }
})
</script>
