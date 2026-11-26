<template>
  <SDialog
    placement="right"
    :open="modelValue"
    title="Lend stock to a reseller"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <SForm>
      <p class="s-callout">
        <strong>Not a sale:</strong>
        Selected serial items are marked as on a stock loan to the borrower below. Selling on a
        receipt or choosing Mark sold on Stock loans marks units sold and updates this loan.
      </p>
      <p v-if="!loanActor.canApprove" class="s-notice">
        This loan needs an admin’s approval. The items are set aside now, but don’t hand them over
        until it’s approved.
      </p>

      <!-- Opened from Inventory with items already ticked: just confirm them -->
      <SStep
        v-if="!pickMode"
        :number="1"
        title="Check the items you're lending"
        hint="These are the items you selected. Close this and change your selection if anything is wrong."
        :done="loanItems.length > 0"
      >
        <template #aside>
          <span class="s-step__count">
            {{ loanItems.length }} item{{ loanItems.length !== 1 ? 's' : '' }}
          </span>
        </template>
        <div :class="pickListClass">
          <ul :class="pickListScrollClass">
            <li v-for="it in loanItems" :key="it.id" :class="[pickRowClass, 's-pick__row--static']">
              <span :class="pickRowTitleClass">{{ getInventoryItemDisplayName(it) }}</span>
            </li>
          </ul>
        </div>
      </SStep>

      <!-- Opened from Stock lent out: choose a category, then tick the units to lend -->
      <SStep
        v-else
        :number="1"
        title="Pick the items to lend"
        hint="Open a category, go into its subcategory if it has one, then tick the units going out."
        :done="loanItems.length > 0"
      >
        <template v-if="loanItems.length > 0" #aside>
          <span class="s-step__count">{{ loanItems.length }} selected</span>
        </template>
        <SField v-slot="{ labelId }" label="Category">
          <DashboardFolderDrillPicker
            v-model="pickedFolderId"
            :aria-labelledby="labelId"
            :folders="lendableFolderTree"
            empty-label="None of this branch's categories track serial numbers yet."
          />
        </SField>
        <p v-if="lendableFolderTree.length === 0" class="s-form-meta">
          Turn on serial numbers for a category in Inventory to lend its stock.
        </p>
        <template v-if="pickedFolderId">
          <p v-if="loadingPickItems" class="s-form-meta" role="status">Loading items…</p>
          <p v-else-if="pickLoadError" class="s-form-meta" role="alert">{{ pickLoadError }}</p>
          <p v-else-if="lendablePickItems.length === 0" class="s-form-meta">
            Nothing in this category is free to lend. Items that are sold, on loan, awaiting payment
            or held for inspection can't be lent.
          </p>
          <p v-else class="s-loan-pick__label">
            Units free to lend in <strong>{{ pickedFolderName }}</strong>
            <span class="s-loan-pick__count">{{ lendablePickItems.length }}</span>
          </p>
          <div v-if="!loadingPickItems && lendablePickItems.length > 0" :class="pickListClass">
            <ul :class="pickListScrollClass">
              <li
                v-for="it in lendablePickItems"
                :key="it.id"
                :class="[pickRowClass, pickedItemIds.includes(it.id) ? pickRowSelectedClass : '']"
              >
                <SCheckbox
                  :model-value="pickedItemIds.includes(it.id)"
                  :label="getInventoryItemDisplayName(it)"
                  @update:model-value="(checked) => togglePickedItem(it.id, !!checked)"
                />
              </li>
            </ul>
          </div>
        </template>
      </SStep>

      <SStep
        :number="2"
        title="Who is borrowing them?"
        hint="The reseller or company taking the goods. A phone number helps you follow up."
        :done="!!partyNameTrimmed"
      >
        <div class="s-form-pair">
          <SField label="Borrower name" required>
            <SInput
              v-model="partyName"
              maxlength="120"
              placeholder="Company or borrower name"
              autocomplete="organization"
            />
          </SField>
          <SField label="Phone" hint="Optional">
            <SInput v-model="partyPhone" type="tel" maxlength="40" placeholder="Contact number" />
          </SField>
        </div>
      </SStep>

      <SStep
        :number="3"
        title="Add a note"
        hint="Pickup time, agreed terms or anything you want on record."
        optional
      >
        <SField label="Notes" hint="Optional">
          <STextarea
            v-model="partyNotes"
            :rows="3"
            maxlength="1000"
            placeholder="SKU list, handshake details, pickup time…"
          />
        </SField>
      </SStep>
    </SForm>

    <template #footer>
      <SStepSummary>
        <template v-if="pickMode && !pickedFolderId">Start by choosing a category.</template>
        <template v-else-if="loanItems.length === 0">Now tick the items to lend.</template>
        <template v-else-if="!partyNameTrimmed"
          >Now enter who is borrowing {{ loanItems.length === 1 ? 'it' : 'them' }}.</template
        >
        <template v-else>
          Lend <strong>{{ loanItems.length }}</strong> item{{
            loanItems.length !== 1 ? 's' : ''
          }}
          to {{ partyNameTrimmed
          }}<template v-if="!loanActor.canApprove"> · needs an admin's approval</template>
        </template>
      </SStepSummary>
      <SDialogActions
        primary-label="Confirm stock loan"
        :primary-loading="submitting"
        :primary-disabled="!partyNameTrimmed || loanItems.length === 0"
        @cancel="emit('update:modelValue', false)"
        @primary="submit"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SForm from '~/components/s/SForm.vue'
