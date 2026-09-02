<template>
  <SidePanel
    :model-value="props.modelValue"
    :title="isEdit ? 'Edit staff' : 'Add staff'"
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <div v-if="emailSentSuccess" class="dash-drawer-empty">
      <CheckCircleIcon class="h-6 w-6" stroke-width="1.75" />
      <p>Invite emailed</p>
      <p class="dash-drawer-hint">
        We sent a sign-in link to
        <span class="font-medium">{{ formData.email }}</span>. They can set a password, then sign in.
      </p>
    </div>

    <div v-else-if="showTemporaryPassword" class="dash-drawer-empty">
      <CheckCircleIcon class="h-6 w-6" stroke-width="1.75" />
      <p>Account created</p>
      <p class="dash-drawer-hint">
        Share this one-time password with
        <span class="font-medium">{{ formData.email }}</span>. They can change it in Profile after signing in.
      </p>
      <div class="staff-invite-secret">
        <code>{{ temporaryPasswordToShow }}</code>
        <button type="button" class="staff-invite-secret__copy" @click="copyTemporaryPassword">
          <ClipboardDocumentIcon
            v-if="!copiedPassword"
            class="h-4 w-4 shrink-0"
            stroke-width="1.75"
          />
          <CheckCircleIcon v-else class="h-4 w-4 shrink-0" stroke-width="2" />
          {{ copiedPassword ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>

    <IosForm v-else id="staff-drawer-form" layout="fill" @submit="handleSubmit">
      <IosFormSection v-if="staffLimitReached && !isEdit" fixed>
        <LimitUpgradeHint message="Your plan staff limit is reached for this store." />
        <p class="ios-form__hint dash-drawer-hint">{{ staffLimitMessage }}</p>
      </IosFormSection>

      <IosFormSection fixed>
        <div class="ios-form__grid sm:grid-cols-2">
          <IosFormField label="First name" required>
            <IosFormInput v-model="formData.firstName" required placeholder="First name" />
          </IosFormField>
          <IosFormField label="Last name" required>
            <IosFormInput v-model="formData.lastName" required placeholder="Last name" />
          </IosFormField>
        </div>
        <IosFormField label="Email" required>
          <IosFormInput
            v-model="formData.email"
            type="email"
            required
            placeholder="email@example.com"
          />
        </IosFormField>
        <IosFormField label="Phone" hint="Optional">
          <IosFormInput v-model="formData.phone" type="tel" placeholder="+1234567890" />
        </IosFormField>
      </IosFormSection>

      <IosFormSection v-if="!isEdit" fixed>
        <IosFormToggle
          v-model="emailCredentialsToStaff"
          label="Email sign-in details"
          :hint="
            emailCredentialsToStaff
              ? 'A random password is generated and emailed when the account is created.'
              : 'A random password is generated. You can copy it after the account is created.'
          "
        />
        <button type="button" class="staff-invite-regen" @click="regeneratePassword">
          <ArrowPathIcon class="h-4 w-4" stroke-width="1.75" />
          Regenerate password
        </button>
      </IosFormSection>

      <IosFormSection fixed>
        <IosFormField label="Position" required>
          <IosFormInput
            v-model="formData.position"
            required
            placeholder="e.g. Sales Associate"
          />
        </IosFormField>
        <IosFormField label="Role" required>
          <IosFormSelect v-model="formData.role" required extra-class="cursor-pointer">
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="intern">Intern</option>
          </IosFormSelect>
        </IosFormField>
        <IosFormToggle
          v-if="canGrantInventoryAccess && formData.role === 'manager'"
          v-model="formData.canManageInventory"
          label="Inventory editor"
          hint="Can add and edit categories, products, quantities, and prices."
        />
        <IosFormField label="Hire date" required>
          <IosFormInput v-model="formData.hireDate" type="date" required />
        </IosFormField>
        <IosFormField label="Salary" hint="Optional">
          <IosFormInput
            v-model="formData.salary"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </IosFormField>
        <IosFormField label="Status" required>
          <IosFormSelect v-model="formData.status" required extra-class="cursor-pointer">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </IosFormSelect>
        </IosFormField>
      </IosFormSection>

      <p v-if="errorMessage" class="ios-form__error">{{ errorMessage }}</p>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        v-if="emailSentSuccess"
        cancel-label="Done"
        :show-primary="false"
        @cancel="closeAfterSuccess"
      />
      <IosDrawerActions
        v-else-if="showTemporaryPassword"
        cancel-label="Done"
        primary-label="Email to staff instead"
        :primary-loading="isSendingInviteEmail"
        :primary-disabled="isSendingInviteEmail"
        @cancel="closeAfterSuccess"
        @primary="emailCredentialsAfterCreate"
      />
      <IosDrawerActions
        v-else
        :primary-label="staffFooterPrimaryLabel"
        :primary-loading="isSubmitting"
        :primary-disabled="isSubmitting || !isFormValid || staffLimitReached"
        @cancel="handleClose"
        @primary="handleSubmit"
      />
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from '~/utils/app-icons'
import SidePanel from '~/components/ui/SidePanel.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import {
  IosForm,
  IosFormSection,
  IosFormField,
  IosFormInput,
  IosFormSelect,
  IosFormToggle,
} from '~/components/ios/forms'
import type { Staff } from '~/composables/useStaff'
import { useStaffStore } from '~/stores/staff'
import { useDepartmentsStore } from '~/stores/departments'
import { useStaffInvitePasswordsStore } from '~/stores/staffInvitePasswords'
import { useStaffInviteEmail } from '~/composables/useStaffInviteEmail'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'
import { getApiErrorMessage } from '~/utils/api-error-message'
import LimitUpgradeHint from '~/components/subscription/LimitUpgradeHint.vue'
import { getPlanDisplayName, getMinimumPlanForFeature } from '~/types/subscription'
import { useProductAnalytics } from '~/composables/useProductAnalytics'

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
const { canAddStaff, limits } = useSubscriptionFeatures()
const { canGrantInventoryAccess } = usePermissions()

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  role: 'staff' as 'manager' | 'staff' | 'intern',
  canManageInventory: false,
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

const storeStaffCount = computed(() => {
  const dept = departmentsStore.getDepartmentById(props.departmentId)
  const storeId = dept?.storeId
  if (!storeId) return 0
  return staffStore.staff.filter((member) => {
    const memberDept = departmentsStore.getDepartmentById(member.departmentId)
    return memberDept?.storeId === storeId && member.status !== 'inactive'
  }).length
})

const staffLimitReached = computed(
  () => !isEdit.value && !canAddStaff(storeStaffCount.value)
)

const staffLimitMessage = computed(() => {
  const max = limits.value.maxStaffPerStore
  if (max < 0) return ''
  const upgradePlan = getMinimumPlanForFeature('analytics')
  const planHint = upgradePlan ? ` Upgrade to ${getPlanDisplayName(upgradePlan)} for more.` : ''
  return `Your plan includes up to ${max} staff per store.${planHint}`
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
    role: 'staff',
    canManageInventory: false,
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
    mode: 'reset_link',
  })
  const { trackEvent } = useProductAnalytics()
  trackEvent('staff_invite_sent', { mode: 'reset_link' })
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
    const message = getApiErrorMessage(error, 'Could not send invite email')
    toast.error(message)
  } finally {
    isSendingInviteEmail.value = false
  }
}

