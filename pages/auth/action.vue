<template>
  <AuthShell
    :panel-eyebrow="shellCopy.eyebrow"
    :panel-title="shellCopy.panelTitle"
    :panel-description="shellCopy.panelDescription"
    :steps="shellCopy.steps"
    :steps-label="shellCopy.stepsLabel"
    :active-step="shellCopy.activeStep"
  >
    <AuthPageHeader
      v-if="showPageHeader"
      :title="headerCopy.title"
      :subtitle="headerCopy.lede"
    />

    <AuthCard>
      <div v-if="phase === 'loading'" class="s-auth-status" role="status">
        <SSpinner :size="28" label="Confirming your link" />
        <p class="s-auth-status__title">Confirming your link</p>
        <p class="s-auth-status__body">Validating your secure request…</p>
      </div>

      <form
        v-else-if="phase === 'reset-form'"
        class="auth-form"
        @submit.prevent="submitPasswordReset"
      >
        <p v-if="resetEmail" class="s-auth-note">
          Set a new password for <strong>{{ resetEmail }}</strong>.
        </p>

        <AuthField
          v-model="passwordForm.password"
          input-id="new-password"
          label="New password"
          autocomplete="new-password"
          placeholder="At least 6 characters"
          password-toggle
          required
        />

        <AuthField
          v-model="passwordForm.confirmPassword"
          input-id="confirm-password"
          label="Confirm password"
          autocomplete="new-password"
          placeholder="Re-enter your password"
          password-toggle
          required
        />

        <AuthAlert v-if="formError" :title="formErrorTitle" :message="formError" />

        <SButton type="submit" variant="primary" size="lg" block :loading="submitting">
          Update password
          <template #trailing><ArrowRightIcon :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
        </SButton>
      </form>

      <div v-else-if="phase === 'success'" class="s-auth-status s-auth-status--success" role="status">
        <span class="s-auth-status__icon">
          <CheckCircleIcon :size="24" :stroke-width="1.75" aria-hidden="true" />
        </span>
        <h1 class="s-auth-status__title">{{ successTitle }}</h1>
        <p class="s-auth-status__body">{{ successMessage }}</p>
        <div class="s-auth-status__actions">
          <SButton variant="primary" size="lg" block @click="goToSignInAfterSuccess">
            {{ successCtaLabel }}
            <template #trailing><ArrowRightIcon :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
          </SButton>
        </div>
      </div>

      <div v-else class="s-auth-status s-auth-status--error" role="alert">
        <span class="s-auth-status__icon">
          <ExclamationTriangleIcon :size="24" :stroke-width="1.75" aria-hidden="true" />
        </span>
        <h1 class="s-auth-status__title">{{ errorTitle }}</h1>
        <p class="s-auth-status__body">{{ errorMessage }}</p>
        <div class="s-auth-status__actions">
          <SButton
            v-if="primaryErrorAction"
            variant="primary"
            size="lg"
            block
            @click="primaryErrorAction.run"
          >
            {{ primaryErrorAction.label }}
          </SButton>
          <SButton v-if="secondaryErrorAction" size="lg" block @click="secondaryErrorAction.run">
            {{ secondaryErrorAction.label }}
          </SButton>
        </div>
        <p v-if="showResendHint" class="s-auth-status__hint">
          Signed in already?
          <NuxtLink to="/dashboard/verify-email" class="auth-link">Resend verification</NuxtLink>
          from the dashboard, or
          <NuxtLink to="/forgot-password" class="auth-link">request a password reset</NuxtLink>.
        </p>
      </div>

      <template v-if="phase !== 'success'" #footer>
        <NuxtLink to="/signin" class="auth-link">Back to sign in</NuxtLink>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '~/utils/app-icons'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import SButton from '~/components/s/SButton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'
import {
  getAuthActionErrorCopy,
  isSupportedAuthActionMode,
  parseFirebaseAuthActionFromLocation,
  type FirebaseAuthActionMode,
} from '~/utils/firebase-auth-action'

definePageMeta({
  layout: false,
})

type Phase = 'loading' | 'reset-form' | 'success' | 'error'

const route = useRoute()

const phase = ref<Phase>('loading')
const actionMode = ref<FirebaseAuthActionMode | ''>('')
const resetEmail = ref('')
const oobCode = ref('')

const successTitle = ref('')
const successMessage = ref('')
const errorTitle = ref('')
const errorMessage = ref('')
const formError = ref('')
const formErrorTitle = ref('Could not update password')
const submitting = ref(false)

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
})

const showPageHeader = computed(() => phase.value === 'loading' || phase.value === 'reset-form')

const showResendHint = computed(
  () => actionMode.value === 'verifyEmail' && phase.value === 'error'
)

const successCtaLabel = computed(() =>
  actionMode.value === 'resetPassword' ? 'Continue to sign in' : 'Continue to sign in'
)

const recoverySteps = [
  { label: 'Enter your email' },
  { label: 'Open the reset link' },
  { label: 'Choose a new password' },
]

const shellCopy = computed(() => {
  if (actionMode.value === 'resetPassword' || phase.value === 'reset-form') {
    return {
      eyebrow: 'Account recovery',
      panelTitle: 'Back to work in minutes',
      panelDescription: 'Reset links expire quickly. Set a new password and sign in on any device.',
      steps: recoverySteps,
      stepsLabel: 'Resetting your password',
      activeStep: phase.value === 'success' ? -1 : 2,
    }
  }
  return {
    eyebrow: 'Join Storvv',
    panelTitle: 'Start your journey',
    panelDescription: 'Verified accounts keep receipts, billing, and team invites reaching the right inbox.',
    steps: undefined,
    stepsLabel: undefined,
    activeStep: phase.value === 'success' ? 1 : 0,
  }
})

