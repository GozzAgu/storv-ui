<template>
  <Modal v-model="open" title="Before you go" subtitle="Help us understand what we could do better." size="sm">
    <IosForm layout="default" scroll>
      <IosFormSection fixed>
        <div class="space-y-2">
          <label
            v-for="reason in CHURN_SURVEY_REASONS"
            :key="reason.id"
            class="flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs transition-colors"
            :class="
              selected === reason.id
                ? 'border-gray-900/60 bg-gray-900/[0.04] dark:border-white/40 dark:bg-white/[0.06]'
                : 'border-gray-200 dark:border-white/10'
            "
          >
            <input v-model="selected" type="radio" class="mt-0.5" :value="reason.id" />
            <span class="text-gray-800 dark:text-gray-200">{{ reason.label }}</span>
          </label>
        </div>
        <IosFormField label="Comment" hint="Optional">
          <IosFormTextarea
            v-model="comment"
            :rows="3"
            placeholder="Anything else we should know?"
          />
        </IosFormField>
      </IosFormSection>
    </IosForm>
    <template #footer>
      <IosDrawerActions
        cancel-label="Skip"
        cancel-variant="ghost"
        primary-label="Send feedback"
        :primary-loading="submitting"
        :primary-disabled="!selected"
        @cancel="skip"
        @primary="submit"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import { IosForm, IosFormSection, IosFormField, IosFormTextarea } from '~/components/ios/forms'
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
