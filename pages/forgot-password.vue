<template>
  <AuthShell
    mobile-line="Password help: we'll email you a secure reset link."
    panel-title="Back to work, without the lockout stress."
    panel-description="Request a reset link and choose a new password. Your store data stays safe, and you keep the same workspace."
  >
    <AuthPageHeader eyebrow="Account recovery" title="Reset your password">
      We'll send a link to your inbox. Remembered it?
      <NuxtLink to="/signin" class="auth-link">Sign in</NuxtLink>
    </AuthPageHeader>

    <AuthCard>
      <form v-if="!emailSent" class="auth-form space-y-5" @submit.prevent="handleForgotPassword">
        <AuthField
          v-model="form.email"
          input-id="email"
          label="Email address"
          type="email"
          autocomplete="email"
          placeholder="Enter your email"
          required
        />

        <AuthAlert v-if="errorMessage" :message="errorMessage" />

        <Button
          type="submit"
          :disabled="isLoading"
          :loading="isLoading"
          variant="primary"
          size="md"
          :icon="ArrowRightIcon"
          icon-right
          extra-class="auth-btn auth-btn--primary !w-full"
        >
          Send reset link
        </Button>
      </form>

      <div v-else class="space-y-5">
        <AuthSuccessPanel :icon="CheckCircleIcon">
          <template #title>Check your email</template>
          We've sent a password reset link to
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ form.email }}</span
          >.
        </AuthSuccessPanel>

        <p class="text-center text-xs text-gray-500 dark:text-gray-400">
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

      <template #footer>
        Wrong place?
        <a href="https://www.storvv.com" class="auth-link">Back to home</a>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import AuthSuccessPanel from '~/components/auth/AuthSuccessPanel.vue'
import Button from '~/components/ui/Button.vue'
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
