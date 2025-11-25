<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo and Header -->
      <div class="text-center">
        <NuxtLink to="/" class="inline-block">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Storv
          </h1>
        </NuxtLink>
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mt-6">
          Reset your password
        </h2>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <!-- Forgot Password Form -->
      <div class="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
        <form v-if="!emailSent" @submit.prevent="handleForgotPassword" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors outline-none text-gray-900 placeholder-gray-400"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            <span v-if="!isLoading">Send reset link</span>
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
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon class="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              Check your email
            </h3>
            <p class="text-sm text-gray-600">
              We've sent a password reset link to
              <span class="font-medium text-gray-900">{{ form.email }}</span>
            </p>
          </div>
          <div class="space-y-3">
            <p class="text-sm text-gray-600">
              Didn't receive the email? Check your spam folder or
            </p>
            <button
              @click="resendEmail"
              :disabled="isResending"
              class="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors disabled:opacity-50"
            >
              {{ isResending ? 'Resending...' : 'Resend email' }}
            </button>
          </div>
        </div>

        <!-- Back to Sign In -->
        <div class="mt-6 text-center">
          <NuxtLink
            to="/signin"
            class="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
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
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: false
})

const form = ref({
  email: ''
})

const emailSent = ref(false)
const isLoading = ref(false)
const isResending = ref(false)

const handleForgotPassword = async () => {
  isLoading.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))
  isLoading.value = false
  emailSent.value = true
  // Handle forgot password logic here
  console.log('Forgot password:', form.value)
}

const resendEmail = async () => {
  isResending.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  isResending.value = false
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

