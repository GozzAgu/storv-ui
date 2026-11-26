<template>
  <SDialog
    :open="open"
    size="sm"
    title="Write off as a loss"
    :description="description"
    :dismissible="!saving"
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <SForm id="write-off-form" @submit="submit">
      <SFormSection>
        <dl class="s-record-summary s-record-summary--stack">
          <div class="s-record-row">
            <dt>Item</dt>
            <dd class="s-record-row__value">{{ summary.name }}</dd>
          </div>
          <div v-if="summary.details" class="s-record-row">
            <dt>Details</dt>
            <dd class="s-record-row__value">{{ summary.details }}</dd>
          </div>
          <div v-if="props.item && !serial" class="s-record-row">
            <dt>In stock</dt>
            <dd class="s-record-row__value">{{ available }}</dd>
          </div>
          <div v-else-if="!summary.serial" class="s-record-row">
            <dt>Units</dt>
            <dd class="s-record-row__value">{{ summary.quantity }}</dd>
          </div>
        </dl>
        <p v-if="blockedReason" class="s-callout" role="alert">{{ blockedReason }}</p>
      </SFormSection>

      <template v-if="!blockedReason">
        <SStep
          v-if="showQuantityStep"
          :number="1"
          title="Enter how many units"
          :hint="`You can write off up to ${available}.`"
          :done="quantityValid"
        >
          <SField label="Units to write off" required>
            <SInput v-model="quantity" type="number" inputmode="numeric" />
          </SField>
        </SStep>
        <SStep
          :number="showQuantityStep ? 2 : 1"
          title="Pick the reason"
          hint="So you can see later where stock is being lost."
        >
          <SField label="Why?" required>
            <SSelect v-model="reason" :options="reasonOptions" />
          </SField>
        </SStep>
        <SStep
          :number="showQuantityStep ? 3 : 2"
          title="Say what happened"
          :hint="
            reason === 'lost_stolen'
              ? 'Needed for lost or stolen stock.'
              : 'A short note helps when you look back later.'
          "
          :optional="reason !== 'lost_stolen'"
          :done="reason === 'lost_stolen' && noteValid"
        >
          <SField label="What happened">
            <STextarea
              v-model="note"
              :rows="2"
              maxlength="500"
              :placeholder="
                reason === 'lost_stolen'
                  ? 'When it was noticed, who checked, any police report number'
                  : 'e.g. Dropped during unpacking, screen shattered'
              "
            />
          </SField>
        </SStep>
      </template>

      <p v-if="error" class="s-field__error" role="alert">{{ error }}</p>
    </SForm>

    <template #footer>
      <SStepSummary v-if="!blockedReason">
        <template v-if="showQuantityStep && !quantityValid">
          Enter how many units to write off, up to {{ available }}.
        </template>
        <template v-else-if="reason === 'lost_stolen' && !noteValid">
          Now say what happened. It's needed for lost or stolen stock.
        </template>
        <template v-else>
          <template v-if="lossValue !== null">
            <strong>{{ formatCurrency(lossValue) }}</strong> will be recorded as a loss at cost.
          </template>
          <template v-else>No cost is recorded, so the loss is logged without a value.</template>
          {{ stockNote }}
        </template>
      </SStepSummary>
      <SDialogActions
        :primary-label="primaryLabel"
        primary-variant="danger"
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
import SStep from '~/components/s/SStep.vue'
import SStepSummary from '~/components/s/SStepSummary.vue'
import STextarea from '~/components/s/STextarea.vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { useWriteOffsStore, type WriteOffContext } from '~/stores/writeOffs'
import { usePreferences } from '~/composables/usePreferences'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { snapshotStockItemDetails, stockItemDetailSummary } from '~/utils/stock-item-details'
import type { InspectionHold } from '~/types/inspection-holds'
import type { SupplierReturn } from '~/types/supplier-returns'
import {
  WRITE_OFF_REASON_LABELS,
  type CreateWriteOffBody,
  type WriteOffReason,
} from '~/types/stock-write-offs'

/**
 * Records stock as a loss at cost. Exactly one source is passed: an in-stock inventory `item`, a
 * held customer return (`hold`), or a supplier return the supplier rejected (`supplierReturn`).
 */
const props = defineProps<{
  open: boolean
  item?: InventoryItem | null
  hold?: InspectionHold | null
  supplierReturn?: SupplierReturn | null
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  written: []
}>()

const inventoryStore = useInventoryStore()
const writeOffsStore = useWriteOffsStore()
const { formatCurrency } = usePreferences()

const reason = ref<WriteOffReason>('damaged')
const quantity = ref<string | number>(1)
const note = ref('')
const saving = ref(false)
const error = ref('')

