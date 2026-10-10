<template>
  <SCard v-if="sales.length" title="Partner sales" flush>
    <ul class="s-list">
      <li v-for="s in sales" :key="s.id" class="s-list__item s-trade-req">
        <SAvatar :name="s.partner.displayName" size="sm" />
        <div class="s-list__main">
          <span class="s-list__primary">{{ summary(s) }}</span>
          <span class="s-list__secondary">
            {{ s.direction === 'buying' ? 'From' : 'To' }} {{ s.partner.displayName }} ·
            {{ formatPrice(s.amountKobo) }} · {{ timing(s) }}
          </span>
        </div>
        <div class="s-trade-req__end">
          <template v-if="s.direction === 'buying' && s.state === 'awaiting_payment'">
            <SButton
              size="sm"
              variant="primary"
              :loading="busyId === `${s.id}:pay`"
              :disabled="!!busyId"
              @click="pay(s)"
            >
              Pay {{ formatPrice(s.amountKobo) }}
            </SButton>
          </template>
          <template v-else-if="s.direction === 'buying' && s.state === 'paid'">
            <SButton size="sm" variant="ghost" :disabled="!!busyId" @click="showReceipt(s)">
              Receipt
            </SButton>
            <SBadge v-if="s.stockAdded" tone="success">In inventory</SBadge>
            <SButton v-else size="sm" variant="primary" :disabled="!!busyId" @click="openStock(s)">
              Add to inventory
            </SButton>
          </template>
          <SBadge v-else :tone="stateTone(s)">{{ stateLabel(s) }}</SBadge>
        </div>
      </li>
    </ul>

    <SDialog
      :open="!!receipt"
      :title="receipt ? `Receipt ${receipt.receiptNumber}` : ''"
      :description="
        receipt
          ? `${receipt.sellerName}${receipt.date ? ` · ${formatDate(receipt.date)}` : ''}`
          : ''
      "
      @update:open="(v) => !v && (receipt = null)"
    >
      <ul v-if="receipt" class="s-list s-trade-reqs__replies">
        <li v-for="(item, i) in receipt.items" :key="i" class="s-list__item">
          <div class="s-list__main">
            <span class="s-list__primary">{{ item.itemName }}</span>
            <span class="s-list__secondary"
              >{{ item.quantity }} × {{ formatNaira(item.price) }}</span
            >
          </div>
          <span class="s-list__value">{{ formatNaira(item.price * item.quantity) }}</span>
        </li>
        <li class="s-list__item">
          <div class="s-list__main"><span class="s-list__primary">Total paid</span></div>
          <span class="s-list__value">{{ formatNaira(receipt.total) }}</span>
        </li>
      </ul>
    </SDialog>

    <SDialog
      :open="!!stocking"
      title="Add to inventory"
      :description="stocking ? `${summary(stocking)} from ${stocking.partner.displayName}` : ''"
      :dismissible="!adding"
      @update:open="(v) => !v && (stocking = null)"
    >
      <form class="s-form" @submit.prevent="addToStock">
        <SSelect
          v-model="folderId"
          label="Folder"
          placeholder="Choose a folder"
          :options="folderOptions"
          required
        />
        <p class="s-partners__note">
          Each item is added with the price you paid as its cost.
          <template v-if="hasSerials"
            >Serial numbers and IMEIs from the seller are included.</template
          >
          Set your selling price afterwards.
        </p>
      </form>
      <template #footer>
        <SButton
          variant="primary"
          :loading="adding"
          :disabled="!folderId || adding"
          @click="addToStock"
        >
          Add {{ unitCount }} item{{ unitCount === 1 ? '' : 's' }}
        </SButton>
      </template>
    </SDialog>
  </SCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import SSelect from '~/components/s/SSelect.vue'
import { useAppToast } from '~/composables/useAppToast'
import { tradeErrorMessage } from '~/composables/useTradePartners'
import { useInventoryStore } from '~/stores/inventory'
import type { TradeReceiptView, TradeSaleLine, TradeSaleView } from '~/types/trade'
import { folderHasChildren } from '~/utils/inventory-folder-tree'
import { tradeStockRows } from '~/utils/trade-stock'

