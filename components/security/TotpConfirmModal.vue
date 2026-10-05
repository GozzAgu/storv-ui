<script setup lang="ts">
import { ref, watch } from 'vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SInput from '~/components/s/SInput.vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
  description?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [code: string]
  cancel: []
}>()

const code = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) code.value = ''
  }
)

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}

function submit() {
  const trimmed = code.value.trim()
  if (trimmed.length !== 6) return
  emit('confirm', trimmed)
}
</script>

<template>
  <SDialog
    :open="modelValue"
    :title="title || 'Confirm with authenticator'"
    :description="description || 'Enter the 6-digit code from your authenticator app.'"
    size="sm"
    :dismissible="!loading"
    @update:open="(value: boolean) => { if (!value) close() }"
  >
    <SInput
      id="totp-confirm-code"
      v-model="code"
      label="Authenticator code"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="6"
      class="s-otp-input"
      placeholder="000000"
      @keyup.enter="submit"
    />
    <template #footer>
      <SDialogActions
        primary-label="Confirm"
        :primary-loading="loading"
        :primary-disabled="code.trim().length !== 6"
        :cancel-disabled="loading"
        @cancel="close"
        @primary="submit"
      />
    </template>
  </SDialog>
</template>
