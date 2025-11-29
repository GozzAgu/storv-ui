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
          Create your account
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-base">
          Get started with Storv today
        </p>
      </div>

      <!-- Sign Up Form Card -->
      <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/50 dark:border-gray-700/50">
        <form @submit.prevent="handleSignUp" class="space-y-5">
          <div>
            <label for="name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Full name
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              required
              class="w-full px-4 py-3.5 bg-white/80 dark:bg-gray-700/80 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-gray-300 dark:hover:border-gray-500"
              placeholder="John Doe"
            />
          </div>

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

          <div>
            <label for="password" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="w-full px-4 py-3.5 bg-white/80 dark:bg-gray-700/80 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 pr-12 hover:border-gray-300 dark:hover:border-gray-500"
                placeholder="Create a password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <EyeIcon v-if="!showPassword" class="w-5 h-5" />
                <EyeSlashIcon v-else class="w-5 h-5" />
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Confirm password
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="w-full px-4 py-3.5 bg-white/80 dark:bg-gray-700/80 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 pr-12 hover:border-gray-300 dark:hover:border-gray-500"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <EyeIcon v-if="!showConfirmPassword" class="w-5 h-5" />
                <EyeSlashIcon v-else class="w-5 h-5" />
              </button>
            </div>
            <p v-if="form.password && form.confirmPassword && form.password !== form.confirmPassword" class="mt-1 text-xs text-red-500">
              Passwords do not match
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div class="text-sm text-red-600 dark:text-red-400">
              <p class="font-semibold mb-2">⚠️ Error</p>
              <div class="whitespace-pre-line text-left">{{ errorMessage }}</div>
              <div v-if="errorMessage.includes('Firestore')" class="mt-4 space-y-2">
                <a 
                  href="https://console.firebase.google.com/project/storv-ux/firestore/rules" 
                  target="_blank"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  🔧 Open Firestore Rules in Firebase Console →
                </a>
                <div class="flex items-center gap-2">
                  <button
                    @click="copyRulesToClipboard"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    📋 Copy Rules to Clipboard
                  </button>
                  <span v-if="rulesCopied" class="text-xs text-green-600 dark:text-green-400">✓ Copied!</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-start">
            <input
              id="terms"
              v-model="form.acceptTerms"
              type="checkbox"
              required
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded mt-1 cursor-pointer"
            />
            <label for="terms" class="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              I agree to the
              <NuxtLink to="/terms" class="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">Terms of Service</NuxtLink>
              and
              <NuxtLink to="/privacy" class="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">Privacy Policy</NuxtLink>
            </label>
          </div>

          <button
            type="submit"
            :disabled="isLoading || !!(form.password && form.confirmPassword && form.password !== form.confirmPassword)"
            class="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-base hover:shadow-xl hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 group"
          >
            <span v-if="!isLoading" class="flex items-center gap-2">
              Create account
              <ArrowRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <span v-else class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-8">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 font-medium">Or sign up with</span>
            </div>
          </div>
        </div>

        <!-- Social Sign Up -->
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="handleGoogleSignUp"
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
            <span class="ml-2">{{ isGoogleLoading ? 'Signing up...' : 'Google' }}</span>
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
          <PhoneSignIn @success="handlePhoneSignUpSuccess" @error="handlePhoneSignInError" />
        </div>

        <!-- Sign In Link -->
        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p class="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
            <NuxtLink
              to="/signin"
              class="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors ml-1"
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
import { EyeIcon, EyeSlashIcon, ArrowRightIcon, PhoneIcon } from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import PhoneSignIn from '~/components/auth/PhoneSignIn.vue'

definePageMeta({
  layout: false,
  middleware: 'guest'
})

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const errorMessage = ref('')
const rulesCopied = ref(false)
const showPhoneSignIn = ref(false)

const { signUp, signInWithGoogle } = useFirebaseAuth()
const { createUserDocument, getUserDocument } = useUser()

