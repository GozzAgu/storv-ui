<template>
  <Modal :modelValue="props.modelValue" @update:modelValue="(value: boolean) => emit('update:modelValue', value)" title="Set Up Two-Factor Authentication" size="lg">
    <div class="space-y-6">
      <!-- Step 1: Choose Method -->
      <div v-if="step === 1" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Choose your preferred 2FA method. We recommend using an authenticator app for better security.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            @click="selectMethod('totp')"
            :class="[
              'p-6 rounded-xl border-2 transition-all text-left',
              selectedMethod === 'totp'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ShieldCheckIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-gray-100">Authenticator App</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Recommended</p>
              </div>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Use apps like Google Authenticator, Authy, or Microsoft Authenticator
            </p>
          </button>
          
          <button
            @click="selectMethod('phone')"
            :class="[
              'p-6 rounded-xl border-2 transition-all text-left',
              selectedMethod === 'phone'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DevicePhoneMobileIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p class="font-semibold text-gray-900 dark:text-gray-100">SMS</p>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Receive verification codes via SMS
            </p>
          </button>
        </div>
      </div>

      <!-- Step 2: TOTP Setup -->
      <div v-if="step === 2 && selectedMethod === 'totp'" class="space-y-6">
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Scan QR Code
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Scan this QR code with your authenticator app
          </p>
          
          <!-- QR Code -->
          <div class="flex justify-center mb-4">
            <div v-if="qrCodeUrl" class="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <img :src="qrCodeUrl" alt="2FA QR Code" class="w-64 h-64" />
            </div>
            <div v-else class="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Generating QR code...</p>
              </div>
            </div>
          </div>

          <!-- Manual Entry -->
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Can't scan? Enter this code manually:
            </p>
            <div class="flex items-center justify-between gap-2">
              <code class="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                {{ secretKey }}
              </code>
              <button
                @click="copySecret"
                class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p class="text-sm text-blue-900 dark:text-blue-100">
              <strong>Popular authenticator apps:</strong> Google Authenticator, Microsoft Authenticator, Authy, 1Password
            </p>
          </div>
        </div>
      </div>

      <!-- Step 2: Phone Setup -->
      <div v-if="step === 2 && selectedMethod === 'phone'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            v-model="phoneNumber"
            type="tel"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="+1234567890"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter your phone number with country code
          </p>
        </div>
        <div id="recaptcha-container-2fa"></div>
      </div>

      <!-- Step 3: Verify -->
      <div v-if="step === 3" class="space-y-4">
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Verify Setup
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Enter the {{ selectedMethod === 'totp' ? '6-digit code' : 'verification code' }} from your {{ selectedMethod === 'totp' ? 'authenticator app' : 'phone' }}
          </p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Code
          </label>
          <input
            v-model="verificationCode"
            type="text"
            maxlength="6"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-center text-2xl tracking-widest font-mono"
            placeholder="000000"
            @input="formatCode"
          />
        </div>

        <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Step 4: Backup Codes -->
      <div v-if="step === 4" class="space-y-4">
        <div class="text-center">
          <CheckCircleIcon class="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Two-Factor Authentication Enabled!
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.
          </p>
        </div>

        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(code, index) in backupCodes"
              :key="index"
              class="px-3 py-2 bg-white dark:bg-gray-900 rounded text-sm font-mono text-gray-900 dark:text-gray-100 text-center"
            >
              {{ code }}
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="copyBackupCodes"
            class="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Copy Codes
          </button>
          <button
            @click="downloadBackupCodes"
            class="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Download
          </button>
        </div>

        <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p class="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Important:</strong> Each backup code can only be used once. Store them securely.
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <Button
          v-if="step > 1 && step < 4"
          variant="secondary"
          @click="previousStep"
          :disabled="isVerifying"
        >
          Back
        </Button>
        <div v-else></div>
        
        <div class="flex gap-2">
          <Button
            v-if="step < 4"
            variant="secondary"
            @click="$emit('update:modelValue', false)"
            :disabled="isVerifying"
          >
            Cancel
          </Button>
          <Button
            v-if="step === 1"
            @click="nextStep"
            :disabled="!selectedMethod"
          >
            Continue
          </Button>
          <Button
            v-if="step === 2"
            @click="initiateSetup"
            :disabled="isLoading || (selectedMethod === 'phone' && !phoneNumber)"
          >
            <span v-if="isLoading" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting up...
            </span>
            <span v-else>Continue</span>
          </Button>
          <Button
            v-if="step === 3"
            @click="verifyCode"
            :disabled="isVerifying || !verificationCode || verificationCode.length !== 6"
          >
            <span v-if="isVerifying" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
            <span v-else>Verify</span>
          </Button>
          <Button
            v-if="step === 4"
            @click="completeSetup"
          >
            Done
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ShieldCheckIcon, DevicePhoneMobileIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import QRCode from 'qrcode'
import { TOTP } from 'otpauth'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
  'error': [error: string]
}>()

