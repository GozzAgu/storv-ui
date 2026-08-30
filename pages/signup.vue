<template>
  <AuthShell
    content-width-class="max-w-[440px]"
    mobile-line="Join Storvv: your store workspace, organized."
    panel-title="Open a workspace built for multi-branch retail."
    panel-description="Create your owner account, then invite managers and staff. Inventory, receipts, and structure stay connected."
  >
    <AuthPageHeader v-if="!registrationComplete" eyebrow="Get started" title="Create your account">
      Takes a minute. Already set up?
      <NuxtLink to="/signin" class="auth-link">Sign in instead</NuxtLink>
    </AuthPageHeader>

    <AuthPageHeader
      v-else
      eyebrow="One more step"
      title="Check your email"
      :show-mobile-logo="false"
    >
      We need you to confirm your address before you sign in.
    </AuthPageHeader>

    <AuthCard>
      <div v-if="registrationComplete" class="space-y-4" role="status">
        <AuthSuccessPanel :icon="EnvelopeIcon">
          <template #title>
            <template v-if="registrationVerificationSent">Open the link we sent you</template>
            <template v-else>Account created</template>
          </template>
          <template v-if="registrationVerificationSent">
            We emailed
            <span class="font-medium text-gray-800 dark:text-gray-200">{{ registrationEmail }}</span
            >. Check your <strong>inbox</strong> and your <strong>Spam</strong> or
            <strong>Junk</strong> folder. Messages from new senders often land there.
          </template>
          <template v-else>
            We could not send a verification email automatically. You can still
            <NuxtLink :to="signInLinkWithEmail" class="auth-link underline underline-offset-2">
              sign in
            </NuxtLink>
            with the password you chose; verify your email from account settings when you can.
          </template>
          <template v-if="registrationVerificationSent" #footer>
            Tap <strong>Verify email</strong> in that message, then come back here to sign in and
            finish setting up your store.
          </template>
        </AuthSuccessPanel>
      </div>

      <form v-else class="auth-form space-y-5" @submit.prevent="handleSignUp">
        <AuthField
          v-model="form.name"
          input-id="business-name"
          label="Business name"
          type="text"
          autocomplete="organization"
          placeholder="Your business or store name"
          required
        />

        <AuthField
          v-model="form.email"
          input-id="email"
          label="Email address"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />

        <AuthField
          v-model="form.password"
          input-id="password"
          label="Password"
          autocomplete="new-password"
          placeholder="At least 12 characters, with a number and capital letter"
          password-toggle
          :minlength="PASSWORD_MIN_LENGTH"
          required
        >
          <template #hint>
            <div v-if="form.password.length > 0" class="mt-2.5 space-y-1.5" aria-live="polite">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400"
                  >Password strength</span
                >
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
                  :class="
                    seg <= passwordStrength.segments
                      ? strengthSegmentClass
                      : 'bg-gray-200 dark:bg-gray-700'
                  "
                />
              </div>
              <p class="text-[10px] leading-snug text-gray-500 dark:text-gray-400">
                {{ strengthHint }}
              </p>
            </div>
            <p class="mt-1.5 text-[10px] leading-snug text-gray-500 dark:text-gray-400">
              Required: at least {{ PASSWORD_MIN_LENGTH }} characters, one number, and one uppercase
              letter.
            </p>
            <ul
              v-if="form.password.length > 0"
              class="mt-2 space-y-1 text-[10px] leading-tight text-gray-600 dark:text-gray-400"
              aria-label="Password requirements"
            >
              <li
                v-for="rule in passwordRuleChecks"
                :key="rule.id"
                class="flex items-center gap-1.5"
              >
                <span
                  :class="
                    rule.ok
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-gray-500'
                  "
                  aria-hidden="true"
                  >{{ rule.ok ? '✓' : '○' }}</span
                >
                <span>{{ rule.label }}</span>
              </li>
            </ul>
          </template>
        </AuthField>

        <AuthField
          v-model="form.confirmPassword"
          input-id="confirmPassword"
          label="Confirm password"
          autocomplete="new-password"
          placeholder="Re-enter your password"
          password-toggle
          required
        >
          <template #hint>
            <p
              v-if="form.password && form.confirmPassword && form.password !== form.confirmPassword"
              class="mt-1 text-xs text-red-500 dark:text-red-400"
            >
              Passwords do not match
            </p>
          </template>
        </AuthField>

        <AuthAlert v-if="errorMessage" :message="errorMessage">
          <template v-if="errorMessage.includes('PERMISSION_DENIED')" #actions>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700"
                @click="copyRulesToClipboard"
              >
                Copy setup rules
              </button>
              <span v-if="rulesCopied" class="text-[11px] text-green-600 dark:text-green-400"
                >Copied!</span
              >
            </div>
          </template>
        </AuthAlert>

        <Checkbox
          v-model="form.acceptTerms"
          size="sm"
          wrapper-class="!items-start"
          label-class="!ml-2.5 !text-xs !font-normal !leading-snug !text-gray-600 dark:!text-gray-300"
        >
          I agree to the
          <NuxtLink to="/terms" class="auth-link">Terms of Service</NuxtLink>
          and
          <NuxtLink to="/privacy" class="auth-link">Privacy Policy</NuxtLink>
        </Checkbox>

        <Button
          type="submit"
          :disabled="
            isLoading ||
            !!(form.password && form.confirmPassword && form.password !== form.confirmPassword)
          "
          :loading="isLoading"
          variant="primary"
          size="md"
          :icon="ArrowRightIcon"
          icon-right
          extra-class="auth-btn auth-btn--primary !w-full"
        >
          Create account
        </Button>
      </form>

      <template v-if="!registrationComplete" #footer>
        Questions?
        <a href="https://www.storvv.com" class="auth-link">Learn more on the homepage</a>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ArrowRightIcon,
  EnvelopeIcon,
} from '~/utils/app-icons'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import AuthSuccessPanel from '~/components/auth/AuthSuccessPanel.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import {
  PASSWORD_MIN_LENGTH,
  getPasswordRuleChecks,
  getPasswordPolicyErrors,
  isPasswordPolicyValid,
  getPasswordStrength,
} from '~/utils/passwordPolicy'
import { markCapacitorDocument } from '~/utils/capacitor-env'
import { useProductAnalytics } from '~/composables/useProductAnalytics'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