// Function to copy Firestore rules to clipboard
const copyRulesToClipboard = async () => {
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - users can read/write their own document
    match /users/{userId} {
      // Allow read if user is authenticated
      allow read: if isAuthenticated();
      
      // Allow create if user is creating their own document
      allow create: if isOwner(userId);
      
      // Allow update if user is updating their own document
      allow update: if isOwner(userId);
      
      // Only allow delete by the document owner
      allow delete: if isOwner(userId);
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`

  try {
    await navigator.clipboard.writeText(rules)
    rulesCopied.value = true
    setTimeout(() => {
      rulesCopied.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to copy:', err)
    alert('Failed to copy rules. Please copy them manually from firestore.rules file.')
  }
}

const handleSignUp = async () => {
  if (!form.value.name || !form.value.email || !form.value.password) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (form.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long'
    return
  }

  if (!form.value.acceptTerms) {
    errorMessage.value = 'Please accept the terms and conditions'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // Create Firebase Auth user
    const user = await signUp(form.value.email, form.value.password)
    
    if (user) {
      // Create user document in Firestore
      await createUserDocument(user.uid, {
        email: form.value.email,
        name: form.value.name,
        role: 'superAdmin',
        hasCompletedOnboarding: false,
        hasCompletedTutorial: false
      })
      
      // Redirect to onboarding (first-time setup)
      await navigateTo('/dashboard/onboarding')
    }
  } catch (error: any) {
    console.error('Sign up error:', error)
    // Handle Firebase Auth errors
    if (error.message.includes('email-already-in-use')) {
      errorMessage.value = 'An account with this email already exists'
    } else if (error.message.includes('invalid-email')) {
      errorMessage.value = 'Invalid email address'
    } else if (error.message.includes('weak-password')) {
      errorMessage.value = 'Password is too weak. Please use a stronger password'
    } else {
      errorMessage.value = error.message || 'Failed to create account. Please try again'
    }
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignUp = async () => {
  isGoogleLoading.value = true
  errorMessage.value = ''

  try {
    const user = await signInWithGoogle()
    
    if (user) {
      // Check if user document exists in Firestore
      let userData = await getUserDocument(user.uid)
      
      // If user doesn't exist in Firestore, create user document (new signup)
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
    console.error('Google sign up error:', error)
    
    // Handle specific error cases
    if (error.message.includes('UNAUTHORIZED_DOMAIN') || error.code === 'auth/unauthorized-domain') {
        errorMessage.value = '⚠️ Domain not authorized!\n\nThis domain is not authorized for Firebase Authentication.\n\nTo fix:\n1. Go to Firebase Console → Authentication → Settings\n2. Add your domain to "Authorized domains"\n3. Save and try again\n\nSee DEPLOYMENT_FIX.md for detailed instructions.'
      } else if (error.message.includes('operation-not-allowed')) {
        errorMessage.value = 'Google sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Google.'
      } else if (error.message.includes('cancelled')) {
        errorMessage.value = 'Sign up was cancelled'
      } else if (error.message.includes('account-exists')) {
        errorMessage.value = 'An account already exists with this email. Please sign in instead.'
      } else if (error.message.includes('PERMISSION_DENIED') || error.code === 'permission-denied' || error.message.includes('Permission denied') || error.message.includes('permission')) {
        // Show detailed instructions for permission errors
        errorMessage.value = 'Firestore permission denied. To fix this:\n\n1. Go to Firebase Console → Firestore Database → Rules\n2. Copy rules from firestore.rules file in your project\n3. Paste and click Publish\n\nSee FIRESTORE_SETUP.md for detailed instructions.'
      } else if (error.message.includes('popup-blocked')) {
        errorMessage.value = 'Pop-up was blocked. Please allow pop-ups for this site and try again.'
      } else if (error.message.includes('Firestore not initialized')) {
        errorMessage.value = 'Firestore is not initialized. Please check your Firebase configuration.'
      } else {
        errorMessage.value = error.message || 'Failed to sign up with Google. Please try again'
      }
    } finally {
      isGoogleLoading.value = false
    }
}

const handlePhoneSignUpSuccess = async (user: any) => {
  try {
    let userData = await getUserDocument(user.uid)
    
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
      
      userData = await getUserDocument(user.uid)
    }
    
    if (userData && !userData.hasCompletedOnboarding) {
      await navigateTo('/dashboard/onboarding')
    } else if (userData && !userData.hasCompletedTutorial) {
      await navigateTo('/dashboard')
    } else {
      await navigateTo('/dashboard')
    }
  } catch (error: any) {
    console.error('Error handling phone sign-up:', error)
    errorMessage.value = error.message || 'Failed to complete sign-up. Please try again.'
  }
}

const handlePhoneSignInError = (error: string) => {
  errorMessage.value = error
}

useHead({
  title: 'Sign Up - Storv',
  meta: [
    {
      name: 'description',
      content: 'Create your Storv account'
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
