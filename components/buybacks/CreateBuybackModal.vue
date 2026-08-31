<template>
  <SidePanel
    :model-value="modelValue"
    title="Record customer buyback"
    subtitle="Purchase an item from a customer and add it to inventory for resale."
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <IosForm id="buyback-drawer-form" layout="fill" @submit="submit">
      <IosFormSection fixed>
        <p
          class="rounded-sm border border-emerald-200/80 bg-emerald-50/90 p-3 text-xs text-emerald-950 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-100"
        >
          <strong>Not a sale:</strong>
          You pay the customer and the item goes straight into stock. Use swap-in on a receipt
          when trade-in credit applies to a sale happening now.
        </p>
      </IosFormSection>

      <IosFormSection title="Customer" fixed>
        <IosFormField label="Customer name" required>
          <IosFormInput
            v-model="customerName"
            maxlength="120"
            autocomplete="name"
            placeholder="Who sold this item?"
          />
        </IosFormField>
        <IosFormField label="Phone" hint="Optional">
          <IosFormInput
            v-model="customerPhone"
            type="tel"
            maxlength="40"
            autocomplete="tel"
            placeholder="Contact number"
          />
        </IosFormField>
        <IosFormField label="Email" hint="Optional">
          <IosFormInput
            v-model="customerEmail"
            type="email"
            maxlength="120"
            autocomplete="email"
            placeholder="Email address"
          />
        </IosFormField>
      </IosFormSection>

      <IosFormSection title="Item" fixed>
        <IosFormField label="Inventory category" required>
          <IosFormSelect v-model="folderId" required extra-class="cursor-pointer">
            <option value="">Select category</option>
            <option v-for="folder in folders" :key="folder.id" :value="folder.id">
              {{ folderOptionLabel(folder) }}
            </option>
          </IosFormSelect>
        </IosFormField>

        <template v-if="folderId && folder">
          <BuybackItemFields
            :fields="buybackDisplayFields"
            :model-value="itemForm"
            :field-label="fieldLabel"
            :field-placeholder="fieldPlaceholder"
            @update:model-value="itemForm = $event"
          />
          <p
            v-if="buybackDisplayFields.length === 0"
            class="ios-form__hint dash-drawer-hint"
          >
            This category has no fields configured yet.
          </p>
        </template>
      </IosFormSection>

      <IosFormSection title="Payment" fixed>
        <IosFormField label="Amount paid to customer" required>
          <div class="relative">
            <span
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
              >{{ currencySymbol }}</span
            >
            <IosFormInput
              v-model="purchasePrice"
              type="number"
              min="0"
              step="0.01"
              extra-class="pl-7"
              placeholder="0.00"
            />
          </div>
        </IosFormField>

        <IosFormField label="Payment method" required>
          <PaymentMethodSelect v-model="paymentMethod" required />
        </IosFormField>

        <IosFormField label="Notes" hint="Optional">
          <IosFormTextarea
            v-model="notes"
            :rows="2"
            maxlength="1000"
            placeholder="Condition, ID check, reference…"
          />
        </IosFormField>
      </IosFormSection>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        primary-label="Record buyback"
        :primary-loading="submitting"
        :primary-disabled="!canSubmit"
        :cancel-disabled="submitting"
        @cancel="emit('update:modelValue', false)"
        @primary="submit"
      />
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import PaymentMethodSelect from '~/components/receipts/PaymentMethodSelect.vue'
import BuybackItemFields from '~/components/buybacks/BuybackItemFields.vue'
import {
  IosForm,
  IosFormSection,
  IosFormField,
  IosFormInput,
  IosFormSelect,
  IosFormTextarea,
} from '~/components/ios/forms'
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
const { footerBtnOutlineClass, footerBtnPrimaryClass } = useDashboardOverlayChrome()
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
    toast.success('Buyback recorded', 'Item added to inventory and ready to sell.')
    emit('created', buybackId)
    emit('update:modelValue', false)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Could not record buyback'
    toast.error('Buyback failed', msg)
  } finally {
    submitting.value = false
  }
}
</script>
