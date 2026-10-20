<template>
  <SDialog
    v-model:open="open"
    title="Manager approval"
    :description="reason"
    size="sm"
    :dismissible="!busy"
  >
    <p v-if="loadError" class="s-form-meta" role="alert">{{ loadError }}</p>
    <p v-else-if="!loading && approvers.length === 0" class="s-form-meta">
      No manager has set an approval PIN yet. The owner or a manager can set one in Profile →
      Approval PIN.
    </p>
    <SForm v-else @submit.prevent="approve">
      <SSelect
        v-model="approverUid"
        label="Manager"
        :options="approverOptions"
        placeholder="Choose who is approving"
        :disabled="loading || busy"
        required
      />
      <SInput
        v-model="pin"
        label="Their PIN"
        type="password"
        inputmode="numeric"
        autocomplete="off"
        placeholder="4–6 digits"
        :error="error ?? undefined"
        :disabled="busy"
        required
        maxlength="6"
      />
    </SForm>
    <template #footer>
      <SDialogActions
        primary-label="Approve"
        :primary-loading="busy"
        :primary-disabled="!canApprove"
        :cancel-disabled="busy"
        @cancel="open = false"
        @primary="approve"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SForm from '~/components/s/SForm.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import { useSalesApi, type SaleApproval } from '~/composables/useSalesApi'

/**
 * Asks a manager to approve a discount above the staff limit or a trade-in with their PIN. The
 * parent sends the approval with the sale; the server checks the PIN and who the manager is.
 */
const props = defineProps<{
  reason: string
  /** Set by the parent when the server refused the PIN, so the manager can retry. */
  error?: string | null
  busy?: boolean
}>()

const emit = defineEmits<{ approve: [approval: SaleApproval] }>()
const open = defineModel<boolean>('open', { default: false })

const salesApi = useSalesApi()
const approvers = ref<Array<{ uid: string; name: string }>>([])
const loading = ref(false)
const loadError = ref<string | null>(null)
const approverUid = ref<string>('')
const pin = ref('')

const approverOptions = computed(() =>
  approvers.value.map((a) => ({ value: a.uid, label: a.name }))
)
const canApprove = computed(() => !!approverUid.value && /^\d{4,6}$/.test(pin.value) && !props.busy)

watch(open, async (isOpen) => {
  if (!isOpen) return
  pin.value = ''
  loadError.value = null
  loading.value = true
  try {
    approvers.value = (await salesApi.approvers()).approvers
    if (approvers.value.length === 1) approverUid.value = approvers.value[0]!.uid
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Could not load managers'
  } finally {
    loading.value = false
  }
})

watch(
  () => props.error,
  (message) => {
    if (message) pin.value = ''
  }
)

function approve() {
  if (!canApprove.value) return
  emit('approve', { approverUid: approverUid.value, pin: pin.value })
}
</script>
