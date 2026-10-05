<template>
  <SDialog
      placement="right"
    :open="modelValue"
    size="md"
    title="New payment link"
    @update:open="(v: boolean) => emit('update:modelValue', v)"
  >
    <SForm>
      <SFormSection>
        <div class="s-form-pair">
          <SField label="Customer name">
            <SInput v-model="customerName" placeholder="e.g. Sarah Johnson" />
          </SField>
          <SField label="Customer phone" hint="WhatsApp">
            <SInput v-model="customerPhone" type="tel" placeholder="e.g. 080 1234 5678" />
          </SField>
        </div>
      </SFormSection>

      <SFormSection>
        <SField label="Category">
          <SSelect v-model="selectedFolderId" @change="onFolderChange">
            <option value="">Select a category</option>
            <option v-for="f in inventoryStore.leafFolders" :key="f.id" :value="f.id">
              {{ f.name }}
            </option>
          </SSelect>
        </SField>

        <SField v-if="selectedFolderId" v-slot="{ labelId }" label="Items">
          <div v-if="itemsLoading" :class="pickListClass" aria-busy="true">
            <div :class="pickListScrollClass">
              <div v-for="i in 3" :key="i" :class="[pickRowClass, 's-pick__row--static']">
                <div class="s-sheet-row__main">
                  <SSkeleton :lines="2" height="12px" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="availableItems.length === 0" :class="emptyStateClass">
            <strong>No available items</strong>
            <span>Try another category</span>
          </div>

          <div v-else :class="pickListClass" role="group" :aria-labelledby="labelId">
            <div :class="pickListScrollClass">
              <div
                v-for="entry in availableItems"
                :key="entry.itemId"
                :class="[pickRowClass, 's-pick__row--static']"
              >
                <div class="s-sheet-row__main">
                  <p :class="pickRowTitleClass">{{ entry.name }}</p>
                  <p :class="pickRowMetaClass">
                    {{ formatNaira(entry.unitPrice) }}
                    <span v-if="entry.serial"> · serialized</span>
                    <span v-else> · {{ entry.max }} in stock</span>
                  </p>
                </div>
                <div class="s-sheet-stepper">
                  <SIconButton
                    variant="secondary"
                    :label="`Decrease ${entry.name} quantity`"
                    :disabled="(cart[entry.itemId]?.quantity || 0) <= 0"
                    @click="dec(entry)"
                  >
                    <Minus :size="16" :stroke-width="2" aria-hidden="true" />
                  </SIconButton>
                  <span class="s-sheet-stepper__value" aria-live="polite">{{
                    cart[entry.itemId]?.quantity || 0
                  }}</span>
                  <SIconButton
                    variant="secondary"
                    :label="`Increase ${entry.name} quantity`"
                    :disabled="(cart[entry.itemId]?.quantity || 0) >= entry.max"
                    @click="inc(entry)"
                  >
                    <Plus :size="16" :stroke-width="2" aria-hidden="true" />
                  </SIconButton>
                </div>
              </div>
            </div>
          </div>
        </SField>
      </SFormSection>

      <p v-if="errorMsg" class="s-field__error" role="alert">{{ errorMsg }}</p>
    </SForm>

    <template #leading>
      <span class="s-form-meta">
        Total
        <strong class="s-sheet-total">{{ formatNaira(total) }}</strong>
      </span>
    </template>

    <template #footer>
      <SDialogActions
        :primary-loading="creating"
        :primary-disabled="!canCreate"
        primary-label="Generate link"
        @cancel="emit('update:modelValue', false)"
        @primary="create"
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
import { ref, computed, reactive, watch } from 'vue'
import { Minus, Plus } from '@lucide/vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
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
