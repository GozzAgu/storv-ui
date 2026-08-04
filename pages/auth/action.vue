<template>
  <AuthShell
    :mobile-line="shellCopy.mobileLine"
    :panel-title="shellCopy.panelTitle"
    :panel-description="shellCopy.panelDescription"
  >
    <AuthPageHeader
      v-if="showPageHeader"
      :eyebrow="headerCopy.eyebrow"
      :title="headerCopy.title"
      :show-mobile-logo="phase !== 'loading'"
    >
      {{ headerCopy.lede }}
    </AuthPageHeader>

    <AuthCard>
      <div v-if="phase === 'loading'" class="auth-action-status auth-action-status--loading">
        <div class="auth-action-status__spinner" aria-hidden="true" />
        <h2 class="auth-action-status__title">Confirming your link</h2>
        <p class="auth-action-status__body">Validating your secure request…</p>
      </div>

      <form
        v-else-if="phase === 'reset-form'"
        class="auth-form space-y-5"
        @submit.prevent="submitPasswordReset"
      >
        <p v-if="resetEmail" class="auth-action-reset-intro">
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

        <Button
          type="submit"
          variant="primary"
          size="md"
          :icon="ArrowRightIcon"
          icon-right
          extra-class="auth-btn auth-btn--primary !w-full"
          :loading="submitting"
          :disabled="submitting"
        >
          Update password
        </Button>
      </form>

      <div
        v-else-if="phase === 'success'"
        class="auth-action-status auth-action-status--success"
        role="status"
      >
        <div class="auth-action-status__icon" aria-hidden="true">
          <CheckCircleIcon stroke-width="1.75" />
        </div>
        <h2 class="auth-action-status__title">{{ successTitle }}</h2>
        <p class="auth-action-status__body">{{ successMessage }}</p>
        <div class="auth-action-status__actions">
          <Button
            variant="primary"
            size="md"
            :icon="ArrowRightIcon"
            icon-right
            extra-class="auth-btn auth-btn--primary !w-full"
            @click="goToSignInAfterSuccess"
          >
            {{ successCtaLabel }}
          </Button>
        </div>
      </div>

      <div v-else class="auth-action-status auth-action-status--error" role="alert">
        <div class="auth-action-status__icon" aria-hidden="true">
          <ExclamationTriangleIcon stroke-width="1.75" />
        </div>
        <h2 class="auth-action-status__title">{{ errorTitle }}</h2>
        <p class="auth-action-status__body">{{ errorMessage }}</p>
        <div class="auth-action-status__actions">
          <Button
            v-if="primaryErrorAction"
            variant="primary"
            size="md"
            extra-class="auth-btn auth-btn--primary !w-full"
            @click="primaryErrorAction.run"
          >
            {{ primaryErrorAction.label }}
          </Button>
          <Button
            v-if="secondaryErrorAction"
            variant="outline"
            size="md"
            extra-class="auth-btn auth-btn--outline !w-full"
            @click="secondaryErrorAction.run"
          >
            {{ secondaryErrorAction.label }}
          </Button>
        </div>
        <p v-if="showResendHint" class="auth-action-status__hint">
          Signed in already?
          <NuxtLink to="/dashboard/verify-email">Resend verification</NuxtLink>
          from the dashboard, or
          <NuxtLink to="/forgot-password">request a password reset</NuxtLink>.
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
import Button from '~/components/ui/Button.vue'
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

const shellCopy = computed(() => {
  if (phase.value === 'success') {
    return {
      mobileLine: 'You are all set — sign in to open your workspace.',
      panelTitle: 'Welcome back to Storvv.',
      panelDescription: 'Your account is ready. Sign in to manage inventory, receipts, and branches.',
    }
  }
  if (actionMode.value === 'resetPassword' || phase.value === 'reset-form') {
    return {
      mobileLine: 'Choose a new password to get back into your workspace.',
      panelTitle: 'Secure recovery, on your terms.',
      panelDescription:
        'Reset links expire quickly. Once you set a new password, sign in on any device to pick up where you left off.',
    }
  }
  return {
    mobileLine: 'Confirm your email to unlock billing, staff tools, and the full dashboard.',
    panelTitle: 'One quick step before you dive in.',
    panelDescription:
      'Verified accounts keep your workspace secure and ensure receipts, billing, and team invites reach the right inbox.',
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

async function reloadCurrentUserEmailVerified() {
  const auth = getFirebaseClientAuth()
  if (!auth?.currentUser) return
  try {
    await auth.currentUser.reload()
    const authStore = useAuthStore()
    if (authStore.currentUser?.uid === auth.currentUser.uid) {
      authStore.currentUser = auth.currentUser
    }
  } catch {
    /* ignore */
  }
}

async function handleVerifyEmail(code: string) {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Authentication is unavailable right now.')

  await applyActionCode(auth, code)
  await reloadCurrentUserEmailVerified()

  successTitle.value = 'Your email is verified'
  successMessage.value = 'You can now sign in to your Storvv workspace.'
  phase.value = 'success'
}

async function handleRecoverEmail(code: string) {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Authentication is unavailable right now.')

  await applyActionCode(auth, code)

  successTitle.value = 'Email restored'
  successMessage.value = 'Your email address has been restored. Sign in to continue.'
  phase.value = 'success'
}

async function preparePasswordReset(code: string) {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Authentication is unavailable right now.')

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
