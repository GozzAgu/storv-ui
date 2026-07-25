<template>
  <div class="dashboard-page-with-footer mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-10">
    <div class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#12141c] sm:p-8">
      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
        <EnvelopeIcon class="h-5 w-5" stroke-width="1.75" />
      </div>
      <h1 class="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
        Verify your email
      </h1>
      <p class="mt-2 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        We sent a verification link to
        <span class="font-medium text-gray-900 dark:text-gray-200">{{ email }}</span>.
        Confirm your email to use billing, staff actions, and the full dashboard.
      </p>

      <div
        v-if="message"
        class="mt-4 rounded-xl border px-3 py-2.5 text-sm"
        :class="
          messageTone === 'error'
            ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
            : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100'
        "
      >
        {{ message }}
      </div>

      <div class="mt-6 flex flex-col gap-2.5">
        <Button class="w-full" :loading="sending" @click="resendVerification">
          Resend verification email
        </Button>
        <Button variant="outline" class="w-full" :loading="checking" @click="checkVerified">
          I've verified — refresh
        </Button>
        <button
          type="button"
          class="text-center text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          @click="signOut"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { EnvelopeIcon } from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'

definePageMeta({
  layout: 'dashboard',
})

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
