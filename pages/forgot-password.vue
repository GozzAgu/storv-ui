<template>
  <AuthShell
    mobile-line="Password help: we'll email you a secure reset link."
    panel-title="Back to work, without the lockout stress."
    panel-description="Request a reset link and choose a new password. Your store data stays safe, and you keep the same workspace."
  >
    <AuthPageHeader
      title="Forgot password?"
      subtitle="We'll email you a secure link so you can choose a new password."
    />

    <AuthCard>
      <form v-if="!emailSent" class="auth-form" @submit.prevent="handleForgotPassword">
        <AuthField
          v-model="form.email"
          input-id="email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="Enter your email"
          :icon="EnvelopeIcon"
          show-clear
          required
        />

        <AuthAlert v-if="errorMessage" :message="errorMessage" />

        <AuthPrimaryButton label="Send reset link" :loading="isLoading" :disabled="isLoading" />
      </form>

      <div v-else class="space-y-5">
        <AuthSuccessPanel :icon="CheckCircleIcon">
          <template #title>Check your email</template>
          We've sent a password reset link to
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ form.email }}</span
          >.
        </AuthSuccessPanel>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Didn't receive it? Check spam or
          <button
            type="button"
            class="auth-link disabled:opacity-50"
            :disabled="isResending"
            @click="resendEmail"
          >
            {{ isResending ? 'Resending...' : 'Resend email' }}
          </button>
        </p>
      </div>

      <p class="auth-auth-footer-link">
        Remembered it?
        <NuxtLink to="/signin">Log In</NuxtLink>
      </p>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircleIcon, EnvelopeIcon } from '~/utils/app-icons'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import AuthSuccessPanel from '~/components/auth/AuthSuccessPanel.vue'
import AuthPrimaryButton from '~/components/auth/AuthPrimaryButton.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'

definePageMeta({
  layout: false,
})

const form = ref({
  email: '',
})

const emailSent = ref(false)
const isLoading = ref(false)
const isResending = ref(false)
const errorMessage = ref('')

const { resetPassword } = useFirebaseAuth()

const handleForgotPassword = async () => {
  if (!form.value.email) {
    errorMessage.value = 'Please enter your email address'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await resetPassword(form.value.email)
    emailSent.value = true
  } catch (error: any) {
    console.error('Password reset error:', error)
    if (error.message.includes('user-not-found')) {
      errorMessage.value = 'No account found with this email address'
    } else if (error.message.includes('invalid-email')) {
      errorMessage.value = 'Invalid email address'
    } else {
      errorMessage.value = error.message || 'Failed to send reset email. Please try again'
    }
  } finally {
    isLoading.value = false
  }
}

const resendEmail = async () => {
  isResending.value = true
  errorMessage.value = ''
  try {
    await resetPassword(form.value.email)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to resend. Please try again.'
  } finally {
    isResending.value = false
  }
}

useHead({
  title: 'Forgot Password - Storvv',
  meta: [
    {
      name: 'description',
      content: 'Reset your Storvv account password',
    },
  ],
})
</script>
