<template>
  <Modal
    :model-value="modelValue"
    size="md"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #header>
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-sm bg-red-100 dark:bg-red-900/30"
        >
          <TrashIcon class="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ isBulk ? 'Remove selected staff' : 'Remove staff member' }}
          </h3>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <div
        class="rounded-sm bg-red-50 p-3 ring-1 ring-red-200/50 dark:bg-red-900/20 dark:ring-red-800/40"
      >
        <div class="flex items-start gap-2.5">
          <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p class="text-xs font-medium text-red-800 dark:text-red-200">
              They will lose sign-in access
            </p>
            <p class="mt-0.5 text-xs text-red-700 dark:text-red-300">
              Removed staff cannot sign in. You can reactivate them later from the Removed tab. Past
              receipts and activity logs will still show their name.
            </p>
          </div>
        </div>
      </div>

      <div v-if="staffList.length" class="space-y-2">
        <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Staff</h4>
        <ul
          class="max-h-40 space-y-1 overflow-y-auto rounded-sm bg-gray-50/80 p-2.5 dark:bg-gray-700/40"
        >
          <li
            v-for="member in staffList"
            :key="member.id"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ member.firstName }} {{ member.lastName }}
            </span>
            <span class="truncate text-gray-500 dark:text-gray-400">{{ member.email }}</span>
          </li>
        </ul>
      </div>

      <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
        <Checkbox
          v-model="confirmed"
          :label="confirmLabel"
          size="sm"
          wrapper-class="items-start"
          label-class="text-xs text-gray-700 dark:text-gray-300"
        />
      </div>
    </div>

    <template #footer>
      <Button
        variant="outline"
        size="sm"
        class="!rounded-2xl"
        :disabled="isProcessing"
        @click="handleCancel"
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        size="sm"
        class="!rounded-2xl"
        :icon="TrashIcon"
        :disabled="!confirmed || isProcessing"
        @click="handleConfirm"
      >
        {{ confirmButtonLabel }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import type { Staff } from '~/composables/useStaff'

const props = defineProps<{
  modelValue: boolean
  staff: Staff | Staff[] | null
  isProcessing?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const confirmed = ref(false)

const staffList = computed(() => {
  if (!props.staff) return []
  return Array.isArray(props.staff) ? props.staff : [props.staff]
})

const isBulk = computed(() => staffList.value.length > 1)

const subtitle = computed(() => {
  if (!staffList.value.length) return ''
  if (isBulk.value) {
    return `${staffList.value.length} staff member${
      staffList.value.length !== 1 ? 's' : ''
    } selected`
  }
  const member = staffList.value[0]!
  return `${member.firstName} ${member.lastName}`.trim()
})

const confirmLabel = computed(() =>
  isBulk.value
    ? 'I understand these staff members will be removed and cannot sign in.'
    : 'I understand this staff member will be removed and cannot sign in.'
)

const confirmButtonLabel = computed(() => {
  if (props.isProcessing) return 'Removing…'
  if (isBulk.value) {
    return `Remove ${staffList.value.length} staff member${staffList.value.length !== 1 ? 's' : ''}`
  }
  return 'Remove staff member'
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) confirmed.value = false
  }
)

function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function handleConfirm() {
  if (!confirmed.value || props.isProcessing) return
  emit('confirm')
}
</script>
