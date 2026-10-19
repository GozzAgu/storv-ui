<template>
  <SCard
    v-if="status?.canApprove"
    title="Approval PIN"
    description="Staff ask for this PIN at the till for discounts above 10% and trade-ins. Keep it private."
  >
    <template #actions>
      <SBadge :tone="status.hasPin ? 'success' : 'warning'">
        {{ status.hasPin ? 'Set' : 'Not set' }}
      </SBadge>
    </template>
    <SForm class="s-approval-pin" @submit.prevent="save">
      <SInput
        v-model="pin"
        :label="status.hasPin ? 'New PIN' : 'PIN'"
        type="password"
        inputmode="numeric"
        autocomplete="new-password"
        placeholder="4–6 digits"
        maxlength="6"
        :disabled="saving"
      />
      <SInput
        v-if="needsTotp"
        v-model="totp"
        label="Authenticator code"
        inputmode="numeric"
        autocomplete="one-time-code"
        placeholder="6 digits"
        maxlength="6"
        :disabled="saving"
      />
      <div>
        <SButton type="submit" :loading="saving" :disabled="!canSave">
          {{ status.hasPin ? 'Change PIN' : 'Set PIN' }}
        </SButton>
      </div>
    </SForm>
  </SCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SForm from '~/components/s/SForm.vue'
import SInput from '~/components/s/SInput.vue'
import { useSalesApi } from '~/composables/useSalesApi'
import { useAppToast } from '~/composables/useAppToast'
import { useUserStore } from '~/stores/user'

/** Lets the owner and managers set the PIN that approves big discounts and trade-ins. */
const salesApi = useSalesApi()
const toast = useAppToast()
const userStore = useUserStore()
const status = ref<{ canApprove: boolean; hasPin: boolean } | null>(null)
const pin = ref('')
const totp = ref('')
const saving = ref(false)

const needsTotp = computed(() => userStore.userData?.twoFactorEnabled === true)
const canSave = computed(
  () => /^\d{4,6}$/.test(pin.value) && (!needsTotp.value || /^\d{6}$/.test(totp.value))
)

onMounted(async () => {
  status.value = await salesApi.approvalPinStatus().catch(() => null)
})

async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    await salesApi.setApprovalPin(pin.value, needsTotp.value ? totp.value : undefined)
    status.value = { canApprove: true, hasPin: true }
    pin.value = ''
    totp.value = ''
    toast.success('Approval PIN saved')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not save the PIN')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.s-approval-pin {
  display: grid;
  gap: var(--s-space-2);
  max-width: 320px;
}
</style>
