<template>
  <SDialog
    :open="open"
    placement="right"
    size="md"
    title="Return to supplier"
    :description="
      props.hold
        ? 'The customer returned this item. Send it back to the supplier: it leaves inventory and waits in Returns until the supplier settles it.'
        : 'Log stock that came in defective. It leaves inventory and waits in Returns until the supplier settles it.'
    "
    :dismissible="!saving"
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <SForm id="return-to-supplier-form" @submit="submit">
      <!-- Pick the item when the dialog wasn't opened from one -->
      <SFormSection v-if="!props.item && !props.hold">
        <SField label="Category" required>
          <SSelect
            v-model="pickedFolderId"
            :options="folderOptions"
            placeholder="Choose a category"
          />
        </SField>
        <SField
          v-if="pickedFolderId"
          label="Item"
          required
          :hint="loadingItems ? 'Loading items…' : undefined"
        >
          <SSelect
            v-model="pickedItemId"
            :options="itemOptions"
            :disabled="loadingItems || itemOptions.length === 0"
            :placeholder="
              itemOptions.length ? 'Choose the defective item' : 'No items in stock here'
            "
          />
        </SField>
      </SFormSection>

      <SFormSection v-if="props.hold">
        <dl class="s-record-summary s-record-summary--stack">
          <div class="s-record-row">
            <dt>Item</dt>
            <dd class="s-record-row__value">{{ props.hold.item.name }}</dd>
          </div>
          <div v-if="holdDetails" class="s-record-row">
            <dt>Details</dt>
            <dd class="s-record-row__value">{{ holdDetails }}</dd>
          </div>
          <div v-if="!props.hold.item.serial" class="s-record-row">
            <dt>Units</dt>
            <dd class="s-record-row__value">{{ props.hold.item.quantity }}</dd>
          </div>
          <div class="s-record-row">
            <dt>Returned on</dt>
            <dd class="s-record-row__value">
              #{{ props.hold.sale.receiptNumber }} · {{ props.hold.sale.customerName }}
            </dd>
          </div>
        </dl>
      </SFormSection>

      <SFormSection v-else-if="item">
        <dl class="s-record-summary s-record-summary--stack">
          <div class="s-record-row">
            <dt>Item</dt>
            <dd class="s-record-row__value">{{ itemName }}</dd>
          </div>
          <div v-if="itemDetails" class="s-record-row">
            <dt>Details</dt>
            <dd class="s-record-row__value">{{ itemDetails }}</dd>
          </div>
          <div class="s-record-row">
            <dt>Category</dt>
            <dd class="s-record-row__value">{{ folder?.name || 'Inventory' }}</dd>
          </div>
          <div v-if="!serial" class="s-record-row">
            <dt>In stock</dt>
            <dd class="s-record-row__value">{{ available }}</dd>
          </div>
        </dl>
        <p v-if="blockedReason" class="s-callout" role="alert">
          {{ blockedReason }}
        </p>
        <SField v-else-if="!serial" label="Units going back" required>
          <SInput v-model="quantity" type="number" inputmode="numeric" />
        </SField>
      </SFormSection>

      <SFormSection v-if="props.hold || (item && !blockedReason)">
        <SField label="Supplier" required>
          <SInput
            v-model="supplierName"
            maxlength="120"
            list="rts-known-suppliers"
            placeholder="Who you bought it from"
          />
          <datalist id="rts-known-suppliers">
            <option v-for="name in knownSuppliers" :key="name" :value="name" />
          </datalist>
        </SField>
        <SField label="What is wrong with it?" required>
          <STextarea
            v-model="defect"
            :rows="2"
            maxlength="300"
            placeholder="e.g. Arrived with a cracked screen, won't power on"
          />
        </SField>
        <SField label="Supplier reference" hint="Optional">
          <SInput
            v-model="supplierReference"
            maxlength="60"
            placeholder="Invoice, waybill or RMA no."
          />
        </SField>
        <SField label="Notes" hint="Optional">
          <STextarea
            v-model="notes"
            :rows="2"
            maxlength="1000"
            placeholder="When it was found, who inspected it"
          />
        </SField>
        <p class="s-callout">{{ stockNote }}</p>
      </SFormSection>

      <p v-if="error" class="s-field__error" role="alert">{{ error }}</p>
    </SForm>

    <template #footer>
      <SDialogActions
        primary-label="Return to supplier"
        :primary-loading="saving"
        :primary-disabled="!canSubmit"
        :cancel-disabled="saving"
        @cancel="emit('update:open', false)"
        @primary="submit"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import STextarea from '~/components/s/STextarea.vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { useSupplierReturnsStore } from '~/stores/supplierReturns'
