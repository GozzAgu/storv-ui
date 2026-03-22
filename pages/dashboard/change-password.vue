<template>
  <div class="max-w-md mx-auto">
    <div class="mb-6">
      <p class="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">Security</p>
      <h1 class="mt-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Set your password</h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        You signed in with a temporary password. Choose a new password to continue.
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
      <div class="p-4 sm:p-6 space-y-4">
        <div>
          <label for="current" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current (temporary) password</label>
          <input
            id="current"
            v-model="form.currentPassword"
            :type="showCurrent ? 'text' : 'password'"
            autocomplete="current-password"
            required
            class="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500/25 focus:ring-offset-0 outline-none"
            placeholder="Enter temporary password"
          />
        </div>
        <div>
          <label for="new" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
          <input
            id="new"
            v-model="form.newPassword"
            :type="showNew ? 'text' : 'password'"
            autocomplete="new-password"
            required
            :minlength="PASSWORD_MIN_LENGTH"
            class="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500/25 focus:ring-offset-0 outline-none"
            placeholder="At least 12 characters, number and capital letter"
          />
          <p class="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
            At least {{ PASSWORD_MIN_LENGTH }} characters, one number, one uppercase letter.
          </p>
        </div>
        <div>
          <label for="confirm" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm new password</label>
          <input
            id="confirm"
            v-model="form.confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            autocomplete="new-password"
            required
            class="w-full px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500/25 focus:ring-offset-0 outline-none"
            placeholder="Confirm new password"
          />
        </div>
        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40">
          <p class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>
        <Button
          type="submit"
          size="sm"
          class="w-full !rounded-lg"
          :disabled="isSubmitting || !form.currentPassword || !form.newPassword || form.newPassword !== form.confirmPassword || !isPasswordPolicyValid(form.newPassword)"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Updating...
          </span>
          <span v-else>Update password</span>
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import {
  PASSWORD_MIN_LENGTH,
  isPasswordPolicyValid,
  getPasswordPolicyErrors,
} from '~/utils/passwordPolicy'

definePageMeta({ layout: 'dashboard', middleware: ['auth'] })

const form = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const userStore = useUserStore()
const authStore = useAuthStore()
const route = useRoute()

// Redirect non-staff or staff who already changed password
onMounted(() => {
  if (!authStore.currentUser) return
  const ud = userStore.userData
  if (!ud) return
  if (ud.role !== 'staff') {
    navigateTo('/dashboard')
    return
  }
  if (!ud.mustChangePassword) {
    navigateTo('/dashboard')
  }
})

const handleSubmit = async () => {
  if (form.value.newPassword !== form.value.confirmPassword) {
    errorMessage.value = 'New password and confirmation do not match.'
    return
  }
  if (!isPasswordPolicyValid(form.value.newPassword)) {
    const errs = getPasswordPolicyErrors(form.value.newPassword)
    errorMessage.value =
      errs.length > 0 ? `Password requirements: ${errs.join('; ')}.` : 'Please choose a stronger password.'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const { updateUserPassword } = useFirebaseAuth()
    await updateUserPassword(form.value.currentPassword, form.value.newPassword)
    const staffStore = useStaffStore()
    await staffStore.clearMustChangePassword()
    if (userStore.userData) {
      userStore.userData = { ...userStore.userData, mustChangePassword: false }
    }
    await navigateTo('/dashboard')
  } catch (e: unknown) {
    const err = e as Error
    errorMessage.value = err?.message || 'Failed to update password. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
