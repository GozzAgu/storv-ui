<template>
  <SDialog v-model:open="open" title="How likely are you to recommend Storvv?" description="Your feedback helps us improve for shop owners like you." size="sm">
    <SForm>
      <SFormSection>
        <fieldset class="s-nps" aria-label="Score from 0, not likely, to 10, very likely">
          <div class="s-nps__scale">
            <button
              v-for="score in scores"
              :key="score"
              type="button"
              class="s-nps__score"
              :aria-pressed="selected === score"
              @click="selected = score"
            >
              {{ score }}
            </button>
          </div>
          <div class="s-nps__legend" aria-hidden="true">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </fieldset>
        <SField label="Comment" hint="Optional">
          <STextarea
            v-model="comment"
            :rows="3"
            placeholder="What would make Storvv better for your shop?"
          />
        </SField>
      </SFormSection>
    </SForm>
    <template #footer>
      <SDialogActions
        cancel-label="Not now"
        primary-label="Submit"
        :primary-loading="submitting"
        :primary-disabled="selected == null"
        @cancel="onDismiss"
        @primary="onSubmit"
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
const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  submit: [score: number, comment?: string]
  dismiss: []
}>()

const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const selected = ref<number | null>(null)
const comment = ref('')
const submitting = ref(false)

async function onSubmit() {
  if (selected.value == null) return
  submitting.value = true
  try {
    emit('submit', selected.value, comment.value)
    open.value = false
  } finally {
    submitting.value = false
  }
}

function onDismiss() {
  emit('dismiss')
  open.value = false
}
</script>
