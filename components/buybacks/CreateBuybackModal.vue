<template>
  <SidePanel
    :model-value="modelValue"
    title="Record customer buyback"
    subtitle="Purchase an item from a customer and add it to inventory for resale."
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <div class="space-y-4">
      <div
        class="rounded-sm border border-emerald-200/80 bg-emerald-50/90 p-3 text-xs text-emerald-950 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-100"
      >
        <strong>Not a sale:</strong>
        You pay the customer and the item goes straight into stock. Use swap-in on a receipt when
        trade-in credit applies to a sale happening now.
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >Customer name *</label
          >
          <input
            v-model="customerName"
            type="text"
            maxlength="120"
            autocomplete="name"
            placeholder="Who sold this item?"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >Phone (optional)</label
          >
          <input
            v-model="customerPhone"
            type="tel"
            maxlength="40"
            autocomplete="tel"
            placeholder="Contact number"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >Email (optional)</label
          >
          <input
            v-model="customerEmail"
            type="email"
            maxlength="120"
            autocomplete="email"
            placeholder="Email address"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >Inventory category *</label
        >
        <select v-model="folderId" class="app-field w-full px-3 py-2 text-sm">
          <option value="">Select category</option>
          <option v-for="folder in folders" :key="folder.id" :value="folder.id">
            {{ folderOptionLabel(folder) }}
          </option>
        </select>
      </div>

      <div v-if="folderId && folder" class="space-y-3 rounded-sm bg-gray-50/90 p-3 dark:bg-gray-900/40">
        <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">Item details</p>
        <BuybackItemFields
          :fields="displayFields"
          :model-value="itemForm"
          :field-label="fieldLabel"
          :field-placeholder="fieldPlaceholder"
          @update:model-value="itemForm = $event"
        />
        <p v-if="displayFields.length === 0" class="text-xs text-gray-500 dark:text-gray-400">
          This category has no fields configured yet.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >Amount paid to customer *</label
          >
          <div class="relative">
            <span
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
              >{{ currencySymbol }}</span
            >
            <input
              v-model.number="purchasePrice"
              type="number"
              min="0"
              step="0.01"
              class="app-field w-full py-2 pl-7 pr-3 text-sm"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >Payment method *</label
          >
          <PaymentMethodSelect v-model="paymentMethod" required />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >Notes (optional)</label
        >
        <textarea
          v-model="notes"
          rows="2"
          maxlength="1000"
          placeholder="Condition, ID check, reference…"
          class="app-field w-full resize-y px-3 py-2 text-sm"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          :class="[footerBtnOutlineClass, 'w-full sm:w-auto']"
          :disabled="submitting"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          :class="[footerBtnPrimaryClass, 'w-full sm:w-auto']"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submit"
        >
          Record buyback
        </Button>
      </div>
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import Button from '~/components/ui/Button.vue'
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
  displayFields,
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
  if (!validateRequiredFields()) return false
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
