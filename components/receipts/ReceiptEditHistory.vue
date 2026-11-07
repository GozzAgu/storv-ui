<template>
  <section v-if="receipt?.edited" class="s-form-section" aria-labelledby="receipt-edits-title">
    <h3 id="receipt-edits-title" class="s-form-section__title">
      Edit history
      <span class="s-form-section__count">{{ receipt.editCount ?? edits.length }}</span>
    </h3>
    <p v-if="loading && !edits.length" class="s-field__hint">Loading edits…</p>
    <ol v-else class="s-receipt-edits">
      <li v-for="entry in entries" :key="entry.id" class="s-receipt-edits__entry">
        <p class="s-receipt-edits__who">
          <strong>{{ entry.editedByName }}</strong>
          <span v-if="entry.editedAt" class="s-receipt-edits__when">
            · {{ formatWhen(entry.editedAt) }}
          </span>
        </p>
        <p v-if="entry.reason" class="s-receipt-edits__reason">“{{ entry.reason }}”</p>
        <ul v-if="entry.changes.length" class="s-receipt-edits__changes">
          <li v-for="change in entry.changes" :key="change.field">
            <span class="s-receipt-edits__field">{{ fieldLabel(change.field) }}:</span>
            <del>{{ change.from || 'Empty' }}</del>
            <span aria-hidden="true">→</span>
            <span class="ds-sr-only">changed to</span>
            <ins>{{ change.to || 'Empty' }}</ins>
          </li>
        </ul>
      </li>
    </ol>
    <p v-if="error" class="s-field__hint s-receipt-edits__note">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Receipt } from '~/stores/receipts'
import { useReceiptEdits } from '~/composables/useReceiptEdits'
import {
  RECEIPT_EDIT_FIELD_LABELS,
  type ReceiptEditableField,
  type ReceiptEditEntry,
} from '~/utils/receipt-edit'

const props = defineProps<{ receipt: Receipt | null }>()

const { edits, loading, error } = useReceiptEdits(
  computed(() => (props.receipt?.edited ? props.receipt.id : null)),
  computed(() => props.receipt?.editCount)
)

/** Without the full history (demo, or not loaded yet) the receipt still says who last edited it and why. */
const entries = computed<ReceiptEditEntry[]>(() => {
  if (edits.value.length || !props.receipt?.edited) return edits.value
  const r = props.receipt
  return [
    {
      id: 'latest',
      changes: [],
      reason: r.lastEditReason ?? '',
      editedBy: '',
      editedByName: r.lastEditedByName ?? 'Someone',
      editNumber: r.editCount ?? 1,
      editedAt: r.lastEditedAt ?? null,
    },
  ]
})

function fieldLabel(field: string): string {
  return RECEIPT_EDIT_FIELD_LABELS[field as ReceiptEditableField] ?? field
}

function formatWhen(date: Date): string {
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style scoped>
.s-receipt-edits__note {
  margin: var(--s-space-1) 0 0;
}

.s-receipt-edits {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-receipt-edits__entry {
  padding: var(--s-space-1-5) var(--s-space-2);
  border-radius: var(--s-radius-lg, var(--s-radius));
  background: var(--s-surface-2);
}

.s-receipt-edits__who,
.s-receipt-edits__reason {
  margin: 0;
  font: var(--s-text-small);
}

.s-receipt-edits__who strong {
  color: var(--s-text);
  font-weight: 600;
}

.s-receipt-edits__when,
.s-receipt-edits__reason {
  color: var(--s-text-muted);
}

.s-receipt-edits__reason {
  margin-top: var(--s-space-half);
  font-style: italic;
}

.s-receipt-edits__changes {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-half);
  margin: var(--s-space-1) 0 0;
  padding: 0;
  list-style: none;
  font: var(--s-text-small);
  overflow-wrap: anywhere;
}

.s-receipt-edits__changes li {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-half) var(--s-space-1);
}

.s-receipt-edits__field {
  color: var(--s-text-muted);
}

.s-receipt-edits__changes del {
  color: var(--s-text-muted);
}

.s-receipt-edits__changes ins {
  color: var(--s-text);
  font-weight: 500;
  text-decoration: none;
}
</style>
