<template>
  <SDialog
    placement="right"
    :open="props.modelValue"
    title="Update prices"
    size="md"
    @update:open="(value: boolean) => (value ? null : handleCancel())"
  >
    <SForm>
      <SStep
        :number="1"
        title="Choose the products to update"
        hint="Only unsold products change. Sold ones keep their price."
        :done="productsChosen"
      >
        <SSelect v-model="scope" label="Which products" :options="scopeOptions" />
        <SSelect
          v-if="scope === 'group'"
          v-model="groupKey"
          label="Name and product model"
          :options="groupOptions"
          :disabled="isLoadingItems"
          :placeholder="isLoadingItems ? 'Loading products…' : 'Choose a product'"
          hint="Every product in this category with this name and model, unsold ones only."
        />
      </SStep>

      <SStep
        :number="2"
        title="Set the new prices"
        :hint="
          canEditCost
            ? 'Change the unit price, the cost price or both.'
            : 'Type a new amount, or change it by a percentage.'
        "
        :done="pricesEntered"
      >
        <SSelect v-model="unitMode" label="Unit price" :options="modeOptions" />
        <SField
          v-if="unitMode !== 'keep'"
          :label="unitMode === 'set' ? 'New unit price' : 'Change unit price by'"
          :hint="unitMode === 'percent' ? 'Use a minus sign to lower prices, e.g. -5.' : undefined"
        >
          <SInput
            v-model="unitValue"
            type="number"
            step="any"
            :min="unitMode === 'set' ? 0 : undefined"
            :placeholder="unitMode === 'set' ? '0.00' : '10'"
          >
            <template #prefix>{{ unitMode === 'percent' ? '%' : currencySymbol }}</template>
          </SInput>
        </SField>

        <template v-if="canEditCost">
          <SSelect v-model="costMode" label="Cost price" :options="modeOptions" />
          <SField
            v-if="costMode !== 'keep'"
            :label="costMode === 'set' ? 'New cost price' : 'Change cost price by'"
          >
            <SInput
              v-model="costValue"
              type="number"
              step="any"
              :min="costMode === 'set' ? 0 : undefined"
              :placeholder="costMode === 'set' ? '0.00' : '10'"
            >
              <template #prefix>{{ costMode === 'percent' ? '%' : currencySymbol }}</template>
            </SInput>
          </SField>
        </template>

        <p v-if="formError && hasInput" class="s-notice" role="status">{{ formError }}</p>
      </SStep>

      <SStep
        v-if="!(formError && hasInput) && summary"
        :number="3"
        title="Check the changes"
        hint="Nothing is saved until you press Update."
      >
        <p class="s-callout">
          <template v-if="summary.toUpdate.length > 0">
            <strong>{{ summary.toUpdate.length }}</strong>
            product{{ summary.toUpdate.length === 1 ? '' : 's' }} will change.
          </template>
          <template v-else>No products will change.</template>
          <template v-if="skipText"> Skipped: {{ skipText }}.</template>
        </p>
        <p v-if="belowCostCount > 0" class="s-notice" role="status">
          {{ belowCostCount }} product{{ belowCostCount === 1 ? '' : 's' }} would sell below cost at
          the new prices.
        </p>
        <div v-if="previewRows.length" :class="pickListClass">
          <div :class="pickListScrollClass">
            <div
              v-for="row in previewRows"
              :key="row.id"
              :class="[pickRowClass, 's-pick__row--static', 's-pick__row--stacked']"
            >
              <p :class="pickRowTitleClass">{{ row.label }}</p>
              <dl class="s-sheet-summary">
                <div v-if="row.plan.priceChanged" class="s-sheet-summary__row">
                  <dt>Unit price</dt>
                  <dd>{{ money(row.plan.before.price) }} → {{ money(row.plan.after.price) }}</dd>
                </div>
                <div v-if="row.plan.costChanged" class="s-sheet-summary__row">
                  <dt>Cost price</dt>
                  <dd>{{ money(row.plan.before.cost) }} → {{ money(row.plan.after.cost) }}</dd>
                </div>
                <div
                  v-if="canEditCost && row.plan.after.marginPercent !== null"
                  class="s-sheet-summary__row s-sheet-summary__row--total"
                >
                  <dt>Margin</dt>
                  <dd>
                    {{ percent(row.plan.before.marginPercent) }} →
                    {{ percent(row.plan.after.marginPercent) }}
                    ({{ profit(row.plan.after) }} each)
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <p v-if="summary.toUpdate.length > previewRows.length" class="s-form-meta">
          … and {{ summary.toUpdate.length - previewRows.length }} more.
        </p>
        <p v-if="summary.toUpdate.length > 0" class="s-form-meta">
          Sold items, items on a stock loan and items held for a balance payment keep their price.
          Past sales are not changed.
        </p>
      </SStep>
    </SForm>

    <template #footer>
      <SStepSummary>
        <template v-if="!productsChosen">
          {{
            isLoadingItems
              ? 'Loading the products in this category…'
              : 'Start by choosing the products to update.'
          }}
        </template>
        <template v-else-if="!hasInput">Now enter the new price.</template>
        <template v-else-if="formError">Fix the price above to see what will change.</template>
        <template v-else-if="summary && summary.toUpdate.length > 0">
          <strong>{{ summary.toUpdate.length }}</strong>
          product{{ summary.toUpdate.length === 1 ? '' : 's' }} will change
          <template v-if="belowCostCount > 0">
            · <strong>{{ belowCostCount }}</strong> below cost
          </template>
        </template>
        <template v-else>No products will change with these prices.</template>
      </SStepSummary>
      <SDialogActions
        :primary-label="primaryLabel"
        :primary-loading="isApplying"
        :primary-disabled="!canApply"
        @cancel="handleCancel"
        @primary="handleApply"
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
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import SStep from '~/components/s/SStep.vue'
import SStepSummary from '~/components/s/SStepSummary.vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import { useAppToast } from '~/composables/useAppToast'
import { usePreferences } from '~/composables/usePreferences'
import { friendlyErrorMessage } from '~/utils/friendly-error'
import {
  bulkPriceGroupKey,
  bulkPriceGroupLabel,
  describeBulkPriceSkips,
  groupItemsForBulkPrice,
  parseBulkPriceChange,
  planBulkPriceChange,
  type BulkPriceChange,
  type ItemPriceSnapshot,
} from '~/utils/inventory-bulk-price'

