<template>
  <div class="s-transfer-panel">
    <!-- Route: where the stock left from and where it entered -->
    <section v-if="route" class="s-transfer-panel__section" aria-label="Route">
      <h4 class="s-transfer-panel__title">Route</h4>
      <div class="s-transfer-panel__route">
        <div v-for="end in ends" :key="end.key" class="s-transfer-panel__end">
          <span class="s-transfer-panel__end-label">{{ end.label }}</span>
          <span class="s-transfer-panel__branch">
            <Store :size="15" :stroke-width="1.75" aria-hidden="true" />
            <span>{{ end.branch || 'Unknown branch' }}</span>
          </span>
          <ol v-if="end.path.length" class="s-transfer-panel__crumbs">
            <li v-for="(name, i) in end.path" :key="i" class="s-transfer-panel__crumb">
              <Folder
                v-if="i === 0"
                :size="13"
                :stroke-width="1.75"
                class="s-transfer-panel__crumb-icon"
                aria-hidden="true"
              />
              <ChevronRight
                v-else
                :size="12"
                :stroke-width="2"
                class="s-transfer-panel__crumb-icon"
                aria-hidden="true"
              />
              <span :class="{ 's-transfer-panel__crumb-last': i === end.path.length - 1 }">
                {{ name }}
              </span>
            </li>
          </ol>
          <span v-else class="s-transfer-panel__crumbs s-transfer-panel__muted">
            Category not recorded
          </span>
        </div>
        <span class="s-transfer-panel__route-arrow" aria-hidden="true">
          <ArrowRight :size="14" :stroke-width="2" />
        </span>
      </div>
    </section>

    <!-- Timeline: each step with when and who -->
    <section v-if="steps.length" class="s-transfer-panel__section" aria-label="Timeline">
      <h4 class="s-transfer-panel__title">Timeline</h4>
      <ol class="s-transfer-panel__steps" :style="{ '--steps': steps.length }">
        <li
          v-for="step in steps"
          :key="step.label"
          class="s-transfer-panel__step"
          :class="`s-transfer-panel__step--${step.state}`"
        >
          <span class="s-transfer-panel__dot" aria-hidden="true">
            <Check v-if="step.state === 'done'" :size="10" :stroke-width="3" />
            <X v-else-if="step.state === 'failed'" :size="10" :stroke-width="3" />
          </span>
          <span class="s-transfer-panel__step-label">{{ step.label }}</span>
          <span class="s-transfer-panel__step-meta">
            <template v-if="step.at">{{ step.at }}</template>
            <template v-else-if="step.state === 'current'">Waiting</template>
            <template v-else>—</template>
          </span>
          <span v-if="step.by" class="s-transfer-panel__step-by">by {{ step.by }}</span>
        </li>
      </ol>

      <dl v-if="facts.length" class="s-transfer-panel__facts">
        <div v-for="fact in facts" :key="fact.label" class="s-transfer-panel__fact">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>
    </section>

    <!-- Items -->
    <section class="s-transfer-panel__section" :aria-label="label">
      <h4 class="s-transfer-panel__title">
        Items <span class="s-transfer-panel__count">{{ rows.length }}</span>
      </h4>
      <div class="s-transfer-panel__table">
        <div class="s-transfer-panel__head" aria-hidden="true">
          <span>Item</span>
          <span>Details</span>
          <span class="s-transfer-panel__qty">Qty</span>
        </div>
        <ul class="s-transfer-panel__items">
          <li v-for="(row, index) in rows" :key="row.key ?? index" class="s-transfer-panel__item">
            <span class="s-transfer-panel__name">{{ row.name || 'Unnamed item' }}</span>
            <span class="s-transfer-panel__details">
              <template v-if="chipsFor(row).length">
                <span v-for="chip in chipsFor(row)" :key="chip.key" class="s-transfer-panel__chip">
                  <span class="s-transfer-panel__chip-label">{{ chip.label }}</span>
                  <span class="s-transfer-panel__chip-value">{{ chip.value }}</span>
                </span>
              </template>
              <span v-else class="s-transfer-panel__muted">{{
                row.loading ? 'Loading details…' : '—'
              }}</span>
            </span>
            <span class="s-transfer-panel__qty">{{ row.quantity ?? 1 }}</span>
          </li>
          <li v-if="rows.length === 0" class="s-transfer-panel__empty s-transfer-panel__muted">
            No items recorded on this transfer.
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Check, ChevronRight, Folder, Store, X } from '@lucide/vue'
import { stockItemDetailChips, type StockItemRow } from '~/utils/stock-item-details'

