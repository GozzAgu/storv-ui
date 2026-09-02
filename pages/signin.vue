<template>
  <AuthShell
    mobile-line="Storvv: inventory, receipts, and branches in one place."
    panel-title="Run your store with a calmer workflow."
    panel-description="Sign in to manage stock, ring up activity, and keep every branch aligned without jumping between tools."
  >
    <AuthPageHeader
      title="Welcome back!"
      subtitle="Sign in to manage inventory, sales, and every branch from one workspace."
    />

    <AuthSegmentToggle mode="signin" />

    <AuthCard>
      <div class="auth-form-panel">
      <form
        class="auth-form"
        @submit.prevent="awaitingTwoFactor ? submitTwoFactorCode() : handleSignIn()"
      >
        <template v-if="!awaitingTwoFactor">
          <AuthField
            v-model="form.email"
            input-id="email"
            label="Email"
            type="email"
            autocomplete="username"
            placeholder="Enter your email"
            :icon="EnvelopeIcon"
            required
          />

          <AuthField
            v-model="form.password"
            input-id="password"
            label="Password"
            autocomplete="current-password"
            placeholder="Enter your password"
            password-toggle
            :icon="LockClosedIcon"
            :biometric-autofill="isSupported && hasSavedLogin"
            :biometric-label="`Autofill with ${biometryLabel}`"
            required
            @focus="offerBiometricAutofillOnFocus"
            @biometric-autofill="fillFromBiometric"
          />

          <div v-if="isSupported" class="auth-checkbox-options">
            <AuthCheckbox v-model="form.enableFaceId">
              Use {{ biometryLabel }} next time on this device
            </AuthCheckbox>
          </div>

          <div class="auth-form-meta">
            <AuthCheckbox v-model="form.rememberMe">Remember me</AuthCheckbox>
            <NuxtLink to="/forgot-password" class="auth-link">Forgot password?</NuxtLink>
          </div>
        </template>

        <AuthSuccessPanel v-if="actionSuccessTitle" :icon="CheckCircleIcon" class="mb-4">
          <template #title>{{ actionSuccessTitle }}</template>
          {{ actionSuccessBody }}
        </AuthSuccessPanel>

        <AuthAlert
          v-if="errorMessage"
          :message="errorMessage"
          :show-firestore-guide="errorMessage.includes('PERMISSION_DENIED')"
        />

        <div v-if="awaitingTwoFactor" class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app to finish signing in.
          </p>
          <AuthField
            v-model="twoFactorCode"
            input-id="twoFactorCode"
            label="Authentication code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="000000"
            maxlength="6"
            required
          />
          <AuthPrimaryButton
            type="button"
            label="Verify and continue"
            :loading="isVerifyingTwoFactor"
            :disabled="isVerifyingTwoFactor || twoFactorCode.length !== 6"
            @click="submitTwoFactorCode"
          />
          <button
            type="button"
            class="auth-link text-xs"
            :disabled="isVerifyingTwoFactor"
            @click="cancelTwoFactorSignIn"
          >
            Use a different account
          </button>
        </div>

        <template v-else>
          <AuthPrimaryButton
            label="Log In"
            :loading="isLoading"
            :disabled="isLoading || isBiometricFilling"
          />
        </template>
      </form>

      <p v-if="!awaitingTwoFactor" class="auth-auth-footer-link">
        Don't have an account?
        <NuxtLink to="/signup">Sign Up</NuxtLink>
      </p>
      </div>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  CheckCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from '~/utils/app-icons'
import { BiometryError } from '@aparajita/capacitor-biometric-auth'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import AuthSuccessPanel from '~/components/auth/AuthSuccessPanel.vue'
import AuthSegmentToggle from '~/components/auth/AuthSegmentToggle.vue'
import AuthPrimaryButton from '~/components/auth/AuthPrimaryButton.vue'
import AuthCheckbox from '~/components/auth/AuthCheckbox.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useNativeBiometricLogin } from '~/composables/useNativeBiometricLogin'
import { useUserStore } from '~/stores/user'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { markCapacitorDocument } from '~/utils/capacitor-env'
import { clearSignOutPending } from '~/utils/auth-sign-out'
import { getErrorMessage } from '~/utils/error-message'
import { getAuthWaitMs, waitForAuthStore } from '~/utils/wait-for-auth'
import { markOnboardingCompleteForSession } from '~/utils/onboarding-session'
import { useFunnelAnalytics } from '~/composables/useFunnelAnalytics'
import {
  isTwoFactorSessionVerified,
  markTwoFactorSessionVerified,
  clearTwoFactorSessionVerified,
} from '~/utils/two-factor-session'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

