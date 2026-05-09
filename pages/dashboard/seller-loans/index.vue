<template>
  <div class="w-full max-w-none space-y-5 pb-6 sm:space-y-6 sm:pb-8">
    <header class="rounded-sm bg-white/90 px-4 py-4 dark:!bg-dashboard-card sm:px-5 sm:py-5">
      <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
        Inventory
      </p>
      <h1 class="mt-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl">
        Seller loans
      </h1>
      <p class="mt-1 max-w-xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        Track phones or serial items lent to external resellers until they appear on a receipt (sold) or you return stock to your shelf.
      </p>
    </header>

    <div
      v-if="!canAccessByRole"
      class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25 sm:px-5 sm:py-5"
    >
      <p class="text-xs font-medium text-red-800 dark:text-red-200">
        Only super admins and store managers can manage seller loans.
      </p>
    </div>

    <template v-else-if="canAccessSellerLoansPlan">
      <div
        v-if="!storesStore.currentStoreId && !sellerLoansStore.loading"
        class="rounded-sm bg-white/90 px-6 py-12 text-center dark:!bg-dashboard-card sm:px-10"
      >
        <BuildingStorefrontIcon class="mx-auto mb-3 h-7 w-7 text-gray-500 dark:text-gray-400" stroke-width="1.5" />
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Select a store</p>
        <p class="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Use the store selector in the top bar.
        </p>
      </div>

      <div v-else class="data-table-shell overflow-hidden">
        <div class="border-b border-gray-200/80 bg-white/95 px-4 py-3 dark:border-gray-800/70 dark:!bg-dashboard-card sm:px-5">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex gap-1.5 rounded-sm bg-gray-100/95 p-0.5 dark:bg-gray-800/80">
              <button
                type="button"
                :class="[
                  'rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors',
                  statusFilter === 'active'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-50'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                ]"
                @click="statusFilter = 'active'"
              >
                Active
              </button>
              <button
                type="button"
                :class="[
                  'rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors',
                  statusFilter === 'returned'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-50'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                ]"
                @click="statusFilter = 'returned'"
              >
                Returned
              </button>
              <button
                type="button"
                :class="[
                  'rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors',
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-50'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                ]"
                @click="statusFilter = 'all'"
              >
                All
              </button>
            </div>
            <button
              type="button"
              class="text-[11px] font-medium text-primary-700 underline underline-offset-2 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200"
              :disabled="sellerLoansStore.loading"
              @click="sellerLoansStore.fetchSellerLoanOuts(true)"
            >
              Refresh
            </button>
          </div>
        </div>

        <div v-if="sellerLoansStore.loading && sellerLoansStore.loans.length === 0" class="p-8">
          <div class="mx-auto flex max-w-[200px] flex-col gap-2">
            <div v-for="i in 6" :key="i" class="h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        <div v-else-if="sellerLoansStore.error" class="px-5 py-8 text-center text-sm text-red-600 dark:text-red-400">
          {{ sellerLoansStore.error }}
        </div>

        <div v-else-if="filteredLoans.length === 0" class="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No loans in this filter.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200/80 dark:divide-gray-700/80">
            <thead class="bg-gray-50/90 dark:!bg-dashboard-card/85">
              <tr>
                <th scope="col" class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4">
                  Reseller / seller
                </th>
                <th scope="col" class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4">
                  Units
                </th>
                <th scope="col" class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4">
                  Started
                </th>
                <th scope="col" class="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4">
                  Status
                </th>
                <th scope="col" class="w-[1%] whitespace-nowrap px-3 py-2.5 text-right text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 sm:px-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200/80 bg-white dark:divide-gray-700/80 dark:!bg-dashboard-card">
              <tr v-for="loan in filteredLoans" :key="loan.id" class="hover:bg-gray-50/85 dark:hover:bg-gray-900/55">
                <td class="px-3 py-2.5 sm:px-4">
                  <p class="text-[11px] font-semibold text-gray-900 dark:text-gray-50">{{ loan.partyName }}</p>
                  <p v-if="loan.partyPhone" class="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{{ loan.partyPhone }}</p>
                  <p v-if="loan.partyNotes && loan.status === 'active'" class="mt-1 max-w-xs truncate text-[10px] text-gray-600 dark:text-gray-300" :title="loan.partyNotes">
                    {{ loan.partyNotes }}
                  </p>
                </td>
                <td class="px-3 py-2.5 text-[11px] text-gray-800 dark:text-gray-200 sm:px-4">
                  {{ loan.lines.length }}
                  <details v-if="loan.lines.length && loan.lines.length <= 40" class="mt-1.5">
                    <summary class="cursor-pointer text-[10px] text-primary-700 dark:text-primary-400">View products</summary>
                    <ul class="mt-1 max-h-32 list-inside list-disc space-y-0.5 text-[10px] text-gray-600 dark:text-gray-400">
                      <li v-for="(line, i) in loan.lines" :key="i">{{ line.itemSummary }}</li>
                    </ul>
                  </details>
                </td>
                <td class="whitespace-nowrap px-3 py-2.5 text-[11px] text-gray-700 dark:text-gray-300 sm:px-4">
                  {{ formatWhen(loan.createdAt) }}
                </td>
                <td class="px-3 py-2.5 sm:px-4">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide ring-1 ring-inset',
                      loan.status === 'active'
                        ? 'bg-indigo-500/10 text-indigo-900 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-100 dark:ring-indigo-400/30'
                        : 'bg-gray-500/10 text-gray-700 ring-gray-400/25 dark:bg-gray-500/15 dark:text-gray-300',
                    ]"
                  >
                    {{ loan.status === 'active' ? 'With seller' : 'Returned' }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-right sm:px-4">
                  <button
                    v-if="loan.status === 'active'"
                    type="button"
                    class="text-[11px] font-semibold text-primary-700 underline underline-offset-2 hover:text-primary-900 disabled:opacity-50 dark:text-primary-400 dark:hover:text-primary-300"
                    :disabled="returningId === loan.id"
                    @click="openReturnModal(loan)"
                  >
                    {{ returningId === loan.id ? 'Returning…' : 'Return to store' }}
                  </button>
                  <span v-else-if="loan.returnedAt" class="text-[10px] text-gray-500 dark:text-gray-400">
                    {{ formatWhen(loan.returnedAt) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div
      v-else
      class="rounded-sm bg-amber-50/90 px-4 py-4 dark:bg-amber-950/25 sm:px-5 sm:py-5"
    >
      <p class="text-xs font-medium text-amber-900 dark:text-amber-100">
        Seller loans are included on Storvv Enterprise — track inventory lent to external resellers until sold or returned. Upgrade in Settings when you are ready.
      </p>
      <NuxtLink
        to="/dashboard/settings"
        class="mt-2 inline-block text-xs font-medium text-amber-900 underline underline-offset-2 dark:text-amber-200"
      >
        Settings
      </NuxtLink>
    </div>

    <Modal
      v-model="showReturnModal"
      title="Return to store"
      subtitle="This clears the loan flags on the listed inventory so the units show as available again on the shelf."
      size="md"
      :close-on-backdrop="!confirmReturnLoading"
      :show-close="!confirmReturnLoading"
    >
      <template #default>
        <p v-if="loanPendingReturn" class="text-sm text-gray-700 dark:text-gray-300">
          Mark all
          <span class="font-semibold tabular-nums">{{ loanPendingReturn.lines.length }}</span>
          item{{ loanPendingReturn.lines.length !== 1 ? 's' : '' }}
          from
          <span class="font-semibold">{{ loanPendingReturn.partyName }}</span>
          as returned to your store?
        </p>
        <p v-if="loanPendingReturn?.partyNotes" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Notes on file: {{ loanPendingReturn.partyNotes }}
        </p>
      </template>
      <template #footer>
        <Button variant="outline" size="sm" extra-class="!rounded-2xl" :disabled="confirmReturnLoading" @click="closeReturnModal">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          extra-class="!rounded-2xl"
          :loading="confirmReturnLoading"
          :disabled="!loanPendingReturn"
          @click="confirmReturn"
        >
          Return to store
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { BuildingStorefrontIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { useSellerLoanOutsStore, type SellerLoanOut } from '~/stores/sellerLoanOuts'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { useAppToast } from '~/composables/useAppToast'

definePageMeta({
  layout: 'dashboard',
})

const sellerLoansStore = useSellerLoanOutsStore()
const storesStore = useStoresStore()
const { canManage } = usePermissions()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const toast = useAppToast()

const canAccessByRole = computed(() => canManage.value)
const canAccessSellerLoansPlan = computed(() => canUseSubscriptionFeature('seller_loans'))

const statusFilter = ref<'active' | 'returned' | 'all'>('active')

const filteredLoans = computed(() => {
  const rows = sellerLoansStore.loans
  if (statusFilter.value === 'all') return rows
  if (statusFilter.value === 'active') return rows.filter((l) => l.status === 'active')
  return rows.filter((l) => l.status === 'returned')
})

function formatWhen(v: Date | undefined) {
  if (!v) return '—'
  try {
    return v.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

watch(
  () => storesStore.currentStoreId,
  () => {
    if (storesStore.currentStoreId && canAccessSellerLoansPlan.value && canAccessByRole.value) {
      sellerLoansStore.fetchSellerLoanOuts(true)
    } else if (!storesStore.currentStoreId) {
      sellerLoansStore.clearForUiStoreSwitch()
    }
  }
)

onMounted(() => {
  if (canAccessSellerLoansPlan.value && canAccessByRole.value && storesStore.currentStoreId) {
    sellerLoansStore.fetchSellerLoanOuts(true)
  }
})

const returningId = ref<string | null>(null)
const showReturnModal = ref(false)
const loanPendingReturn = ref<SellerLoanOut | null>(null)
const confirmReturnLoading = ref(false)

watch(showReturnModal, (open) => {
  if (!open && !confirmReturnLoading.value) {
    loanPendingReturn.value = null
  }
})

function openReturnModal(loan: SellerLoanOut) {
  loanPendingReturn.value = loan
  showReturnModal.value = true
}

function closeReturnModal() {
  showReturnModal.value = false
  if (!confirmReturnLoading.value) {
    loanPendingReturn.value = null
  }
}

async function confirmReturn() {
  const loan = loanPendingReturn.value
  if (!loan) return
  returningId.value = loan.id
  confirmReturnLoading.value = true
  try {
    await sellerLoansStore.returnSellerLoanOut(loan.id)
    toast.success('Stock returned — items are available again in inventory.')
    showReturnModal.value = false
    loanPendingReturn.value = null
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Return failed')
  } finally {
    confirmReturnLoading.value = false
    returningId.value = null
  }
}
</script>