onMounted(() => {
  markCapacitorDocument()
})

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
})

const isLoading = ref(false)
const errorMessage = ref('')
const rulesCopied = ref(false)

const registrationComplete = ref(false)
const registrationEmail = ref('')
const registrationVerificationSent = ref(true)

const signInLinkWithEmail = computed(() => {
  const e = registrationEmail.value.trim()
  if (!e) return '/signin'
  return `/signin?${new URLSearchParams({ email: e }).toString()}`
})

watch(registrationComplete, (done) => {
  if (import.meta.client && done) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

const { signUp, signOut } = useFirebaseAuth()
const { trackEvent } = useProductAnalytics()
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

const copyRulesToClipboard = async () => {
  const rules = `rules_version = '2';
service cloud.firestore {
 match /databases/{database}/documents {
 function isAuthenticated() {
 return request.auth != null;
 }
 function isOwner(userId) {
 return isAuthenticated() && request.auth.uid == userId;
 }
 match /users/{userId} {
 allow read: if isAuthenticated();
 allow create: if isOwner(userId);
 allow update: if isOwner(userId);
 allow delete: if isOwner(userId);
 }
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
    alert('Could not copy setup rules. Please contact support@storvv.com if sign-up keeps failing.')
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
      errs.length > 0
        ? `Password requirements: ${errs.join('; ')}.`
        : 'Please choose a stronger password.'
    return
  }

  if (!form.value.acceptTerms) {
    errorMessage.value = 'Please accept the terms and conditions'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const { user, verificationEmailSent } = await signUp(
      form.value.email,
      form.value.password,
      true
    )

    if (user) {
      await createUserDocument(user.uid, {
        email: form.value.email,
        name: form.value.name,
        role: 'superAdmin',
        subscription: 'storvv_micro',
        hasCompletedOnboarding: false,
        hasCompletedTutorial: false,
        activationFunnel: { signedUpAt: new Date().toISOString() },
      })

      trackEvent('sign_up', { method: 'email' })

      try {
        await signOut()
      } catch (signOutErr) {
        console.warn('Sign out after registration:', signOutErr)
      }

      registrationEmail.value = form.value.email.trim()
      registrationVerificationSent.value = verificationEmailSent
      registrationComplete.value = true

      const { useAppToast } = await import('~/composables/useAppToast')
      const toast = useAppToast()
      if (verificationEmailSent) {
        toast.success('Check your email for the verification link.')
      } else {
        toast.warning(
          'We could not send the verification email. You can still sign in from this page when ready.'
        )
      }
    }
  } catch (error: any) {
    console.error('Sign up error:', error)
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
      content: 'Create your Storvv account',
    },
  ],
})
</script>
