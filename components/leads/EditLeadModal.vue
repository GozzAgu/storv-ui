<template>
  <SDialog
      placement="right"
    :open="modelValue"
    title="Edit lead"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <SForm @submit="save">
      <SFormSection>
        <div class="s-form-pair">
          <SField label="Phone">
            <SInput
              v-model="customerPhone"
              type="tel"
              maxlength="40"
              autocomplete="tel"
            />
          </SField>

          <SField label="Estimated value" hint="Optional">
            <SInput v-model="estimatedValue" type="number" min="0" step="0.01">
              <template #prefix>{{ currencySymbol }}</template>
            </SInput>
          </SField>
        </div>

        <SField label="Product interest" required>
          <SInput v-model="productName" maxlength="160" />
        </SField>
      </SFormSection>

      <p v-if="errorMessage" class="s-field__error" role="alert">{{ errorMessage }}</p>
    </SForm>

    <template #footer>
      <SDialogActions
        primary-label="Save changes"
        :primary-loading="isSaving"
        :primary-disabled="!canSave"
        :cancel-disabled="isSaving"
        @cancel="emit('update:modelValue', false)"
        @primary="save"
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
import SInput from '~/components/s/SInput.vue'
import { computed, ref, watch } from 'vue'
import { usePreferences } from '~/composables/usePreferences'
import { useSalesLeadsStore } from '~/stores/salesLeads'
import type { SalesLead } from '~/types/leads'

const props = defineProps<{
  modelValue: boolean
  lead: SalesLead | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const salesLeadsStore = useSalesLeadsStore()
const { preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value.currencySymbol || '$')

const customerPhone = ref('')
const productName = ref('')
const estimatedValue = ref<number | null>(null)
const isSaving = ref(false)
const errorMessage = ref('')

const canSave = computed(() => productName.value.trim().length > 0)

watch(
  () => [props.modelValue, props.lead] as const,
  ([open, lead]) => {
    if (!open || !lead) return
    customerPhone.value = lead.customerPhone || ''
    productName.value = lead.productName
    estimatedValue.value =
      typeof lead.estimatedValue === 'number' && lead.estimatedValue > 0
        ? lead.estimatedValue
        : null
    errorMessage.value = ''
  },
  { immediate: true }
)

async function save() {
  if (!props.lead || !canSave.value || isSaving.value) return
  isSaving.value = true
  errorMessage.value = ''
  try {
    await salesLeadsStore.updateSalesLead(props.lead.id, {
      customerPhone: customerPhone.value,
      productName: productName.value,
      estimatedValue: estimatedValue.value ?? undefined,
    })
    emit('saved')
    emit('update:modelValue', false)
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : 'Could not save lead'
  } finally {
    isSaving.value = false
  }
}
</script>
