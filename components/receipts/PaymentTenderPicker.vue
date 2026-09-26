<template>
  <div class="payment-tender-picker" role="listbox" :aria-label="ariaLabel">
    <button
      v-for="method in options"
      :key="method"
      type="button"
      role="option"
      :aria-selected="modelValue === method"
      class="payment-tender-picker__chip"
      :class="{ 'payment-tender-picker__chip--active': modelValue === method }"
      :disabled="disabled"
      @click="select(method)"
    >
      {{ method }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    options?: string[]
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    options: undefined,
    disabled: false,
    ariaLabel: 'Payment method',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { paymentTenderOptions } = usePaymentTenders()

const options = computed(() =>
  props.options?.length ? props.options : paymentTenderOptions.value
)

function select(method: string) {
  if (props.disabled) return
  emit('update:modelValue', method)
}

watch(
  options,
  (list) => {
    if (!list.length) return
    if (!list.includes(props.modelValue)) {
      emit('update:modelValue', list[0]!)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.payment-tender-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.payment-tender-picker__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid rgb(15 23 42 / 0.1);
  border-radius: 9999px;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 550;
  letter-spacing: -0.01em;
  line-height: 1.2;
  color: var(--dash-overlay-muted, #64748b);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.payment-tender-picker__chip:hover:not(:disabled) {
  border-color: rgb(15 23 42 / 0.18);
  color: var(--dash-overlay-ink, #0f172a);
  background: rgb(15 23 42 / 0.04);
}

.payment-tender-picker__chip--active {
  border-color: transparent;
  background: #1a1523;
  color: #ffffff;
}

.payment-tender-picker__chip--active:hover:not(:disabled) {
  border-color: transparent;
  background: #1a1523;
  color: #ffffff;
}

.payment-tender-picker__chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

:global(html.dark) .payment-tender-picker__chip {
  border-color: rgb(255 255 255 / 0.12);
  color: rgb(255 255 255 / 0.62);
}

:global(html.dark) .payment-tender-picker__chip:hover:not(:disabled) {
  border-color: rgb(255 255 255 / 0.22);
  color: #ffffff;
  background: rgb(255 255 255 / 0.06);
}

:global(html.dark) .payment-tender-picker__chip--active,
:global(html.dark) .payment-tender-picker__chip--active:hover:not(:disabled) {
  border-color: transparent;
  background: #ffffff;
  color: #111111;
}
</style>
