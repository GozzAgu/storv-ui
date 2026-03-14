<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/30 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style="background-image: linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px); background-size: 48px 48px;"></div>
      <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary-400/25 dark:bg-primary-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-300/20 dark:bg-primary-500/15 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-[400px] w-full relative z-10">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 rounded-lg">
          <img
            src="/storvv logo 2.png"
            alt="Storvv"
            class="h-6 w-auto max-w-[110px] mx-auto object-contain shrink-0"
          />
        </NuxtLink>
        <h1 class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Reset your password
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div class="rounded-2xl bg-white dark:bg-gray-800/90 shadow-xl shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-200/60 dark:ring-gray-700/60 overflow-hidden">
        <div class="p-6 sm:p-8">
          <form v-if="!emailSent" @submit.prevent="handleForgotPassword" class="space-y-5">
            <div class="space-y-2">
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border-0 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 outline-none transition-shadow"
                placeholder="Enter your email"
              />
            </div>

            <div
              v-if="errorMessage"
              class="rounded-xl bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/80 dark:ring-red-800/50 p-4"
            >
              <p class="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error</p>
              <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
            </div>

            <Button
              type="submit"
              :disabled="isLoading"
              :loading="isLoading"
              variant="primary"
              size="lg"
              :icon="ArrowRightIcon"
              icon-right
              extra-class="!w-full !rounded-full"
            >
              Send reset link
            </Button>
          </form>

          <div v-else class="space-y-5">
            <div class="flex justify-center">
              <div class="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircleIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div class="text-center">
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Check your email
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                We've sent a password reset link to
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ form.email }}</span>
              </p>
            </div>
            <p class="text-center text-sm text-gray-500 dark:text-gray-400">
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

          <p class="mt-8 pt-6 border-t border-gray-200/80 dark:border-gray-700/80 text-center text-sm text-gray-500 dark:text-gray-400">
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
import { ref } from 'vue'
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'

definePageMeta({
  layout: false
})

useForceLightPage()

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