import { useInspectionHoldsStore } from '~/stores/inspectionHolds'
import type { InspectionHold } from '~/types/inspection-holds'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { snapshotStockItemDetails, stockItemDetailSummary } from '~/utils/stock-item-details'

/**
 * Logs a defective in-stock item for its supplier. Opened from an inventory item (`item` set) or
 * from the Supplier returns page, where the user picks the category and item.
 */
const props = defineProps<{
  open: boolean
  item?: InventoryItem | null
  /** A customer return waiting for inspection, decided as "return to supplier". */
  hold?: InspectionHold | null
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  logged: []
}>()

const inventoryStore = useInventoryStore()
const returnsStore = useSupplierReturnsStore()
const holdsStore = useInspectionHoldsStore()

const pickedFolderId = ref('')
const pickedItemId = ref('')
const folderItems = ref<InventoryItem[]>([])
const loadingItems = ref(false)

const quantity = ref<string | number>(1)
const supplierName = ref('')
const supplierReference = ref('')
const defect = ref('')
const notes = ref('')
const saving = ref(false)
const error = ref('')

const item = computed<InventoryItem | null>(
  () => props.item ?? folderItems.value.find((i) => i.id === pickedItemId.value) ?? null
)
const folder = computed(() =>
  item.value ? inventoryStore.getFolderById(item.value.folderId) : null
)
const serial = computed(() => folderHasSerialNumbers(folder.value ?? undefined))
const itemName = computed(() =>
  item.value ? getInventoryItemDisplayName(item.value) || 'Item' : ''
)
const itemDetails = computed(() =>
  item.value ? stockItemDetailSummary(snapshotStockItemDetails(item.value), 3) : ''
)

function stockOf(i: InventoryItem): number {
  const f = inventoryStore.getFolderById(i.folderId)
  if (folderHasSerialNumbers(f ?? undefined)) return i.dateOut ? 0 : 1
  return resolveBulkStockFieldAndValueFromMap(i, f?.template?.fields)?.value ?? 0
}

/** Same checks the server makes, so the user sees why before submitting. */
function unavailableReason(i: InventoryItem): string {
  if (i.inspectionHoldId) return 'This item is waiting for inspection. Decide it from To inspect.'
  if (i.sellerLoanOutId) return 'This item is out on a stock loan. Bring it back first.'
  if (i.pendingSaleReceiptId) return 'This item is held on an outstanding order.'
  if (stockOf(i) <= 0) return serial.value ? 'This unit has already been sold.' : 'None in stock.'
  return ''
}

const available = computed(() => (item.value ? stockOf(item.value) : 0))
const blockedReason = computed(() => (item.value ? unavailableReason(item.value) : ''))
const quantityNumber = computed(() => (serial.value ? 1 : Math.floor(Number(quantity.value) || 0)))

