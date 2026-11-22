<template>
  <section class="s-table-card" aria-labelledby="inspect-title">
    <div class="s-table-card__head s-inspect__head">
      <div>
        <h2 id="inspect-title" class="s-inspect__title">
          To inspect
          <SBadge tone="warning" size="sm">{{ holds.length }}</SBadge>
        </h2>
        <p class="s-inspect__hint">
          Items customers returned that were held off sale. Check each one, then put it back on
          sale, return it to the supplier, or write it off.
        </p>
      </div>
    </div>

    <!-- Phone -->
    <SCard flush class="s-only-sm">
      <ul class="s-list">
        <li v-for="hold in holds" :key="hold.id" class="s-list__item s-inspect__phone-row">
          <span class="s-list__main">
            <span class="s-list__primary">{{ hold.item.name }}</span>
            <span class="s-list__secondary">“{{ hold.complaint || 'No reason given' }}”</span>
            <span class="s-list__secondary">
              {{ hold.sale.customerName }} · #{{ hold.sale.receiptNumber }} · waiting
              {{ waitingFor(hold.heldAt) }}
            </span>
          </span>
          <span v-if="canManage" class="s-inspect__actions">
            <SButton
              variant="secondary"
              size="sm"
              :loading="restockingId === hold.id"
              :disabled="!!restockingId"
              @click="emit('restock', hold)"
            >
              Back on sale
            </SButton>
            <SButton
              v-if="canReturnToSupplier"
              variant="primary"
              size="sm"
              @click="emit('to-supplier', hold)"
            >
              To supplier
            </SButton>
            <SButton v-if="canWriteOff" variant="ghost" size="sm" @click="emit('write-off', hold)">
              Write off
            </SButton>
          </span>
        </li>
      </ul>
    </SCard>

    <!-- Tablet and desktop -->
    <div class="s-table-wrap s-hide-sm">
      <table class="s-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Customer said</th>
            <th scope="col" class="s-hide-md">Returned</th>
            <th scope="col" class="s-hide-lg">Waiting</th>
            <th scope="col"><span class="ds-sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hold in holds" :key="hold.id">
            <td>
              <span class="s-table__primary">{{ hold.item.name }}</span>
              <span class="s-table__secondary">{{ itemLine(hold) }}</span>
            </td>
            <td>
              <span class="s-table__primary">“{{ hold.complaint || 'No reason given' }}”</span>
            </td>
            <td class="s-hide-md">
              <span class="s-table__primary">{{ hold.sale.customerName }}</span>
              <span class="s-table__secondary">
                #{{ hold.sale.receiptNumber }} · {{ formatDay(hold.heldAt) }}
              </span>
            </td>
            <td class="s-hide-lg s-table__nowrap">{{ waitingFor(hold.heldAt) }}</td>
            <td class="s-table__nowrap">
              <span v-if="canManage" class="s-inspect__actions">
                <SButton
                  variant="secondary"
                  size="sm"
                  :loading="restockingId === hold.id"
                  :disabled="!!restockingId"
                  @click="emit('restock', hold)"
                >
                  Back on sale
                </SButton>
                <SButton
                  v-if="canReturnToSupplier"
                  variant="primary"
                  size="sm"
                  @click="emit('to-supplier', hold)"
                >
                  Return to supplier
                </SButton>
                <SButton
                  v-if="canWriteOff"
                  variant="ghost"
                  size="sm"
                  @click="emit('write-off', hold)"
                >
                  Write off
                </SButton>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="error" class="s-field__error s-inspect__error" role="alert">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { stockItemDetailSummary } from '~/utils/stock-item-details'
import type { InspectionHold } from '~/types/inspection-holds'

/** Customer returns waiting for a decision, oldest first, as a table in the page body. */
withDefaults(
  defineProps<{
    holds: InspectionHold[]
    canManage: boolean
    canWriteOff: boolean
    /** Supplier returns are on Medium and up; without them it's back on sale or write off. */
    canReturnToSupplier?: boolean
    restockingId: string | null
    error?: string
  }>(),
  { canReturnToSupplier: true, error: undefined }
)
const emit = defineEmits<{
  restock: [hold: InspectionHold]
  'to-supplier': [hold: InspectionHold]
  'write-off': [hold: InspectionHold]
}>()

function itemLine(hold: InspectionHold) {
  const details = stockItemDetailSummary(hold.item.details, 2)
  const qty = hold.item.serial ? '' : `× ${hold.item.quantity}`
  return [details, qty, hold.item.folderName].filter(Boolean).join(' · ')
}

function waitingFor(iso: string | null) {
  if (!iso) return EMPTY_CELL
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  return days === 1 ? '1 day' : `${days} days`
}

function formatDay(iso: string | null) {
  if (!iso) return EMPTY_CELL
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}
</script>

<style scoped>
.s-inspect__head {
  padding: var(--s-space-2) var(--s-space-3);
}

.s-inspect__title {
  display: flex;
  align-items: center;
  gap: var(--s-space-1);
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-heading);
}

.s-inspect__hint {
  margin: var(--s-space-half) 0 0;
  color: var(--s-text-muted);
  font: var(--s-text-small);
}

.s-inspect__actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--s-space-1);
}

.s-inspect__phone-row {
  flex-wrap: wrap;
}

.s-inspect__error {
  margin: 0;
  padding: var(--s-space-2) var(--s-space-3);
}
</style>
