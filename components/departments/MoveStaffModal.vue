<template>
  <SidePanel
    :model-value="modelValue"
    title="Move to another department"
    size="md"
    dense
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <IosForm layout="fill">
      <IosFormSection fixed>
        <p class="dash-drawer-callout">
          Move
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ staffName }}</span>
          from
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ currentDepartmentName }}</span>
          to another department. Their role stays the same; inventory and department access update to
          match the new department on their next action (or immediately if they refresh).
        </p>
      </IosFormSection>

      <IosFormSection fixed>
        <IosFormField v-if="staff" label="Destination department" required>
          <IosFormSelect
            v-model="targetDepartmentId"
            required
            extra-class="cursor-pointer"
            :disabled="isProcessing || departmentOptions.length === 0"
          >
            <option value="" disabled>Select department</option>
            <option v-for="dept in departmentOptions" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </IosFormSelect>
          <p
            v-if="departmentOptions.length === 0"
            class="ios-form__hint dash-drawer-hint"
          >
            No other departments in this store. Create another department first.
          </p>
        </IosFormField>

        <Checkbox
          v-model="confirmed"
          label="I understand this staff member will move departments and their access will follow the new department."
          size="sm"
          wrapper-class="items-start"
          label-class="text-xs text-gray-700 dark:text-gray-300"
        />
      </IosFormSection>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        primary-label="Move staff member"
        :primary-icon="ArrowsRightLeftIcon"
        :primary-disabled="!canSubmit"
        :primary-loading="isProcessing"
        @cancel="handleCancel"
        @primary="handleConfirm"
      />
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowsRightLeftIcon } from '~/utils/app-icons'
import SidePanel from '~/components/ui/SidePanel.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { IosForm, IosFormSection, IosFormField, IosFormSelect } from '~/components/ios/forms'
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
  props.departments.filter((d) => d.id !== props.currentDepartmentId && d.isActive !== false)
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
