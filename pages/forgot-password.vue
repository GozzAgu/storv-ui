<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-purple-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/40 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
    <!-- Enhanced Background Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Geometric Grid Pattern -->
      <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <div class="absolute inset-0" style="background-image: linear-gradient(to right, #667eea 1px, transparent 1px), linear-gradient(to bottom, #667eea 1px, transparent 1px); background-size: 50px 50px;"></div>
      </div>
      
      <!-- Animated Gradient Orbs -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-400/40 to-purple-400/40 dark:from-primary-500/30 dark:to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary-300/20 to-purple-300/20 dark:from-primary-400/15 dark:to-purple-400/15 rounded-full blur-3xl"></div>
      
      <!-- Floating Shapes -->
      <div class="absolute top-20 left-10 w-32 h-32 bg-primary-200/20 dark:bg-primary-400/10 rounded-3xl rotate-45 blur-xl"></div>
      <div class="absolute bottom-20 right-20 w-24 h-24 bg-purple-200/20 dark:bg-purple-400/10 rounded-full blur-xl"></div>
      <div class="absolute top-1/3 right-1/4 w-20 h-20 bg-pink-200/20 dark:bg-pink-400/10 rounded-2xl rotate-12 blur-lg"></div>
      
      <!-- Dot Pattern Overlay -->
      <div class="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" style="background-image: radial-gradient(circle, #667eea 1px, transparent 1px); background-size: 30px 30px;"></div>
    </div>

    <div class="max-w-md w-full relative z-10">
      <!-- Logo and Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block transform hover:scale-105 transition-transform duration-200">
          <h1 class="text-4xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Storv
          </h1>
        </NuxtLink>
        <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Reset your password
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-base">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <!-- Forgot Password Form Card -->
      <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/50 dark:border-gray-700/50">
        <form v-if="!emailSent" @submit.prevent="handleForgotPassword" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="w-full px-4 py-3.5 bg-white/80 dark:bg-gray-700/80 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-gray-300 dark:hover:border-gray-500"
              placeholder="you@example.com"
            />
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage && !emailSent" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p class="text-sm text-red-600 dark:text-red-400 text-center">{{ errorMessage }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-base hover:shadow-xl hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 group"
          >
            <span v-if="!isLoading" class="flex items-center gap-2">
              Send reset link
              <ArrowRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <span v-else class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          </button>
        </form>

        <!-- Success Message -->
        <div v-else class="text-center space-y-6">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
            <CheckCircleIcon class="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Check your email
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              We've sent a password reset link to
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ form.email }}</span>
            </p>
          </div>
          <div class="space-y-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the email? Check your spam folder or
            </p>
            <button
              @click="resendEmail"
              :disabled="isResending"
              class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
            >
              {{ isResending ? 'Resending...' : 'Resend email' }}
            </button>
          </div>
        </div>

        <!-- Back to Sign In -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <NuxtLink
            to="/signin"
            class="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
          >
            <ArrowLeftIcon class="w-4 h-4 mr-1" />
            Back to sign in
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'

definePageMeta({
  layout: false
})

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
    // Handle Firebase Auth errors
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
    // Show success feedback
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to resend email. Please try again'
  } finally {
    isResending.value = false
  }
}

useHead({
  title: 'Forgot Password - Storv',
  meta: [
    {
      name: 'description',
      content: 'Reset your Storv account password'
    }
  ]
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
