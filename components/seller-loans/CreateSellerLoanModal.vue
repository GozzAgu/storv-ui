<template>
  <SDialog
      placement="right"
    :open="modelValue"
    title="Stock loan"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <SForm>
      <SFormSection>
        <p class="s-callout">
          <strong>Not a sale:</strong>
          Selected serial items are marked as on a stock loan to the borrower below. Selling on a
          receipt or choosing Mark sold on Stock loans marks units sold and updates this loan.
        </p>
      </SFormSection>

      <SFormSection>
        <h3 class="s-form-section__title">Products</h3>
        <div :class="pickListClass">
          <ul :class="pickListScrollClass">
            <li
              v-for="it in items"
              :key="it.id"
              :class="[pickRowClass, 's-pick__row--static']"
            >
              <span :class="pickRowTitleClass">{{ getInventoryItemDisplayName(it) }}</span>
            </li>
          </ul>
        </div>
        <p class="s-form-meta">
          {{ items.length }} item{{ items.length !== 1 ? 's' : '' }}
        </p>
      </SFormSection>

      <SFormSection>
        <div class="s-form-pair">
          <SField label="Borrower name" required>
            <SInput
              v-model="partyName"
              maxlength="120"
              placeholder="Company or borrower name"
              autocomplete="organization"
            />
          </SField>
          <SField label="Phone" hint="Optional">
            <SInput v-model="partyPhone" type="tel" maxlength="40" placeholder="Contact number" />
          </SField>
        </div>
        <SField label="Notes" hint="Optional">
          <STextarea
            v-model="partyNotes"
            :rows="3"
            maxlength="1000"
            placeholder="SKU list, handshake details, pickup time…"
          />
        </SField>
      </SFormSection>
    </SForm>

    <template #footer>
      <SDialogActions
        primary-label="Confirm stock loan"
        :primary-loading="submitting"
        :primary-disabled="!partyNameTrimmed"
        @cancel="emit('update:modelValue', false)"
        @primary="submit"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SInput from '~/components/s/SInput.vue'
import STextarea from '~/components/s/STextarea.vue'
import { ref, computed, watch } from 'vue'
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
