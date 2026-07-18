<template>
  <AuthShell
    mobile-line="Storvv: inventory, receipts, and branches in one place."
    panel-title="Run your store with a calmer workflow."
    panel-description="Sign in to manage stock, ring up activity, and keep every branch aligned without jumping between tools."
  >
    <AuthPageHeader eyebrow="Welcome back" title="Sign in to your workspace">
      Enter your credentials to open the dashboard. New here?
      <NuxtLink to="/signup" class="auth-link">Create an account</NuxtLink>
    </AuthPageHeader>

    <AuthCard>
      <Button
        v-if="hasSavedLogin && isSupported"
        type="button"
        variant="outline"
        size="md"
        :icon="FingerPrintIcon"
        :disabled="isLoading || isBiometricLoading"
        :loading="isBiometricLoading"
        extra-class="auth-btn auth-btn--outline !w-full"
        @click="handleBiometricSignIn"
      >
        Sign in with {{ biometryLabel }}
      </Button>

      <form
        class="auth-form space-y-5"
        :class="{ 'mt-5': hasSavedLogin && isSupported }"
        @submit.prevent="handleSignIn"
      >
        <AuthField
          v-model="form.email"
          input-id="email"
          label="Email address"
          type="email"
          autocomplete="username"
          placeholder="Enter your email"
          required
        />

        <AuthField
          v-model="form.password"
          input-id="password"
          label="Password"
          autocomplete="current-password"
          placeholder="Enter your password"
          password-toggle
          required
        >
          <template #label-right>
            <NuxtLink to="/forgot-password" class="auth-link shrink-0 text-xs">
              Forgot?
            </NuxtLink>
          </template>
        </AuthField>

        <Checkbox
          v-if="isSupported"
          v-model="form.enableFaceId"
          size="sm"
          wrapper-class="!items-center"
          label-class="!ml-2.5 !text-xs !font-normal !text-gray-600 dark:!text-gray-400"
        >
          Use {{ biometryLabel }} next time on this device
        </Checkbox>

        <Checkbox
          v-model="form.rememberMe"
          size="sm"
          wrapper-class="!items-center"
          label-class="!ml-2.5 !text-xs !font-normal !text-gray-600 dark:!text-gray-400"
        >
          Remember me
        </Checkbox>

        <AuthAlert
          v-if="errorMessage"
          :message="errorMessage"
          :show-firestore-guide="errorMessage.includes('Firestore')"
        />

        <Button
          type="submit"
          :disabled="isLoading || isBiometricLoading"
          :loading="isLoading"
          variant="primary"
          size="md"
          :icon="ArrowRightIcon"
          icon-right
          extra-class="auth-btn auth-btn--primary !w-full"
        >
          Sign in
        </Button>
      </form>

      <template #footer>
        Prefer to explore first?
        <a href="https://www.storvv.com" class="auth-link">Back to home</a>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowRightIcon, FingerPrintIcon } from '@heroicons/vue/24/outline'
import { BiometryError } from '@aparajita/capacitor-biometric-auth'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useAdminCredentials } from '~/composables/useAdminCredentials'
import { useNativeBiometricLogin } from '~/composables/useNativeBiometricLogin'
import { useUserStore } from '~/stores/user'
import { markCapacitorDocument } from '~/utils/capacitor-env'
import { getErrorMessage } from '~/utils/error-message'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

const form = ref({
  email: '',
  password: '',
  rememberMe: false,
  enableFaceId: false,
})

const isLoading = ref(false)
const isBiometricLoading = ref(false)
const errorMessage = ref('')

const route = useRoute()

const {
  isSupported,
  hasSavedLogin,
  biometryLabel,
  saveLogin,
  clearSavedLogin,
  getLoginAfterBiometric,
  refreshAvailability,
} = useNativeBiometricLogin()

const biometricStaleMessage =
  'Saved Face ID login is out of date. Sign in with your password, keep "Use Face ID next time" checked, then try again.'

onMounted(() => {
  markCapacitorDocument()
  const email = route.query.email
  if (typeof email === 'string' && email.trim()) {
    form.value.email = decodeURIComponent(email).trim()
  }
  void refreshAvailability().then(() => {
    if (hasSavedLogin.value) {
      form.value.enableFaceId = true
    }
  })
})

const { signIn } = useFirebaseAuth()
const { storeCredentials } = useAdminCredentials()
const userStore = useUserStore()

async function persistBiometricLogin(email: string, password: string) {
  if (!isSupported.value) return
  try {
    if (form.value.enableFaceId) {
      const saved = await saveLogin(email, password)
      if (!saved) {
        console.warn('[SignIn] Face ID save failed — Keychain write or verify failed')
      }
    } else {
      await clearSavedLogin()
    }
  } catch (error) {
    console.warn('[SignIn] Face ID preference not saved:', getErrorMessage(error), error)
  }
}

async function completeSignIn(email: string, password: string) {
  const user = await signIn(email, password)

  if (!user) return

  try {
    await userStore.fetchUserData(user.uid)
  } catch (error) {
    throw new Error(getErrorMessage(error) || 'Failed to load your account')
  }

  const userData = userStore.userData

  if (!userData) {
    errorMessage.value = 'Account not found. Please contact your administrator.'
    return
  }

  if (userData.role === 'superAdmin') {
    storeCredentials(email, password)
  }

  // Save to Keychain before leaving sign-in (async after navigate often never finishes on iOS)
  await persistBiometricLogin(email, password)

  let destination = '/dashboard'
  if (userData.role === 'staff' && userData.mustChangePassword) {
    destination = '/dashboard/change-password'
  } else if (!userData.hasCompletedOnboarding) {
    destination = '/dashboard/onboarding'
  }

  await navigateTo(destination)
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
    await completeSignIn(form.value.email, form.value.password)
  } catch (error: unknown) {
    console.error('Sign in error:', getErrorMessage(error) || error)
    mapSignInError(error)
  } finally {
    isLoading.value = false
  }
}

const handleBiometricSignIn = async () => {
  isBiometricLoading.value = true
  errorMessage.value = ''

  try {
    const saved = await getLoginAfterBiometric()
    if (!saved) {
      errorMessage.value =
        'No saved login found. Sign in with your password and enable Face ID for next time.'
      await refreshAvailability()
      return
    }

    form.value.email = saved.email
    form.value.password = saved.password
    form.value.enableFaceId = true

    try {
      await completeSignIn(saved.email, saved.password)
    } catch (signInError: unknown) {
      const msg = getErrorMessage(signInError)
      if (
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential') ||
        msg.includes('Incorrect password')
      ) {
        await clearSavedLogin()
        await refreshAvailability()
        errorMessage.value = biometricStaleMessage
        return
      }
      throw signInError
    }
  } catch (error: unknown) {
    console.error('Biometric sign in error:', getErrorMessage(error) || error)
    if (error instanceof BiometryError) {
      errorMessage.value = error.message || 'Biometric sign in failed'
    } else {
      mapSignInError(error)
    }
  } finally {
    isBiometricLoading.value = false
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
