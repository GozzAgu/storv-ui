<template>
  <Modal v-model="open" title="Before you go" subtitle="Help us understand what we could do better." size="sm">
    <div class="space-y-3">
      <label
        v-for="reason in CHURN_SURVEY_REASONS"
        :key="reason.id"
        class="flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs transition-colors"
        :class="
          selected === reason.id
            ? 'border-primary-500/40 bg-primary-500/[0.06] dark:border-primary-400/30'
            : 'border-gray-200 dark:border-white/10'
        "
      >
        <input v-model="selected" type="radio" class="mt-0.5" :value="reason.id" />
        <span class="text-gray-800 dark:text-gray-200">{{ reason.label }}</span>
      </label>
      <textarea
        v-model="comment"
        rows="3"
        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.03]"
        placeholder="Anything else we should know? (optional)"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="sm" @click="skip">Skip</Button>
        <Button variant="primary" size="sm" :disabled="!selected || submitting" @click="submit">
          {{ submitting ? 'Sending…' : 'Send feedback' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { CHURN_SURVEY_REASONS } from '~/types/growth'

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  submit: [reason: string, comment?: string]
  skip: []
}>()

const selected = ref('')
const comment = ref('')
const submitting = ref(false)

function skip() {
  emit('skip')
  open.value = false
}

async function submit() {
  if (!selected.value) return
  submitting.value = true
  try {
    emit('submit', selected.value, comment.value)
    open.value = false
  } finally {
    submitting.value = false
  }
}
</script>
