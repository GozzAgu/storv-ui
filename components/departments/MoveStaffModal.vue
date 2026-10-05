<template>
  <SDialog
      placement="right"
    :open="modelValue"
    title="Move to another department"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <SForm>
      <SFormSection>
        <p class="s-callout">
          Move
          <strong>{{ staffName }}</strong>
          from
          <strong>{{ currentDepartmentName }}</strong>
          to another department. Their role stays the same; inventory and department access update to
          match the new department on their next action (or immediately if they refresh).
        </p>
      </SFormSection>

      <SFormSection>
        <SField
          v-if="staff"
          label="Destination department"
          required
          :hint="
            departmentOptions.length === 0
              ? 'No other departments in this store. Create another department first.'
              : undefined
          "
        >
          <SSelect
            v-model="targetDepartmentId"
            required
            :disabled="isProcessing || departmentOptions.length === 0"
          >
            <option value="" disabled>Select department</option>
            <option v-for="dept in departmentOptions" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </SSelect>
        </SField>

        <SCheckbox
          v-model="confirmed"
          label="I understand this staff member will move departments and their access will follow the new department."
        />
      </SFormSection>
    </SForm>

    <template #footer>
      <SDialogActions
        primary-label="Move staff member"
        :primary-icon="ArrowsRightLeftIcon"
        :primary-disabled="!canSubmit"
        :primary-loading="isProcessing"
        @cancel="handleCancel"
        @primary="handleConfirm"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SSelect from '~/components/s/SSelect.vue'
import { computed, ref, watch } from 'vue'
import { ArrowsRightLeftIcon } from '~/utils/app-icons'
import SCheckbox from '~/components/s/SCheckbox.vue'
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
