<template>
  <section v-if="visible" class="s-form-section">
    <h3 class="s-form-section__title">Admin</h3>
    <p class="s-form-meta">
      An admin can do everything in this branch that you can, including adding, editing and
      removing regular staff. They see financial figures only if you turn on Financial figures
      for them below. Only you can make or remove admins and manage billing. Saved separately.
    </p>
    <SCheckbox
      v-model="admin"
      variant="switch"
      :label="`Make admin of ${branchLabel}`"
      description="Everything in this branch, and managing regular staff."
      :disabled="saving"
    />
    <template v-if="admin">
      <SCheckbox
        v-for="extra in ADMIN_EXTRAS"
        :key="extra.key"
        v-model="grants[extra.key]"
        variant="switch"
        :label="extra.label"
        :description="extra.description"
        :disabled="saving"
      />
    </template>
    <div>
      <SButton size="sm" :loading="saving" :disabled="!dirty" @click="save">
        Save admin access
      </SButton>
    </div>

    <TotpConfirmModal
      v-model="totp.open.value"
      title="Confirm with authenticator"
      description="Enter your 6-digit code to change who is an admin."
      @confirm="totp.confirm"
      @cancel="totp.cancel"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SButton from '~/components/s/SButton.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import TotpConfirmModal from '~/components/security/TotpConfirmModal.vue'
import { useTotpConfirmModal } from '~/composables/useTotpConfirmModal'
import { resolveTotpForSensitiveAction } from '~/utils/security-api-errors'
import { normalizeStaffAdminGrants } from '~/utils/staff-permissions'
import { useStaffStore } from '~/stores/staff'
import type { Staff } from '~/composables/useStaff'
import type { StaffAdminGrants } from '~/types/staff-permissions'

const props = defineProps<{ staff?: Staff | null; branchName?: string }>()
const emit = defineEmits<{ saved: [{ admin: boolean; adminGrants: StaffAdminGrants }] }>()

const ADMIN_EXTRAS: Array<{ key: keyof StaffAdminGrants; label: string; description: string }> = [
  {
    key: 'branches',
    label: 'Edit this branch’s details',
    description:
      'Name, address, contact details and the note for cashiers. Adding, deleting or deactivating branches stays with you.',
  },
  {
    key: 'storeSettings',
    label: 'Change store settings',
    description:
      'Business details, inventory, receipt and checkout settings. These apply to every branch.',
  },
  {
    key: 'paymentsConfirm',
    label: 'Let staff confirm payments',
    description:
      'Turn Confirm payments on or off for regular staff. Seeing all payments and refunds stay with you.',
  },
  {
    key: 'deleteSales',
    label: 'Delete sales and settle commissions',
    description: 'Sales with payments recorded against them can never be deleted.',
  },
  {
    key: 'dataExport',
    label: 'Export store data',
    description: 'Download Excel backups of this branch.',
  },
]

const { isStoreOwner } = usePermissions()
const staffStore = useStaffStore()
const toast = useAppToast()
const totp = useTotpConfirmModal()

const visible = computed(
  () => isStoreOwner.value && !!props.staff?.authUid && props.staff.status !== 'inactive'
)
const branchLabel = computed(() => props.branchName?.trim() || 'this branch')

const admin = ref(false)
const grants = ref<StaffAdminGrants>(normalizeStaffAdminGrants(null))
const savedAdmin = ref(false)
const savedGrants = ref<StaffAdminGrants>(normalizeStaffAdminGrants(null))
const saving = ref(false)

const dirty = computed(
  () =>
    admin.value !== savedAdmin.value ||
    (admin.value &&
      ADMIN_EXTRAS.some((e) => grants.value[e.key] !== savedGrants.value[e.key]))
)

function reset() {
  savedAdmin.value = props.staff?.admin === true
  savedGrants.value = normalizeStaffAdminGrants(savedAdmin.value ? props.staff?.adminGrants : null)
  admin.value = savedAdmin.value
  grants.value = { ...savedGrants.value }
}

async function save() {
  if (!props.staff) return
  saving.value = true
  try {
    const code = await resolveTotpForSensitiveAction(totp.prompt)
    const result = await staffStore.setStaffAdminAccess(
      props.staff.id,
      { admin: admin.value, grants: admin.value ? { ...grants.value } : normalizeStaffAdminGrants(null) },
      code
    )
    savedAdmin.value = result.admin
    savedGrants.value = { ...result.adminGrants }
    admin.value = result.admin
    grants.value = { ...result.adminGrants }
    emit('saved', result)
    toast.success(result.admin ? 'Admin access saved' : 'Admin access removed')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not save admin access')
  } finally {
    saving.value = false
  }
}

watch(() => [props.staff?.id, props.staff?.admin], reset, { immediate: true })
</script>
