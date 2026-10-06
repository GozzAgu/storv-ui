<template>
  <SDialog
      placement="right"
    :open="props.modelValue"
    :title="isEdit ? 'Edit staff' : 'Add staff'"
    size="md"
    @update:open="(value: boolean) => emit('update:modelValue', value)"
  >
    <div
      v-if="emailSentSuccess"
      class="s-auth-status s-auth-status--success s-record-status"
      role="status"
    >
      <span class="s-auth-status__icon" aria-hidden="true">
        <CheckCircleIcon :size="24" :stroke-width="1.75" />
      </span>
      <h3 class="s-auth-status__title">Invite emailed</h3>
      <p class="s-auth-status__body">
        We emailed sign-in details to
        <strong>{{ formData.email }}</strong>. They can change the password after
        signing in.
      </p>
    </div>

    <div
      v-else-if="showTemporaryPassword"
      class="s-auth-status s-auth-status--success s-record-status"
      role="status"
    >
      <span class="s-auth-status__icon" aria-hidden="true">
        <CheckCircleIcon :size="24" :stroke-width="1.75" />
      </span>
      <h3 class="s-auth-status__title">Account created</h3>
      <p class="s-auth-status__body">
        Share this one-time password with
        <strong>{{ formData.email }}</strong>. They can change it in Profile after signing in.
      </p>
      <div class="s-record-secret">
        <code class="s-record-secret__code">{{ temporaryPasswordToShow }}</code>
        <SButton size="sm" variant="ghost" @click="copyTemporaryPassword">
          <template #leading>
            <ClipboardDocumentIcon
              v-if="!copiedPassword"
              :size="16"
              :stroke-width="2"
              aria-hidden="true"
            />
            <CheckCircleIcon v-else :size="16" :stroke-width="2" aria-hidden="true" />
          </template>
          {{ copiedPassword ? 'Copied' : 'Copy' }}
        </SButton>
      </div>
      <SButton size="sm" variant="ghost" @click="openMailtoInvite(temporaryPasswordToShow)">
        Open in email app instead
      </SButton>
    </div>

    <SForm v-else id="staff-drawer-form" @submit="handleSubmit">
      <SFormSection v-if="staffLimitReached && !isEdit">
        <p class="s-notice">
          Your plan staff limit is reached for this store.
          <NuxtLink to="/dashboard/settings?upgrade=1" class="s-link">Upgrade</NuxtLink>
        </p>
        <p v-if="staffLimitMessage" class="s-field__hint">{{ staffLimitMessage }}</p>
      </SFormSection>

      <SFormSection>
        <div class="s-form-pair">
          <SField label="First name" required>
            <SInput v-model="formData.firstName" required placeholder="First name" />
          </SField>
          <SField label="Last name" required>
            <SInput v-model="formData.lastName" required placeholder="Last name" />
          </SField>
        </div>
        <SField label="Email" required>
          <SInput
            v-model="formData.email"
            type="email"
            required
            placeholder="email@example.com"
          />
        </SField>
        <div class="s-form-pair">
          <SField label="Phone" hint="Optional">
            <SInput v-model="formData.phone" type="tel" placeholder="+1234567890" />
          </SField>
          <SField label="Position" required>
            <SInput
              v-model="formData.position"
              required
              placeholder="e.g. Sales associate"
            />
          </SField>
        </div>
      </SFormSection>

      <SFormSection v-if="!isEdit">
        <SCheckbox
          v-model="emailCredentialsToStaff"
          label="Email sign-in details"
          :description="
            emailCredentialsToStaff
              ? 'A random password is generated and emailed when the account is created.'
              : 'A random password is generated. You can copy it after the account is created.'
          "
        />
        <div>
          <SButton size="sm" variant="ghost" @click="regeneratePassword">
            <template #leading>
              <ArrowPathIcon :size="16" :stroke-width="2" aria-hidden="true" />
            </template>
            Regenerate password
          </SButton>
        </div>
      </SFormSection>

      <SFormSection>
        <div class="s-form-pair">
          <SField label="Hire date" required>
            <SInput v-model="formData.hireDate" type="date" required />
          </SField>
          <SField label="Salary" hint="Optional">
            <SInput
              v-model="formData.salary"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional"
            />
          </SField>
        </div>
        <SField label="Status" required>
          <SSelect v-model="formData.status" required>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On leave</option>
          </SSelect>
        </SField>
      </SFormSection>

      <StaffPermissionsPanel
        v-if="canEditStaffPermissions"
        v-model="formData.permissions"
      />

      <p v-if="errorMessage" class="s-field__error" role="alert">{{ errorMessage }}</p>
    </SForm>

    <template #footer>
      <SDialogActions
        v-if="emailSentSuccess"
        cancel-label="Done"
        :show-primary="false"
        @cancel="closeAfterSuccess"
      />
      <SDialogActions
        v-else-if="showTemporaryPassword"
        cancel-label="Done"
        primary-label="Email to staff instead"
        :primary-loading="isSendingInviteEmail"
        :primary-disabled="isSendingInviteEmail"
        @cancel="closeAfterSuccess"
        @primary="emailCredentialsAfterCreate"
      />
      <SDialogActions
        v-else
        :primary-label="staffFooterPrimaryLabel"
        :primary-loading="isSubmitting"
        :primary-disabled="isSubmitting || !isFormValid || staffLimitReached"
        @cancel="handleClose"
        @primary="handleSubmit"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import SDialog from '~/components/s/SDialog.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SField from '~/components/s/SField.vue'
