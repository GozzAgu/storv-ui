<template>
  <div class="space-y-4">
    <!-- Phone Number Input -->
    <div v-if="!codeSent" class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Phone Number
        </label>
        <div class="flex gap-2">
          <select
            v-model="countryCode"
            class="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          >
            <option v-for="country in countries" :key="country.code" :value="country.code">
              {{ country.flag }} {{ country.code }}
            </option>
          </select>
          <input
            v-model="phoneNumber"
            type="tel"
            placeholder="1234567890"
            class="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
            :disabled="isLoading"
          />
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          We'll send you a verification code via SMS
        </p>
      </div>

      <button
        @click="handleSendCode"
        :disabled="!phoneNumber || isLoading"
        class="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span v-if="isLoading" class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span v-else>Send Verification Code</span>
      </button>
    </div>

    <!-- Verification Code Input -->
    <div v-else class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Verification Code
        </label>
        <input
          v-model="verificationCode"
          type="text"
          placeholder="Enter 6-digit code"
          maxlength="6"
          class="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder-gray-400 dark:placeholder-gray-500 text-center text-2xl tracking-widest"
          :disabled="isVerifying"
          @keyup.enter="handleVerifyCode"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter the code sent to {{ countryCode }}{{ phoneNumber }}
        </p>
      </div>

      <div class="flex gap-2">
        <button
          @click="codeSent = false; verificationCode = ''"
          :disabled="isVerifying"
          class="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Change Number
        </button>
        <button
          @click="handleVerifyCode"
          :disabled="!verificationCode || verificationCode.length !== 6 || isVerifying"
          class="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span v-if="isVerifying" class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span v-else>Verify</span>
        </button>
      </div>

      <button
        @click="handleResendCode"
        :disabled="isResending"
        class="w-full text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
      >
        {{ isResending ? 'Sending...' : "Didn't receive code? Resend" }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
      <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
    </div>

    <!-- reCAPTCHA Container (hidden) -->
    <div id="recaptcha-container" class="hidden"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'

const emit = defineEmits<{
  success: [user: any]
  error: [error: string]
}>()

const { sendPhoneVerificationCode, verifyPhoneCode, clearRecaptcha } = useFirebaseAuth()

const phoneNumber = ref('')
const countryCode = ref('+1')
const verificationCode = ref('')
const codeSent = ref(false)
const isLoading = ref(false)
const isVerifying = ref(false)
const isResending = ref(false)
const errorMessage = ref('')

const countries = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
]

const handleSendCode = async () => {
  if (!phoneNumber.value.trim()) {
    errorMessage.value = 'Please enter a phone number'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const fullPhoneNumber = `${countryCode.value}${phoneNumber.value.replace(/\D/g, '')}`
    await sendPhoneVerificationCode(fullPhoneNumber, 'recaptcha-container')
    codeSent.value = true
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to send verification code'
    emit('error', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const handleVerifyCode = async () => {
  if (verificationCode.value.length !== 6) {
    errorMessage.value = 'Please enter a 6-digit verification code'
    return
  }

  isVerifying.value = true
  errorMessage.value = ''

  try {
    const user = await verifyPhoneCode(verificationCode.value)
    emit('success', user)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to verify code'
    emit('error', errorMessage.value)
  } finally {
    isVerifying.value = false
  }
}

const handleResendCode = async () => {
  isResending.value = true
  errorMessage.value = ''
  codeSent.value = false
  verificationCode.value = ''

  try {
    const fullPhoneNumber = `${countryCode.value}${phoneNumber.value.replace(/\D/g, '')}`
    await sendPhoneVerificationCode(fullPhoneNumber, 'recaptcha-container')
    codeSent.value = true
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to resend code'
  } finally {
    isResending.value = false
  }
}

onUnmounted(() => {
  clearRecaptcha()
})
</script>

