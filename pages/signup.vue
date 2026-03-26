<template>
  <AuthShell
    content-width-class="max-w-[440px]"
    mobile-line="Join Storvv: your store workspace, organized."
    panel-title="Open a workspace built for multi-branch retail."
    panel-description="Create your owner account, then invite managers and staff. Inventory, receipts, and structure stay connected."
  >
    <div class="mb-8 text-center lg:mb-9 lg:text-left">
      <a
        href="https://www.storvv.com"
        class="mb-4 inline-block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 lg:hidden dark:focus-visible:ring-offset-slate-950"
      >
        <img
          :src="logoSource"
          alt="Storvv"
          class="mx-auto h-6 w-auto max-w-[104px] shrink-0 object-contain sm:h-7"
        />
      </a>
      <p
        class="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400"
      >
        Get started
      </p>
      <h1
        class="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl"
      >
        Create your account
      </h1>
      <p class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        Takes a minute. Already set up?
        <NuxtLink
          to="/signin"
          class="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Sign in instead
        </NuxtLink>
      </p>
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-gray-200/90 bg-white dark:border-gray-800 dark:bg-slate-950"
    >
        <div class="p-4 sm:p-5">
          <form @submit.prevent="handleSignUp" class="space-y-4">
            <div class="space-y-1.5">
              <label for="business-name" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Business name
              </label>
              <input
                id="business-name"
                v-model="form.name"
                type="text"
                autocomplete="organization"
                required
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                placeholder="Your business or store name"
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
                class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
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
                  class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-xs text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                  :minlength="PASSWORD_MIN_LENGTH"
                  placeholder="At least 12 characters, with a number and capital letter"
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

              <!-- Strength meter -->
              <div
                v-if="form.password.length > 0"
                class="mt-2 space-y-1.5"
                aria-live="polite"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400">Password strength</span>
                  <span class="text-[10px] font-semibold tabular-nums" :class="strengthLabelClass">
                    {{ passwordStrength.label }}
                  </span>
                </div>
                <div
                  class="flex gap-1"
                  role="meter"
                  :aria-valuenow="passwordStrength.score"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="Password strength score"
                >
                  <div
                    v-for="seg in 4"
                    :key="seg"
                    class="h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-200"
                    :class="seg <= passwordStrength.segments ? strengthSegmentClass : 'bg-gray-200 dark:bg-gray-700'"
                  />
                </div>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                  {{ strengthHint }}
                </p>
              </div>

              <p class="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                Required: at least {{ PASSWORD_MIN_LENGTH }} characters, one number, and one uppercase letter.
              </p>
              <ul
                v-if="form.password.length > 0"
                class="mt-2 space-y-1 text-[10px] leading-tight text-gray-600 dark:text-gray-400"
                aria-label="Password requirements"
              >
                <li v-for="rule in passwordRuleChecks" :key="rule.id" class="flex items-center gap-1.5">
                  <span
                    :class="rule.ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'"
                    aria-hidden="true"
                    >{{ rule.ok ? '✓' : '○' }}</span
                  >
                  <span>{{ rule.label }}</span>
                </li>
              </ul>
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
                  class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-xs text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
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
            class="mt-5 border-t border-gray-200/90 pt-4 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400"
          >
            Questions?
            <a
              href="https://www.storvv.com"
              class="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
            >
              Learn more on the homepage
            </a>
          </p>
        </div>
      </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import AuthShell from '~/components/auth/AuthShell.vue'
import Button from '~/components/ui/Button.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useTheme } from '~/composables/useTheme'
import { useUser } from '~/composables/useUser'
import {
  PASSWORD_MIN_LENGTH,
  getPasswordRuleChecks,
  getPasswordPolicyErrors,
  isPasswordPolicyValid,
  getPasswordStrength,
} from '~/utils/passwordPolicy'

definePageMeta({
  layout: false,
  middleware: 'guest'
})

const { actualTheme } = useTheme()
const logoSource = computed(() =>
  actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)

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

const passwordRuleChecks = computed(() => getPasswordRuleChecks(form.value.password))

const passwordStrength = computed(() => getPasswordStrength(form.value.password))

const strengthLabelClass = computed(() => {
  const t = passwordStrength.value.tier
  return {
    'text-gray-400 dark:text-gray-500': t === 'empty',
    'text-red-600 dark:text-red-400': t === 'weak',
    'text-orange-600 dark:text-orange-400': t === 'fair',
    'text-amber-600 dark:text-amber-400': t === 'good',
    'text-green-600 dark:text-green-400': t === 'strong',
  }
})

const strengthSegmentClass = computed(() => {
  const t = passwordStrength.value.tier
  if (t === 'weak') return 'bg-red-500 dark:bg-red-500'
  if (t === 'fair') return 'bg-orange-500 dark:bg-orange-400'
  if (t === 'good') return 'bg-amber-500 dark:bg-amber-400'
  if (t === 'strong') return 'bg-green-500 dark:bg-green-500'
  return 'bg-gray-300 dark:bg-gray-600'
})

const strengthHint = computed(() => {
  const s = passwordStrength.value
  const pwd = form.value.password
  if (!pwd.length) return ''
  if (!isPasswordPolicyValid(pwd)) {
    return 'Meet all required checks below to continue.'
  }
  if (s.tier === 'strong') {
    return 'Great! This password looks strong.'
  }
  if (s.tier === 'good') {
    return 'Good. Add variety or length to reach Strong.'
  }
  return 'Add lowercase letters, symbols, or more characters to increase strength.'
})

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

  if (!isPasswordPolicyValid(form.value.password)) {
    const errs = getPasswordPolicyErrors(form.value.password)
    errorMessage.value =
      errs.length > 0 ? `Password requirements: ${errs.join('; ')}.` : 'Please choose a stronger password.'
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