import SForm from '~/components/s/SForm.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import { ref, watch, computed, onMounted } from 'vue'
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from '~/utils/app-icons'
import SButton from '~/components/s/SButton.vue'
import type { Staff } from '~/composables/useStaff'
import { useStaffStore } from '~/stores/staff'
import { useDepartmentsStore } from '~/stores/departments'
import { useStaffInvitePasswordsStore } from '~/stores/staffInvitePasswords'
import { useStaffInviteEmail } from '~/composables/useStaffInviteEmail'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'
import { getApiErrorMessage } from '~/utils/api-error-message'
import { staffLimitReachedMessage } from '~/types/subscription'
import { useProductAnalytics } from '~/composables/useProductAnalytics'
import StaffPermissionsPanel from '~/components/departments/StaffPermissionsPanel.vue'
import type { StaffPermissions } from '~/types/staff-permissions'
import { deriveDefaultPermissions, resolveStaffPermissions } from '~/utils/staff-permissions'

interface Props {
  modelValue: boolean
  departmentId: string
  staff?: Staff | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
  error: [error: string]
}>()

const staffStore = useStaffStore()
const departmentsStore = useDepartmentsStore()
const staffInvitePasswordsStore = useStaffInvitePasswordsStore()
const { sendStaffInviteEmail } = useStaffInviteEmail()
const authStore = useAuthStore()
const userStore = useUserStore()
const toast = useAppToast()
const { plan, canAddStaff, staffLimitForStore } = useSubscriptionFeatures()
const { canEditStaffPermissions } = usePermissions()

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  permissions: deriveDefaultPermissions({}) as StaffPermissions,
  hireDate: new Date().toISOString().split('T')[0]!,
  salary: undefined as number | undefined,
  status: 'active' as 'active' | 'inactive' | 'on_leave',
})

// Random password for new staff (generated, not typed; regenerate icon keeps it private)
const generatedPassword = ref('')
function generateRandomPassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols
  const getRandom = (str: string) => str[Math.floor(Math.random() * str.length)]!
  let out = getRandom(upper) + getRandom(lower) + getRandom(digits) + getRandom(symbols)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const rest = new Uint8Array(length - 4)
    crypto.getRandomValues(rest)
    for (let i = 0; i < rest.length; i++) out += all[rest[i]! % all.length]
  } else {
    for (let i = 4; i < length; i++) out += all[Math.floor(Math.random() * all.length)]
  }
  return out
    .split('')
    .sort(() => (Math.random() > 0.5 ? 1 : -1))
    .join('')
}

function regeneratePassword() {
  generatedPassword.value = generateRandomPassword()
}

const isSubmitting = ref(false)
const errorMessage = ref('')
const showTemporaryPassword = ref(false)
const temporaryPasswordToShow = ref('')
const copiedPassword = ref(false)
const emailCredentialsToStaff = ref(true)
const emailSentSuccess = ref(false)
const isSendingInviteEmail = ref(false)

const createdStaffMeta = ref<{
  staffId: string
  storeId: string
  departmentName: string
} | null>(null)

const isEdit = computed(() => !!props.staff)

const staffFooterPrimaryLabel = computed(() => (isEdit.value ? 'Update staff' : 'Add staff'))