/** One end of a transfer: branch and its category path, top level first. */
interface RouteEnd {
  branch: string
  path: string[]
}

export interface TransferStep {
  label: string
  /** Formatted date; absent for steps not reached yet. */
  at?: string
  by?: string
  state: 'done' | 'current' | 'upcoming' | 'failed'
}

const props = withDefaults(
  defineProps<{
    rows: StockItemRow[]
    /** Notes, tracking and reasons shown under the timeline; empty values left out by the caller. */
    facts?: Array<{ label: string; value: string }>
    /** Requested → Dispatched → Received (or Rejected / Cancelled). */
    steps?: TransferStep[]
    /** Where the stock left from and entered, for the audit trail. */
    route?: { from: RouteEnd; to: RouteEnd }
    label?: string
  }>(),
  { facts: () => [], steps: () => [], label: 'Items in transfer' }
)

const ends = computed(() =>
  props.route
    ? [
        { key: 'from', label: 'From', ...props.route.from },
        { key: 'to', label: 'To', ...props.route.to },
      ]
    : []
)

function chipsFor(row: StockItemRow) {
  return stockItemDetailChips(row.details)
}
</script>

<style scoped>
.s-transfer-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--s-divider);
  border-radius: var(--s-radius-lg);
  background: var(--s-surface-2);
  overflow: hidden;
}

/* Each section is a band with a small title; bands are split by hairlines. */
.s-transfer-panel__section {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1-5);
  padding: var(--s-space-2);
}

.s-transfer-panel__section + .s-transfer-panel__section {
  border-top: 1px solid var(--s-divider);
}

.s-transfer-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-transfer-panel__count {
  padding: 0 6px;
  border-radius: var(--s-radius-full);
  background: var(--s-overlay-tint);
  color: var(--s-text-2);
  letter-spacing: 0;
}

/* ── Route ───────────────────────────────────────────────── */
.s-transfer-panel__route {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-space-3);
}

.s-transfer-panel__end {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: var(--s-space-1-5);
  border: 1px solid var(--s-divider);
  border-radius: 10px;
  background: var(--s-surface);
}

.s-transfer-panel__end-label {
  color: var(--s-text-muted);
  font: var(--s-text-caption);
}

.s-transfer-panel__branch {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--s-text);
  font: var(--s-text-small);
  font-size: 0.875rem;
  font-weight: 600;
}

.s-transfer-panel__branch svg {
  flex: none;
  color: var(--s-text-muted);
}

.s-transfer-panel__branch span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s-transfer-panel__crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--s-text-2);
  font: var(--s-text-small);
}

.s-transfer-panel__crumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.s-transfer-panel__crumb-icon {
  flex: none;
  color: var(--s-text-muted);
}

.s-transfer-panel__crumb-last {
  color: var(--s-text);
  font-weight: 500;
}

.s-transfer-panel__route-arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--s-divider);
  border-radius: var(--s-radius-full);
  background: var(--s-surface-2);
  color: var(--s-text-muted);
  transform: translate(-50%, -50%);
}

/* ── Timeline ────────────────────────────────────────────── */
.s-transfer-panel__steps {
  display: grid;
  grid-template-columns: repeat(var(--steps, 3), minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-transfer-panel__step {
  position: relative;
  display: grid;
  grid-template-columns: 18px 1fr;
  column-gap: 10px;
  row-gap: 2px;
  padding-right: var(--s-space-2);
}

/* The line joining one step's dot to the next. */
.s-transfer-panel__step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 24px;
  right: 6px;
  height: 1px;
  background: var(--s-divider);
}

.s-transfer-panel__step--done:not(:last-child)::after {
  background: color-mix(in srgb, var(--s-success) 45%, transparent);
}

.s-transfer-panel__dot {
  grid-row: 1 / span 3;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--s-divider);
  border-radius: var(--s-radius-full);
  background: var(--s-surface-2);
  color: #fff;
}

.s-transfer-panel__step--done .s-transfer-panel__dot {
  border-color: var(--s-success);
  background: var(--s-success);
}

.s-transfer-panel__step--failed .s-transfer-panel__dot {
  border-color: var(--s-error);
  background: var(--s-error);
}

