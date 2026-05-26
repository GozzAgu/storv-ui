<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { getNextStaffRoleLabel, normalizeStaffRole } from '~/utils/staff-role'

const props = withDefaults(
  defineProps<{
    role: string
    loading?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  { loading: false, disabled: false, size: 'sm' },
)

defineEmits<{ click: [] }>()

const nextLabel = computed(() => getNextStaffRoleLabel(props.role))
const currentLabel = computed(() => {
  const r = normalizeStaffRole(props.role)
  return r.charAt(0).toUpperCase() + r.slice(1)
})

const iconClass = computed(() => (props.size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5'))
</script>

<template>
  <button
    type="button"
    class="dashboard-table__action-btn staff-role-cycle-btn"
    :class="{ 'staff-role-cycle-btn--loading': loading }"
    :disabled="disabled || loading"
    :title="`Change role from ${currentLabel} to ${nextLabel}`"
    :aria-label="`Change role from ${currentLabel} to ${nextLabel}`"
    @click="$emit('click')"
  >
    <span v-if="loading" class="staff-role-cycle-btn__spinner" aria-hidden="true" />
    <ArrowPathIcon v-else :class="iconClass" class="staff-role-cycle-btn__icon" aria-hidden="true" />
  </button>
</template>

<style scoped>
.staff-role-cycle-btn {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--app-radius-sm, 0.25rem);
  color: rgb(107 114 128);
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease;
}

.staff-role-cycle-btn:hover:not(:disabled) {
  background-color: rgb(239 246 255);
  color: rgb(37 99 235);
}

.staff-role-cycle-btn:active:not(:disabled) {
  transform: scale(0.94);
}

.staff-role-cycle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.staff-role-cycle-btn--loading {
  pointer-events: none;
}

.staff-role-cycle-btn__icon {
  flex-shrink: 0;
}

.staff-role-cycle-btn__spinner {
  height: 0.875rem;
  width: 0.875rem;
  border-radius: 9999px;
  border: 2px solid rgb(191 219 254);
  border-top-color: rgb(37 99 235);
  animation: staff-role-spin 0.65s linear infinite;
}

:global(html.dark) .staff-role-cycle-btn:hover:not(:disabled) {
  background-color: rgb(30 58 138 / 0.25);
  color: rgb(147 197 253);
}

:global(html.dark) .staff-role-cycle-btn__spinner {
  border-color: rgb(30 64 175 / 0.5);
  border-top-color: rgb(96 165 250);
}

@keyframes staff-role-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
