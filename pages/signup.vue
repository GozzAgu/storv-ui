<template>
  <AuthShell
    panel-eyebrow="Join Storvv"
    panel-title="Start your journey"
    panel-description="Follow these simple steps to set up your store workspace."
    :active-step="registrationComplete ? 1 : 0"
  >
    <AuthBuddies
      mode="signup"
      :focused="focused"
      :name="form.name"
      :email="form.email"
      :password="form.password"
      :confirm-password="form.confirmPassword"
      :error="errorMessage"
      :loading="isLoading"
      :done="registrationComplete"
    />

    <AuthPageHeader
      v-if="!registrationComplete"
      title="Create your account"
      subtitle="Set up a workspace for stock, sales, and branches."
    />

    <AuthPageHeader
      v-else
      title="Check your email"
      subtitle="We need you to confirm your address before you sign in."
    />

    <AuthSegmentToggle v-if="!registrationComplete" mode="signup" />

    <AuthCard>
      <div v-if="registrationComplete" class="s-auth-body" role="status">
        <AuthSuccessPanel :icon="EnvelopeIcon">
          <template #title>
            <template v-if="registrationVerificationSent">Open the link we sent you</template>
            <template v-else>Account created</template>
          </template>
          <template v-if="registrationVerificationSent">
            We emailed
            <strong>{{ registrationEmail }}</strong
            >. Check your inbox and spam folder.
          </template>
          <template v-else>
            We could not send a verification email automatically. You can still
            <NuxtLink :to="signInLinkWithEmail" class="auth-link"> sign in </NuxtLink>
            with the password you chose.
          </template>
          <template v-if="registrationVerificationSent" #footer>
            Tap verify in that message, then sign in to finish setting up your store.
          </template>
        </AuthSuccessPanel>

        <p class="auth-auth-footer-link">
          Ready to continue?
          <NuxtLink :to="signInLinkWithEmail">Sign in</NuxtLink>
        </p>
      </div>

      <div v-else class="auth-form-panel" @focusin="trackFocus" @focusout="trackFocus">
        <form class="auth-form" @submit.prevent="handleSignUp">
          <AuthField
            v-model="form.name"
            input-id="business-name"
            label="Your business name"
            type="text"
            autocomplete="organization"
            placeholder="Your business name"
            :icon="BuildingStorefrontIcon"
            required
          />

          <AuthField
            v-model="form.email"
            input-id="email"
            label="Email"
            type="email"
            autocomplete="email"
            placeholder="Enter your email"
            :icon="EnvelopeIcon"
            required
          />

          <AuthField
            v-model="form.password"
            input-id="password"
            label="Password"
            autocomplete="new-password"
            placeholder="Enter your password"
            password-toggle
            :icon="LockClosedIcon"
            :minlength="PASSWORD_MIN_LENGTH"
            required
          >
            <template #hint>
              <AuthPasswordStrength :password="form.password" />
            </template>
          </AuthField>

          <AuthField
            v-model="form.confirmPassword"
            input-id="confirmPassword"
            label="Confirm password"
            autocomplete="new-password"
            placeholder="Re-enter your password"
            password-toggle
            :icon="LockClosedIcon"
            required
          >
            <template #hint>
              <p
                v-if="
                  form.password && form.confirmPassword && form.password !== form.confirmPassword
                "
                class="s-field__error"
                role="alert"
              >
                Passwords do not match
              </p>
            </template>
          </AuthField>

          <AuthAlert v-if="errorMessage" :message="errorMessage">
            <template v-if="errorMessage.includes('PERMISSION_DENIED')" #actions>
              <SButton size="sm" @click="copyRulesToClipboard">
                {{ rulesCopied ? 'Copied' : 'Copy setup rules' }}
              </SButton>
            </template>
          </AuthAlert>

          <div class="auth-checkbox-options">
            <AuthCheckbox v-model="form.acceptTerms">
              I accept the
              <NuxtLink to="/terms" class="auth-link">terms</NuxtLink>
              and
              <NuxtLink to="/privacy" class="auth-link">privacy policy</NuxtLink>
            </AuthCheckbox>
          </div>

          <AuthPrimaryButton
            label="Create account"
            :loading="isLoading"
            :disabled="
              isLoading ||
              !!(form.password && form.confirmPassword && form.password !== form.confirmPassword)
            "
          />
        </form>

        <p class="auth-auth-footer-link">
          Already have an account?
          <NuxtLink to="/signin">Sign in</NuxtLink>
        </p>
      </div>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { EnvelopeIcon, LockClosedIcon, BuildingStorefrontIcon } from '~/utils/app-icons'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import AuthSuccessPanel from '~/components/auth/AuthSuccessPanel.vue'
import AuthSegmentToggle from '~/components/auth/AuthSegmentToggle.vue'
import AuthPrimaryButton from '~/components/auth/AuthPrimaryButton.vue'
import AuthCheckbox from '~/components/auth/AuthCheckbox.vue'
import AuthPasswordStrength from '~/components/auth/AuthPasswordStrength.vue'
import SButton from '~/components/s/SButton.vue'
import AuthBuddies from '~/components/auth/AuthBuddies.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useFocusedField } from '~/composables/useFocusedField'
import { useUser } from '~/composables/useUser'
import {
  PASSWORD_MIN_LENGTH,
  getPasswordPolicyErrors,
  isPasswordPolicyValid,
} from '~/utils/passwordPolicy'
import { markCapacitorDocument } from '~/utils/capacitor-env'
import { useProductAnalytics } from '~/composables/useProductAnalytics'
import { useAppToast } from '~/composables/useAppToast'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

onMounted(() => {
  markCapacitorDocument()
})

const toast = useAppToast()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
})

const { focused, trackFocus } = useFocusedField()
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
    errorMessage.value = 'Please accept the terms and privacy policy'
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