const staffStoreId = computed(() => departmentsStore.getDepartmentById(props.departmentId)?.storeId)

const storeStaffCount = computed(() => {
  const storeId = staffStoreId.value
  if (!storeId) return 0
  return staffStore.staff.filter((member) => {
    const memberDept = departmentsStore.getDepartmentById(member.departmentId)
    return memberDept?.storeId === storeId && member.status !== 'inactive'
  }).length
})

const staffLimitReached = computed(
  () => !isEdit.value && !canAddStaff(storeStaffCount.value, staffStoreId.value)
)

const staffLimitMessage = computed(() => {
  const max = staffLimitForStore(staffStoreId.value)
  if (max < 0) return ''
  return staffLimitReachedMessage(plan.value, max)
})

const isFormValid = computed(() => {
  const base = !!(
    formData.value.firstName &&
    formData.value.lastName &&
    formData.value.email &&
    formData.value.position &&
    formData.value.hireDate
  )
  if (isEdit.value) return base
  return base && !!generatedPassword.value
})

const resetForm = () => {
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    permissions: deriveDefaultPermissions({}),
    hireDate: new Date().toISOString().split('T')[0]!,
    salary: undefined,
    status: 'active',
  }
  generatedPassword.value = generateRandomPassword()
  errorMessage.value = ''
  showTemporaryPassword.value = false
  temporaryPasswordToShow.value = ''
  copiedPassword.value = false
  emailSentSuccess.value = false
  createdStaffMeta.value = null
}

const copyTemporaryPassword = async () => {
  if (!temporaryPasswordToShow.value) return
  try {
    await navigator.clipboard.writeText(temporaryPasswordToShow.value)
    copiedPassword.value = true
    setTimeout(() => {
      copiedPassword.value = false
    }, 2000)
  } catch {
    // ignore
  }
}

const closeAfterSuccess = () => {
  showTemporaryPassword.value = false
  temporaryPasswordToShow.value = ''
  emailSentSuccess.value = false
  createdStaffMeta.value = null
  emit('success')
  emit('update:modelValue', false)
}

async function emailStaffCredentials(params: {
  staffId: string
  storeId: string
  departmentName: string
  temporaryPassword: string
}) {
  const ownerUserId = authStore.currentUser?.uid
  if (!ownerUserId) throw new Error('Sign in required')

  await sendStaffInviteEmail({
    ownerUserId,
    storeId: params.storeId,
    departmentId: props.departmentId,
    staffId: params.staffId,
    staffEmail: formData.value.email.trim().toLowerCase(),
    staffName: `${formData.value.firstName} ${formData.value.lastName}`.trim(),
    departmentName: params.departmentName,
    businessName:
      userStore.userData?.storeDetails?.storeName ||
      userStore.userData?.name ||
      'Storvv',
    temporaryPassword: params.temporaryPassword,
    // Match the created temporary password (and StaffInvitePasswordsPanel). reset_link is for
    // re-invites without a known password and needs Firebase Admin password-reset generation.
    mode: 'credentials',
  })
  const { trackEvent } = useProductAnalytics()
  trackEvent('staff_invite_sent', { mode: 'credentials' })
}

function inviteSignInUrl() {
  const config = useRuntimeConfig()
  const origin = String(config.public.appOrigin || '').trim().replace(/\/$/, '')
  return origin ? `${origin}/signin` : 'https://app.storvv.com/signin'
}

function openMailtoInvite(password: string) {
  const email = formData.value.email.trim()
  const name = `${formData.value.firstName} ${formData.value.lastName}`.trim() || 'there'
  const business =
    userStore.userData?.storeDetails?.storeName || userStore.userData?.name || 'Storvv'
  const signInUrl = inviteSignInUrl()
  const subject = encodeURIComponent(`Your Storvv sign-in for ${business}`)
  const body = encodeURIComponent(
    [
      `Hi ${name},`,
      '',
      `You've been invited to ${business} on Storvv.`,
      '',
      `Sign in: ${signInUrl}`,
      `Email: ${email}`,
      `Temporary password: ${password}`,
      '',
      'Change this password after you sign in.',
    ].join('\n')
  )
  window.open(`mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`, '_blank')
}

function inviteEmailFailureMessage(error: unknown) {
  const message = getApiErrorMessage(error, 'Could not send invite email')
  return `${message} You can copy the password below, or open your email app.`
}

