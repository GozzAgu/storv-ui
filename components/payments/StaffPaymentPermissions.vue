<template>
  <section v-if="access.enabled && access.isOwner && memberUid" class="s-form-section">
    <h3 class="s-form-section__title">Payments</h3>
    <p class="s-form-meta">
      Saved separately and recorded in the payments audit log. Confirming means checking money
      against your bank app or till before a sale counts as paid.
    </p>
    <SCheckbox
      v-model="perms.view"
      variant="switch"
      label="See all payments"
      description="View every payment on every sale, not just ones they recorded."
      :disabled="loading"
    />
    <SCheckbox
      v-model="perms.confirm"
      variant="switch"
      label="Confirm payments"
      description="Confirm or reject payments recorded by others, and count the till."
      :disabled="loading"
    />
    <SCheckbox
      v-model="perms.refund"
      variant="switch"
      label="Refund payments"
      description="Record refunds and close sales that have no money held."
      :disabled="loading"
    />
    <div>
      <SButton size="sm" :loading="saving" :disabled="!dirty || loading" @click="save">
        Save payment permissions
      </SButton>
    </div>

    <TotpConfirmModal
      v-model="totp.open.value"
      title="Confirm with authenticator"
      description="Enter your 6-digit code to change who can handle payments."
      @confirm="totp.confirm"
      @cancel="totp.cancel"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import SButton from '~/components/s/SButton.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import TotpConfirmModal from '~/components/security/TotpConfirmModal.vue'
import { useTotpConfirmModal } from '~/composables/useTotpConfirmModal'
import { resolveTotpForSensitiveAction } from '~/utils/security-api-errors'
import type { PaymentPermissions } from '~/types/payments-v2'

const props = defineProps<{ memberUid?: string | null }>()

const paymentsV2 = usePaymentsV2()
const access = paymentsV2.access
const toast = useAppToast()
const totp = useTotpConfirmModal()

const empty = (): PaymentPermissions => ({ view: false, confirm: false, refund: false })
const perms = ref<PaymentPermissions>(empty())
const saved = ref<PaymentPermissions>(empty())
const loading = ref(false)
const saving = ref(false)

const dirty = computed(
  () =>
    perms.value.view !== saved.value.view ||
    perms.value.confirm !== saved.value.confirm ||
    perms.value.refund !== saved.value.refund
)

async function load() {
  perms.value = empty()
  saved.value = empty()
  await paymentsV2.loadAccess()
  if (!props.memberUid || !access.value.enabled || !access.value.isOwner) return
  loading.value = true
  try {
    const db = useFirestore().getFirestoreInstance()
    const ownerId = await getQueryUserId()
    const storeId = await getCurrentStoreId()
    if (!db || !ownerId || !storeId) return
    const snap = await getDoc(
      doc(db, 'users', ownerId, 'stores', storeId, 'members', props.memberUid)
    )
    const raw = (snap.data()?.permissions?.payments ?? {}) as Partial<PaymentPermissions>
    const current = {
      view: raw.view === true,
      confirm: raw.confirm === true,
      refund: raw.refund === true,
    }
    perms.value = { ...current }
    saved.value = { ...current }
  } catch {
    toast.error('Could not load payment permissions')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!props.memberUid) return
  saving.value = true
  try {
    const code = await resolveTotpForSensitiveAction(totp.prompt)
    const res = await paymentsV2.setMemberPermissions(props.memberUid, { ...perms.value }, code)
    saved.value = { ...res.permissions }
    perms.value = { ...res.permissions }
    toast.success('Payment permissions saved')
  } catch (err) {
    toast.error(paymentsErrorMessage(err, 'Could not save payment permissions'))
  } finally {
    saving.value = false
  }
}

watch(() => props.memberUid, load, { immediate: true })
</script>