const props = defineProps<{
  sales: TradeSaleView[]
  onPay: (saleId: string) => Promise<string | null>
  onReceipt: (saleId: string) => Promise<TradeReceiptView>
  onClaimStock: (
    saleId: string,
    action?: 'claim' | 'release'
  ) => Promise<{ lines: TradeSaleLine[] }>
  onChanged: () => Promise<void>
}>()

const toast = useAppToast()
const inventory = useInventoryStore()
const busyId = ref('')
const receipt = ref<TradeReceiptView | null>(null)
const stocking = ref<TradeSaleView | null>(null)
const folderId = ref('')
const adding = ref(false)

const priceFormat = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})
const formatPrice = (kobo: number) => priceFormat.format(kobo / 100)
const formatNaira = (naira: number) => priceFormat.format(naira)
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

function summary(s: TradeSaleView): string {
  const units = s.lines.reduce((n, l) => n + l.quantity, 0)
  const first = s.lines[0]?.name ?? 'Items'
  const names = new Set(s.lines.map((l) => l.name))
  return names.size > 1
    ? `${first} + ${names.size - 1} more`
    : units > 1
    ? `${units} × ${first}`
    : first
}

function timing(s: TradeSaleView): string {
  if (s.state === 'paid' && s.paidAtMs)
    return `paid ${formatDate(new Date(s.paidAtMs).toISOString())}`
  if (s.state === 'awaiting_payment') {
    const hours = Math.max(1, Math.round((s.expiresAtMs - Date.now()) / 3_600_000))
    return `pay within ${hours}h`
  }
  return formatDate(new Date(s.createdAtMs).toISOString())
}

const STATE_LABEL: Record<TradeSaleView['state'], string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  expired: 'Expired',
  cancelled: 'Cancelled',
}
const stateLabel = (s: TradeSaleView) => STATE_LABEL[s.state]
const stateTone = (s: TradeSaleView) =>
  s.state === 'paid' ? 'success' : s.state === 'awaiting_payment' ? 'accent' : 'neutral'

async function pay(s: TradeSaleView) {
  busyId.value = `${s.id}:pay`
  try {
    const url = await props.onPay(s.id)
    if (url) window.location.assign(url)
    else {
      toast.success('Paid. Add the items to your inventory when ready.')
      await props.onChanged()
    }
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not start the payment'))
  } finally {
    busyId.value = ''
  }
}

async function showReceipt(s: TradeSaleView) {
  busyId.value = `${s.id}:receipt`
  try {
    receipt.value = await props.onReceipt(s.id)
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not load the receipt'))
  } finally {
    busyId.value = ''
  }
}

const folderOptions = computed(() =>
  inventory.folders
    .filter((f) => !folderHasChildren(inventory.folders, f.id))
    .map((f) => ({ label: f.name, value: f.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
)
const hasSerials = computed(() => stocking.value?.lines.some((l) => l.serial) ?? false)
const unitCount = computed(() => stocking.value?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0)

async function openStock(s: TradeSaleView) {
  folderId.value = ''
  stocking.value = s
  await inventory.fetchFolders().catch(() => undefined)
}

async function addToStock() {
  const sale = stocking.value
  const folder = inventory.getFolderById(folderId.value)
  if (!sale || !folder || adding.value) return
  adding.value = true
  let claimed = false
  let created = 0
  try {
    const { lines } = await props.onClaimStock(sale.id)
    claimed = true
    for (const row of tradeStockRows(folder, lines, sale.id)) {
      await inventory.createItem(folder.id, row as never)
      created++
    }
    toast.success(`Added ${created} item${created === 1 ? '' : 's'} to ${folder.name}`)
    stocking.value = null
  } catch (e) {
    if (claimed && created === 0)
      await props.onClaimStock(sale.id, 'release').catch(() => undefined)
    toast.error(
      created
        ? `Added ${created} item${created === 1 ? '' : 's'}, then stopped: ${tradeErrorMessage(
            e,
            'something went wrong'
          )}`
        : tradeErrorMessage(e, 'Could not add the items')
    )
  } finally {
    adding.value = false
    await props.onChanged().catch(() => undefined)
  }
}
</script>