watch(
  () => formData.value.role,
  (role) => {
    if (role !== 'manager') {
      formData.value.canManageInventory = false
    }
  }
)

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
          role: (props.staff.role as 'manager' | 'staff' | 'intern') || 'staff',
          canManageInventory: props.staff.canManageInventory === true,
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
        role: formData.value.role,
        canManageInventory:
          formData.value.role === 'manager' ? formData.value.canManageInventory : false,
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
        role: formData.value.role,
        canManageInventory:
          formData.value.role === 'manager' ? formData.value.canManageInventory : false,
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
            const message = getApiErrorMessage(error, 'Could not send invite email')
            toast.error(`${message}. You can copy the password below instead.`)
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

<style scoped>
.staff-invite-secret {
  display: flex;
  width: 100%;
  max-width: 22rem;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding: 0.75rem 0.875rem;
  border-radius: 1rem;
  background: rgb(244 244 245);
  text-align: left;
}

.staff-invite-secret code {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
}

.staff-invite-secret__copy,
.staff-invite-regen {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: inherit;
}

.staff-invite-secret__copy {
  flex-shrink: 0;
  border-radius: 9999px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.staff-invite-regen {
  margin-top: 0.25rem;
  padding: 0.125rem 0;
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.7;
}

.staff-invite-regen:hover,
.staff-invite-secret__copy:hover {
  opacity: 1;
}
</style>
