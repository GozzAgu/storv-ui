<template>
  <SDialog
    :open="open"
    title="Lend stock to a partner"
    :description="
      request
        ? `${request.from.displayName} asked for ${request.item}`
        : 'They can return the items or pay you for the ones they sell.'
    "
    :dismissible="!saving"
    @update:open="(v) => !v && emit('update:open', false)"
  >
    <form id="trade-lend-form" class="s-form" @submit.prevent="submit">
      <SSelect
        v-model="partnerHandle"
        label="Partner"
        placeholder="Choose a partner"
        :options="partnerOptions"
        :disabled="!!request"
        required
      />
      <SSelect
        v-model="folderId"
        label="Category"
        placeholder="Choose a category"
        :options="folderOptions"
        required
      />

      <p v-if="foldersLoaded && !folderOptions.length" class="s-partners__note">
        Add some inventory first. Your categories will show here.
      </p>
      <SSkeleton v-if="loadingItems" :lines="3" />
      <p v-else-if="folderId && !available.length" class="s-partners__note">
        Nothing in this category is free to lend. Sold or out-of-stock items, items held for a sale
        and items already on loan are not shown.
      </p>
      <ul v-else-if="available.length" class="s-list s-trade-lend__items">
        <li v-for="item in available" :key="item.id" class="s-list__item s-trade-lend__item">
          <SCheckbox
            :model-value="!!picked[item.id]"
            :label="labelOf(item).name"
            :description="
              serialFolder
                ? labelOf(item).serial || 'No serial number'
                : `${stockOf(item)} in stock`
            "
            @update:model-value="(v: boolean) => toggle(item, v)"
          />
          <div v-if="picked[item.id]" class="s-trade-lend__price">
            <SInput
              v-if="!serialFolder"
              v-model="picked[item.id]!.quantity"
              type="number"
              inputmode="numeric"
              label="How many"
              :min="1"
              :max="stockOf(item)"
              :aria-label="`How many ${labelOf(item).name}`"
              required
            />
            <SInput
              v-model="picked[item.id]!.price"
              type="number"
              inputmode="decimal"
              :label="serialFolder ? 'Agreed price' : 'Agreed price each'"
              :aria-label="`Agreed price for ${labelOf(item).name}`"
              required
            >
              <template #prefix>₦</template>
            </SInput>
          </div>
        </li>
      </ul>

      <SInput
        v-model="dueDate"
        type="date"
        label="Due back by"
        :min="today"
        :max="maxDate"
        required
      />
      <p class="s-partners__note">
        The items stay in your inventory, marked as lent, until {{ partnerName }} returns them or
        pays for them. You both get reminders from the due date.
      </p>
    </form>
    <template #footer>
      <SDialogActions
        :primary-label="
          pickedUnits ? `Lend ${pickedUnits} item${pickedUnits === 1 ? '' : 's'}` : 'Lend'
        "
        :primary-loading="saving"
        :primary-disabled="!canSubmit"
        @cancel="emit('update:open', false)"
        @primary="submit"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import { useAppToast } from '~/composables/useAppToast'
import {
  getInventoryItemDisplayName,
  getInventoryItemField,
} from '~/composables/useInventoryItemDisplay'
import { tradeErrorMessage, type TradeLoanLabels } from '~/composables/useTradePartners'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import type { NewTradeLoanInput, TradeConnectionView, TradeRequestView } from '~/types/trade'
import {
  isItemAwaitingPayment,
  isItemOnStockLoan,
  isItemSold,
} from '~/utils/inventory-availability'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { folderHasChildren } from '~/utils/inventory-folder-tree'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'

const props = defineProps<{
  open: boolean
  partners: TradeConnectionView[]
  /** The "have" reply being answered with a loan, if any. */
  request: TradeRequestView | null
  onLend: (input: NewTradeLoanInput, labels: TradeLoanLabels) => Promise<void>
}>()
const emit = defineEmits<{ 'update:open': [boolean]; lent: [] }>()

const toast = useAppToast()
const inventory = useInventoryStore()

const DAY = 24 * 60 * 60 * 1000
/** Calendar date in Lagos, which is what the server checks the due date against. */
const lagosDate = (ms: number) => new Date(ms + 60 * 60 * 1000).toISOString().slice(0, 10)
const today = computed(() => lagosDate(Date.now()))
const maxDate = computed(() => lagosDate(Date.now() + 90 * DAY))

const partnerHandle = ref('')
const folderId = ref('')
const dueDate = ref('')
const items = ref<InventoryItem[]>([])
const loadingItems = ref(false)
const foldersLoaded = ref(false)
const picked = ref<
  Record<string, { price: number | null; folderId: string; quantity: number | null }>
