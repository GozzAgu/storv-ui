<template>
  <SidePanel
    :model-value="modelValue"
    size="lg"
    title="New payment link"
    dense
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <IosForm layout="fill">
      <IosFormSection fixed>
        <IosFormField label="Customer name">
          <IosFormInput v-model="customerName" placeholder="e.g. Sarah Johnson" />
        </IosFormField>
        <IosFormField label="Customer phone" hint="WhatsApp">
          <IosFormInput v-model="customerPhone" type="tel" placeholder="e.g. 080 1234 5678" />
        </IosFormField>
      </IosFormSection>

      <IosFormSection fixed>
        <IosFormField label="Category">
          <IosFormSelect
            v-model="selectedFolderId"
            extra-class="cursor-pointer"
            @change="onFolderChange"
          >
            <option value="">Select a category</option>
            <option v-for="f in inventoryStore.leafFolders" :key="f.id" :value="f.id">
              {{ f.name }}
            </option>
          </IosFormSelect>
        </IosFormField>

        <IosFormField v-if="selectedFolderId" label="Items">
          <div v-if="itemsLoading" :class="pickListClass">
            <div :class="pickListScrollClass">
              <div
                v-for="i in 3"
                :key="i"
                :class="[pickRowClass, '!cursor-default hover:!bg-transparent']"
              >
                <div class="min-w-0 flex-1 space-y-1.5">
                  <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-title" />
                  <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-meta" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="availableItems.length === 0" :class="emptyStateClass">
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300">No available items</p>
            <p class="dash-drawer-hint mt-0.5">Try another category</p>
          </div>

          <div v-else :class="pickListClass">
            <div :class="[pickListScrollClass, 'max-h-64']">
              <div
                v-for="entry in availableItems"
                :key="entry.itemId"
                :class="[pickRowClass, '!cursor-default hover:!bg-transparent']"
              >
                <div class="min-w-0 flex-1">
                  <p :class="pickRowTitleClass">{{ entry.name }}</p>
                  <p :class="pickRowMetaClass">
                    {{ formatNaira(entry.unitPrice) }}
                    <span v-if="entry.serial"> · serialized</span>
                    <span v-else> · {{ entry.max }} in stock</span>
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/[0.06]"
                    :disabled="(cart[entry.itemId]?.quantity || 0) <= 0"
                    @click="dec(entry)"
                  >
                    −
                  </button>
                  <span class="w-6 text-center text-sm tabular-nums text-gray-900 dark:text-gray-100">{{
                    cart[entry.itemId]?.quantity || 0
                  }}</span>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-40 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/[0.06]"
                    :disabled="(cart[entry.itemId]?.quantity || 0) >= entry.max"
                    @click="inc(entry)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </IosFormField>
      </IosFormSection>

      <p v-if="errorMsg" class="ios-form__error">{{ errorMsg }}</p>
    </IosForm>

    <template #leading>
      <span class="text-xs text-gray-600 dark:text-gray-400">
        Total
        <strong class="tabular-nums text-gray-900 dark:text-gray-100">{{ formatNaira(total) }}</strong>
      </span>
    </template>

    <template #footer>
      <IosDrawerActions
        :primary-loading="creating"
        :primary-disabled="!canCreate"
        primary-label="Generate link"
        @cancel="emit('update:modelValue', false)"
        @primary="create"
      />
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import {
  IosForm,
  IosFormSection,
  IosFormField,
  IosFormInput,
  IosFormSelect,
} from '~/components/ios/forms'
import { formatNaira } from '~/utils/naira'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { resolveBulkStockFieldAndValue } from '~/utils/inventory-bulk-quantity'
import {
  isItemSold,
  isItemAwaitingPayment,
  isItemOnStockLoan,
} from '~/utils/inventory-availability'
import { usePaymentLinks } from '~/composables/usePaymentLinks'

interface CreatedLink {
  token: string
  invoiceNumber: string
  url: string
  customerName: string
  customerPhone: string
  total: number
}

