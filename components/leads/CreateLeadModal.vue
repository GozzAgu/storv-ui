<template>
  <SDialog
      placement="right"
    :open="modelValue"
    title="Add sales lead"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <SForm @submit="save">
      <SFormSection>
        <SField label="Customer name" required>
          <SInput
            v-model="customerName"
            maxlength="120"
            autocomplete="name"
            placeholder="Who is enquiring?"
            @blur="refreshDuplicateWarning"
          />
        </SField>

        <div class="s-form-pair">
          <SField label="Phone" hint="Optional">
            <SInput
              v-model="customerPhone"
              type="tel"
              maxlength="40"
              autocomplete="tel"
              placeholder="Contact number"
              @blur="refreshDuplicateWarning"
            />
          </SField>

          <SField label="Email" hint="Optional">
            <SInput
              v-model="customerEmail"
              type="email"
              maxlength="120"
              autocomplete="email"
              placeholder="Email address"
              @blur="refreshDuplicateWarning"
            />
          </SField>
        </div>
      </SFormSection>

      <p v-if="duplicateLead" class="s-callout" role="status">
        An open lead already exists for this contact ({{ duplicateLead.customerName }}).
        <NuxtLink
          :to="dashPath(`/leads/${duplicateLead.id}`)"
          class="s-link"
          @click="emit('update:modelValue', false)"
        >
          Open existing lead
        </NuxtLink>
      </p>

      <SFormSection>
        <SField label="Product interest" required>
          <SInput
            v-model="productName"
            maxlength="160"
            placeholder="What are they looking for?"
          />
        </SField>

        <SField label="Link inventory item" hint="Optional">
          <div class="s-inline-field">
            <div class="s-inline-field__grow">
              <SInput
                v-model="inventorySearchQuery"
                maxlength="160"
                placeholder="Search in-stock products…"
              />
            </div>
            <SButton
              :loading="inventoryLinkLoading"
              :disabled="!inventorySearchQuery.trim()"
              @click="linkInventoryItem"
            >
              Find item
            </SButton>
          </div>
          <p v-if="linkedInventoryLabel" class="s-form-meta">
            Linked: <strong>{{ linkedInventoryLabel }}</strong>
            <button type="button" class="s-link" @click="clearInventoryLink">Clear</button>
          </p>
        </SField>

        <div class="s-form-pair">
          <SField label="Estimated value" hint="Optional">
            <SInput v-model="estimatedValue" type="number" min="0" step="0.01" placeholder="0.00">
              <template #prefix>{{ currencySymbol }}</template>
            </SInput>
          </SField>

          <SField label="Source" required>
            <SSelect v-model="source">
              <option v-for="option in SALES_LEAD_SOURCES" :key="option" :value="option">
                {{ SALES_LEAD_SOURCE_LABELS[option] }}
              </option>
            </SSelect>
          </SField>
        </div>

        <SField label="Notes" hint="Optional">
          <STextarea
            v-model="notes"
            :rows="3"
            maxlength="500"
            placeholder="Anything useful for follow-up"
          />
        </SField>
      </SFormSection>

      <p v-if="errorMessage" class="s-field__error" role="alert">{{ errorMessage }}</p>
    </SForm>

    <template #footer>
      <SDialogActions
        cancel-label="Cancel"
        primary-label="Save lead"
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
import SSelect from '~/components/s/SSelect.vue'
import STextarea from '~/components/s/STextarea.vue'
import { computed, ref, watch } from 'vue'
import SButton from '~/components/s/SButton.vue'
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