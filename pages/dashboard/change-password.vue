<template>
  <AuthShell
    panel-eyebrow="Welcome to the team"
    panel-title="Make your account yours"
    panel-description="Your manager gave you a temporary password. Choose your own before you start."
    :steps="staffSteps"
    :active-step="0"
    steps-label="Getting started as staff"
  >
    <AuthPageHeader
      title="Set your password"
      subtitle="You signed in with a temporary password. Choose a new one to continue."
    />

    <AuthCard>
      <form class="auth-form" @submit.prevent="handleSubmit">
        <AuthField
          v-model="form.currentPassword"
          input-id="current"
          label="Temporary password"
          autocomplete="current-password"
          placeholder="The password you were given"
          password-toggle
          :icon="Lock"
          required
        />
        <AuthField
          v-model="form.newPassword"
          input-id="new"
          label="New password"
          autocomplete="new-password"
          placeholder="Choose a new password"
          password-toggle
          :icon="Lock"
          :minlength="PASSWORD_MIN_LENGTH"
          required
        >
          <template #hint>
            <AuthPasswordStrength :password="form.newPassword" />
          </template>
        </AuthField>
        <AuthField
          v-model="form.confirmPassword"
          input-id="confirm"
          label="Confirm new password"
          autocomplete="new-password"
          placeholder="Type it again"
          password-toggle
          :icon="Lock"
          required
        >
          <template #hint>
            <p v-if="passwordsDiffer" class="s-field__error" role="alert">Passwords do not match</p>
          </template>
        </AuthField>

        <AuthAlert v-if="errorMessage" title="Couldn't update your password" :message="errorMessage" />

        <AuthPrimaryButton
          :label="isSubmitting ? 'Updating…' : 'Update password'"
          :loading="isSubmitting"
          :disabled="
            isSubmitting ||
            !form.currentPassword ||
            !form.newPassword ||
            passwordsDiffer ||
            !isPasswordPolicyValid(form.newPassword)
          "
        />
      </form>

      <template #footer>
        <button type="button" class="auth-link" @click="signOut">Sign out</button>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { Lock } from '@lucide/vue'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import AuthPrimaryButton from '~/components/auth/AuthPrimaryButton.vue'
import AuthPasswordStrength from '~/components/auth/AuthPasswordStrength.vue'
import {
  PASSWORD_MIN_LENGTH,
  isPasswordPolicyValid,
  getPasswordPolicyErrors,
} from '~/utils/passwordPolicy'

definePageMeta({ layout: false, middleware: ['auth'] })

useHead({ title: 'Set your password - Storvv' })

const staffSteps = [
  { label: 'Set your own password' },
  { label: 'Open your branch' },
  { label: 'Start selling' },
]

const form = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passwordsDiffer = computed(
  () => !!form.value.confirmPassword && form.value.newPassword !== form.value.confirmPassword
)
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

async function signOut() {
  await useFirebaseAuth().signOut()
  await navigateTo('/signin')
}

const handleSubmit = async () => {
  if (form.value.newPassword !== form.value.confirmPassword) {
    errorMessage.value = 'New password and confirmation do not match.'
    return
  }
  if (!isPasswordPolicyValid(form.value.newPassword)) {
    const errs = getPasswordPolicyErrors(form.value.newPassword)
    errorMessage.value =
      errs.length > 0
        ? `Password requirements: ${errs.join('; ')}.`
        : 'Please choose a stronger password.'
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
