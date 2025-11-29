<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-purple-50/40 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
    <!-- Enhanced Background Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Geometric Grid Pattern -->
      <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <div class="absolute inset-0" style="background-image: linear-gradient(to right, #667eea 1px, transparent 1px), linear-gradient(to bottom, #667eea 1px, transparent 1px); background-size: 50px 50px;"></div>
      </div>
      
      <!-- Animated Gradient Orbs -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-400/40 to-purple-400/40 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
      
      <!-- Floating Shapes -->
      <div class="absolute top-20 left-10 w-32 h-32 bg-primary-200/20 rounded-3xl rotate-45 blur-xl"></div>
      <div class="absolute bottom-20 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-xl"></div>
      <div class="absolute top-1/3 right-1/4 w-20 h-20 bg-pink-200/20 rounded-2xl rotate-12 blur-lg"></div>
      
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
        <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Welcome back
        </h2>
        <p class="text-gray-600 text-base">
          Sign in to continue to your dashboard
        </p>
      </div>

      <!-- Sign In Form Card -->
      <div class="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/50">
        <form @submit.prevent="handleSignIn" class="space-y-5">
          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-gray-700">
              Email address
            </label>
            <div class="relative">
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                class="w-full px-4 py-3.5 bg-white/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 hover:border-gray-300"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="password" class="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <NuxtLink
                to="/forgot-password"
                class="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
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
                class="w-full px-4 py-3.5 bg-white/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 pr-12 hover:border-gray-300"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeIcon v-if="!showPassword" class="w-5 h-5" />
                <EyeSlashIcon v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-700 cursor-pointer">
                Remember me
              </label>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div class="text-sm text-red-600 dark:text-red-400">
              <p class="font-semibold mb-2">⚠️ Error</p>
              <div class="whitespace-pre-line text-left">{{ errorMessage }}</div>
              <NuxtLink 
                v-if="errorMessage.includes('Firestore')" 
                to="/QUICK_FIX.md" 
                target="_blank"
                class="mt-3 inline-block text-xs text-red-700 dark:text-red-300 underline hover:text-red-900 dark:hover:text-red-100"
              >
                View Quick Fix Guide →
              </NuxtLink>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-base hover:shadow-xl hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 group"
          >
            <span v-if="!isLoading" class="flex items-center gap-2">
              Sign in
              <ArrowRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <span v-else class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-8">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white/90 text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        <!-- Social Sign In -->
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="handleGoogleSignIn"
            :disabled="isGoogleLoading || isLoading"
            class="group w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="!isGoogleLoading" class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <svg v-else class="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-2">{{ isGoogleLoading ? 'Signing in...' : 'Google' }}</span>
          </button>
          <button
            type="button"
            @click="showPhoneSignIn = !showPhoneSignIn"
            class="group w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 hover:shadow-md"
          >
            <PhoneIcon class="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span class="ml-2">Phone</span>
          </button>
        </div>

        <!-- Phone Sign In Component -->
        <div v-if="showPhoneSignIn" class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <PhoneSignIn @success="handlePhoneSignInSuccess" @error="handlePhoneSignInError" />
        </div>

        <!-- Sign Up Link -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <p class="text-center text-sm text-gray-600">
            Don't have an account?
            <NuxtLink
              to="/signup"
              class="font-semibold text-primary-600 hover:text-primary-500 transition-colors ml-1"
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
import { ref } from 'vue'
import { EyeIcon, EyeSlashIcon, ArrowRightIcon, PhoneIcon } from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useAdminCredentials } from '~/composables/useAdminCredentials'
import { useUserStore } from '~/stores/user'
import PhoneSignIn from '~/components/auth/PhoneSignIn.vue'

definePageMeta({
  layout: false,
  middleware: 'guest'
})

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const errorMessage = ref('')
const showPhoneSignIn = ref(false)

const { signIn, signInWithGoogle } = useFirebaseAuth()
const { getUserDocument, createUserDocument } = useUser()
const { storeCredentials } = useAdminCredentials()
const userStore = useUserStore()

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
      // Get user document to check role and onboarding status
      await userStore.fetchUserData(user.uid)
      const userData = userStore.userData || await getUserDocument(user.uid)
      
      // If user is super admin, store credentials for staff creation
      if (userData && userData.role === 'superAdmin') {
        storeCredentials(form.value.email, form.value.password)
      }
      
      if (userData && !userData.hasCompletedOnboarding) {
        // Redirect to onboarding
        await navigateTo('/dashboard/onboarding')
      } else if (userData && !userData.hasCompletedTutorial) {
        // Redirect to tutorial
        await navigateTo('/dashboard')
      } else {
        // Redirect to dashboard
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

const handleGoogleSignIn = async () => {
  isGoogleLoading.value = true
  errorMessage.value = ''

  try {
    const user = await signInWithGoogle()
    
    if (user) {
      // Check if user document exists in Firestore
      let userData = await getUserDocument(user.uid)
      
      // If user doesn't exist in Firestore, create user document
      if (!userData) {
        const displayName = user.displayName || ''
        
        await createUserDocument(user.uid, {
          email: user.email || '',
          name: displayName || user.email?.split('@')[0] || 'User',
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
    }
  } catch (error: any) {
    console.error('Google sign in error:', error)
    
    // Handle specific error cases
    if (error.message.includes('UNAUTHORIZED_DOMAIN') || error.code === 'auth/unauthorized-domain') {
      errorMessage.value = '⚠️ Domain not authorized!\n\nThis domain is not authorized for Firebase Authentication.\n\nTo fix:\n1. Go to Firebase Console → Authentication → Settings\n2. Add your domain to "Authorized domains"\n3. Save and try again\n\nSee DEPLOYMENT_FIX.md for detailed instructions.'
    } else if (error.message.includes('operation-not-allowed')) {
      errorMessage.value = 'Google sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Google.'
    } else if (error.message.includes('cancelled')) {
      errorMessage.value = 'Sign in was cancelled'
    } else if (error.message.includes('account-exists')) {
      errorMessage.value = 'An account already exists with this email. Please sign in with email and password instead.'
    } else if (error.message.includes('PERMISSION_DENIED') || error.code === 'permission-denied' || error.message.includes('Permission denied') || error.message.includes('permission')) {
      errorMessage.value = 'Firestore permission denied. To fix this:\n\n1. Go to Firebase Console → Firestore Database → Rules\n2. Copy rules from firestore.rules file in your project\n3. Paste and click Publish\n\nSee FIRESTORE_SETUP.md for detailed instructions.'
    } else if (error.message.includes('popup-blocked')) {
      errorMessage.value = 'Pop-up was blocked. Please allow pop-ups for this site and try again.'
    } else {
      errorMessage.value = error.message || 'Failed to sign in with Google. Please try again.'
    }
  } finally {
    isGoogleLoading.value = false
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
  title: 'Sign In - Storv',
  meta: [
    {
      name: 'description',
      content: 'Sign in to your Storv account'
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
