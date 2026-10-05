<template>
  <SCard v-if="canShow && filteredEntries.length > 0" flush class="s-invites">
    <div class="s-invites__head">
      <span class="s-invites__icon" aria-hidden="true">
        <KeyRound :size="16" :stroke-width="1.75" />
      </span>
      <div class="s-invites__intro">
        <h2 class="s-invites__title">Pending sign-in invites</h2>
        <p class="s-invites__text">
          These people haven't set their own password yet. Email them their sign-in details or copy
          them. Each invite disappears once they sign in and change their password.
        </p>
      </div>
      <SButton variant="ghost" size="sm" @click="clearThisDepartment">Clear all</SButton>
    </div>
    <ul class="s-list" aria-label="Pending invites">
      <li v-for="entry in filteredEntries" :key="entry.id" class="s-list__item s-invites__item">
        <span class="s-list__main">
          <span class="s-list__primary">{{ entry.staffName || 'Staff' }}</span>
          <span class="s-list__secondary">{{ entry.staffEmail }} · {{ formatTime(entry.createdAt) }}</span>
          <span class="s-invites__password">
            <span class="ds-sr-only">Temporary password:</span>
            <code>{{ entry.password }}</code>
          </span>
        </span>
        <span class="s-invites__actions">
          <SButton
            variant="secondary"
            size="sm"
            :loading="emailingId === entry.id"
            @click="emailEntryToStaff(entry)"
          >
            <template #leading><Mail :size="14" :stroke-width="2" aria-hidden="true" /></template>
            Email
          </SButton>
          <SButton variant="ghost" size="sm" @click="copyInviteEmail(entry)">
            {{ copyInviteId === entry.id ? 'Copied' : 'Copy invite' }}
          </SButton>
          <SIconButton
            :label="copyId === entry.id ? 'Password copied' : `Copy password for ${entry.staffEmail}`"
            size="sm"
            @click="copyPassword(entry)"
          >
            <Check v-if="copyId === entry.id" :size="16" :stroke-width="2" aria-hidden="true" />
            <Copy v-else :size="16" :stroke-width="1.75" aria-hidden="true" />
          </SIconButton>
          <SIconButton
            :label="`Remove invite for ${entry.staffEmail}`"
            size="sm"
            @click="removeInvite(entry.id)"
          >
            <Trash2 :size="16" :stroke-width="1.75" aria-hidden="true" />
          </SIconButton>
        </span>
      </li>
    </ul>
    <p class="ds-sr-only" aria-live="polite">
      {{ copyId ? 'Password copied' : copyInviteId ? 'Invite copied' : '' }}
    </p>
  </SCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Check, Copy, KeyRound, Mail, Trash2 } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import {
  useStaffInvitePasswordsStore,
  type StaffInvitePasswordEntry,
} from '~/stores/staffInvitePasswords'
import { useStaffStore } from '~/stores/staff'
import { useStaffInviteEmail } from '~/composables/useStaffInviteEmail'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useDepartmentsStore } from '~/stores/departments'
import { useAppToast } from '~/composables/useAppToast'
import { getApiErrorMessage } from '~/utils/api-error-message'

const props = defineProps<{
  departmentId: string
  /** Only super admins / those who can create staff should see this */
  canShow: boolean
}>()

const inviteStore = useStaffInvitePasswordsStore()
const staffStore = useStaffStore()
const { sendStaffInviteEmail } = useStaffInviteEmail()
const authStore = useAuthStore()
const userStore = useUserStore()
const departmentsStore = useDepartmentsStore()
const toast = useAppToast()

const filteredEntries = computed(() =>
  inviteStore.entries.filter((entry) => entry.departmentId === props.departmentId)
)

const departmentStaff = computed(() =>
  staffStore.staff.filter((member) => member.departmentId === props.departmentId)
)

async function syncInvitesWithStaff() {
  inviteStore.hydrate()
  await staffStore.fetchStaffByDepartment(props.departmentId)
  inviteStore.pruneForStaff(departmentStaff.value)
}

onMounted(() => {
  void syncInvitesWithStaff()
})

watch(
  () => props.departmentId,
  () => {
    void syncInvitesWithStaff()
  }
)

watch(
  departmentStaff,
  (staff) => {
    inviteStore.pruneForStaff(staff)
  },
  { deep: true }
)

const copyId = ref<string | null>(null)
const copyInviteId = ref<string | null>(null)
const emailingId = ref<string | null>(null)

function buildInviteEmail(entry: {
  staffName: string
  staffEmail: string
  password: string
  departmentName: string
}) {
  const origin = import.meta.client ? window.location.origin : 'https://app.storvv.com'
  const name = entry.staffName || 'there'
  return [
    `Hi ${name},`,
    '',
    `You've been invited to Storvv (${entry.departmentName}). Sign in at ${origin}/signin`,
    '',
    `Email: ${entry.staffEmail}`,
    `Temporary password: ${entry.password}`,
    '',
    'You will be asked to set a new password on first sign-in.',
    '',
    'Thanks',
  ].join('\n')
}

async function emailEntryToStaff(entry: StaffInvitePasswordEntry) {
  const ownerUserId = authStore.currentUser?.uid
  if (!ownerUserId) {
    toast.error('Sign in required')
    return
  }

  const dept = departmentsStore.getDepartmentById(entry.departmentId)
  const storeId = entry.storeId || dept?.storeId
  if (!entry.staffId || !storeId) {
    toast.error('Missing staff or store details for this invite')
    return
  }

  emailingId.value = entry.id
  try {
    await sendStaffInviteEmail({
      ownerUserId,
      storeId,
      departmentId: entry.departmentId,
      staffId: entry.staffId,
      staffEmail: entry.staffEmail,
      staffName: entry.staffName,
      departmentName: entry.departmentName,
      businessName:
        userStore.userData?.storeDetails?.storeName ||
        userStore.userData?.name ||
        'Storvv',
      temporaryPassword: entry.password,
      mode: 'credentials',
    })
    toast.success(`Sign-in details emailed to ${entry.staffEmail}`)
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Could not send invite email')
    toast.error(message)
  } finally {
    emailingId.value = null
  }
}

async function copyInviteEmail(entry: {
  id: string
  staffName: string
  staffEmail: string
  password: string
  departmentName: string
}) {
  try {
    await navigator.clipboard.writeText(buildInviteEmail(entry))
    copyInviteId.value = entry.id
    setTimeout(() => {
      copyInviteId.value = null
    }, 2000)
  } catch {
    // ignore
  }
}

function removeInvite(id: string) {
  inviteStore.removeInvite(id)
}

function clearThisDepartment() {
  inviteStore.clearDepartment(props.departmentId)
}

async function copyPassword(entry: { id: string; password: string }) {
  try {
    await navigator.clipboard.writeText(entry.password)
    copyId.value = entry.id
    setTimeout(() => {
      copyId.value = null
    }, 2000)
  } catch {
    // ignore
  }
}

function formatTime(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ts))
  } catch {
    return new Date(ts).toLocaleString()
  }
}
</script>