const reasonOptions = Object.entries(WRITE_OFF_REASON_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const folder = computed(() =>
  props.item ? inventoryStore.getFolderById(props.item.folderId) : null
)
const serial = computed(() =>
  props.item
    ? folderHasSerialNumbers(folder.value ?? undefined)
    : props.hold?.item.serial ?? props.supplierReturn?.item.serial ?? false
)
const available = computed(() => {
  const i = props.item
  if (!i) return 0
  if (serial.value) return i.dateOut ? 0 : 1
  return resolveBulkStockFieldAndValueFromMap(i, folder.value?.template?.fields)?.value ?? 0
})

/** What's being written off, whichever source it came from. */
const context = computed<WriteOffContext | null>(() => {
  if (props.item) {
    const i = props.item
    return {
      item: {
        inventoryItemId: i.id,
        folderId: i.folderId,
        folderName: folder.value?.name || 'Inventory',
        name: getInventoryItemDisplayName(i) || 'Item',
        details: snapshotStockItemDetails(i),
        serial: serial.value,
        unitCost: resolveItemUnitCost(i) ?? null,
      },
      quantity: serial.value ? 1 : Math.floor(Number(quantity.value) || 0),
    }
  }
  if (props.hold) {
    const h = props.hold
    return {
      item: { ...h.item },
      quantity: h.item.quantity,
      customerReturn: {
        receiptNumber: h.sale.receiptNumber,
        customerName: h.sale.customerName,
        complaint: h.complaint,
      },
    }
  }
  if (props.supplierReturn) {
    const r = props.supplierReturn
    return {
      item: {
        inventoryItemId: r.item.inventoryItemId,
        folderId: r.item.folderId,
        folderName: r.item.folderName,
        name: r.item.name,
        details: r.item.details,
        serial: r.item.serial,
        unitCost: r.item.unitCost,
      },
      quantity: r.item.quantity,
      supplierReturn: { returnId: r.id, supplierName: r.supplierName, defect: r.defect },
    }
  }
  return null
})

const summary = computed(() => ({
  name: context.value?.item.name ?? '',
  details: context.value ? stockItemDetailSummary(context.value.item.details, 3) : '',
  serial: context.value?.item.serial ?? false,
  quantity: context.value?.quantity ?? 0,
}))

const description = computed(() => {
  if (props.hold)
    return `Returned by ${props.hold.sale.customerName} on #${props.hold.sale.receiptNumber}`
  if (props.supplierReturn) return `${props.supplierReturn.supplierName} rejected the claim`
  return 'Damaged, lost or unsellable stock leaves inventory and is recorded as a loss.'
})

/** Same checks the server makes for inventory stock. */
const blockedReason = computed(() => {
  const i = props.item
  if (!i) return ''
  if (i.inspectionHoldId) return 'This item is waiting for inspection. Decide it from To inspect.'
  if (i.sellerLoanOutId) return 'This item is out on a stock loan. Bring it back first.'
  if (i.pendingSaleReceiptId) return 'This item is held on an outstanding order.'
  if (available.value <= 0)
    return serial.value ? 'This unit has already been sold.' : 'None in stock.'
  return ''
})

const lossValue = computed(() => {
  const c = context.value
  if (!c || c.item.unitCost === null) return null
  return c.item.unitCost * c.quantity
})

const stockNote = computed(() => {
  if (props.supplierReturn) return 'It already left inventory when it was returned.'
  if (serial.value) return 'The unit is removed from inventory.'
  const n = context.value?.quantity ?? 0
  return props.hold
    ? `The ${n} held unit${n === 1 ? '' : 's'} won't go back into stock.`
    : `${n} unit${n === 1 ? '' : 's'} come off the stock count.`
})

const canSubmit = computed(() => {
  const c = context.value
  if (!c || saving.value || blockedReason.value) return false
  if (reason.value === 'lost_stolen' && note.value.trim().length < 3) return false
  if (props.item) return c.quantity >= 1 && c.quantity <= available.value
  return true
})

/** Step ticks and footer guidance. */
const showQuantityStep = computed(() => !!props.item && !serial.value)
const quantityValid = computed(() => {
  const n = context.value?.quantity ?? 0
  return n >= 1 && n <= available.value
})
const noteValid = computed(() => note.value.trim().length >= 3)
const primaryLabel = computed(() => {
  const n = summary.value.quantity
  return !summary.value.serial && n > 1 ? `Write off ${n} units` : 'Write off'
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    reason.value = props.supplierReturn
      ? 'supplier_rejected'
      : props.hold
      ? 'customer_damage'
      : 'damaged'
    quantity.value = 1
    note.value = ''
    error.value = ''
    saving.value = false
  },
  { immediate: true }
)

async function submit() {
  const c = context.value
  if (!c || !canSubmit.value) return
  const base = { reason: reason.value, note: note.value.trim() || undefined }
  const body: CreateWriteOffBody = props.item
    ? { source: 'inventory', itemId: props.item.id, quantity: c.quantity, ...base }
    : props.hold
    ? { source: 'inspection', holdId: props.hold.id, ...base }
    : { source: 'supplier_return', returnId: props.supplierReturn!.id, ...base }
  saving.value = true
  error.value = ''
  try {
    await writeOffsStore.create(body, c)
    emit('written')
    emit('update:open', false)
  } catch (err) {
    error.value = (err as { message?: string })?.message || 'That didn’t save. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>
