<template>
  <div class="s-c s-act-card" :class="{ 's-act-card--compact': compact }">
    <!-- Hover card heading: what happened, in one line -->
    <header v-if="compact" class="s-act-card__head">
      <p class="s-act-card__headline">{{ headline }}</p>
      <span class="s-act-card__badge" :class="`s-act-card__badge--${log.action}`">
        {{ actionLabel }} · {{ typeLabel }}
      </span>
    </header>

    <!-- Who, what, when: always shown, even for entries saved before details existed -->
    <dl class="s-act-card__meta">
      <div>
        <dt>Done by</dt>
        <dd>{{ log.userDisplayName || 'Unknown' }}</dd>
      </div>
      <div v-if="!compact">
        <dt>Action</dt>
        <dd>{{ actionLabel }} · {{ typeLabel }}</dd>
      </div>
      <div>
        <dt>When</dt>
        <dd>{{ exactTime }}</dd>
      </div>
      <div v-if="log.entityId">
        <dt>Record</dt>
        <dd class="s-act-card__mono">{{ recordRef }}</dd>
      </div>
    </dl>

    <!-- Route (transfers) -->
    <section v-if="details?.route" class="s-act-card__section">
      <h4 class="s-act-card__title">Route</h4>
      <div class="s-act-card__route">
        <div v-for="end in routeEnds" :key="end.key" class="s-act-card__end">
          <span class="s-act-card__label">{{ end.label }}</span>
          <span class="s-act-card__branch">{{ end.branch || 'Unknown branch' }}</span>
          <span class="s-act-card__crumbs">{{ end.path.length ? end.path.join(' › ') : '—' }}</span>
        </div>
        <ArrowRight :size="14" :stroke-width="2" class="s-act-card__arrow" aria-hidden="true" />
      </div>
    </section>

    <!-- Facts -->
    <section v-if="details?.facts?.length" class="s-act-card__section">
      <h4 class="s-act-card__title">Details</h4>
      <dl class="s-act-card__facts">
        <div v-for="(fact, i) in details.facts" :key="i">
          <dt>{{ fact.label }}</dt>
          <dd :class="fact.tone && `s-act-card__tone--${fact.tone}`">
            {{ show(fact.value, fact.money) }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Before → after -->
    <section v-if="details?.changes?.length" class="s-act-card__section">
      <h4 class="s-act-card__title">
        What changed <span class="s-act-card__count">{{ details.changes.length }}</span>
      </h4>
      <div class="s-act-card__table">
        <div class="s-act-card__thead s-act-card__changes" aria-hidden="true">
          <span>Field</span>
          <span>Before</span>
          <span />
          <span>After</span>
        </div>
        <div v-for="(c, i) in details.changes" :key="i" class="s-act-card__changes s-act-card__row">
          <span class="s-act-card__field">{{ c.label }}</span>
          <span class="s-act-card__before">{{ show(c.from, c.money) }}</span>
          <ArrowRight :size="12" :stroke-width="2" class="s-act-card__muted" aria-label="to" />
          <span class="s-act-card__after">{{ show(c.to, c.money) }}</span>
        </div>
      </div>
    </section>

    <!-- Items -->
    <section v-if="details?.lines?.length" class="s-act-card__section">
      <h4 class="s-act-card__title">
        {{ details.linesLabel || 'Items' }}
        <span class="s-act-card__count">{{ details.lines.length }}</span>
      </h4>
      <div class="s-act-card__table">
        <div class="s-act-card__thead s-act-card__lines" aria-hidden="true">
          <span>Item</span>
          <span class="s-act-card__num">Qty</span>
          <span class="s-act-card__num">Amount</span>
        </div>
        <div v-for="(line, i) in details.lines" :key="i" class="s-act-card__lines s-act-card__row">
          <span class="s-act-card__item">
            <span class="s-act-card__item-name">{{ line.name }}</span>
            <span v-if="line.meta" class="s-act-card__muted">{{ line.meta }}</span>
            <span v-if="line.note" class="s-act-card__note">{{ line.note }}</span>
          </span>
          <span class="s-act-card__num">{{ line.qty ?? '—' }}</span>
          <span class="s-act-card__num">
            <s v-if="line.was !== undefined && line.was !== line.amount" class="s-act-card__muted">
              {{ formatCurrency(line.was) }}
            </s>
            {{ line.amount !== undefined ? formatCurrency(line.amount) : '—' }}
          </span>
        </div>
      </div>
    </section>

    <p v-if="!hasDetails" class="s-act-card__muted s-act-card__older">
      This entry was recorded before detailed activity was kept, so only the summary above is
      available.
    </p>

    <NuxtLink v-if="details?.link" :to="dashPath(details.link.path)" class="s-act-card__link">
      {{ details.link.label }}
      <ArrowUpRight :size="14" :stroke-width="2" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, ArrowUpRight } from '~/icons'
