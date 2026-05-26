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
          <ArrowsRightLeftIcon class="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Move to another department</h3>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ staffName }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <div
        class="rounded-sm bg-gray-50 p-3 ring-1 ring-gray-200/60 dark:bg-gray-800/40 dark:ring-gray-700/50"
      >
        <p class="text-xs text-gray-700 dark:text-gray-300">
          From
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ currentDepartmentName }}</span>
          to the department you select below. Their role stays the same; inventory and department access
          update to match the new department on their next action (or immediately if they refresh).
        </p>
      </div>

      <div v-if="staff">
        <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Destination department <span class="text-red-500">*</span>
        </label>
        <select
          v-model="targetDepartmentId"
          class="w-full rounded-sm bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:!bg-dashboard-card dark:text-gray-100"
          :disabled="isProcessing || departmentOptions.length === 0"
        >
          <option value="" disabled>Select department</option>
          <option
            v-for="dept in departmentOptions"
            :key="dept.id"
            :value="dept.id"
          >
            {{ dept.name }}
          </option>
        </select>
        <p
          v-if="departmentOptions.length === 0"
          class="mt-1.5 text-xs text-amber-700 dark:text-amber-300"
        >
          No other departments in this store. Create another department first.
        </p>
      </div>

      <div class="rounded-sm bg-gray-50 p-2.5 dark:!bg-dashboard-card/35">
        <Checkbox
          v-model="confirmed"
          label="I understand this staff member will move departments and their access will follow the new department."
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
        variant="primary"
        size="sm"
        class="!rounded-2xl"
        :icon="ArrowsRightLeftIcon"
        :disabled="!canSubmit"
        @click="handleConfirm"
      >
        {{ isProcessing ? 'Moving…' : 'Move staff member' }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowsRightLeftIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import type { Staff } from '~/composables/useStaff'
import type { Department } from '~/composables/useDepartments'

const props = defineProps<{
  modelValue: boolean
  staff: Staff | null
  currentDepartmentId: string
  currentDepartmentName: string
  departments: Department[]
  isProcessing?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [targetDepartmentId: string]
  cancel: []
}>()

const confirmed = ref(false)
const targetDepartmentId = ref('')

const staffName = computed(() => {
  if (!props.staff) return ''
  return `${props.staff.firstName} ${props.staff.lastName}`.trim()
})

const departmentOptions = computed(() =>
  props.departments.filter(
    (d) => d.id !== props.currentDepartmentId && d.isActive !== false
  )
)

const canSubmit = computed(
  () =>
    !!props.staff &&
    !!targetDepartmentId.value &&
    confirmed.value &&
    !props.isProcessing &&
    departmentOptions.value.length > 0
)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      confirmed.value = false
      targetDepartmentId.value = ''
      return
    }
    const first = departmentOptions.value[0]
    targetDepartmentId.value = first?.id ?? ''
  }
)

function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function handleConfirm() {
  if (!canSubmit.value || !targetDepartmentId.value) return
  emit('confirm', targetDepartmentId.value)
}
</script>
