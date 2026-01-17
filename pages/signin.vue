<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/40 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
    <!-- Enhanced Background Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Geometric Grid Pattern -->
      <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <div class="absolute inset-0" style="background-image: linear-gradient(to right, #667eea 1px, transparent 1px), linear-gradient(to bottom, #667eea 1px, transparent 1px); background-size: 50px 50px;"></div>
      </div>
      
      <!-- Animated Gradient Orbs -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-400/40 to-primary-400/40 dark:from-primary-500/30 dark:to-primary-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-primary-400/30 to-pink-400/30 dark:from-primary-500/20 dark:to-pink-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary-300/20 to-primary-300/20 dark:from-primary-400/15 dark:to-primary-400/15 rounded-full blur-3xl"></div>
      
      <!-- Floating Shapes -->
      <div class="absolute top-20 left-10 w-32 h-32 bg-primary-200/20 dark:bg-primary-400/10 rounded-3xl rotate-45 blur-xl"></div>
      <div class="absolute bottom-20 right-20 w-24 h-24 bg-primary-200/20 dark:bg-primary-400/10 rounded-full blur-xl"></div>
      <div class="absolute top-1/3 right-1/4 w-20 h-20 bg-pink-200/20 dark:bg-pink-400/10 rounded-2xl rotate-12 blur-lg"></div>
      
      <!-- Dot Pattern Overlay -->
      <div class="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" style="background-image: radial-gradient(circle, #667eea 1px, transparent 1px); background-size: 30px 30px;"></div>
    </div>

    <div class="max-w-md w-full relative z-10">
      <!-- Logo and Header -->
      <div class="text-center mb-6">
        <NuxtLink to="/" class="inline-block transform hover:scale-105 transition-transform duration-200 mb-3">
          <img
            :src="logoSource"
            alt="Storvv Logo"
            class="h-10 w-auto mx-auto object-contain"
          />
        </NuxtLink>
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5">
          Welcome back
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Sign in to continue to your dashboard
        </p>
      </div>

      <!-- Sign In Form Card -->
      <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-2xl p-6 sm:p-7 border border-white/50 dark:border-gray-700/50">
        <form @submit.prevent="handleSignIn" class="space-y-4">
          <div class="space-y-1.5">
            <label for="email" class="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div class="relative">
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                class="w-full px-3 py-2.5 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-gray-300 dark:hover:border-gray-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="password" class="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <NuxtLink
                to="/forgot-password"
                class="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Forgot?
              </NuxtLink>
            </div>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="w-full px-3 py-2.5 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 pr-10 hover:border-gray-300 dark:hover:border-gray-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <EyeIcon v-if="!showPassword" class="w-4 h-4" />
                <EyeSlashIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                type="checkbox"
                class="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
              />
              <label for="remember-me" class="ml-2 block text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Remember me
              </label>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div class="text-xs sm:text-sm text-red-600 dark:text-red-400">
              <p class="font-semibold mb-1.5">⚠️ Error</p>
              <div class="whitespace-pre-line text-left">{{ errorMessage }}</div>
              <NuxtLink 
                v-if="errorMessage.includes('Firestore')" 
                to="/QUICK_FIX.md" 
                target="_blank"
                class="mt-2 inline-block text-[11px] text-red-700 dark:text-red-300 underline hover:text-red-900 dark:hover:text-red-100"
              >
                View Quick Fix Guide →
              </NuxtLink>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-md font-semibold text-sm hover:brightness-110 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 flex items-center justify-center gap-2 group"
          >
            <span v-if="!isLoading" class="flex items-center gap-2">
              Sign in
              <ArrowRightIcon class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <span v-else class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          </button>
        </form>

        <!-- Phone Sign In Option -->
        <div class="mt-5">
          <button
            type="button"
            @click="showPhoneSignIn = !showPhoneSignIn"
            class="w-full inline-flex justify-center items-center py-2.5 px-3 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-[1.02]"
          >
            <PhoneIcon class="w-4 h-4 mr-2" />
            <span>Sign in with Phone</span>
          </button>
        </div>

        <!-- Phone Sign In Component -->
        <div v-if="showPhoneSignIn" class="pt-3 border-t border-gray-200 dark:border-gray-700">
          <PhoneSignIn @success="handlePhoneSignInSuccess" @error="handlePhoneSignInError" />
        </div>

        <!-- Sign Up Link -->
        <div class="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
          <p class="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <NuxtLink
              to="/signup"
              class="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors ml-1"
            >
              Sign up for free
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { EyeIcon, EyeSlashIcon, ArrowRightIcon, PhoneIcon } from '@heroicons/vue/24/outline'
import { useTheme } from '~/composables/useTheme'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useAdminCredentials } from '~/composables/useAdminCredentials'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import PhoneSignIn from '~/components/auth/PhoneSignIn.vue'

