<template>
  <SDialog
    :open="modelValue"
    @update:open="emit('update:modelValue', $event)"
    size="md"
    title="Customer balance"
  >
    <template #default>
      <div v-if="!hasBalanceFeature" class="s-balance__locked">
        <p class="s-balance__locked-text">
          Customer balance tracking is available on Storvv Medium and Enterprise.
        </p>
        <SButton size="sm" to="/dashboard/settings?tab=subscription">
          View plans
          <template #trailing>
            <ArrowRight :size="14" :stroke-width="2" aria-hidden="true" />
          </template>
        </SButton>
      </div>

      <SForm v-else>
        <SFormSection>
          <div class="s-balance__summary">
            <p class="s-balance__name">{{ customerName }}</p>
            <p class="s-balance__amount">
              {{ formatCurrency(currentBalance) }}
              <span class="s-balance__amount-label">balance due</span>
            </p>
          </div>

          <STabs
            v-model="actionTab"
            :tabs="actionTabs"
            label="Balance action"
            block
          />

          <SField label="Amount">
            <SInput v-model="amountInput" type="number" inputmode="decimal" min="0" step="0.01" />
          </SField>

          <SField label="Note" hint="Optional">
            <SInput v-model="noteInput" type="text" placeholder="e.g. Part payment for invoice" />
          </SField>

          <div v-if="recentLedger.length" class="s-record-history">
            <h4 class="s-record-history__title">Recent activity</h4>
            <ul class="s-record-rows s-balance__history">
              <li v-for="entry in recentLedger" :key="entry.id" class="s-record-row">
                <span class="s-balance__entry-label"
                  >{{ entry.type }}{{ entry.note ? ` · ${entry.note}` : '' }}</span
                >
                <span
                  class="s-record-row__value"
                  :class="entry.amount >= 0 ? 's-balance__entry--owed' : 's-balance__entry--credit'"
                >
                  {{ entry.amount >= 0 ? '+' : '' }}{{ formatCurrency(entry.amount) }}
                </span>
              </li>
            </ul>
          </div>
        </SFormSection>
      </SForm>
    </template>

    <template #footer>
      <SDialogActions
        cancel-label="Close"
        primary-label="Save"
        :show-primary="hasBalanceFeature"
        :primary-loading="saving"
        :primary-disabled="!amountInput || amountInput <= 0"
        @cancel="emit('update:modelValue', false)"
        @primary="handleSave"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SButton from '~/components/s/SButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SInput from '~/components/s/SInput.vue'
import STabs from '~/components/s/STabs.vue'
import { ref, computed, watch } from 'vue'
import { ArrowRight } from '@lucide/vue'
import { useCustomerAccountsStore } from '~/stores/customerAccounts'
import { getCustomerContactKey } from '~/utils/customer-key'

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

const actionTab = ref<string>('charge')
const amountInput = ref<number | null>(null)
const noteInput = ref('')
const saving = ref(false)

const actionTabs = [
  { value: 'charge', label: 'Add charge' },
  { value: 'payment', label: 'Record payment' },
]

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