>({})
const saving = ref(false)

const partnerOptions = computed(() =>
  props.partners.map((c) => ({ label: c.partner.displayName, value: c.partner.handle }))
)
const partnerName = computed(
  () =>
    props.partners.find((c) => c.partner.handle === partnerHandle.value)?.partner.displayName ||
    'your partner'
)
const folderOptions = computed(() =>
  inventory.folders
    .filter((f) => !folderHasChildren(inventory.folders, f.id))
    .map((f) => ({ label: f.name, value: f.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
)
const folder = computed(() => inventory.folders.find((f) => f.id === folderId.value))
/** Serial items are lent one by one; other categories lend a number of units. */
const serialFolder = computed(() => folderHasSerialNumbers(folder.value))

function stockOf(item: InventoryItem): number {
  return (
    resolveBulkStockFieldAndValueFromMap(
      item as unknown as Record<string, unknown>,
      folder.value?.template?.fields
    )?.value ?? 0
  )
}

const available = computed(() =>
  items.value.filter(
    (i) =>
      !isItemAwaitingPayment(i) &&
      !isItemOnStockLoan(i) &&
      (serialFolder.value ? !isItemSold(i) : stockOf(i) > 0)
  )
)

function labelOf(item: InventoryItem) {
  return {
    name: getInventoryItemDisplayName(item),
    serial:
      getInventoryItemField(item, 'serialNo') ||
      getInventoryItemField(item, 'serialNumber') ||
      getInventoryItemField(item, 'imei'),
  }
}

/** The price they quoted in their reply, else the item's own selling price. */
function defaultPrice(item: InventoryItem): number | null {
  const replied = props.request?.myReply?.priceKobo
  if (replied) return replied / 100
  const own = parseFloat(getInventoryItemField(item, 'price') || '')
  return Number.isFinite(own) && own > 0 ? own : null
}

function toggle(item: InventoryItem, on: boolean) {
  const next = { ...picked.value }
  if (on) {
    next[item.id] = {
      price: defaultPrice(item),
      folderId: item.folderId || folderId.value,
      quantity: serialFolder.value ? null : 1,
    }
  } else delete next[item.id]
  picked.value = next
}

/** Units for a picked item: 1 for serial items, else the number entered when it is in stock. */
function unitsOf(itemId: string): number {
  const p = picked.value[itemId]
  if (!p) return 0
  if (p.quantity === null) return 1
  const item = items.value.find((i) => i.id === itemId)
  const n = Number(p.quantity)
  return item && Number.isInteger(n) && n >= 1 && n <= stockOf(item) ? n : 0
}

const pickedCount = computed(() => Object.keys(picked.value).length)
const pickedUnits = computed(() => Object.keys(picked.value).reduce((n, id) => n + unitsOf(id), 0))
const canSubmit = computed(
  () =>
    !saving.value &&
    !!partnerHandle.value &&
    !!dueDate.value &&
    pickedCount.value > 0 &&
    Object.entries(picked.value).every(([id, p]) => !!p.price && p.price > 0 && unitsOf(id) > 0)
)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    partnerHandle.value = props.request?.from.handle ?? ''
    folderId.value = ''
    items.value = []
    picked.value = {}
    dueDate.value = lagosDate(Date.now() + 7 * DAY)
    foldersLoaded.value = false
    await inventory.fetchFolders().catch(() => undefined)
    foldersLoaded.value = true
  },
  { immediate: true }
)

watch(folderId, async (id) => {
  items.value = []
  picked.value = {}
  if (!id) return
  loadingItems.value = true
  try {
    const list = await inventory.fetchItemsAllChunked(id, { force: true })
    if (folderId.value === id) items.value = list
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not load the items'))
  } finally {
    loadingItems.value = false
  }
})

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  const labels: TradeLoanLabels = {}
  for (const item of items.value) if (picked.value[item.id]) labels[item.id] = labelOf(item)
  try {
    await props.onLend(
      {
        to: partnerHandle.value,
        requestId: props.request?.id ?? null,
        dueDate: dueDate.value,
        lines: Object.entries(picked.value).map(([itemId, p]) => ({
          itemId,
          folderId: p.folderId,
          priceKobo: Math.round((p.price ?? 0) * 100),
          ...(p.quantity === null ? {} : { quantity: unitsOf(itemId) }),
        })),
      },
      labels
    )
    toast.success(`Lent to ${partnerName.value}. They can see it on their Partners page.`)
    emit('lent')
    emit('update:open', false)
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not lend these items'))
  } finally {
    saving.value = false
  }
}
</script>