import SInput from '~/components/s/SInput.vue'
import SStep from '~/components/s/SStep.vue'
import SStepSummary from '~/components/s/SStepSummary.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SField from '~/components/s/SField.vue'
import DashboardFolderDrillPicker from '~/components/dashboard/DashboardFolderDrillPicker.vue'
import STextarea from '~/components/s/STextarea.vue'
import { ref, computed, watch } from 'vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { isItemLendable } from '~/utils/inventory-availability'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { useSellerLoanOutsStore } from '~/stores/sellerLoanOuts'
import { useAppToast } from '~/composables/useAppToast'
import { useStockLoanActor } from '~/composables/useStockLoanActor'

/**
 * Lend serial-numbered stock to a reseller. Opened from Inventory with `items` already ticked in
 * one category; opened from Stock lent out without them, it starts by picking the items.
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    items?: InventoryItem[]
    folderId?: string
  }>(),
  { items: () => [], folderId: '' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const sellerLoansStore = useSellerLoanOutsStore()
const toast = useAppToast()
const loanActor = useStockLoanActor()
const inventoryStore = useInventoryStore()
const {
  pickListClass,
  pickListScrollClass,
  pickRowClass,
  pickRowSelectedClass,
  pickRowTitleClass,
} = useDashboardDrawerChrome()

/** No items handed in: the person picks them here. */
const pickMode = computed(() => props.items.length === 0)
const pickedFolderId = ref('')
const pickFolderItems = ref<InventoryItem[]>([])
const pickedItemIds = ref<string[]>([])
const loadingPickItems = ref(false)
const pickLoadError = ref('')

/**
 * Categories you can lend from (they track serial numbers), plus the parents above them so the
 * picker can drill down: "Phones › Samsung". Everything else is left out.
 */
const lendableFolderTree = computed(() => {
  const all = inventoryStore.folders
  const byId = new Map(all.map((f) => [f.id, f]))
  const keep = new Set<string>()
  for (const f of all) {
    if (!folderHasSerialNumbers(f)) continue
    let cur: (typeof all)[number] | undefined = f
    while (cur && !keep.has(cur.id)) {
      keep.add(cur.id)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
  }
  return all.filter((f) => keep.has(f.id))
})
const pickedFolderName = computed(
  () => inventoryStore.folders.find((f) => f.id === pickedFolderId.value)?.name || 'this category'
)
const lendablePickItems = computed(() => pickFolderItems.value.filter(isItemLendable))

function togglePickedItem(id: string, checked: boolean) {
  const next = new Set(pickedItemIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  pickedItemIds.value = [...next]
}

/** What will be lent, and from which category, whichever way the form was opened. */
const loanItems = computed(() =>
  pickMode.value
    ? lendablePickItems.value.filter((it) => pickedItemIds.value.includes(it.id))
    : props.items
)
const loanFolderId = computed(() => (pickMode.value ? pickedFolderId.value : props.folderId))

watch(pickedFolderId, async (folderId) => {
  pickedItemIds.value = []
  pickFolderItems.value = []
  pickLoadError.value = ''
  if (!folderId) return
  loadingPickItems.value = true
  try {
    pickFolderItems.value = await inventoryStore.fetchItemsAllChunked(folderId)
  } catch {
    pickLoadError.value = 'Couldn’t load the items in that category. Try again.'
  } finally {
    loadingPickItems.value = false
  }
})

const partyName = ref('')
const partyPhone = ref('')
const partyNotes = ref('')
const submitting = ref(false)

const partyNameTrimmed = computed(() => partyName.value.trim())

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      partyName.value = ''
      partyPhone.value = ''
      partyNotes.value = ''
      if (pickMode.value) {
        pickedFolderId.value = ''
        pickedItemIds.value = []
        if (inventoryStore.folders.length === 0) void inventoryStore.fetchFolders()
      }
    }
  }
)

async function submit() {
  if (!partyNameTrimmed.value || loanItems.value.length === 0) return
  submitting.value = true
  try {
    const lines = loanItems.value.map((it) => ({
      inventoryItemId: it.id,
      folderId: loanFolderId.value,
      itemSummary: getInventoryItemDisplayName(it),
    }))
    const { status } = await sellerLoansStore.createSellerLoanOut({
      partyName: partyNameTrimmed.value,
      partyPhone: partyPhone.value.trim(),
      partyNotes: partyNotes.value,
      lines,
    })
    toast.success(
      status === 'pending_approval'
        ? 'Sent for approval. Hold on to the goods until an admin approves the loan.'
        : 'Stock loan recorded. Items stay on loan until sold or returned to the store.'
    )
    emit('update:modelValue', false)
    emit('success')
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Could not save stock loan')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.s-loan-pick__label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 -4px;
  color: var(--s-text-2);
  font: var(--s-text-small);
}

.s-loan-pick__label strong {
  color: var(--s-text);
}

.s-loan-pick__count {
  padding: 0 8px;
  border-radius: var(--s-radius-full);
  background: var(--s-chip-bg);
  color: var(--s-text-muted);
  font: 600 0.75rem / 1.25rem var(--s-font-sans);
  font-variant-numeric: tabular-nums;
}
</style>
