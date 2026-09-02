<template>
  <Modal
    :model-value="modelValue"
    size="md"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #header>
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-sm bg-primary-100 dark:bg-primary-900/30"
        >
          <ArrowUturnLeftIcon class="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Reactivate staff member
          </h3>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ staffName }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <div
        class="rounded-sm bg-primary-50 p-3 ring-1 ring-primary-200/50 dark:bg-primary-900/20 dark:ring-primary-800/40"
      >
        <div class="flex items-start gap-2.5">
          <CheckCircleIcon class="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
          <div>
            <p class="text-xs font-medium text-primary-900 dark:text-primary-100">
              Restore sign-in access
            </p>
            <p class="mt-0.5 text-xs text-primary-800 dark:text-primary-200">
              They can sign in again with their existing email and password. They will reappear on
              the active roster.
            </p>
          </div>
        </div>
      </div>

      <div v-if="staff" class="space-y-2">
        <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Staff details</h4>
        <div class="space-y-1.5 rounded-sm bg-gray-50/80 p-2.5 dark:bg-gray-700/40">
          <div class="flex justify-between gap-2 text-xs">
            <span class="text-gray-500 dark:text-gray-400">Name</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ staff.firstName }} {{ staff.lastName }}
            </span>
          </div>
          <div class="flex justify-between gap-2 text-xs">
            <span class="text-gray-500 dark:text-gray-400">Email</span>
            <span class="truncate font-medium text-gray-900 dark:text-gray-100">{{
              staff.email
            }}</span>
          </div>
          <div v-if="staff.position" class="flex justify-between gap-2 text-xs">
            <span class="text-gray-500 dark:text-gray-400">Position</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ staff.position }}</span>
          </div>
          <div class="flex justify-between gap-2 text-xs">
            <span class="text-gray-500 dark:text-gray-400">Role</span>
            <span class="font-medium capitalize text-gray-900 dark:text-gray-100">{{
              staff.role
            }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
        <Checkbox
          v-model="confirmed"
          label="I understand this staff member will be reactivated and can sign in again."
          size="sm"
          wrapper-class="items-start"
          label-class="text-xs text-gray-700 dark:text-gray-300"
        />
      </div>
    </div>

    <template #footer>
      <IosDrawerActions
        primary-label="Reactivate staff member"
        :primary-icon="ArrowUturnLeftIcon"
        :primary-disabled="!confirmed || isProcessing"
        :primary-loading="isProcessing"
        @cancel="handleCancel"
        @primary="handleConfirm"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
} from '~/utils/app-icons'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import type { Staff } from '~/composables/useStaff'

const props = defineProps<{
  modelValue: boolean
  staff: Staff | null
  isProcessing?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const confirmed = ref(false)

const staffName = computed(() => {
  if (!props.staff) return ''
  return `${props.staff.firstName} ${props.staff.lastName}`.trim()
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
