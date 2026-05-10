<template>
  <Modal
    :model-value="modelValue"
    title="Stock loan"
    subtitle="Items stay in inventory until sold on a receipt, marked sold from Stock loans when the borrower sells, or returned here."
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <div class="space-y-4">
        <div
          class="rounded-sm border border-sky-200/80 bg-sky-50/90 p-3 text-xs text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/35 dark:text-sky-100"
        >
          <strong>Not a sale:</strong>
          Selected serial items are marked as on a stock loan to the borrower below. Selling on a receipt or choosing Mark sold on Stock loans marks units sold and updates this loan.
        </div>

        <div>
          <p class="text-xs font-medium text-gray-700 dark:text-gray-300">Products</p>
          <ul class="mt-1.5 max-h-44 space-y-1 overflow-y-auto rounded-sm border border-gray-200/90 bg-gray-50/90 px-2.5 py-2 text-[11px] text-gray-800 dark:border-gray-700/80 dark:bg-gray-900/40 dark:text-gray-200">
            <li v-for="it in items" :key="it.id" class="truncate">{{ getInventoryItemDisplayName(it) }}</li>
          </ul>
          <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{{ items.length }} item{{ items.length !== 1 ? 's' : '' }}</p>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Borrower name *</label>
          <input
            v-model="partyName"
            type="text"
            maxlength="120"
            placeholder="Company or borrower name"
            autocomplete="organization"
            class="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Phone (optional)</label>
          <input
            v-model="partyPhone"
            type="tel"
            maxlength="40"
            placeholder="Contact number"
            class="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
          <textarea
            v-model="partyNotes"
            rows="3"
            maxlength="1000"
            placeholder="SKU list, handshake details, pickup time…"
            class="w-full resize-y rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <Button variant="outline" size="sm" extra-class="!rounded-2xl" @click="emit('update:modelValue', false)">Cancel</Button>
      <Button
        variant="primary"
        size="sm"
        extra-class="!rounded-2xl"
        :loading="submitting"
        :disabled="!partyNameTrimmed"
        @click="submit"
      >
        Confirm stock loan
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import type { InventoryItem } from '~/stores/inventory'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { useSellerLoanOutsStore } from '~/stores/sellerLoanOuts'
import { useAppToast } from '~/composables/useAppToast'

const props = defineProps<{
  modelValue: boolean
  items: InventoryItem[]
  folderId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const sellerLoansStore = useSellerLoanOutsStore()
const toast = useAppToast()

const partyName = ref('')
const partyPhone = ref('')
const partyNotes = ref('')
const submitting = ref(false)

const partyNameTrimmed = computed(() => partyName.value.trim())

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      partyName.value = ''
      partyPhone.value = ''
      partyNotes.value = ''
    }
  }
)

async function submit() {
  if (!partyNameTrimmed.value || props.items.length === 0) return
  submitting.value = true
  try {
    const lines = props.items.map((it) => ({
      inventoryItemId: it.id,
      folderId: props.folderId,
      itemSummary: getInventoryItemDisplayName(it),
    }))
    await sellerLoansStore.createSellerLoanOut({
      partyName: partyNameTrimmed.value,
      partyPhone: partyPhone.value.trim(),
      partyNotes: partyNotes.value,
      lines,
    })
    toast.success('Stock loan recorded — items stay on loan until sold or returned to the store.')
    emit('update:modelValue', false)
    emit('success')
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Could not save stock loan')
  } finally {
    submitting.value = false
  }
}
</script>
