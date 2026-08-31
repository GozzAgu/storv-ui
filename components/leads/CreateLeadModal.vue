<template>
  <SidePanel
    :model-value="modelValue"
    title="Add sales lead"
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <IosForm @submit="save">
      <IosFormSection>
        <IosFormField label="Customer name" required>
          <IosFormInput
            v-model="customerName"
            maxlength="120"
            autocomplete="name"
            placeholder="Who is enquiring?"
            @blur="refreshDuplicateWarning"
          />
        </IosFormField>

        <IosFormField label="Phone" hint="Optional">
          <IosFormInput
            v-model="customerPhone"
            type="tel"
            maxlength="40"
            autocomplete="tel"
            placeholder="Contact number"
            @blur="refreshDuplicateWarning"
          />
        </IosFormField>

        <IosFormField label="Email" hint="Optional">
          <IosFormInput
            v-model="customerEmail"
            type="email"
            maxlength="120"
            autocomplete="email"
            placeholder="Email address"
            @blur="refreshDuplicateWarning"
          />
        </IosFormField>
      </IosFormSection>

      <div
        v-if="duplicateLead"
        class="rounded-sm border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-100"
      >
        An open lead already exists for this contact ({{ duplicateLead.customerName }}).
        <NuxtLink
          :to="dashPath(`/leads/${duplicateLead.id}`)"
          class="font-medium underline underline-offset-2"
          @click="emit('update:modelValue', false)"
        >
          Open existing lead
        </NuxtLink>
      </div>

      <IosFormSection>
        <IosFormField label="Product interest" required>
          <IosFormInput
            v-model="productName"
            maxlength="160"
            placeholder="What are they looking for?"
          />
        </IosFormField>

        <IosFormField label="Link inventory item" hint="Optional">
          <div class="flex flex-wrap gap-2">
            <IosFormInput
              v-model="inventorySearchQuery"
              maxlength="160"
              placeholder="Search in-stock products…"
              extra-class="min-w-0 flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              :loading="inventoryLinkLoading"
              :disabled="!inventorySearchQuery.trim()"
              @click="linkInventoryItem"
            >
              Find item
            </Button>
          </div>
          <p v-if="linkedInventoryLabel" class="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
            Linked: {{ linkedInventoryLabel }}
            <button
              type="button"
              class="ml-1 font-medium text-primary-600 hover:underline dark:text-primary-400"
              @click="clearInventoryLink"
            >
              Clear
            </button>
          </p>
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
              placeholder="0.00"
            />
          </div>
        </IosFormField>

        <IosFormField label="Source" required>
          <IosFormSelect v-model="source">
            <option v-for="option in SALES_LEAD_SOURCES" :key="option" :value="option">
              {{ SALES_LEAD_SOURCE_LABELS[option] }}
            </option>
          </IosFormSelect>
        </IosFormField>

        <IosFormField label="Notes" hint="Optional">
          <IosFormTextarea
            v-model="notes"
            :rows="3"
            maxlength="500"
            placeholder="Anything useful for follow-up"
          />
        </IosFormField>
      </IosFormSection>

      <p v-if="errorMessage" class="ios-form__error">{{ errorMessage }}</p>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        cancel-label="Cancel"
        primary-label="Save lead"
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
import Button from '~/components/ui/Button.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import {
  IosForm,
  IosFormSection,
  IosFormField,
  IosFormInput,
  IosFormTextarea,
  IosFormSelect,
} from '~/components/ios/forms'
import { usePreferences } from '~/composables/usePreferences'
import { useSalesLeadsStore } from '~/stores/salesLeads'
import { findDuplicateOpenLead } from '~/composables/leads/findDuplicateOpenLead'
import { resolveLeadProductInventoryMatch } from '~/composables/leads/resolveLeadProductInventoryMatch'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import {
  SALES_LEAD_SOURCES,
  SALES_LEAD_SOURCE_LABELS,
  type SalesLead,
  type SalesLeadSource,
} from '~/types/leads'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [leadId: string]
}>()

const salesLeadsStore = useSalesLeadsStore()
const { dashPath } = useDashboardPaths()
const { preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value.currencySymbol || '$')

const customerName = ref('')
const customerPhone = ref('')
const customerEmail = ref('')
const productName = ref('')
const estimatedValue = ref<number | null>(null)
const source = ref<SalesLeadSource>('walk_in')
const notes = ref('')
const inventoryItemId = ref('')
const linkedInventoryLabel = ref('')
const inventorySearchQuery = ref('')
const inventoryLinkLoading = ref(false)
const duplicateLead = ref<SalesLead | null>(null)
const isSaving = ref(false)
const errorMessage = ref('')

const canSave = computed(
  () => customerName.value.trim().length > 0 && productName.value.trim().length > 0
)

function resetForm() {
  customerName.value = ''
  customerPhone.value = ''
  customerEmail.value = ''
  productName.value = ''
  estimatedValue.value = null
  source.value = 'walk_in'
  notes.value = ''
  inventoryItemId.value = ''
  linkedInventoryLabel.value = ''
  inventorySearchQuery.value = ''
  duplicateLead.value = null
  errorMessage.value = ''
}

async function refreshDuplicateWarning() {
  if (salesLeadsStore.leads.length === 0) {
    await salesLeadsStore.fetchSalesLeads(true)
  }
  duplicateLead.value = findDuplicateOpenLead(salesLeadsStore.leads, {
    phone: customerPhone.value,
    email: customerEmail.value,
  })
}

function clearInventoryLink() {
  inventoryItemId.value = ''
  linkedInventoryLabel.value = ''
}

async function linkInventoryItem() {
  const query = inventorySearchQuery.value.trim() || productName.value.trim()
  if (!query || inventoryLinkLoading.value) return
  inventoryLinkLoading.value = true
  errorMessage.value = ''
  try {
    const match = await resolveLeadProductInventoryMatch(query)
    if (!match) {
      errorMessage.value = 'No in-stock item matched that search.'
      return
    }
    inventoryItemId.value = match.item.id
    linkedInventoryLabel.value = getInventoryItemDisplayName(match.item)
    if (!productName.value.trim()) {
      productName.value = linkedInventoryLabel.value
    }
  } finally {
    inventoryLinkLoading.value = false
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      resetForm()
      if (salesLeadsStore.leads.length === 0) {
        await salesLeadsStore.fetchSalesLeads(true)
      }
    }
  }
)

async function save() {
  if (!canSave.value || isSaving.value) return
  await refreshDuplicateWarning()
  if (duplicateLead.value) {
    errorMessage.value = 'An open lead already exists for this contact.'
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  try {
    const leadId = await salesLeadsStore.createSalesLead({
      customerName: customerName.value,
      customerPhone: customerPhone.value,
      customerEmail: customerEmail.value,
      productName: productName.value,
      inventoryItemId: inventoryItemId.value || undefined,
      estimatedValue: estimatedValue.value ?? undefined,
      source: source.value,
      notes: notes.value,
    })
    emit('created', leadId)
    emit('update:modelValue', false)
  } catch (e: unknown) {
    errorMessage.value = e instanceof Error ? e.message : 'Could not save lead'
  } finally {
    isSaving.value = false
  }
}
</script>