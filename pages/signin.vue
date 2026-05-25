<template>
 <AuthShell
 mobile-line="Storvv: inventory, receipts, and branches in one place."
 panel-title="Run your store with a calmer workflow."
 panel-description="Sign in to manage stock, ring up activity, and keep every branch aligned without jumping between tools."
 >
 <div
 :class="[authEntranceClass(40), 'mb-8 text-center lg:mb-9 lg:text-left']"
 >
 <a
 href="https://www.storvv.com"
 class="mb-4 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 lg:hidden rounded-sm dark:focus-visible:ring-offset-slate-950"
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
 Welcome back
 </p>
 <h1
 class="mt-1.5 text-[1.35rem] font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl"
 >
 Sign in to your workspace
 </h1>
 <p class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
 Enter your credentials to open the dashboard. New here?
 <NuxtLink
 to="/signup"
 class="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
 >
 Create an account
 </NuxtLink>
 </p>
 </div>

 <div
 :class="[
 authEntranceClass(120),
 'overflow-hidden rounded-sm bg-white/90 backdrop-blur-sm duration-500 ease-out dark:bg-slate-950/95',
 ]"
 >
 <div class="relative p-4 sm:p-5">
 <div
 class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/35 to-transparent dark:via-primary-500/25"
 aria-hidden="true"
 />
 <form @submit.prevent="handleSignIn" class="space-y-4">
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
 class="w-full rounded-sm bg-white px-3 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
 placeholder="Enter your email"
 />
 </div>

 <div class="space-y-1.5">
 <div class="flex items-center justify-between gap-2">
 <label for="password" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
 Password
 </label>
 <NuxtLink
 to="/forgot-password"
 class="text-xs font-medium text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 transition-colors shrink-0"
 >
 Forgot?
 </NuxtLink>
 </div>
 <div class="relative">
 <input
 id="password"
 v-model="form.password"
 :type="showPassword ? 'text' : 'password'"
 autocomplete="current-password"
 required
 class="w-full rounded-sm bg-white px-3 py-2.5 pr-10 text-xs text-gray-900 placeholder-gray-400 outline-none transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
 placeholder="Enter your password"
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
 </div>

 <div class="flex items-center">
 <input
 id="remember-me"
 v-model="form.rememberMe"
 type="checkbox"
 class="h-3.5 w-3.5 rounded border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 cursor-pointer bg-white dark:bg-gray-800"
 />
 <label for="remember-me" class="ml-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
 Remember me
 </label>
 </div>

 <div
 v-if="errorMessage"
 class="rounded-sm bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/80 dark:ring-red-800/50 p-3"
 >
 <p class="text-xs font-medium text-red-800 dark:text-red-200 mb-0.5">Error</p>
 <div class="text-xs text-red-700 dark:text-red-300 whitespace-pre-line text-left">{{ errorMessage }}</div>
 <NuxtLink
 v-if="errorMessage.includes('Firestore')"
 to="/QUICK_FIX.md"
 target="_blank"
 class="mt-2 inline-block text-[11px] font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
 >
 View Quick Fix Guide →
 </NuxtLink>
 </div>

 <Button
 type="submit"
 :disabled="isLoading"
 :loading="isLoading"
 variant="primary"
 size="md"
 :icon="ArrowRightIcon"
 icon-right
 extra-class="!w-full"
 >
 Sign in
 </Button>
 </form>

 <p class="mt-5 border-t border-gray-200/90 pt-4 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
 Prefer to explore first?
 <a
 href="https://www.storvv.com"
 class="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
 >
 Back to home
 </a>
 </p>
 </div>
 </div>
 </AuthShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import AuthShell from '~/components/auth/AuthShell.vue'
import Button from '~/components/ui/Button.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useTheme } from '~/composables/useTheme'
import { useAdminCredentials } from '~/composables/useAdminCredentials'
import { useUserStore } from '~/stores/user'
import { authEntranceClass } from '~/utils/auth-entrance'
import { markCapacitorDocument } from '~/utils/capacitor-env'

definePageMeta({
 layout: false,
 middleware: 'guest'
})

const { actualTheme } = useTheme()
const logoSource = computed(() =>
 actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)

const form = ref({
 email: '',
 password: '',
 rememberMe: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const route = useRoute()

onMounted(() => {
 markCapacitorDocument()
 const email = route.query.email
 if (typeof email === 'string' && email.trim()) {
 form.value.email = decodeURIComponent(email).trim()
 }
})

const { signIn } = useFirebaseAuth()
const { storeCredentials } = useAdminCredentials()
const userStore = useUserStore()

const handleSignIn = async () => {
 if (!form.value.email || !form.value.password) {
 errorMessage.value = 'Please fill in all fields'
 return
 }

 isLoading.value = true
 errorMessage.value = ''

 try {
 const user = await signIn(form.value.email, form.value.password)
 
 if (user) {
 // Get user data - this will automatically check for staff members via authUid
 // fetchUserData checks:
 // 1. First, looks for user document in users/{userId}
 // 2. If not found, searches for staff member where authUid === userId using collection group query
 // This allows staff to login based on authUid even without a user document
 await userStore.fetchUserData(user.uid)
 const userData = userStore.userData
 
 if (!userData) {
 // User document not found and staff member not found via authUid
 errorMessage.value = 'Account not found. Please contact your administrator.'
 return
 }
 
 // If user is super admin, store credentials for staff creation
 if (userData.role === 'superAdmin') {
 storeCredentials(form.value.email, form.value.password)
 }
 
 // Staff must change their temporary password before using the app
 if (userData.role === 'staff' && userData.mustChangePassword) {
 await navigateTo('/dashboard/change-password')
 return
 }
 
 // Redirect based on onboarding status
 if (!userData.hasCompletedOnboarding) {
 await navigateTo('/dashboard/onboarding')
 } else if (!userData.hasCompletedTutorial) {
 await navigateTo('/dashboard')
 } else {
 await navigateTo('/dashboard')
 }
 }
 } catch (error: any) {
 console.error('Sign in error:', error)
 // Handle Firebase Auth errors
 if (error.message.includes('user-not-found')) {
 errorMessage.value = 'No account found with this email address'
 } else if (error.message.includes('wrong-password')) {
 errorMessage.value = 'Incorrect password. Please try again'
 } else if (error.message.includes('invalid-email')) {
 errorMessage.value = 'Invalid email address'
 } else if (error.message.includes('too-many-requests')) {
 errorMessage.value = 'Too many failed attempts. Please try again later'
 } else {
 errorMessage.value = error.message || 'Failed to sign in. Please try again'
 }
 } finally {
 isLoading.value = false
 }
}

useHead({
 title: 'Sign In - Storvv',
 meta: [
 {
 name: 'description',
 content: 'Sign in to your Storvv account'
 }
 ]
})
</script>