async function emailCredentialsAfterCreate() {
  const meta = createdStaffMeta.value
  const password = temporaryPasswordToShow.value
  if (!meta || !password) return

  isSendingInviteEmail.value = true
  try {
    await emailStaffCredentials({
      staffId: meta.staffId,
      storeId: meta.storeId,
      departmentName: meta.departmentName,
      temporaryPassword: password,
    })
    toast.success(`Sign-in details emailed to ${formData.value.email}`)
    showTemporaryPassword.value = false
    temporaryPasswordToShow.value = ''
    emailSentSuccess.value = true
  } catch (error: unknown) {
    toast.error(inviteEmailFailureMessage(error))
    openMailtoInvite(password)
  } finally {
    isSendingInviteEmail.value = false
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm()
      if (props.staff) {
        formData.value = {
          firstName: props.staff.firstName || '',
          lastName: props.staff.lastName || '',
          email: props.staff.email || '',
          phone: props.staff.phone || '',
          position: props.staff.position || '',
          permissions: resolveStaffPermissions(props.staff),
          hireDate: props.staff.hireDate || new Date().toISOString().split('T')[0]!,
          salary: props.staff.salary,
          status: (props.staff.status as 'active' | 'inactive' | 'on_leave') || 'active',
        }
      } else {
        generatedPassword.value = generateRandomPassword()
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!isEdit.value && staffLimitReached.value) {
    errorMessage.value = staffLimitMessage.value || 'Staff limit reached for your plan.'
    return
  }
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields correctly.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (isEdit.value && props.staff) {
      await staffStore.updateStaff(props.staff.id, {
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        email: formData.value.email,
        phone: formData.value.phone.trim(),
        position: formData.value.position,
        ...(canEditStaffPermissions.value ? { permissions: formData.value.permissions } : {}),
        hireDate: formData.value.hireDate,
        salary: formData.value.salary,
        status: formData.value.status,
      })
    } else {
      const result = await staffStore.createStaff({
        departmentId: props.departmentId,
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        email: formData.value.email,
        password: generatedPassword.value,
        phone: formData.value.phone.trim() || undefined,
        position: formData.value.position,
        permissions: canEditStaffPermissions.value
          ? formData.value.permissions
          : deriveDefaultPermissions({}),
        hireDate: formData.value.hireDate,
        salary: formData.value.salary,
        status: formData.value.status,
      })
      const created = result as { staffId: string; temporaryPassword?: string }
      if (created?.temporaryPassword) {
        const dept =
          departmentsStore.getDepartmentById(props.departmentId) ||
          (await departmentsStore.fetchDepartment(props.departmentId).catch(() => null))
        const departmentName = dept?.name || 'Department'
        const storeId = dept?.storeId || ''

        createdStaffMeta.value = {
          staffId: created.staffId,
          storeId,
          departmentName,
        }

        if (emailCredentialsToStaff.value && storeId) {
          isSendingInviteEmail.value = true
          try {
            await emailStaffCredentials({
              staffId: created.staffId,
              storeId,
              departmentName,
              temporaryPassword: created.temporaryPassword,
            })
            emailSentSuccess.value = true
            toast.success(`Sign-in details emailed to ${formData.value.email}`)
            return
          } catch (error: unknown) {
            toast.error(inviteEmailFailureMessage(error))
            openMailtoInvite(created.temporaryPassword)
          } finally {
            isSendingInviteEmail.value = false
          }
        } else if (emailCredentialsToStaff.value && !storeId) {
          toast.warning(
            'Staff was created but email could not be sent. This department has no store assigned.'
          )
        }

        temporaryPasswordToShow.value = created.temporaryPassword
        showTemporaryPassword.value = true
        if (!emailCredentialsToStaff.value) {
          staffInvitePasswordsStore.recordInvite({
            staffId: created.staffId,
            storeId,
            staffEmail: formData.value.email.trim().toLowerCase(),
            staffName: `${formData.value.firstName} ${formData.value.lastName}`.trim(),
            password: created.temporaryPassword,
            departmentId: props.departmentId,
            departmentName,
          })
        }
        return
      }
    }

    emit('success')
    emit('update:modelValue', false)
  } catch (error: any) {
    errorMessage.value =
      error?.data?.message || error?.message || 'Failed to save staff member. Please try again.'
    emit('error', errorMessage.value)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // Any initialization logic can go here
})
</script>
