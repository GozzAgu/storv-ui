<template>
  <SDialog
    :open="props.modelValue"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
    title="Set up two-factor authentication"
    size="md"
  >
    <div class="s-form">
      <template v-if="step === 1">
        <p class="s-settings__dialog-text">
          Choose your preferred 2FA method. We recommend using an authenticator app for better
          security.
        </p>
        <div class="s-choice-grid" role="radiogroup" aria-label="Two-factor method">
          <button
            type="button"
            role="radio"
            class="s-choice"
            :aria-checked="selectedMethod === 'totp'"
            @click="selectMethod('totp')"
          >
            <span class="s-choice__head">
              <span class="s-profile-2fa__method">
                <ShieldCheck :size="20" :stroke-width="1.75" aria-hidden="true" />
                <span class="s-choice__title">Authenticator app</span>
              </span>
              <span class="s-choice__radio" aria-hidden="true" />
            </span>
            <SBadge tone="accent" class="s-profile-2fa__badge">Recommended</SBadge>
            <span class="s-choice__description">
              Use apps like Google Authenticator, Authy, or Microsoft Authenticator
            </span>
          </button>

          <button
            type="button"
            role="radio"
            class="s-choice"
            :aria-checked="selectedMethod === 'phone'"
            @click="selectMethod('phone')"
          >
            <span class="s-choice__head">
              <span class="s-profile-2fa__method">
                <Smartphone :size="20" :stroke-width="1.75" aria-hidden="true" />
                <span class="s-choice__title">SMS</span>
              </span>
              <span class="s-choice__radio" aria-hidden="true" />
            </span>
            <span class="s-choice__description">Receive verification codes via SMS</span>
          </button>
        </div>
      </template>

      <template v-if="step === 2 && selectedMethod === 'totp'">
        <div class="s-profile-2fa__intro">
          <h3 class="s-form-section__title">Scan QR code</h3>
          <p class="s-settings__dialog-text">Scan this QR code with your authenticator app</p>
        </div>

        <div class="s-profile-2fa__qr">
          <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="2FA QR code" />
          <div v-else class="s-profile-2fa__qr-loading" role="status">
            <SSpinner :size="24" />
            <span>Generating QR code...</span>
          </div>
        </div>

        <div class="s-profile-2fa__secret">
          <p class="s-form-meta">Can't scan? Enter this code manually:</p>
          <div class="s-inline-field">
            <code class="s-inline-field__grow s-profile-2fa__key">{{ secretKey }}</code>
            <SButton size="sm" @click="copySecret">
              <template #leading><Copy :size="16" :stroke-width="2" aria-hidden="true" /></template>
              Copy
            </SButton>
          </div>
        </div>

        <p class="s-callout">
          <strong>Popular authenticator apps:</strong> Google Authenticator, Microsoft
          Authenticator, Authy, 1Password
        </p>
      </template>

      <template v-if="step === 2 && selectedMethod === 'phone'">
        <SInput
          v-model="phoneNumber"
          type="tel"
          label="Phone number"
          autocomplete="tel"
          placeholder="+1234567890"
          hint="Enter your phone number with country code"
        />
        <div id="recaptcha-container-2fa"></div>
      </template>

      <template v-if="step === 3">
        <div class="s-profile-2fa__intro">
          <h3 class="s-form-section__title">Verify setup</h3>
          <p class="s-settings__dialog-text">
            Enter the {{ selectedMethod === 'totp' ? '6-digit code' : 'verification code' }} from
            your {{ selectedMethod === 'totp' ? 'authenticator app' : 'phone' }}
          </p>
        </div>

        <SInput
          v-model="verificationCode"
          label="Verification code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          class="s-otp-input s-otp-input--lg"
          placeholder="000000"
          @input="formatCode"
        />

        <p v-if="errorMessage" class="s-profile-error" role="alert">{{ errorMessage }}</p>
      </template>

      <template v-if="step === 4">
        <div class="s-profile-2fa__intro">
          <CircleCheck class="s-profile-2fa__done" :size="48" :stroke-width="1.75" aria-hidden="true" />
          <h3 class="s-form-section__title">Two-factor authentication enabled!</h3>
          <p class="s-settings__dialog-text">
            Save these backup codes in a safe place. You can use them if you lose access to your
            authenticator app.
          </p>
        </div>

        <ul class="s-profile-2fa__codes" aria-label="Backup codes">
          <li v-for="(code, index) in backupCodes" :key="index">{{ code }}</li>
        </ul>

        <div class="s-profile-2fa__code-actions">
          <SButton block @click="copyBackupCodes">
            <template #leading><Copy :size="16" :stroke-width="2" aria-hidden="true" /></template>
            Copy codes
          </SButton>
          <SButton block @click="downloadBackupCodes">
            <template #leading><Download :size="16" :stroke-width="2" aria-hidden="true" /></template>
            Download
          </SButton>
        </div>

        <p class="s-notice">
          <strong>Important:</strong> Each backup code can only be used once. Store them securely.
        </p>
      </template>
    </div>

    <template #footer>
      <div v-if="step > 1 && step < 4" class="s-dialog__foot-start">
        <SButton :disabled="isVerifying" @click="previousStep">Back</SButton>
      </div>
      <SButton v-if="step < 4" :disabled="isVerifying" @click="$emit('update:modelValue', false)">
        Cancel
      </SButton>
      <SButton v-if="step === 1" variant="primary" :disabled="!selectedMethod" @click="nextStep">
        Continue
      </SButton>
      <SButton
        v-if="step === 2"
        variant="primary"
        :loading="isLoading"
        :disabled="isLoading || (selectedMethod === 'phone' && !phoneNumber)"
        @click="initiateSetup"
      >
        {{ isLoading ? 'Setting up...' : 'Continue' }}
      </SButton>
      <SButton
        v-if="step === 3"
        variant="primary"
        :loading="isVerifying"
        :disabled="isVerifying || !verificationCode || verificationCode.length !== 6"
        @click="verifyCode"
      >
        {{ isVerifying ? 'Verifying...' : 'Verify' }}
      </SButton>
      <SButton v-if="step === 4" variant="primary" @click="completeSetup">Done</SButton>
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { CircleCheck, Copy, Download, ShieldCheck, Smartphone } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SInput from '~/components/s/SInput.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import QRCode from 'qrcode'
import { TOTP } from 'otpauth'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
  error: [error: string]
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
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      reset()
    }
  }
)

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
    const issuer = 'Storvv'

    // Create TOTP URI
    const totpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
      email
    )}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

    // Generate QR code
    qrCodeUrl.value = await QRCode.toDataURL(totpUri, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
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
        algorithm: 'SHA1',
      })

      // Validate the token
      const delta = totp.validate({ token: verificationCode.value, window: 1 })

      if (delta !== null) {
        // Code is valid, save to Firestore
        const { save2FASecret } = useFirebaseAuth()
        await save2FASecret(secretKey.value, selectedMethod.value, verificationCode.value)

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
  const codesText = `Storvv - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.value
    .map((code, i) => `${i + 1}. ${code}`)
    .join('\n')}\n\nKeep these codes safe. Each code can only be used once.`

  const blob = new Blob([codesText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'storvv-2fa-backup-codes.txt'
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
