<template>
  <div
    v-if="canShow && filteredEntries.length > 0"
    class="rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-3 sm:px-5 sm:py-4"
  >
    <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
          <LockClosedIcon class="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-300" />
          Saved staff sign-in passwords
        </h2>
        <p class="mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-200/70 leading-snug max-w-xl">
          You can open this list anytime after closing the add-staff dialog. Passwords stay only in this browser
          session until you clear them or leave the page.
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
        class="rounded-lg bg-white/80 dark:bg-gray-900/50 ring-1 ring-amber-200/60 dark:ring-amber-800/40 px-3 py-2.5"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate max-w-full">
              {{ entry.staffName || 'Staff' }}
            </p>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">{{ entry.staffEmail }}</p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {{ entry.departmentName }} · {{ formatTime(entry.createdAt) }}
            </p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              class="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Copy password"
              @click="copyPassword(entry)"
            >
              <ClipboardDocumentIcon v-if="copyId !== entry.id" class="w-4 h-4" />
              <CheckCircleIcon v-else class="w-4 h-4 text-emerald-600" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              title="Remove from list"
              @click="removeInvite(entry.id)"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="mt-2 pt-2 border-t border-gray-200/80 dark:border-gray-700/80">
          <code class="block text-xs font-mono text-gray-900 dark:text-gray-100 break-all select-all">{{ entry.password }}</code>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { LockClosedIcon, ClipboardDocumentIcon, CheckCircleIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useStaffInvitePasswordsStore } from '~/stores/staffInvitePasswords'

const props = defineProps<{
  departmentId: string
  /** Only super admins / those who can create staff should see this */
  canShow: boolean
}>()

const inviteStore = useStaffInvitePasswordsStore()

const filteredEntries = computed(() =>
  inviteStore.entries.filter((e) => e.departmentId === props.departmentId)
)

const copyId = ref<string | null>(null)

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