definePageMeta({
  layout: false,
  middleware: 'guest'
})

const { actualTheme } = useTheme()

const logoSource = computed(() => {
  return actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
})

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showPhoneSignIn = ref(false)

const { signIn } = useFirebaseAuth()
const { getUserDocument, createUserDocument } = useUser()
const { storeCredentials } = useAdminCredentials()
const userStore = useUserStore()
const authStore = useAuthStore()

const handleSignIn = async () => {
  if (!form.value.email || !form.value.password) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const user = await signIn(form.value.email, form.value.password)
    
    if (user) {
      // Get user data - this will automatically check for staff members via authUid
      // fetchUserData checks:
      // 1. First, looks for user document in users/{userId}
      // 2. If not found, searches for staff member where authUid === userId using collection group query
      // This allows staff to login based on authUid even without a user document
      await userStore.fetchUserData(user.uid)
      const userData = userStore.userData
      
      if (!userData) {
        // User document not found and staff member not found via authUid
        errorMessage.value = 'Account not found. Please contact your administrator.'
        return
      }
      
      // If user is super admin, store credentials for staff creation
      if (userData.role === 'superAdmin') {
        storeCredentials(form.value.email, form.value.password)
      }
      
      // Redirect based on onboarding status
      if (!userData.hasCompletedOnboarding) {
        await navigateTo('/dashboard/onboarding')
      } else if (!userData.hasCompletedTutorial) {
        await navigateTo('/dashboard')
      } else {
        await navigateTo('/dashboard')
      }
    }
  } catch (error: any) {
    console.error('Sign in error:', error)
    // Handle Firebase Auth errors
    if (error.message.includes('user-not-found')) {
      errorMessage.value = 'No account found with this email address'
    } else if (error.message.includes('wrong-password')) {
      errorMessage.value = 'Incorrect password. Please try again'
    } else if (error.message.includes('invalid-email')) {
      errorMessage.value = 'Invalid email address'
    } else if (error.message.includes('too-many-requests')) {
      errorMessage.value = 'Too many failed attempts. Please try again later'
    } else {
      errorMessage.value = error.message || 'Failed to sign in. Please try again'
    }
  } finally {
    isLoading.value = false
  }
}

const handlePhoneSignInSuccess = async (user: any) => {
  try {
    // Check if user document exists in Firestore
    let userData = await getUserDocument(user.uid)
    
    // If user doesn't exist in Firestore, create user document
    if (!userData) {
      const phoneNumber = user.phoneNumber || ''
      const displayName = user.displayName || phoneNumber.split('@')[0] || 'User'
      
      await createUserDocument(user.uid, {
        email: user.email || '',
        name: displayName,
        role: 'superAdmin',
        hasCompletedOnboarding: false,
        hasCompletedTutorial: false
      })
      
      // Get the newly created user data
      userData = await getUserDocument(user.uid)
    }
    
    // Redirect based on onboarding status
    if (userData && !userData.hasCompletedOnboarding) {
      await navigateTo('/dashboard/onboarding')
    } else if (userData && !userData.hasCompletedTutorial) {
      await navigateTo('/dashboard')
    } else {
      await navigateTo('/dashboard')
    }
  } catch (error: any) {
    console.error('Error handling phone sign-in:', error)
    errorMessage.value = error.message || 'Failed to complete sign-in. Please try again.'
  }
}

const handlePhoneSignInError = (error: string) => {
  errorMessage.value = error
}

useHead({
  title: 'Sign In - Storvv',
  meta: [
    {
      name: 'description',
      content: 'Sign in to your Storvv account'
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