const route = useRoute()

const actionSuccessTitle = computed(() => {
  if (route.query.verified === '1') return 'Email verified'
  if (route.query.reset === '1') return 'Password updated'
  return ''
})

const actionSuccessBody = computed(() => {
  if (route.query.verified === '1') {
    return 'Your email is confirmed. Sign in below to open your Storvv workspace.'
  }
  if (route.query.reset === '1') {
    return 'Your password was changed successfully. Sign in with your new password.'
  }
  return ''
})

const form = ref({
  email: '',
  password: '',
  rememberMe: false,
  enableFaceId: false,
})

const isLoading = ref(false)
const isVerifyingTwoFactor = ref(false)
const awaitingTwoFactor = ref(false)
const twoFactorCode = ref('')
const pendingSignIn = ref<{ email: string; password: string } | null>(null)
const errorMessage = ref('')
const biometricAutofillOffered = ref(false)
const isBiometricFilling = ref(false)

const {
  isSupported,
  hasSavedLogin,
  biometryLabel,
  saveLogin,
  clearSavedLogin,
  getLoginAfterBiometric,
} = useNativeBiometricLogin()

watch(
  hasSavedLogin,
  (saved) => {
    if (saved) form.value.enableFaceId = true
  },
  { immediate: true }
)

onMounted(() => {
  markCapacitorDocument()
  clearSignOutPending()
  const email = route.query.email
  if (typeof email === 'string' && email.trim()) {
    form.value.email = decodeURIComponent(email).trim()
  }
  if (route.query.verify2fa === '1') {
    void resumePendingTwoFactorSignIn()
  }
})

async function fillFromBiometric(options: { auto?: boolean } = {}) {
  if (!isSupported.value || !hasSavedLogin.value || awaitingTwoFactor.value) return
  if (isBiometricFilling.value || isLoading.value) return

  if (options.auto) {
    biometricAutofillOffered.value = true
  }

  isBiometricFilling.value = true
  errorMessage.value = ''

  try {
    const saved = await getLoginAfterBiometric()
    if (!saved) return

    form.value.email = saved.email
    form.value.password = saved.password
    form.value.enableFaceId = true
  } catch (error: unknown) {
    if (error instanceof BiometryError) {
      if (!options.auto) {
        errorMessage.value = error.message || `${biometryLabel.value} autofill failed`
      }
      return
    }
    console.warn('[SignIn] Biometric autofill failed:', getErrorMessage(error) || error)
  } finally {
    isBiometricFilling.value = false
  }
}

function offerBiometricAutofillOnFocus() {
  if (biometricAutofillOffered.value) return
  if (!isSupported.value || !hasSavedLogin.value) return
  if (form.value.email && form.value.password) return

  biometricAutofillOffered.value = true
  void fillFromBiometric()
}

async function resumePendingTwoFactorSignIn() {
  const authStore = useAuthStore()
  await waitForAuthStore(authStore, getAuthWaitMs())
  if (!authStore.currentUser) return
  try {
    await userStore.fetchUserData(authStore.currentUser.uid)
  } catch {
    return
  }
  if (userStore.userData?.twoFactorEnabled && !isTwoFactorSessionVerified(authStore.currentUser.uid)) {
    awaitingTwoFactor.value = true
    form.value.email = authStore.currentUser.email || form.value.email
  }
}

const { signIn, signOut } = useFirebaseAuth()
const { authFetch } = useAuthenticatedFetch()
const userStore = useUserStore()

function normalizeSignInEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function persistBiometricLogin(email: string, password: string) {
  if (!isSupported.value) return
  try {
    if (form.value.enableFaceId) {
      const saved = await saveLogin(email, password)
      if (!saved) {
        console.warn('[SignIn] Face ID save failed - Keychain write or verify failed')
      }
    } else {
      await clearSavedLogin()
    }
  } catch (error) {
    console.warn('[SignIn] Face ID preference not saved:', getErrorMessage(error), error)
  }
}