const step = ref(1)
const selectedMethod = ref<'totp' | 'phone' | null>(null)
const secretKey = ref('')
const qrCodeUrl = ref('')
const phoneNumber = ref('')
const verificationCode = ref('')
const backupCodes = ref<string[]>([])
const isLoading = ref(false)
const isVerifying = ref(false)
const errorMessage = ref('')

// Reset when modal opens/closes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    reset()
  }
})

const reset = () => {
  step.value = 1
  selectedMethod.value = null
  secretKey.value = ''
  qrCodeUrl.value = ''
  phoneNumber.value = ''
  verificationCode.value = ''
  backupCodes.value = []
  errorMessage.value = ''
  isLoading.value = false
  isVerifying.value = false
}

const selectMethod = (method: 'totp' | 'phone') => {
  selectedMethod.value = method
}

const nextStep = () => {
  if (step.value === 1 && selectedMethod.value) {
    step.value = 2
    if (selectedMethod.value === 'totp') {
      generateTOTPSecret()
    }
  }
}

const previousStep = () => {
  if (step.value > 1) {
    step.value--
  }
}

const generateTOTPSecret = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // Generate a random secret (32 characters base32)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    secretKey.value = secret
    
    // Get user email for QR code
    const { currentUser } = useFirebaseAuth()
    const email = currentUser.value?.email || 'user'
    const issuer = 'Storv'
    
    // Create TOTP URI
    const totpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
    
    // Generate QR code
    qrCodeUrl.value = await QRCode.toDataURL(totpUri, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to generate QR code'
    emit('error', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

const copySecret = async () => {
  try {
    await navigator.clipboard.writeText(secretKey.value)
    // Show feedback (you could use a toast notification here)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

const initiateSetup = async () => {
  if (selectedMethod.value === 'phone') {
    // Handle phone-based 2FA setup
    errorMessage.value = 'Phone-based 2FA setup will be implemented'
    // This would use Firebase phone MFA enrollment
  } else {
    // For TOTP, move to verification step
    step.value = 3
  }
}

const formatCode = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value.replace(/\D/g, '') // Remove non-digits
  if (value.length > 6) value = value.slice(0, 6)
  verificationCode.value = value
  target.value = value
}

const verifyCode = async () => {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    errorMessage.value = 'Please enter a 6-digit code'
    return
  }

  isVerifying.value = true
  errorMessage.value = ''

  try {
    if (selectedMethod.value === 'totp') {
      // Verify TOTP code using the library
      const totp = new TOTP({
        secret: secretKey.value,
        digits: 6,
        period: 30,
        algorithm: 'SHA1'
      })
      
      // Validate the token
      const delta = totp.validate({ token: verificationCode.value, window: 1 })
      
      if (delta !== null) {
        // Code is valid, save to Firestore
        const { save2FASecret } = useFirebaseAuth()
        await save2FASecret(secretKey.value, selectedMethod.value)
        
        // Generate backup codes
        backupCodes.value = generateBackupCodes()
        step.value = 4
      } else {
        errorMessage.value = 'Invalid verification code. Please try again.'
      }
    } else {
      // Verify phone code
      errorMessage.value = 'Phone verification not yet implemented'
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Verification failed. Please try again.'
    emit('error', errorMessage.value)
  } finally {
    isVerifying.value = false
  }
}

const generateBackupCodes = (): string[] => {
  const codes: string[] = []
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars
  for (let i = 0; i < 10; i++) {
    let code = ''
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    codes.push(code)
  }
  return codes
}

const copyBackupCodes = async () => {
  const codesText = backupCodes.value.join('\n')
  try {
    await navigator.clipboard.writeText(codesText)
    // Show feedback
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

const downloadBackupCodes = () => {
  const codesText = `Storv - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.value.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nKeep these codes safe. Each code can only be used once.`
  
  const blob = new Blob([codesText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'storv-2fa-backup-codes.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const completeSetup = () => {
  emit('success')
  emit('update:modelValue', false)
}
</script>