type Scope = 'selected' | 'group' | 'all'
type Mode = 'keep' | 'set' | 'percent'
type PlainItem = Record<string, unknown> & { id: string }

const props = defineProps<{
  modelValue: boolean
  folderId: string
  selectedItems: InventoryItem[]
  /** Show and edit cost price (owner / profit-and-cost viewers). */
  canEditCost: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  applied: []
}>()

const inventoryStore = useInventoryStore()
const toast = useAppToast()
const { preferences, formatCurrency } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol ?? '₦')
const { pickListClass, pickListScrollClass, pickRowClass, pickRowTitleClass } =
  useDashboardDrawerChrome()

const scope = ref<Scope>('group')
const groupKey = ref<string | null>(null)
const unitMode = ref<Mode>('set')
const unitValue = ref<number | null>(null)
const costMode = ref<Mode>('keep')
const costValue = ref<number | null>(null)
const allItems = ref<PlainItem[]>([])
const isLoadingItems = ref(false)
const isApplying = ref(false)

const modeOptions = [
  { label: 'Keep current', value: 'keep' },
  { label: 'Set to an amount', value: 'set' },
  { label: 'Change by a percentage', value: 'percent' },
]

const scopeOptions = computed(() => [
  ...(props.selectedItems.length
    ? [{ label: `Selected products (${props.selectedItems.length})`, value: 'selected' }]
    : []),
  { label: 'All with the same name and model', value: 'group' },
  { label: `Everything in this category (${allItems.value.length})`, value: 'all' },
])

const groups = computed(() => groupItemsForBulkPrice(allItems.value))
const groupOptions = computed(() =>
  groups.value.map((g) => ({ label: `${g.label} (${g.itemIds.length})`, value: g.key }))
)

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    scope.value = props.selectedItems.length ? 'selected' : 'group'
    // Default the group to the first selected product's name + model.
    const first = props.selectedItems[0] as unknown as PlainItem | undefined
    groupKey.value = first ? bulkPriceGroupKey(first) : null
    isLoadingItems.value = true
    try {
      const list = await inventoryStore.fetchItemsAllChunked(props.folderId)
      allItems.value = list.filter((i) => i.folderId === props.folderId) as unknown as PlainItem[]
      if (!groupKey.value && groups.value[0]) groupKey.value = groups.value[0].key
    } catch (err) {
      toast.error(friendlyErrorMessage(err, 'Could not load the products in this category.'))
    } finally {
      isLoadingItems.value = false
    }
  },
  { immediate: true }
)

