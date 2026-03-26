<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-slate-950 sm:px-6 sm:py-10 lg:px-8"
  >
    <div class="w-full max-w-[360px]">
      <div class="text-center mb-6">
        <NuxtLink to="/" class="inline-block mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 rounded-lg">
          <img
            :src="logoSource"
            alt="Storvv"
            class="h-5 w-auto max-w-[96px] mx-auto object-contain shrink-0"
          />
        </NuxtLink>
        <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Reset your password
        </h1>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-gray-200/90 bg-white dark:border-gray-800 dark:bg-slate-950"
      >
        <div class="p-4 sm:p-5">
          <form v-if="!emailSent" @submit.prevent="handleForgotPassword" class="space-y-4">
            <div class="space-y-1.5">
              <label for="email" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                placeholder="Enter your email"
              />
            </div>

            <div
              v-if="errorMessage"
              class="rounded-lg bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/80 dark:ring-red-800/50 p-3"
            >
              <p class="text-xs font-medium text-red-800 dark:text-red-200 mb-0.5">Error</p>
              <p class="text-xs text-red-700 dark:text-red-300">{{ errorMessage }}</p>
            </div>

            <Button
              type="submit"
              :disabled="isLoading"
              :loading="isLoading"
              variant="primary"
              size="md"
              :icon="ArrowRightIcon"
              icon-right
              extra-class="!w-full"
            >
              Send reset link
            </Button>
          </form>

          <div v-else class="space-y-4">
            <div class="flex justify-center">
              <div class="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircleIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div class="text-center">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                Check your email
              </h3>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                We've sent a password reset link to
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ form.email }}</span>
              </p>
            </div>
            <p class="text-center text-xs text-gray-500 dark:text-gray-400">
              Didn't receive it? Check spam or
              <button
                type="button"
                @click="resendEmail"
                :disabled="isResending"
                class="font-semibold text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
              >
                {{ isResending ? 'Resending...' : 'Resend email' }}
              </button>
            </p>
          </div>

          <p class="mt-5 border-t border-gray-200/90 pt-4 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Remember your password?
            <NuxtLink
              to="/signin"
              class="font-semibold text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Sign in
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useTheme } from '~/composables/useTheme'

definePageMeta({
  layout: false
})

const { actualTheme } = useTheme()
const logoSource = computed(() =>
  actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)

const form = ref({
  email: ''
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
      content: 'Reset your Storvv account password'
    }
  ]
})
</script>
