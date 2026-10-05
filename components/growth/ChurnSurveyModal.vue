<template>
  <SDialog v-model:open="open" title="Before you go" description="Help us understand what we could do better." size="sm">
    <SForm>
      <SFormSection>
        <fieldset class="s-choices" aria-label="Main reason for leaving">
          <label
            v-for="reason in CHURN_SURVEY_REASONS"
            :key="reason.id"
            class="s-choice"
            :class="{ 's-choice--selected': selected === reason.id }"
          >
            <input
              v-model="selected"
              type="radio"
              name="churn-reason"
              class="s-choice__input"
              :value="reason.id"
            />
            <span>{{ reason.label }}</span>
          </label>
        </fieldset>
        <SField label="Comment" hint="Optional">
          <STextarea
            v-model="comment"
            :rows="3"
            placeholder="Anything else we should know?"
          />
        </SField>
      </SFormSection>
    </SForm>
    <template #footer>
      <SDialogActions
        cancel-label="Skip"
        primary-label="Send feedback"
        :primary-loading="submitting"
        :primary-disabled="!selected"
        @cancel="skip"
        @primary="submit"
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
import STextarea from '~/components/s/STextarea.vue'
import { ref } from 'vue'
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
