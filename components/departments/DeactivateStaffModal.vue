<template>
  <SDialog
    :open="modelValue"
    role="alertdialog"
    size="sm"
    :title="isBulk ? `Remove ${subtitle}?` : `Remove ${subtitle || 'staff member'}?`"
    description="Removed staff can't sign in. You can reactivate them later from the Removed tab. Past sales and activity logs will still show their name."
    :dismissible="!isProcessing"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div class="s-confirm">
      <ul v-if="staffList.length" class="s-confirm__names" aria-label="Staff">
        <li v-for="member in staffList" :key="member.id" class="s-confirm__name">
          <span class="s-confirm__name-primary">{{ member.firstName }} {{ member.lastName }}</span>
          <span class="s-confirm__name-secondary">{{ member.email }}</span>
        </li>
      </ul>

      <div class="s-confirm__ack">
        <SCheckbox v-model="confirmed" :label="confirmLabel" />
      </div>
    </div>

    <template #footer>
      <SDialogActions
        primary-variant="danger"
        :primary-label="confirmButtonLabel"
        :primary-icon="UserMinus"
        :primary-disabled="!confirmed || isProcessing"
        :cancel-disabled="isProcessing"
        @cancel="handleCancel"
        @primary="handleConfirm"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import { computed, ref, watch } from 'vue'
import { UserMinus } from '@lucide/vue'
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
    }`
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
