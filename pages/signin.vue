<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/30 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style="background-image: linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px); background-size: 48px 48px;"></div>
      <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary-400/25 dark:bg-primary-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-300/20 dark:bg-primary-500/15 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-[360px] w-full relative z-10">
      <div class="text-center mb-6">
        <NuxtLink to="/" class="inline-block mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 rounded-lg">
          <img
            :src="logoSource"
            alt="Storvv"
            class="h-5 w-auto max-w-[96px] mx-auto object-contain shrink-0"
          />
        </NuxtLink>
        <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Welcome back
        </h1>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Sign in to continue to your dashboard
        </p>
      </div>

      <div class="rounded-xl bg-white dark:bg-gray-800/90 shadow-xl shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-200/60 dark:ring-gray-700/60 overflow-hidden">
        <div class="p-4 sm:p-5">
          <form @submit.prevent="handleSignIn" class="space-y-4">
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
                class="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 outline-none transition-shadow"
                placeholder="Enter your email"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <label for="password" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <NuxtLink
                  to="/forgot-password"
                  class="text-xs font-medium text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 transition-colors shrink-0"
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
                  class="w-full px-3 py-2 pr-10 rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 outline-none transition-shadow"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  <EyeIcon v-if="!showPassword" class="w-3.5 h-3.5" />
                  <EyeSlashIcon v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                type="checkbox"
                class="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 cursor-pointer bg-white dark:bg-gray-800"
              />
              <label for="remember-me" class="ml-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <div
              v-if="errorMessage"
              class="rounded-lg bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/80 dark:ring-red-800/50 p-3"
            >
              <p class="text-xs font-medium text-red-800 dark:text-red-200 mb-0.5">Error</p>
              <div class="text-xs text-red-700 dark:text-red-300 whitespace-pre-line text-left">{{ errorMessage }}</div>
              <NuxtLink
                v-if="errorMessage.includes('Firestore')"
                to="/QUICK_FIX.md"
                target="_blank"
                class="mt-2 inline-block text-[11px] font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                View Quick Fix Guide →
              </NuxtLink>
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
              Sign in
            </Button>
          </form>

          <p class="mt-5 pt-4 border-t border-gray-200/80 dark:border-gray-700/80 text-center text-xs text-gray-500 dark:text-gray-400">
            Don't have an account?
            <NuxtLink
              to="/signup"
              class="font-semibold text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 transition-colors"
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
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useAdminCredentials } from '~/composables/useAdminCredentials'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false,
  middleware: 'guest'
})

useForceLightPage()

const logoSource = computed(() => '/storvv logo 2.png')

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const { signIn } = useFirebaseAuth()
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
      
      // Staff must change their temporary password before using the app
      if (userData.role === 'staff' && userData.mustChangePassword) {
        await navigateTo('/dashboard/change-password')
        return
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