const headerCopy = computed(() => {
  if (phase.value === 'reset-form') {
    return {
      eyebrow: 'Password reset',
      title: 'Create a new password',
      lede: 'Use a strong password you have not used on Storvv before.',
    }
  }
  return {
    eyebrow: 'Account security',
    title: 'Almost there',
    lede: 'We are validating your secure link.',
  }
})

const primaryErrorAction = computed<{ label: string; run: () => void } | null>(() => {
  if (actionMode.value === 'verifyEmail') {
    return { label: 'Go to sign in', run: () => navigateTo('/signin') }
  }
  if (actionMode.value === 'resetPassword') {
    return { label: 'Request a new reset link', run: () => navigateTo('/forgot-password') }
  }
  return { label: 'Back to sign in', run: () => navigateTo('/signin') }
})

const secondaryErrorAction = computed<{ label: string; run: () => void } | null>(() => {
  if (actionMode.value === 'resetPassword') {
    return { label: 'Back to sign in', run: () => navigateTo('/signin') }
  }
  return null
})

function goToSignInAfterSuccess() {
  if (actionMode.value === 'resetPassword') {
    navigateTo('/signin?reset=1')
    return
  }
  navigateTo('/signin?verified=1')
}

function setError(error: unknown) {
  const copy = getAuthActionErrorCopy(error)
  errorTitle.value = copy.title
  errorMessage.value = copy.message
  phase.value = 'error'
}

async function signOutExistingSession() {
  const auth = getFirebaseClientAuth()
  if (!auth?.currentUser) return

  const authStore = useAuthStore()
  const userStore = useUserStore()
  try {
    await authStore.signOut()
    userStore.clearUserData()
  } catch {
    /* ignore */
  }
}

async function handleVerifyEmail(code: string) {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Authentication is unavailable right now.')

  // The link may be for a different account (e.g. staff) than whoever is signed in.
  await signOutExistingSession()

  await applyActionCode(auth, code)

  successTitle.value = 'Your email is verified'
  successMessage.value = 'You can now sign in to your Storvv workspace.'
  phase.value = 'success'
}

async function handleRecoverEmail(code: string) {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Authentication is unavailable right now.')

  await signOutExistingSession()

  await applyActionCode(auth, code)

  successTitle.value = 'Email restored'
  successMessage.value = 'Your email address has been restored. Sign in to continue.'
  phase.value = 'success'
}

async function preparePasswordReset(code: string) {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Authentication is unavailable right now.')

  await signOutExistingSession()

  resetEmail.value = await verifyPasswordResetCode(auth, code)
  phase.value = 'reset-form'
}

async function submitPasswordReset() {
  formError.value = ''
  if (passwordForm.password.length < 6) {
    formErrorTitle.value = 'Password too short'
    formError.value = 'Use at least 6 characters.'
    return
  }
  if (passwordForm.password !== passwordForm.confirmPassword) {
    formErrorTitle.value = 'Passwords do not match'
    formError.value = 'Make sure both password fields match.'
    return
  }

  const auth = getFirebaseClientAuth()
  if (!auth) {
    formErrorTitle.value = 'Unavailable'
    formError.value = 'Authentication is unavailable right now.'
    return
  }

  submitting.value = true
  try {
    await confirmPasswordReset(auth, oobCode.value, passwordForm.password)
    actionMode.value = 'resetPassword'
    successTitle.value = 'Password updated'
    successMessage.value = 'Your password has been changed. Sign in with your new password.'
    phase.value = 'success'
  } catch (error: unknown) {
    const copy = getAuthActionErrorCopy(error)
    formErrorTitle.value = copy.title
    formError.value = copy.message
  } finally {
    submitting.value = false
  }
}

async function runAction() {
  const parsed = parseFirebaseAuthActionFromLocation(route.query, route.hash)
  actionMode.value = parsed.mode
  oobCode.value = parsed.oobCode

  if (!parsed.mode || !parsed.oobCode) {
    errorTitle.value = 'Invalid link'
    errorMessage.value =
      'This link is missing required information. Open the latest email from Storvv or request a new one.'
    phase.value = 'error'
    return
  }

  if (!isSupportedAuthActionMode(parsed.mode)) {
    errorTitle.value = 'Unsupported action'
    errorMessage.value = 'This link type is not supported yet. Contact support if you need help.'
    phase.value = 'error'
    return
  }

  try {
    if (parsed.mode === 'verifyEmail' || parsed.mode === 'verifyAndChangeEmail') {
      await handleVerifyEmail(parsed.oobCode)
      return
    }

    if (parsed.mode === 'recoverEmail') {
      await handleRecoverEmail(parsed.oobCode)
      return
    }

    if (parsed.mode === 'resetPassword') {
      await preparePasswordReset(parsed.oobCode)
      return
    }

    errorTitle.value = 'Open this link on the web'
    errorMessage.value =
      'This sign-in link must be opened in the same browser where you started sign-in.'
    phase.value = 'error'
  } catch (error: unknown) {
    setError(error)
  }
}

onMounted(() => {
  runAction()
})

useHead({
  title: 'Account action - Storvv',
  meta: [
    {
      name: 'description',
      content: 'Complete email verification or password reset for your Storvv account.',
    },
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
})
</script>
