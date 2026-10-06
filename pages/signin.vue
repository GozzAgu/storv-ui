<template>
  <AuthShell
    panel-eyebrow="Welcome back"
    panel-title="Your store, in one place"
    panel-description="Stock, sales, and every branch in one workspace."
    :steps="signInHighlights"
    steps-label="What you can do in Storvv"
  >
    <AuthBuddies
      mode="signin"
      :focused="focused"
      :email="form.email"
      :password="form.password"
      :error="errorMessage"
      :loading="isLoading || isVerifyingTwoFactor"
      :two-factor="awaitingTwoFactor"
    />

    <AuthPageHeader
      title="Welcome back!"
      subtitle="Sign in to manage inventory, sales, and every branch from one workspace."
    />

    <AuthSegmentToggle mode="signin" />

    <AuthCard>
      <div class="auth-form-panel" @focusin="trackFocus" @focusout="trackFocus">
        <AuthGoogleButton
          v-if="googleAvailable && !awaitingTwoFactor"
          :loading="googleLoading"
          :disabled="isLoading || isBiometricFilling"
          @click="handleGoogleSignIn()"
        />
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

          <AuthSuccessPanel v-if="actionSuccessTitle" :icon="CheckCircleIcon">
            <template #title>{{ actionSuccessTitle }}</template>
            {{ actionSuccessBody }}
          </AuthSuccessPanel>

          <AuthAlert
            v-if="errorMessage"
            :message="errorMessage"
            :show-firestore-guide="errorMessage.includes('PERMISSION_DENIED')"
          />

          <div v-if="awaitingTwoFactor" class="auth-form">
            <p class="s-auth-note">
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
              class="auth-link s-auth-secondary-link"
              :disabled="isVerifyingTwoFactor"
              @click="cancelTwoFactorSignIn"
            >
              Use a different account
            </button>
          </div>

          <template v-else>
            <AuthPrimaryButton
              label="Sign in"
              :loading="isLoading"
              :disabled="isLoading || isBiometricFilling"
            />
          </template>
        </form>

        <p v-if="!awaitingTwoFactor" class="auth-auth-footer-link">
          Don't have an account?
          <NuxtLink to="/signup">Create one</NuxtLink>
        </p>
      </div>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { CheckCircleIcon, EnvelopeIcon, LockClosedIcon } from '~/utils/app-icons'
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
import AuthBuddies from '~/components/auth/AuthBuddies.vue'
import AuthGoogleButton from '~/components/auth/AuthGoogleButton.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useGoogleSignIn } from '~/composables/useGoogleSignIn'
import { hasPendingGoogleRedirect } from '~/utils/google-sign-in'
import { useFocusedField } from '~/composables/useFocusedField'
import { useNativeBiometricLogin } from '~/composables/useNativeBiometricLogin'
import { useUserStore } from '~/stores/user'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { markCapacitorDocument } from '~/utils/capacitor-env'
import { clearSignOutPending } from '~/utils/auth-sign-out'
import { getErrorMessage } from '~/utils/error-message'
import { getAuthWaitMs, waitForAuthStore } from '~/utils/wait-for-auth'
import { resolvePostSignInDestination } from '~/utils/post-sign-in-destination'
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

const signInHighlights = [
  { label: "Check today's sales" },
  { label: 'Restock what is running low' },
  { label: 'Keep every branch in sync' },
]

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

const { focused, trackFocus } = useFocusedField()
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
  } else if (hasPendingGoogleRedirect()) {
    void handleGoogleSignIn(true)
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
  if (
    userStore.userData?.twoFactorEnabled &&
    !isTwoFactorSessionVerified(authStore.currentUser.uid)
  ) {
    awaitingTwoFactor.value = true
    form.value.email = authStore.currentUser.email || form.value.email
  }
}

const { signIn, signOut } = useFirebaseAuth()
const {
  available: googleAvailable,
  loading: googleLoading,
  continueWithGoogle,
  resumeGoogleRedirect,
} = useGoogleSignIn()
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

/** `credentials` is null for Google sign-in, which has no password to save for Face ID. */
async function finishAuthenticatedSession(credentials: { email: string; password: string } | null) {
  const userData = userStore.userData
  if (!userData) {
    errorMessage.value = userStore.error || 'Account not found. Please contact your administrator.'
    try {
      await signOut()
    } catch {
      /* ignore */
    }
    return
  }

  if (credentials?.password) {
    await persistBiometricLogin(credentials.email, credentials.password)
  }

  if (userData.role === 'superAdmin') {
    const { recordMilestone } = useFunnelAnalytics()
    await recordMilestone('firstLoginAt', { role: userData.role })
  }

  await navigateTo(resolvePostSignInDestination(userData))
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
    errorMessage.value = userStore.error || 'Account not found. Please contact your administrator.'
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

  await finishAuthenticatedSession({ email: normalizedEmail, password })
}

async function handleGoogleSignIn(resumeRedirect = false) {
  errorMessage.value = ''
  try {
    const outcome = resumeRedirect ? await resumeGoogleRedirect() : await continueWithGoogle()
    if (!outcome || outcome.status === 'cancelled') return
    if (outcome.status === 'needs-two-factor') {
      pendingSignIn.value = null
      form.value.email = outcome.user.email || form.value.email
      awaitingTwoFactor.value = true
      twoFactorCode.value = ''
      if (route.query.verify2fa !== '1') {
        await navigateTo('/signin?verify2fa=1', { replace: true })
      }
      return
    }
    await finishAuthenticatedSession(null)
  } catch (error: unknown) {
    errorMessage.value = getErrorMessage(error) || 'Google sign-in failed. Please try again.'
  }
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
      pending ??
        (form.value.password ? { email: form.value.email, password: form.value.password } : null)
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
