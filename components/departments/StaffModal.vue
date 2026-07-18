<template>
  <SidePanel
    :modelValue="props.modelValue"
    @update:modelValue="(value: boolean) => emit('update:modelValue', value)"
    :title="isEdit ? 'Edit Staff Member' : 'Add Staff Member'"
    :subtitle="
      isEdit
        ? 'Update staff details.'
        : 'Add a staff member with sign-in. A random password is generated; copy it to share with them (no one else sees it).'
    "
    size="lg"
  >
    <div class="space-y-4">
      <!-- Success: show one-time password to copy and share (no email invite) -->
      <div v-if="showTemporaryPassword" class="flex flex-col items-center text-center py-2">
        <div
          class="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center mb-4"
        >
          <CheckCircleIcon
            class="w-6 h-6 text-emerald-600 dark:text-emerald-400"
            stroke-width="2"
          />
        </div>
        <h4 class="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-1">
          Account created
        </h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">
          Share this one-time password with
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ formData.email }}</span
          >. They sign in with email + this password, then can change it in Profile.
        </p>
        <div class="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
          <div
            class="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-sm bg-gray-50 dark:!bg-dashboard-card/90/80"
          >
            <code
              class="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 tracking-wide select-all truncate"
              >{{ temporaryPasswordToShow }}</code
            >
            <button
              type="button"
              @click="copyTemporaryPassword"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
            >
              <ClipboardDocumentIcon
                v-if="!copiedPassword"
                class="w-4 h-4 shrink-0"
                stroke-width="1.75"
              />
              <CheckCircleIcon v-else class="w-4 h-4 shrink-0 text-emerald-500" stroke-width="2" />
              {{ copiedPassword ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">
          Staff can change their password in Profile after signing in.
        </p>
        <Button
          size="sm"
          class="!rounded-2xl w-full sm:w-auto min-w-[120px]"
          @click="closeAfterSuccess"
        >
          Done
        </Button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            First name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.firstName"
            type="text"
            required
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
            placeholder="First name"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Last name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.lastName"
            type="text"
            required
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
            placeholder="Last name"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.email"
            type="email"
            required
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
            placeholder="email@example.com"
          />
        </div>

        <div v-if="!isEdit" class="md:col-span-2 flex items-center gap-3">
          <p class="text-xs text-gray-500 dark:text-gray-400 flex-1">
            A random password will be generated. You'll see it after the account is created so you
            can copy and share it.
          </p>
          <button
            type="button"
            @click="regeneratePassword"
            class="p-2 rounded-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors shrink-0"
          >
            <ArrowPathIcon class="w-4 h-4" stroke-width="1.75" />
          </button>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Phone
          </label>
          <input
            v-model="formData.phone"
            type="tel"
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
            placeholder="+1234567890"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Position <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.position"
            type="text"
            required
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
            placeholder="e.g. Sales Associate"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Role <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.role"
            required
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="intern">Intern</option>
          </select>
        </div>

        <div
          v-if="canGrantInventoryAccess && formData.role === 'manager'"
          class="rounded-lg border border-primary-200/60 bg-primary-50/40 px-3 py-2.5 dark:border-primary-500/20 dark:bg-primary-950/20"
        >
          <label class="flex cursor-pointer items-start gap-2.5">
            <input
              v-model="formData.canManageInventory"
              type="checkbox"
              class="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500/40"
            />
            <span class="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              <span class="font-medium text-gray-900 dark:text-gray-100">Inventory editor:</span>
              can add and edit categories, products, quantities, and prices (same as owner on the
              floor, not billing or staff admin).
            </span>
          </label>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Hire date <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.hireDate"
            type="date"
            required
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Salary (optional)
          </label>
          <input
            v-model.number="formData.salary"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
            placeholder="0.00"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Status <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.status"
            required
            class="w-full px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="p-3 rounded-sm bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40"
      >
        <p class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>
    </div>

    <template #footer>
      <template v-if="!showTemporaryPassword">
        <Button
          variant="outline"
          size="sm"
          @click="handleClose"
          class="w-full sm:w-auto !rounded-2xl"
          >Cancel</Button
        >
        <Button
          size="sm"
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
          class="w-full sm:w-auto !rounded-2xl"
        >
          <span v-if="isSubmitting" class="flex items-center gap-1.5">
            <svg
              class="animate-spin h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isEdit ? 'Updating...' : 'Adding...' }}
          </span>
          <span v-else>{{ isEdit ? 'Update Staff' : 'Add Staff' }}</span>
        </Button>
      </template>
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { CheckCircleIcon, ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import SidePanel from '~/components/ui/SidePanel.vue'
import Button from '~/components/ui/Button.vue'
import type { Staff } from '~/composables/useStaff'
import { useStaffStore } from '~/stores/staff'
import { useDepartmentsStore } from '~/stores/departments'
import { useStaffInvitePasswordsStore } from '~/stores/staffInvitePasswords'

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

const isEdit = computed(() => !!props.staff)

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
  emit('success')
  emit('update:modelValue', false)
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
        phone: formData.value.phone || undefined,
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
        phone: formData.value.phone || undefined,
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
        temporaryPasswordToShow.value = created.temporaryPassword
        showTemporaryPassword.value = true
        const dept =
          departmentsStore.getDepartmentById(props.departmentId) ||
          (await departmentsStore.fetchDepartment(props.departmentId).catch(() => null))
        staffInvitePasswordsStore.recordInvite({
          staffEmail: formData.value.email.trim().toLowerCase(),
          staffName: `${formData.value.firstName} ${formData.value.lastName}`.trim(),
          password: created.temporaryPassword,
          departmentId: props.departmentId,
          departmentName: dept?.name || 'Department',
        })
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