async function finishAuthenticatedSession(email: string, password: string) {
  const userData = userStore.userData
  if (!userData) {
    errorMessage.value =
      userStore.error || 'Account not found. Please contact your administrator.'
    try {
      await signOut()
    } catch {
      /* ignore */
    }
    return
  }

  await persistBiometricLogin(email, password)

  if (userData.role === 'superAdmin') {
    const { recordMilestone } = useFunnelAnalytics()
    await recordMilestone('firstLoginAt', { role: userData.role })
  }

  let destination = '/dashboard'
  if (userData.role === 'staff') {
    destination = userData.mustChangePassword ? '/dashboard/change-password' : '/dashboard'
  } else if (!userData.hasCompletedOnboarding) {
    destination = '/dashboard/onboarding'
  } else {
    markOnboardingCompleteForSession(userData.uid)
  }

  await navigateTo(destination)
}

async function completeSignIn(email: string, password: string) {
  const normalizedEmail = normalizeSignInEmail(email)
  const user = await signIn(normalizedEmail, password)
  if (!user) return

  try {
    await userStore.fetchUserData(user.uid)
  } catch (error) {
    throw new Error(getErrorMessage(error) || 'Failed to load your account')
  }

  const userData = userStore.userData
  if (!userData) {
    errorMessage.value =
      userStore.error || 'Account not found. Please contact your administrator.'
    try {
      await signOut()
    } catch {
      /* ignore */
    }
    return
  }

  if (userData.twoFactorEnabled && !isTwoFactorSessionVerified(user.uid)) {
    pendingSignIn.value = { email: normalizedEmail, password }
    awaitingTwoFactor.value = true
    twoFactorCode.value = ''
    errorMessage.value = ''
    if (route.query.verify2fa !== '1') {
      await navigateTo('/signin?verify2fa=1', { replace: true })
    }
    return
  }

  await finishAuthenticatedSession(normalizedEmail, password)
}

async function submitTwoFactorCode() {
  if (twoFactorCode.value.length !== 6) {
    errorMessage.value = 'Enter the 6-digit code from your authenticator app'
    return
  }

  const authStore = useAuthStore()
  if (!authStore.currentUser) {
    errorMessage.value = 'Session expired. Sign in again.'
    awaitingTwoFactor.value = false
    return
  }

  isVerifyingTwoFactor.value = true
  errorMessage.value = ''

  try {
    await authFetch('/api/auth/2fa/verify', {
      method: 'POST',
      body: { code: twoFactorCode.value },
    })
    await authStore.currentUser.getIdToken(true)
    markTwoFactorSessionVerified(authStore.currentUser.uid)
    awaitingTwoFactor.value = false
    const pending = pendingSignIn.value
    pendingSignIn.value = null
    await finishAuthenticatedSession(
      pending?.email || form.value.email,
      pending?.password || form.value.password
    )
  } catch (error: unknown) {
    errorMessage.value = getErrorMessage(error) || 'Invalid verification code'
  } finally {
    isVerifyingTwoFactor.value = false
  }
}

async function cancelTwoFactorSignIn() {
  awaitingTwoFactor.value = false
  twoFactorCode.value = ''
  pendingSignIn.value = null
  errorMessage.value = ''
  const authStore = useAuthStore()
  if (authStore.currentUser) {
    clearTwoFactorSessionVerified(authStore.currentUser.uid)
  }
  try {
    await signOut()
  } catch {
    /* ignore */
  }
}

function mapSignInError(error: unknown) {
  const msg = getErrorMessage(error)
  if (msg.includes('user-not-found') || msg.includes('No account found')) {
    errorMessage.value = 'No account found with this email address'
  } else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
    errorMessage.value = 'Incorrect password. Please try again'
  } else if (msg.includes('invalid-email')) {
    errorMessage.value = 'Invalid email address'
  } else if (msg.includes('too-many-requests')) {
    errorMessage.value = 'Too many failed attempts. Please try again later'
  } else if (msg.includes('network')) {
    errorMessage.value = 'Network error. Check your connection and try again'
  } else {
    errorMessage.value = msg || 'Failed to sign in. Please try again'
  }
}

const handleSignIn = async () => {
  if (!form.value.email || !form.value.password) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await completeSignIn(normalizeSignInEmail(form.value.email), form.value.password)
  } catch (error: unknown) {
    console.error('Sign in error:', getErrorMessage(error) || error)
    mapSignInError(error)
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: 'Sign In - Storvv',
  meta: [
    {
      name: 'description',
      content: 'Sign in to your Storvv account',
    },
  ],
})
</script>
