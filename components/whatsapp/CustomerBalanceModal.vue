<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    size="md"
    title="Customer balance"
  >
    <template #default>
      <div v-if="!hasBalanceFeature" class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Customer balance tracking is available on Storvv Medium and Enterprise.
        </p>
        <NuxtLink
          to="/dashboard/settings?tab=subscription"
          class="inline-flex text-sm font-medium text-gray-800 hover:text-gray-950 dark:text-gray-200"
        >
          View plans →
        </NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div class="rounded-sm bg-gray-50/80 px-4 py-3 dark:bg-white/[0.04]">
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            {{ customerName }}
          </p>
          <p class="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-50">
            {{ formatCurrency(currentBalance) }}
            <span class="text-xs font-normal text-gray-500 dark:text-gray-400">balance due</span>
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            :class="actionTab === 'charge' ? activeTabClass : inactiveTabClass"
            @click="actionTab = 'charge'"
          >
            Add charge
          </button>
          <button
            type="button"
            :class="actionTab === 'payment' ? activeTabClass : inactiveTabClass"
            @click="actionTab = 'payment'"
          >
            Record payment
          </button>
        </div>

        <IosFormField label="Amount">
          <IosFormInput v-model="amountInput" type="number" min="0" step="0.01" />
        </IosFormField>

        <IosFormField label="Note" hint="Optional">
          <IosFormInput v-model="noteInput" type="text" placeholder="e.g. Part payment for invoice" />
        </IosFormField>

        <div v-if="recentLedger.length" class="border-t border-gray-200 pt-3">
          <p
            class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Recent activity
          </p>
          <ul class="max-h-36 space-y-1.5 overflow-y-auto text-[11px]">
            <li
              v-for="entry in recentLedger"
              :key="entry.id"
              class="flex justify-between gap-2 text-gray-600 dark:text-gray-400"
            >
              <span class="min-w-0 truncate capitalize"
                >{{ entry.type }}{{ entry.note ? ` · ${entry.note}` : '' }}</span
              >
              <span
                class="shrink-0"
                :class="entry.amount >= 0 ? tableMoneyOwedClass() : tableMoneyClass()"
              >
                {{ entry.amount >= 0 ? '+' : '' }}{{ formatCurrency(entry.amount) }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #footer>
      <IosDrawerActions
        cancel-label="Close"
        primary-label="Save"
        :show-primary="hasBalanceFeature"
        :primary-loading="saving"
        :primary-disabled="!amountInput || amountInput <= 0"
        @cancel="emit('update:modelValue', false)"
        @primary="handleSave"
      />
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import { IosFormField, IosFormInput } from '~/components/ios/forms'
import { useCustomerAccountsStore } from '~/stores/customerAccounts'
import { getCustomerContactKey } from '~/utils/customer-key'
import { tableMoneyClass, tableMoneyOwedClass } from '~/utils/table-money-styles'

const props = defineProps<{
  modelValue: boolean
  customerName: string
  email?: string
  phone?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [balance: number]
}>()

const { hasBalanceFeature } = useWhatsAppMessaging()
const { formatCurrency } = usePreferences()
const accountsStore = useCustomerAccountsStore()
const toast = useAppToast()

const actionTab = ref<'charge' | 'payment'>('charge')
const amountInput = ref<number | null>(null)
const noteInput = ref('')
const saving = ref(false)

const activeTabClass =
  'rounded-sm border-0 bg-gray-900 px-3 py-2 text-xs font-medium text-white dark:bg-white dark:text-gray-900'
const inactiveTabClass =
  'rounded-sm bg-white px-3 py-2 text-xs font-medium text-gray-600 dark:!bg-dashboard-card dark:text-gray-400'

const contactKey = computed(() =>
  getCustomerContactKey({
    email: props.email,
    phone: props.phone,
    name: props.customerName,
  })
)

const currentBalance = computed(() => accountsStore.getBalanceForContactKey(contactKey.value))

const recentLedger = computed(() => {
  const account = accountsStore.accountsByContactKey[contactKey.value]
  return account?.balanceLedger?.slice(0, 8) ?? []
})

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !hasBalanceFeature.value) return
    amountInput.value = null
    noteInput.value = ''
    actionTab.value = 'charge'
    await accountsStore.fetchAccountsForStore()
  }
)

const handleSave = async () => {
  if (!amountInput.value || amountInput.value <= 0) return
  saving.value = true
  try {
    const signedAmount = actionTab.value === 'charge' ? amountInput.value : -amountInput.value
    const updated = await accountsStore.applyLedgerEntry({
      customerName: props.customerName,
      email: props.email,
      phone: props.phone,
      type: actionTab.value === 'charge' ? 'charge' : 'payment',
      amount: signedAmount,
      note: noteInput.value,
    })
    toast.success(actionTab.value === 'charge' ? 'Charge recorded' : 'Payment recorded')
    emit('saved', updated.accountBalance)
    emit('update:modelValue', false)
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Failed to update balance')
  } finally {
    saving.value = false
  }
}
</script>
