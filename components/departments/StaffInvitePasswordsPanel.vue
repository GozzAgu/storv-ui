<template>
  <div
    v-if="canShow && filteredEntries.length > 0"
    class="rounded-2xl border border-amber-200/75 bg-amber-50/85 px-4 py-3 backdrop-blur-md dark:border-amber-800/55 dark:bg-amber-950/35 sm:px-5 sm:py-4"
  >
    <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
      <div class="min-w-0">
        <h2
          class="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2"
        >
          <LockClosedIcon class="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-300" />
          Pending staff sign-in invites
        </h2>
        <p
          class="mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-200/70 leading-snug max-w-xl"
        >
          Staff who have not changed their password yet. Email credentials to them or copy manually.
          Entries disappear after they sign in and set a new password.
        </p>
      </div>
      <button
        type="button"
        class="text-[11px] font-medium text-amber-800 dark:text-amber-200 hover:underline shrink-0"
        @click="clearThisDepartment"
      >
        Clear for this department
      </button>
    </div>
    <ul class="space-y-2.5">
      <li
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="rounded-sm bg-white/80 dark:!bg-dashboard-card ring-1 ring-amber-200/60 dark:ring-amber-800/40 px-3 py-2.5"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate max-w-full">
              {{ entry.staffName || 'Staff' }}
            </p>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {{ entry.staffEmail }}
            </p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {{ entry.departmentName }} · {{ formatTime(entry.createdAt) }}
            </p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              class="rounded-sm px-2 py-1 text-[10px] font-medium text-amber-900 hover:bg-amber-100/80 disabled:opacity-60 dark:text-amber-100 dark:hover:bg-amber-900/30"
              :disabled="emailingId === entry.id"
              title="Email sign-in details to staff"
              @click="emailEntryToStaff(entry)"
            >
              {{ emailingId === entry.id ? 'Sending…' : 'Email to staff' }}
            </button>
            <button
              type="button"
              class="rounded-sm px-2 py-1 text-[10px] font-medium text-amber-900 hover:bg-amber-100/80 dark:text-amber-100 dark:hover:bg-amber-900/30"
              title="Copy invite email"
              @click="copyInviteEmail(entry)"
            >
              {{ copyInviteId === entry.id ? 'Copied' : 'Copy invite' }}
            </button>
            <button
              type="button"
              class="p-1.5 rounded-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Copy password"
              @click="copyPassword(entry)"
            >
              <ClipboardDocumentIcon v-if="copyId !== entry.id" class="w-4 h-4" />
              <CheckCircleIcon v-else class="w-4 h-4 text-emerald-600" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-sm text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              title="Remove saved invite"
              @click="removeInvite(entry.id)"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="mt-2 pt-2 border-t border-gray-200/80 dark:border-white/10">
          <code
            class="block text-xs font-mono text-gray-900 dark:text-gray-100 break-all select-all"
            >{{ entry.password }}</code
          >
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  LockClosedIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  TrashIcon,
} from '~/utils/app-icons'
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