import {
  activityActionLabel,
  activityEntityTypeLabel,
  type ActivityLog,
} from '~/composables/useActivityLog'
import { useDashboardPaths } from '~/composables/useDashboardPaths'
import { usePreferences } from '~/composables/usePreferences'
import type { ActivityValue } from '~/utils/activity-details'

/** Everything recorded about one Activity entry, opened from its row. */
const props = defineProps<{
  log: ActivityLog
  /** Hover-card layout: headline, no outer frame, tighter spacing. */
  compact?: boolean
}>()

const headline = computed(() => {
  const name = String(props.log.entityName || '').trim()
  return name && name !== '-' ? name : `${actionLabel.value} ${typeLabel.value.toLowerCase()}`
})

const { formatCurrency } = usePreferences()
const { dashPath } = useDashboardPaths()

const details = computed(() => props.log.details ?? null)
const hasDetails = computed(() => {
  const d = details.value
  return Boolean(d && (d.facts?.length || d.changes?.length || d.lines?.length || d.route))
})
const actionLabel = computed(() => activityActionLabel(props.log.action))
const typeLabel = computed(() => activityEntityTypeLabel(props.log.entityType))
const recordRef = computed(() => {
  const id = String(props.log.entityId || '')
  return id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id
})
const exactTime = computed(() => {
  const d =
    props.log.createdAt instanceof Date
      ? props.log.createdAt
      : new Date(String(props.log.createdAt))
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
})
const routeEnds = computed(() => {
  const r = details.value?.route
  return r
    ? [
        { key: 'from', label: 'From', ...r.from },
        { key: 'to', label: 'To', ...r.to },
      ]
    : []
})

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/

/** Money in the viewer's currency, ISO dates as dates, yes/no for booleans, "—" for empty. */
function show(value: ActivityValue | undefined, money?: boolean): string {
  if (value === null || value === undefined || value === '') return '—'
  if (money && typeof value === 'number') return formatCurrency(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (ISO_DATE.test(value)) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
  }
  return value
}
</script>

<style scoped>
.s-act-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--s-divider);
  border-radius: var(--s-radius-lg);
  background: var(--s-surface-2);
  overflow: hidden;
  text-align: left;
}

.s-act-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--s-space-1-5) var(--s-space-3);
  margin: 0;
  padding: var(--s-space-2);
}

.s-act-card__meta > div,
.s-act-card__facts > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.s-act-card dt,
.s-act-card__label {
  color: var(--s-text-muted);
  font: var(--s-text-caption);
}

.s-act-card dd {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-small);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.s-act-card__mono {
  font-family: var(--s-font-mono, ui-monospace, monospace) !important;
}

.s-act-card__section {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1);
  padding: var(--s-space-2);
  border-top: 1px solid var(--s-divider);
}

.s-act-card__title {
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

.s-act-card__count {
  padding: 0 6px;
  border-radius: var(--s-radius-full);
  background: var(--s-overlay-tint);
  color: var(--s-text-2);
  letter-spacing: 0;
}

.s-act-card__facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--s-space-1-5) var(--s-space-3);
  margin: 0;
}

.s-act-card__tone--good {
  color: var(--s-success) !important;
}

.s-act-card__tone--bad {
  color: var(--s-error) !important;
}

.s-act-card__tone--warn {
  color: var(--s-warning) !important;
}

/* Route */
.s-act-card__route {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-space-3);
}

.s-act-card__end {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--s-space-1-5);
  border: 1px solid var(--s-divider);
  border-radius: 10px;
  background: var(--s-surface);
}

.s-act-card__branch {
  color: var(--s-text);
  font: var(--s-text-small);
  font-weight: 600;
}

.s-act-card__crumbs {
  color: var(--s-text-2);
  font: var(--s-text-small);
}

.s-act-card__arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  color: var(--s-text-muted);
  transform: translate(-50%, -50%);
}

/* Tables: changes and items */
.s-act-card__table {
  border: 1px solid var(--s-divider);
  border-radius: 10px;
  background: var(--s-surface);
  overflow: hidden;
}

.s-act-card__changes {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(0, 1.5fr) 16px minmax(0, 1.5fr);
  align-items: center;
  gap: var(--s-space-1-5);
}

.s-act-card__lines {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px 160px;
  align-items: center;
  gap: var(--s-space-2);
}