const folderOptions = computed(() =>
  inventoryStore.folders
    .map((f) => ({ value: f.id, label: f.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
)
const itemOptions = computed(() =>
  folderItems.value
    .filter((i) => !unavailableReasonFor(i))
    .map((i) => {
      const details = stockItemDetailSummary(snapshotStockItemDetails(i), 2)
      const name = getInventoryItemDisplayName(i) || 'Item'
      const f = inventoryStore.getFolderById(i.folderId)
      const qty = folderHasSerialNumbers(f ?? undefined) ? '' : ` (${stockOf(i)} in stock)`
      return { value: i.id, label: `${name}${details ? ` · ${details}` : ''}${qty}` }
    })
)

function unavailableReasonFor(i: InventoryItem) {
  return !!i.inspectionHoldId || !!i.sellerLoanOutId || !!i.pendingSaleReceiptId || stockOf(i) <= 0
}

const knownSuppliers = computed(() =>
  [...new Set(returnsStore.returns.map((r) => r.supplierName).filter(Boolean))].sort()
)

const holdDetails = computed(() =>
  props.hold ? stockItemDetailSummary(props.hold.item.details, 3) : ''
)

const stockNote = computed(() => {
  if (props.hold) {
    const n = props.hold.item.quantity
    return props.hold.item.serial
      ? 'The held unit will be removed from inventory.'
      : `${n} held unit${n === 1 ? '' : 's'} won't go back into stock.`
  }
  const n = quantityNumber.value || 0
  return serial.value
    ? 'This unit will be removed from inventory.'
    : `${n} unit${n === 1 ? '' : 's'} will be taken off the stock count.`
})

const canSubmit = computed(() => {
  if (props.hold) {
    return !saving.value && supplierName.value.trim().length > 0 && defect.value.trim().length >= 3
  }
  return (
    !!item.value &&
    !blockedReason.value &&
    !saving.value &&
    supplierName.value.trim().length > 0 &&
    defect.value.trim().length >= 3 &&
    quantityNumber.value >= 1 &&
    quantityNumber.value <= available.value
  )
})

watch(pickedFolderId, async (folderId) => {
  pickedItemId.value = ''
  folderItems.value = []
  if (!folderId) return
  loadingItems.value = true
  try {
    folderItems.value = await inventoryStore.fetchItemsAllChunked(folderId)
  } catch {
    error.value = 'Couldn’t load items in that category.'
  } finally {
    loadingItems.value = false
  }
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    quantity.value = 1
    supplierName.value = ''
    supplierReference.value = ''
    // From the inspection list, start from what the customer said.
    defect.value = props.hold?.complaint ?? ''
    notes.value = ''
    error.value = ''
    saving.value = false
    if (!props.item && !props.hold) {
      pickedFolderId.value = ''
      pickedItemId.value = ''
      if (inventoryStore.folders.length === 0) void inventoryStore.fetchFolders()
    }
    if (returnsStore.returns.length === 0) void returnsStore.fetchReturns()
  },
  { immediate: true }
)

async function submit() {
  if (!canSubmit.value) return
  const hold = props.hold
  if (hold) {
    await run(() =>
      holdsStore.decide(hold.id, {
        action: 'supplier',
        supplierName: supplierName.value.trim(),
        supplierReference: supplierReference.value.trim() || undefined,
        defect: defect.value.trim(),
        notes: notes.value.trim() || undefined,
      })
    )
    return
  }
  const current = item.value
  if (!current) return
  await run(() =>
    returnsStore.logReturn(
      {
        itemId: current.id,
        quantity: quantityNumber.value,
        supplierName: supplierName.value.trim(),
        supplierReference: supplierReference.value.trim() || undefined,
        defect: defect.value.trim(),
        notes: notes.value.trim() || undefined,
      },
      {
        item: current,
        folderId: current.folderId,
        folderName: folder.value?.name || 'Inventory',
        serial: serial.value,
      }
    )
  )
}

async function run(fn: () => Promise<void>) {
  saving.value = true
  error.value = ''
  try {
    await fn()
    emit('logged')
    emit('update:open', false)
  } catch (err) {
    error.value = (err as { message?: string })?.message || 'That didn’t save. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>
