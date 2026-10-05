<template>
  <SDialog
    :open="modelValue"
    size="sm"
    :title="`Reactivate ${staffName || 'staff member'}?`"
    description="They can sign in again with their existing email and password, and will reappear on the active roster."
    :dismissible="!isProcessing"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div class="s-confirm">
      <dl v-if="staff" class="s-record-summary s-record-summary--stack">
        <div class="s-record-row">
          <dt>Name</dt>
          <dd class="s-record-row__value">{{ staff.firstName }} {{ staff.lastName }}</dd>
        </div>
        <div class="s-record-row">
          <dt>Email</dt>
          <dd class="s-record-row__value">{{ staff.email }}</dd>
        </div>
        <div v-if="staff.position" class="s-record-row">
          <dt>Position</dt>
          <dd class="s-record-row__value">{{ staff.position }}</dd>
        </div>
        <div class="s-record-row">
          <dt>Role</dt>
          <dd class="s-record-row__value s-confirm__value--capitalize">{{ staff.role }}</dd>
        </div>
      </dl>

      <div class="s-confirm__ack">
        <SCheckbox
          v-model="confirmed"
          label="I understand this staff member will be reactivated and can sign in again."
        />
      </div>
    </div>

    <template #footer>
      <SDialogActions
        primary-label="Reactivate staff member"
        :primary-icon="Undo2"
        :primary-disabled="!confirmed || isProcessing"
        :primary-loading="isProcessing"
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
import { Undo2 } from '@lucide/vue'
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
