<template>
  <SidePanel
    :model-value="modelValue"
    title="Stock loan"
    size="lg"
    dense
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <IosForm layout="fill">
      <IosFormSection fixed>
        <p class="dash-drawer-callout">
          <strong class="font-medium text-gray-900 dark:text-gray-100">Not a sale:</strong>
          Selected serial items are marked as on a stock loan to the borrower below. Selling on a
          receipt or choosing Mark sold on Stock loans marks units sold and updates this loan.
        </p>
      </IosFormSection>

      <IosFormSection fixed>
        <p class="dash-drawer-label">Products</p>
        <div :class="pickListClass">
          <ul :class="pickListScrollClass">
            <li
              v-for="it in items"
              :key="it.id"
              :class="[pickRowClass, '!cursor-default hover:!bg-transparent']"
            >
              <span :class="pickRowTitleClass">{{ getInventoryItemDisplayName(it) }}</span>
            </li>
          </ul>
        </div>
        <p class="ios-form__hint dash-drawer-hint">
          {{ items.length }} item{{ items.length !== 1 ? 's' : '' }}
        </p>
      </IosFormSection>

      <IosFormSection fixed>
        <IosFormField label="Borrower name" required>
          <IosFormInput
            v-model="partyName"
            maxlength="120"
            placeholder="Company or borrower name"
            autocomplete="organization"
          />
        </IosFormField>
        <IosFormField label="Phone" hint="Optional">
          <IosFormInput v-model="partyPhone" type="tel" maxlength="40" placeholder="Contact number" />
        </IosFormField>
        <IosFormField label="Notes" hint="Optional">
          <IosFormTextarea
            v-model="partyNotes"
            :rows="3"
            maxlength="1000"
            placeholder="SKU list, handshake details, pickup time…"
          />
        </IosFormField>
      </IosFormSection>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        primary-label="Confirm stock loan"
        :primary-loading="submitting"
        :primary-disabled="!partyNameTrimmed"
        @cancel="emit('update:modelValue', false)"
        @primary="submit"
      />
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import {
  IosForm,
  IosFormSection,
  IosFormField,
  IosFormInput,
  IosFormTextarea,
} from '~/components/ios/forms'
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
const {
  pickListClass,
  pickListScrollClass,
  pickRowClass,
  pickRowTitleClass,
} = useDashboardDrawerChrome()

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
    toast.success('Stock loan recorded. Items stay on loan until sold or returned to the store.')
    emit('update:modelValue', false)
    emit('success')
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Could not save stock loan')
  } finally {
    submitting.value = false
  }
}
</script>