.s-transfer-panel__step--current .s-transfer-panel__dot {
  border-color: var(--s-warning);
  box-shadow: inset 0 0 0 3px var(--s-surface-2), inset 0 0 0 9px var(--s-warning);
}

.s-transfer-panel__step-label {
  position: relative;
  z-index: 1;
  justify-self: start;
  padding-right: 8px;
  background: var(--s-surface-2);
  color: var(--s-text);
  font: var(--s-text-small);
  font-weight: 600;
}

.s-transfer-panel__step--upcoming .s-transfer-panel__step-label {
  color: var(--s-text-muted);
}

.s-transfer-panel__step--failed .s-transfer-panel__step-label {
  color: var(--s-error);
}

.s-transfer-panel__step-meta,
.s-transfer-panel__step-by {
  grid-column: 2;
  color: var(--s-text-2);
  font: var(--s-text-small);
  font-variant-numeric: tabular-nums;
}

.s-transfer-panel__step-by {
  color: var(--s-text-muted);
}

.s-transfer-panel__facts {
  display: grid;
  gap: 6px;
  margin: var(--s-space-half) 0 0;
  padding-top: var(--s-space-1-5);
  border-top: 1px dashed var(--s-divider);
}

.s-transfer-panel__fact {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: var(--s-space-2);
  font: var(--s-text-small);
}

.s-transfer-panel__fact dt {
  color: var(--s-text-muted);
}

.s-transfer-panel__fact dd {
  margin: 0;
  color: var(--s-text);
  overflow-wrap: anywhere;
}

/* ── Items ───────────────────────────────────────────────── */
.s-transfer-panel__table {
  border: 1px solid var(--s-divider);
  border-radius: 10px;
  background: var(--s-surface);
  overflow: hidden;
}

.s-transfer-panel__head,
.s-transfer-panel__item {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) 3fr 64px;
  align-items: center;
  gap: var(--s-space-2);
  padding: 0 var(--s-space-1-5);
}

.s-transfer-panel__head {
  height: 32px;
  border-bottom: 1px solid var(--s-divider);
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-transfer-panel__items {
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-transfer-panel__item {
  min-height: 44px;
  padding-top: var(--s-space-1);
  padding-bottom: var(--s-space-1);
  border-bottom: 1px solid var(--s-divider);
  font: var(--s-text-small);
}

.s-transfer-panel__item:last-child {
  border-bottom: 0;
}

.s-transfer-panel__name {
  color: var(--s-text);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.s-transfer-panel__details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.s-transfer-panel__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border: 1px solid var(--s-divider);
  border-radius: 6px;
  white-space: nowrap;
}

.s-transfer-panel__chip-label {
  color: var(--s-text-muted);
}

.s-transfer-panel__chip-value {
  color: var(--s-text);
  font-weight: 500;
}

.s-transfer-panel__qty {
  color: var(--s-text);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  text-align: right;
}

.s-transfer-panel__head .s-transfer-panel__qty {
  color: var(--s-text-muted);
  font-weight: 600;
}

.s-transfer-panel__empty {
  padding: var(--s-space-1-5);
  font: var(--s-text-small);
}

.s-transfer-panel__muted {
  color: var(--s-text-muted);
}

/* ── Phone ───────────────────────────────────────────────── */
@media (max-width: 640px) {
  .s-transfer-panel__section {
    padding: var(--s-space-1-5);
  }

  .s-transfer-panel__route {
    grid-template-columns: 1fr;
    gap: var(--s-space-1);
  }

  .s-transfer-panel__route-arrow {
    position: static;
    justify-self: center;
    transform: rotate(90deg);
    grid-row: 2;
  }

  .s-transfer-panel__end:last-of-type {
    grid-row: 3;
  }

  .s-transfer-panel__steps {
    grid-template-columns: 1fr;
    row-gap: var(--s-space-1-5);
  }

  .s-transfer-panel__step:not(:last-child)::after {
    top: 22px;
    bottom: calc(var(--s-space-1-5) * -1 + 4px);
    left: 8px;
    right: auto;
    width: 1px;
    height: auto;
  }

  .s-transfer-panel__step-label {
    background: none;
  }

  .s-transfer-panel__fact {
    grid-template-columns: 1fr;
    gap: 2px;
  }

  .s-transfer-panel__head {
    display: none;
  }

  .s-transfer-panel__item {
    grid-template-columns: 1fr auto;
    row-gap: 6px;
  }

  .s-transfer-panel__qty::before {
    content: '× ';
  }

  .s-transfer-panel__details {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