.s-act-card__thead {
  height: 30px;
  padding: 0 var(--s-space-1-5);
  border-bottom: 1px solid var(--s-divider);
  color: var(--s-text-muted);
  font: var(--s-text-caption);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s-act-card__row {
  min-height: 40px;
  padding: var(--s-space-1) var(--s-space-1-5);
  border-bottom: 1px solid var(--s-divider);
  font: var(--s-text-small);
}

.s-act-card__row:last-child {
  border-bottom: 0;
}

.s-act-card__field {
  color: var(--s-text-2);
}

.s-act-card__before {
  color: var(--s-text-muted);
  text-decoration: line-through;
  text-decoration-color: color-mix(in srgb, var(--s-text-muted) 60%, transparent);
  overflow-wrap: anywhere;
}

.s-act-card__after {
  color: var(--s-text);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.s-act-card__item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.s-act-card__item-name {
  color: var(--s-text);
  font-weight: 600;
}

.s-act-card__note {
  color: var(--s-warning);
  font: var(--s-text-caption);
}

.s-act-card__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.s-act-card__num s {
  margin-right: 6px;
}

.s-act-card__muted {
  color: var(--s-text-muted);
}

.s-act-card__older {
  margin: 0;
  padding: 0 var(--s-space-2) var(--s-space-2);
  font: var(--s-text-small);
}

.s-act-card__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  margin: 0 var(--s-space-2) var(--s-space-2);
  color: var(--s-text);
  font: var(--s-text-small);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Hover card layout ───────────────────────────────────── */
.s-act-card--compact {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.s-act-card__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--s-space-2) var(--s-space-2) 0;
}

.s-act-card__headline {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-small);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
}

.s-act-card__badge {
  align-self: flex-start;
  padding: 1px 8px;
  border-radius: var(--s-radius-full);
  background: var(--s-overlay-tint);
  color: var(--s-text-2);
  font: var(--s-text-caption);
  font-weight: 500;
}

.s-act-card__badge--created {
  background: var(--s-success-soft);
  color: var(--s-success);
}

.s-act-card__badge--deleted {
  background: var(--s-error-soft);
  color: var(--s-error);
}

.s-act-card--compact .s-act-card__meta {
  grid-template-columns: 1fr 1fr;
  gap: var(--s-space-1) var(--s-space-2);
  padding: var(--s-space-1-5) var(--s-space-2);
}

.s-act-card--compact .s-act-card__section {
  gap: 6px;
  padding: var(--s-space-1-5) var(--s-space-2);
}

.s-act-card--compact .s-act-card__facts {
  grid-template-columns: 1fr 1fr;
  gap: var(--s-space-1) var(--s-space-2);
}

.s-act-card--compact .s-act-card__route {
  grid-template-columns: 1fr;
  gap: 6px;
}

.s-act-card--compact .s-act-card__arrow {
  display: none;
}

.s-act-card--compact .s-act-card__end {
  padding: var(--s-space-1);
}

.s-act-card--compact .s-act-card__changes {
  grid-template-columns: minmax(80px, 0.9fr) minmax(0, 1fr) 12px minmax(0, 1fr);
  gap: var(--s-space-1);
}

.s-act-card--compact .s-act-card__lines {
  grid-template-columns: minmax(0, 1fr) 32px 120px;
  gap: var(--s-space-1);
}

.s-act-card--compact .s-act-card__thead,
.s-act-card--compact .s-act-card__row {
  padding-left: var(--s-space-1);
  padding-right: var(--s-space-1);
}

.s-act-card--compact .s-act-card__row {
  min-height: 34px;
}

.s-act-card--compact .s-act-card__older {
  padding: 0 var(--s-space-2) var(--s-space-1-5);
}

.s-act-card--compact .s-act-card__link {
  margin: var(--s-space-half) var(--s-space-2) var(--s-space-2);
}

@media (max-width: 640px) {
  .s-act-card__meta,
  .s-act-card__facts {
    grid-template-columns: 1fr 1fr;
  }

  .s-act-card__route {
    grid-template-columns: 1fr;
    gap: var(--s-space-1);
  }

  .s-act-card__arrow {
    display: none;
  }

  .s-act-card__changes {
    grid-template-columns: 1fr;
    gap: 2px;
  }

  .s-act-card__changes .s-act-card__muted {
    display: none;
  }

  .s-act-card__thead {
    display: none;
  }

  .s-act-card__lines {
    grid-template-columns: 1fr auto;
  }

  .s-act-card__lines .s-act-card__num:nth-child(2)::before {
    content: '× ';
  }

  .s-act-card__lines .s-act-card__num:last-child {
    grid-column: 1 / -1;
    text-align: left;
  }
}
</style>
