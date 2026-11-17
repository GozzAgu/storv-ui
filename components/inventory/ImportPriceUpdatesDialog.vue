<template>
  <SDialog
    :open="open"
    title="Update prices from this file?"
    size="md"
    @update:open="(value: boolean) => (value ? null : emit('skip'))"
  >
    <SForm>
      <SFormSection>
        <p class="s-callout">
          <strong>{{ updates.length }}</strong>
          product{{ updates.length === 1 ? '' : 's' }} already in this category
          {{ updates.length === 1 ? 'has' : 'have' }} a different price in the file
          (matched by {{ hasSerialNumbers ? 'serial number' : 'name and product model' }}).
        </p>
        <p v-if="lockedCount > 0" class="s-form-meta">
          {{ lockedCount }} more {{ lockedCount === 1 ? 'is' : 'are' }} sold, on a stock loan or
          held for a balance payment, and will keep {{ lockedCount === 1 ? 'its' : 'their' }} price.
        </p>
        <p v-if="!hasSerialNumbers && matchedRowCount > 0" class="s-form-meta">
          If you update, the {{ matchedRowCount }} matching row{{ matchedRowCount === 1 ? '' : 's' }}
          won’t also be added as new products, and stock quantities stay as they are.
        </p>
      </SFormSection>

      <SFormSection fixed>
        <div :class="pickListClass">
          <div :class="pickListScrollClass">
            <div
              v-for="u in updates.slice(0, 8)"
              :key="u.itemId"
              :class="[pickRowClass, 's-pick__row--static', 's-pick__row--stacked']"
            >
              <p :class="pickRowTitleClass">{{ u.label }} · Row {{ u.rowNumber }}</p>
              <dl class="s-sheet-summary">
                <div v-if="u.plan.priceChanged" class="s-sheet-summary__row">
                  <dt>Unit price</dt>
                  <dd>{{ money(u.plan.before.price) }} → {{ money(u.plan.after.price) }}</dd>
                </div>
                <div v-if="u.plan.costChanged && canSeeCost" class="s-sheet-summary__row">
                  <dt>Cost price</dt>
                  <dd>{{ money(u.plan.before.cost) }} → {{ money(u.plan.after.cost) }}</dd>
                </div>
                <div
                  v-if="canSeeCost && u.plan.after.marginPercent !== null"
                  class="s-sheet-summary__row s-sheet-summary__row--total"
                >
                  <dt>Margin</dt>
                  <dd>
                    {{ percent(u.plan.before.marginPercent) }} →
                    {{ percent(u.plan.after.marginPercent) }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <p v-if="updates.length > 8" class="s-form-meta">… and {{ updates.length - 8 }} more.</p>
      </SFormSection>
    </SForm>

    <template #footer>
      <SDialogActions
        cancel-label="Don’t update prices"
        :primary-label="`Update ${updates.length} price${updates.length === 1 ? '' : 's'}`"
        @cancel="emit('skip')"
        @primary="emit('confirm')"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import { usePreferences } from '~/composables/usePreferences'
import type { ImportPriceUpdate } from '~/utils/inventory-import-price-match'

defineProps<{
  open: boolean
  updates: ImportPriceUpdate[]
  lockedCount: number
  /** Bulk folders: rows that matched existing products. */
  matchedRowCount: number
  hasSerialNumbers: boolean
  canSeeCost: boolean
}>()

const emit = defineEmits<{ confirm: []; skip: [] }>()

const { formatCurrency } = usePreferences()
const { pickListClass, pickListScrollClass, pickRowClass, pickRowTitleClass } =
  useDashboardDrawerChrome()

const money = (v: number | null) => (v === null ? '-' : formatCurrency(v))
const percent = (v: number | null) => (v === null ? '-' : `${v.toFixed(0)}%`)
</script>
