<template>
  <SidePanel
    :model-value="modelValue"
    title="Edit lead"
    subtitle="Update contact details or product interest."
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <div class="space-y-4">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >Phone</label
        >
        <input
          v-model="customerPhone"
          type="tel"
          maxlength="40"
          autocomplete="tel"
          class="app-field w-full px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >Product interest *</label
        >
        <input
          v-model="productName"
          type="text"
          maxlength="160"
          class="app-field w-full px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >Estimated value (optional)</label
        >
        <div class="relative">
          <span
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
            >{{ currencySymbol }}</span
          >
          <input
            v-model.number="estimatedValue"
            type="number"
            min="0"
            step="0.01"
            class="app-field w-full py-2 pl-7 pr-3 text-sm"
          />
        </div>
      </div>

      <p v-if="errorMessage" class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button variant="outline" size="sm" :disabled="isSaving" @click="emit('update:modelValue', false)">
          Cancel
        </Button>
        <Button variant="primary" size="sm" :loading="isSaving" :disabled="!canSave" @click="save">
          Save changes
        </Button>
      </div>
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import Button from '~/components/ui/Button.vue'
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
