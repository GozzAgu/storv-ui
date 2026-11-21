<template>
  <div class="s-form">
    <SField label="Why are you deleting it?" required>
      <SSelect
        :model-value="modelValue.reason"
        :options="options"
        @update:model-value="(v) => emit('update:modelValue', { ...modelValue, reason: v as DeleteReason })"
      />
    </SField>
    <SField label="Note" :hint="modelValue.reason === 'other' ? 'Required' : 'Optional'">
      <STextarea
        :model-value="modelValue.note ?? ''"
        :rows="2"
        maxlength="500"
        placeholder="e.g. Added twice during the stock count"
        @update:model-value="(v) => emit('update:modelValue', { ...modelValue, note: v ?? '' })"
      />
    </SField>
    <p class="s-callout">
      A copy of {{ count === 1 ? 'this product' : 'each product' }} is kept in Returns → Stock out
      log, so it can be traced or restored. Damaged or lost stock? Use
      <strong>Write off as a loss</strong> instead, so the cost shows in Reports.
    </p>
  </div>
</template>

<script setup lang="ts">
import SField from '~/components/s/SField.vue'
import SSelect from '~/components/s/SSelect.vue'
import STextarea from '~/components/s/STextarea.vue'
import { DELETE_REASON_LABELS, type DeleteReason, type DeleteWhy } from '~/types/stock-removals'

/** Reason and note asked whenever products are deleted, so every removal is explained. */
defineProps<{ modelValue: DeleteWhy; count: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: DeleteWhy] }>()

const options = Object.entries(DELETE_REASON_LABELS).map(([value, label]) => ({ value, label }))
</script>
