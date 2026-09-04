<template>
  <Modal v-model="open" title="How likely are you to recommend Storvv?" subtitle="Your feedback helps us improve for shop owners like you." size="sm">
    <IosForm layout="default" scroll>
      <IosFormSection fixed>
        <div class="flex flex-wrap justify-between gap-1">
          <button
            v-for="score in scores"
            :key="score"
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors"
            :class="
              selected === score
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200'
            "
            @click="selected = score"
          >
            {{ score }}
          </button>
        </div>
        <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
        <IosFormField label="Comment" hint="Optional">
          <IosFormTextarea
            v-model="comment"
            :rows="3"
            placeholder="What would make Storvv better for your shop?"
          />
        </IosFormField>
      </IosFormSection>
    </IosForm>
    <template #footer>
      <IosDrawerActions
        cancel-label="Not now"
        cancel-variant="ghost"
        primary-label="Submit"
        :primary-loading="submitting"
        :primary-disabled="selected == null"
        @cancel="onDismiss"
        @primary="onSubmit"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import { IosForm, IosFormSection, IosFormField, IosFormTextarea } from '~/components/ios/forms'

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
