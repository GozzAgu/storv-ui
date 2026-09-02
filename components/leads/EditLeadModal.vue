<template>
  <SidePanel
    :model-value="modelValue"
    title="Edit lead"
    size="lg"
    dense
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <IosForm layout="fill" @submit="save">
      <IosFormSection fixed>
        <IosFormField label="Phone">
          <IosFormInput
            v-model="customerPhone"
            type="tel"
            maxlength="40"
            autocomplete="tel"
          />
        </IosFormField>

        <IosFormField label="Product interest" required>
          <IosFormInput v-model="productName" maxlength="160" />
        </IosFormField>

        <IosFormField label="Estimated value" hint="Optional">
          <div class="relative">
            <span
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
              >{{ currencySymbol }}</span
            >
            <IosFormInput
              v-model="estimatedValue"
              type="number"
              min="0"
              step="0.01"
              extra-class="pl-7"
            />
          </div>
        </IosFormField>
      </IosFormSection>

      <p v-if="errorMessage" class="ios-form__error">{{ errorMessage }}</p>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        primary-label="Save changes"
        :primary-loading="isSaving"
        :primary-disabled="!canSave"
        :cancel-disabled="isSaving"
        @cancel="emit('update:modelValue', false)"
        @primary="save"
      />
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import {
  IosForm,
  IosFormSection,
  IosFormField,
  IosFormInput,
} from '~/components/ios/forms'
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
