<template>
  <div
    class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/30 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
  >
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style="background-image: linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px); background-size: 48px 48px;"
      ></div>
      <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary-400/25 dark:bg-primary-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-300/20 dark:bg-primary-500/15 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-[360px] w-full relative z-10">
      <div class="text-center mb-6">
        <NuxtLink
          to="/"
          class="inline-block mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 rounded-lg"
        >
          <img
            :src="logoSource"
            alt="Storvv"
            class="h-5 w-auto max-w-[96px] mx-auto object-contain shrink-0"
          />
        </NuxtLink>
        <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Create your account
        </h1>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Get started with Storvv in a few seconds
        </p>
      </div>

      <div
        class="rounded-xl bg-white dark:bg-gray-800/90 shadow-xl shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-200/60 dark:ring-gray-700/60 overflow-hidden"
      >
        <div class="p-4 sm:p-5">
          <form @submit.prevent="handleSignUp" class="space-y-4">
            <div class="space-y-1.5">
              <label for="name" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Full name
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                autocomplete="name"
                required
                class="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 outline-none transition-shadow"
                placeholder="John Doe"
              />
            </div>

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
                placeholder="you@example.com"
              />
            </div>

            <div class="space-y-1.5">
              <label for="password" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div class="relative">
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  required
                  class="w-full px-3 py-2 pr-10 rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 outline-none transition-shadow"
                  placeholder="Create a password (min 8 characters)"
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

            <div class="space-y-1.5">
              <label for="confirmPassword" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Confirm password
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  required
                  class="w-full px-3 py-2 pr-10 rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 outline-none transition-shadow"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  <EyeIcon v-if="!showConfirmPassword" class="w-3.5 h-3.5" />
                  <EyeSlashIcon v-else class="w-3.5 h-3.5" />
                </button>
              </div>
              <p
                v-if="form.password && form.confirmPassword && form.password !== form.confirmPassword"
                class="text-xs text-red-500"
              >
                Passwords do not match
              </p>
            </div>

            <div
              v-if="errorMessage"
              class="rounded-lg bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/80 dark:ring-red-800/50 p-3"
            >
              <p class="text-xs font-medium text-red-800 dark:text-red-200 mb-0.5">Error</p>
              <div class="text-xs text-red-700 dark:text-red-300 whitespace-pre-line text-left">
                {{ errorMessage }}
              </div>
              <div v-if="errorMessage.includes('Firestore')" class="mt-2 space-y-1.5">
                <a
                  href="https://console.firebase.google.com/project/storv-ux/firestore/rules"
                  target="_blank"
                  class="inline-flex items-center gap-2 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  🔧 Open Firestore Rules in Firebase Console →
                </a>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="copyRulesToClipboard"
                    class="inline-flex items-center gap-2 px-2.5 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    📋 Copy Rules to Clipboard
                  </button>
                  <span v-if="rulesCopied" class="text-[11px] text-green-600 dark:text-green-400">✓ Copied!</span>
                </div>
              </div>
            </div>

            <div class="flex items-start">
              <input
                id="terms"
                v-model="form.acceptTerms"
                type="checkbox"
                required
                class="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 cursor-pointer bg-white dark:bg-gray-800 mt-0.5 shrink-0"
              />
              <label for="terms" class="ml-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none leading-snug">
                I agree to the
                <NuxtLink
                  to="/terms"
                  class="text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300"
                  >Terms of Service</NuxtLink
                >
                and
                <NuxtLink
                  to="/privacy"
                  class="text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300"
                  >Privacy Policy</NuxtLink
                >
              </label>
            </div>

            <Button
              type="submit"
              :disabled="
                isLoading || !!(form.password && form.confirmPassword && form.password !== form.confirmPassword)
              "
              :loading="isLoading"
              variant="primary"
              size="md"
              :icon="ArrowRightIcon"
              icon-right
              extra-class="!w-full"
            >
              Create account
            </Button>
          </form>

          <p
            class="mt-5 pt-4 border-t border-gray-200/80 dark:border-gray-700/80 text-center text-xs text-gray-500 dark:text-gray-400"
          >
            Already have an account?
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
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'

definePageMeta({
  layout: false,
  middleware: 'guest'
})

useForceLightPage()

const logoSource = computed(() => '/storvv logo 2.png')

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
const errorMessage = ref('')
const rulesCopied = ref(false)

const { signUp, sendVerificationEmail } = useFirebaseAuth()
const { createUserDocument } = useUser()

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
    // Create Firebase Auth user (verification email is sent automatically)
    const user = await signUp(form.value.email, form.value.password, true)
    
    if (user) {
      // Create user document in Firestore
      await createUserDocument(user.uid, {
        email: form.value.email,
        name: form.value.name,
        role: 'superAdmin',
        subscription: 'storvv_micro',
        hasCompletedOnboarding: false,
        hasCompletedTutorial: false
      })
      
      // Show success message about email verification
      const { useToast } = await import('~/composables/useToast')
      const toast = useToast()
      toast.success('Account created! Please check your email to verify your account.')
      
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

useHead({
  title: 'Sign Up - Storvv',
  meta: [
    {
      name: 'description',
      content: 'Create your Storvv account'
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