interface CartEntry {
  itemId: string
  folderId: string
  name: string
  unitPrice: number
  quantity: number
  max: number
  serial: boolean
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; created: [CreatedLink] }>()

const inventoryStore = useInventoryStore()
const { createLink } = usePaymentLinks()
const {
  pickListClass,
  pickListScrollClass,
  pickRowClass,
  pickRowTitleClass,
  pickRowMetaClass,
  emptyStateClass,
} = useDashboardDrawerChrome()

const customerName = ref('')
const customerPhone = ref('')
const selectedFolderId = ref('')
const itemsLoading = ref(false)
const creating = ref(false)
const errorMsg = ref('')
const cart = reactive<Record<string, CartEntry>>({})

const availableItems = computed<CartEntry[]>(() => {
  const fid = selectedFolderId.value
  if (!fid) return []
  const folder = inventoryStore.getFolderById(fid)
  const serial = !!folder?.hasSerialNumbers
  const items = (inventoryStore.items[fid] || []) as InventoryItem[]
  const out: CartEntry[] = []
  for (const item of items) {
    if (isItemSold(item) || isItemAwaitingPayment(item) || isItemOnStockLoan(item)) continue
    const unitPrice = inventoryStore.getItemPrice(item)
    let max = 1
    if (!serial) {
      const resolved = resolveBulkStockFieldAndValue(item, folder)
      max = resolved?.value ?? 0
      if (max <= 0) continue
    }
    out.push({
      itemId: item.id,
      folderId: fid,
      name: String(item.name || 'Item'),
      unitPrice,
      quantity: 0,
      max,
      serial,
    })
  }
  return out
})

const total = computed(() =>
  Object.values(cart).reduce((sum, e) => sum + e.unitPrice * e.quantity, 0)
)
const canCreate = computed(
  () =>
    customerName.value.trim().length > 0 &&
    total.value > 0 &&
    Object.values(cart).some((e) => e.quantity > 0)
)

const inc = (entry: CartEntry) => {
  const cur = cart[entry.itemId]
  if (cur) {
    cur.quantity = Math.min(entry.max, cur.quantity + 1)
  } else {
    cart[entry.itemId] = { ...entry, quantity: 1 }
  }
}
const dec = (entry: CartEntry) => {
  const cur = cart[entry.itemId]
  if (!cur) return
  cur.quantity = Math.max(0, cur.quantity - 1)
  if (cur.quantity === 0) delete cart[entry.itemId]
}

const onFolderChange = async () => {
  errorMsg.value = ''
  if (!selectedFolderId.value) return
  itemsLoading.value = true
  try {
    await inventoryStore.fetchItems(selectedFolderId.value)
  } catch (e) {
    errorMsg.value = (e as Error)?.message || 'Could not load items'
  } finally {
    itemsLoading.value = false
  }
}

const create = async () => {
  if (!canCreate.value || creating.value) return
  creating.value = true
  errorMsg.value = ''
  try {
    const items = Object.values(cart)
      .filter((e) => e.quantity > 0)
      .map((e) => ({ itemId: e.itemId, folderId: e.folderId, quantity: e.quantity }))
    const res = await createLink({
      customerName: customerName.value.trim(),
      customerPhone: customerPhone.value.trim(),
      items,
    })
    emit('created', {
      token: res.token,
      invoiceNumber: res.invoiceNumber,
      url: res.url,
      customerName: customerName.value.trim(),
      customerPhone: customerPhone.value.trim(),
      total: total.value,
    })
    emit('update:modelValue', false)
  } catch (e) {
    errorMsg.value =
      (e as { data?: { message?: string } })?.data?.message ||
      (e as Error)?.message ||
      'Could not create link'
  } finally {
    creating.value = false
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      customerName.value = ''
      customerPhone.value = ''
      selectedFolderId.value = ''
      errorMsg.value = ''
      Object.keys(cart).forEach((k) => delete cart[k])
      if (inventoryStore.leafFolders.length === 0) {
        try {
          await inventoryStore.fetchFolders()
        } catch {
          /* ignore */
        }
      }
    }
  }
)
</script>
