<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'

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
    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300" for="totp-confirm-code">
      Authenticator code
    </label>
    <input
      id="totp-confirm-code"
      v-model="code"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="6"
      class="app-field mt-1.5 w-full rounded-xl px-3 py-2 text-center text-lg tracking-[0.35em]"
      placeholder="000000"
      @keyup.enter="submit"
    />
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