const targetItems = computed<PlainItem[]>(() => {
  if (scope.value === 'selected') return props.selectedItems as unknown as PlainItem[]
  if (scope.value === 'all') return allItems.value
  return allItems.value.filter((i) => bulkPriceGroupKey(i) === groupKey.value)
})

const hasInput = computed(
  () =>
    (unitMode.value !== 'keep' && unitValue.value !== null && String(unitValue.value) !== '') ||
    (costMode.value !== 'keep' && costValue.value !== null && String(costValue.value) !== '')
)

const parsed = computed<{ change: BulkPriceChange | null; error: string | null }>(() => {
  const adj = (mode: Mode, value: number | null) =>
    mode === 'keep' || value === null || String(value) === ''
      ? undefined
      : { mode, value: Number(value) }
  try {
    return {
      change: parseBulkPriceChange({
        unitPrice: adj(unitMode.value, unitValue.value),
        costPrice: props.canEditCost ? adj(costMode.value, costValue.value) : undefined,
      }),
      error: null,
    }
  } catch (err) {
    return { change: null, error: err instanceof Error ? err.message : 'Check the prices' }
  }
})
const formError = computed(() => parsed.value.error)
/** Step ticks: products picked (step 1) and a valid price change typed (step 2). */
const productsChosen = computed(() => targetItems.value.length > 0)
const pricesEntered = computed(() => hasInput.value && !formError.value)

const summary = computed(() =>
  parsed.value.change && targetItems.value.length
    ? planBulkPriceChange(targetItems.value, parsed.value.change)
    : null
)
const skipText = computed(() =>
  summary.value ? describeBulkPriceSkips(summary.value.skippedByReason) : ''
)

const belowCostCount = computed(
  () =>
    summary.value?.toUpdate.filter(
      (p) => p.after.sellPrice !== null && p.after.cost !== null && p.after.sellPrice < p.after.cost
    ).length ?? 0
)

const previewRows = computed(() => {
  if (!summary.value) return []
  const byId = new Map(targetItems.value.map((i) => [i.id, i]))
  return summary.value.toUpdate.slice(0, 5).map((plan) => {
    const item = byId.get(plan.id)!
    const serial = item.serialNo ?? item.serialNumber
    return {
      id: plan.id,
      plan,
      label: `${bulkPriceGroupLabel(item)}${serial ? ` · Serial ${serial}` : ''}`,
    }
  })
})

const canApply = computed(
  () => !isApplying.value && !isLoadingItems.value && (summary.value?.toUpdate.length ?? 0) > 0
)
const primaryLabel = computed(() => {
  const n = summary.value?.toUpdate.length ?? 0
  if (isApplying.value) return 'Updating…'
  return n > 0 ? `Update ${n} product${n === 1 ? '' : 's'}` : 'Update prices'
})

const money = (v: number | null) => (v === null ? '-' : formatCurrency(v))
const percent = (v: number | null) => (v === null ? '-' : `${v.toFixed(0)}%`)
const profit = (s: ItemPriceSnapshot) =>
  s.sellPrice !== null && s.cost !== null ? formatCurrency(s.sellPrice - s.cost) : '-'

async function handleApply() {
  const change = parsed.value.change
  if (!change || !summary.value || !canApply.value) return
  isApplying.value = true
  try {
    const ids = summary.value.toUpdate.map((p) => p.id)
    const result = await inventoryStore.applyBulkPriceChange(props.folderId, {
      itemIds: ids,
      change,
    })
    const skipped = describeBulkPriceSkips(result.skipped)
    if (result.updated > 0) {
      toast.success(
        `Updated prices for ${result.updated} product${result.updated === 1 ? '' : 's'}${
          skipped ? ` (skipped ${skipped})` : ''
        }.`
      )
    } else {
      toast.warning(`No prices changed${skipped ? `: ${skipped}` : ''}.`)
    }
    emit('applied')
    handleCancel()
  } catch (err) {
    toast.error(friendlyErrorMessage(err, 'Could not update prices. Please try again.'))
  } finally {
    isApplying.value = false
  }
}

function handleCancel() {
  unitMode.value = 'set'
  unitValue.value = null
  costMode.value = 'keep'
  costValue.value = null
  emit('update:modelValue', false)
}
</script>
