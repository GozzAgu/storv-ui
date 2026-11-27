<template>
  <SDialog
    placement="right"
    :open="modelValue"
    title="Record a trade-in"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <SForm id="buyback-drawer-form" @submit="submit">
      <p class="s-callout">
        <strong>Not a sale:</strong>
        You pay the customer and the item goes straight into stock. Use swap-in on a receipt when
        trade-in credit applies to a sale happening now.
      </p>

      <SStep
        :number="1"
        title="Who is selling the item?"
        hint="Their name goes on the trade-in record. Phone and email help if you need to reach them later."
        :done="customerDone"
      >
        <SField label="Customer name" required>
          <SInput
            v-model="customerName"
            maxlength="120"
            autocomplete="name"
            placeholder="Who sold this item?"
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
            />
          </SField>
          <SField label="Email" hint="Optional">
            <SInput
              v-model="customerEmail"
              type="email"
              maxlength="120"
              autocomplete="email"
              placeholder="Email address"
            />
          </SField>
        </div>
      </SStep>

      <SStep
        :number="2"
        title="Describe the item"
        hint="Pick its category first. The details that category needs will appear below."
        :done="itemDone"
      >
        <SField label="Inventory category" required>
          <SSelect v-model="folderId" required>
            <option value="">Select category</option>
            <option v-for="folder in folders" :key="folder.id" :value="folder.id">
              {{ folderOptionLabel(folder) }}
            </option>
          </SSelect>
        </SField>

        <template v-if="folderId && folder">
          <BuybackItemFields
            :fields="buybackDisplayFields"
            :model-value="itemForm"
            :field-label="fieldLabel"
            :field-placeholder="fieldPlaceholder"
            @update:model-value="itemForm = $event"
          />
          <p v-if="buybackDisplayFields.length === 0" class="s-form-meta">
            This category has no fields configured yet.
          </p>
        </template>
      </SStep>

      <SStep
        :number="3"
        title="Record what you paid"
        hint="The amount you gave the customer and how you paid them."
        :done="paymentDone"
      >
        <div class="s-form-pair">
          <SField label="Amount paid to customer" required>
            <SInput v-model="purchasePrice" type="number" min="0" step="0.01" placeholder="0.00">
              <template #prefix>{{ currencySymbol }}</template>
            </SInput>
          </SField>

          <SField v-slot="{ id }" label="Payment method" required>
            <div class="s-control s-control--select">
              <PaymentMethodSelect
                :id="id"
                v-model="paymentMethod"
                required
                select-class="s-control__input"
              />
              <ChevronDown
                class="s-control__chevron"
                :size="16"
                :stroke-width="1.75"
                aria-hidden="true"
              />
            </div>
          </SField>
        </div>
      </SStep>

      <SStep
        :number="4"
        title="Add a note"
        hint="Condition, ID check or anything you want to remember."
        optional
      >
        <SField label="Notes" hint="Optional">
          <STextarea
            v-model="notes"
            :rows="2"
            maxlength="1000"
            placeholder="Condition, ID check, reference…"
          />
        </SField>
      </SStep>
    </SForm>

    <template #footer>
      <SStepSummary>
        <template v-if="!customerDone">Start with the customer's name.</template>
        <template v-else-if="!folderId || !folder">Now choose the item's category.</template>
        <template v-else-if="!itemDone">Fill in the item's required details.</template>
        <template v-else-if="!priceValid">Enter the amount you paid the customer.</template>
        <template v-else-if="!paymentMethod.trim()">Choose how you paid them.</template>
        <template v-else>
          Pay <strong>{{ priceLabel }}</strong> to {{ customerName.trim() }} · item goes into stock
          under {{ folder?.name }}
        </template>
      </SStepSummary>
      <SDialogActions
        primary-label="Record trade-in"
        :primary-loading="submitting"
        :primary-disabled="!canSubmit"
        :cancel-disabled="submitting"
        @cancel="emit('update:modelValue', false)"
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
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import SStep from '~/components/s/SStep.vue'
import SStepSummary from '~/components/s/SStepSummary.vue'
import STextarea from '~/components/s/STextarea.vue'
import { computed, ref, watch } from 'vue'
import { ChevronDown } from '~/icons'
import PaymentMethodSelect from '~/components/receipts/PaymentMethodSelect.vue'
import BuybackItemFields from '~/components/buybacks/BuybackItemFields.vue'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomerBuybacksStore } from '~/stores/customerBuybacks'
import { useInventoryItemCaptureForm } from '~/composables/useInventoryItemCaptureForm'
import { useAppToast } from '~/composables/useAppToast'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [buybackId: string]
}>()

const inventoryStore = useInventoryStore()
const buybacksStore = useCustomerBuybacksStore()
const toast = useAppToast()
const { preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol ?? '$')

const folders = computed(() => inventoryStore.leafFolders)

function folderOptionLabel(folder: (typeof folders.value)[number]): string {
  const parent = inventoryStore.folders.find(
    (entry) => entry.id === folder.parentId && folder.parentId
  )
  return parent ? `${folder.name} · ${parent.name}` : folder.name
}
const {
  folderId,
  itemForm,
  folder,
  buybackDisplayFields,
  fieldLabel,
  fieldPlaceholder,
  validateRequiredFields,
  buildItemPayload,
  reset,
} = useInventoryItemCaptureForm(folders)

const customerName = ref('')
const customerPhone = ref('')
const customerEmail = ref('')
const purchasePrice = ref<number | null>(null)
const paymentMethod = ref('')
const notes = ref('')
const submitting = ref(false)

const customerDone = computed(() => !!customerName.value.trim())
const itemDone = computed(
  () => !!folderId.value && !!folder.value && validateRequiredFields({ excludeCostPrice: true })
)
const priceValid = computed(() => {
  const price = Number(purchasePrice.value)
  return Number.isFinite(price) && price > 0
})
const paymentDone = computed(() => priceValid.value && !!paymentMethod.value.trim())
const priceLabel = computed(
  () =>
    `${currencySymbol.value}${Number(purchasePrice.value).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`
)

const canSubmit = computed(() => {
  if (!customerName.value.trim()) return false
  if (!folderId.value || !folder.value) return false
  if (!validateRequiredFields({ excludeCostPrice: true })) return false
  const price = Number(purchasePrice.value)
  if (!Number.isFinite(price) || price <= 0) return false
  if (!paymentMethod.value.trim()) return false
  return !submitting.value
})

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    customerName.value = ''
    customerPhone.value = ''
    customerEmail.value = ''
    purchasePrice.value = null
    paymentMethod.value = ''
    notes.value = ''
    reset()
    if (inventoryStore.folders.length === 0) {
      await inventoryStore.fetchFolders()
    }
  }
)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const buybackId = await buybacksStore.createCustomerBuyback({
      customerName: customerName.value,
      customerPhone: customerPhone.value,
      customerEmail: customerEmail.value,
      folderId: folderId.value,
      itemData: buildItemPayload(),
      purchasePrice: Number(purchasePrice.value),
      paymentMethod: paymentMethod.value,
      notes: notes.value,
    })
    toast.success('Trade-in recorded', 'Item added to inventory and ready to sell.')
    emit('created', buybackId)
    emit('update:modelValue', false)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Could not record trade-in'
    toast.error('Trade-in failed', msg)
  } finally {
    submitting.value = false
  }
}
</script>
