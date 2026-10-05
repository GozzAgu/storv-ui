<template>
  <AuthShell
    panel-eyebrow="One last check"
    panel-title="Confirm it's you"
    panel-description="Verifying your email keeps billing, staff invites and your store data secure."
    :active-step="0"
  >
    <AuthCard>
      <div class="s-auth-status" role="status">
        <span class="s-auth-status__icon">
          <Mail :size="24" :stroke-width="1.75" aria-hidden="true" />
        </span>
        <h1 class="s-auth-status__title">Verify your email</h1>
        <p class="s-auth-status__body">
          We sent a verification link to <strong>{{ email }}</strong>. Open it to use billing, staff actions
          and the full dashboard.
        </p>
      </div>

      <AuthAlert v-if="message && messageTone === 'error'" title="Not yet" :message="message" />
      <p v-else-if="message" class="s-auth-notice" role="status">{{ message }}</p>

      <div class="s-auth-status__actions">
        <SButton variant="primary" size="lg" block :loading="checking" @click="checkVerified">
          I've verified my email
        </SButton>
        <SButton size="lg" block :loading="sending" @click="resendVerification">
          Resend the link
        </SButton>
      </div>

      <template #footer>
        <button type="button" class="auth-link" @click="signOut">Sign out</button>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Mail } from '@lucide/vue'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthCard from '~/components/auth/AuthCard.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import SButton from '~/components/s/SButton.vue'

definePageMeta({
  layout: false,
})

useHead({ title: 'Verify your email - Storvv' })

const authStore = useAuthStore()
const { sendVerificationEmail, signOut: firebaseSignOut } = useFirebaseAuth()

const sending = ref(false)
const checking = ref(false)
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const email = computed(() => authStore.currentUser?.email || 'your inbox')

async function resendVerification() {
  if (!authStore.currentUser) return
  sending.value = true
  message.value = ''
  try {
    await sendVerificationEmail()
    message.value = 'Verification email sent. Check your inbox and spam folder.'
    messageTone.value = 'success'
  } catch (error: unknown) {
    message.value =
      (error as { message?: string })?.message || 'Could not send verification email.'
    messageTone.value = 'error'
  } finally {
    sending.value = false
  }
}

async function checkVerified() {
  if (!authStore.currentUser) return
  checking.value = true
  message.value = ''
  try {
    await authStore.currentUser.reload()
    if (authStore.currentUser.emailVerified) {
      await navigateTo('/dashboard')
      return
    }
    message.value = 'Email not verified yet. Open the link in your inbox, then try again.'
    messageTone.value = 'error'
  } catch (error: unknown) {
    message.value = (error as { message?: string })?.message || 'Could not refresh status.'
    messageTone.value = 'error'
  } finally {
    checking.value = false
  }
}

async function signOut() {
  await firebaseSignOut()
  await navigateTo('/signin')
}

onMounted(async () => {
  if (authStore.currentUser?.emailVerified) {
    await navigateTo('/dashboard')
  }
})
</script>

