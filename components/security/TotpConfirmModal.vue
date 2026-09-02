<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import { IosFormField, IosFormInput } from '~/components/ios/forms'

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
  <Modal
    :model-value="modelValue"
    :title="title || 'Confirm with authenticator'"
    :subtitle="description || 'Enter the 6-digit code from your authenticator app.'"
    size="sm"
    @update:model-value="(value: boolean) => { if (!value) close() }"
  >
    <IosFormField label="Authenticator code" for="totp-confirm-code">
      <IosFormInput
        id="totp-confirm-code"
        v-model="code"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        extra-class="rounded-xl text-center text-lg tracking-[0.35em]"
        placeholder="000000"
        @keyup.enter="submit"
      />
    </IosFormField>
    <template #footer>
      <IosDrawerActions
        primary-label="Confirm"
        :primary-loading="loading"
        :primary-disabled="code.trim().length !== 6"
        :cancel-disabled="loading"
        @cancel="close"
        @primary="submit"
      />
    </template>
  </Modal>
</template>
