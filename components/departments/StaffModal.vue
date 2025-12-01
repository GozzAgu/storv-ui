<template>
  <Modal
    :modelValue="props.modelValue"
    @update:modelValue="(value: boolean) => emit('update:modelValue', value)"
    :title="isEdit ? 'Edit Staff Member' : 'Add Staff Member'"
    size="lg"
  >
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.firstName"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="First name"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.lastName"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Last name"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.email"
            type="email"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="email@example.com"
          />
        </div>

        <div v-if="!isEdit">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password <span class="text-red-500">*</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">(For staff login)</span>
          </label>
          <input
            v-model="formData.password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Minimum 6 characters"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Staff will use this email and password to log in
          </p>
        </div>

        <div v-if="!isEdit && needsSuperAdminPassword" class="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Security Verification Required</strong><br>
              Please enter your super admin password to create staff accounts. This is required because your credentials are not stored.
            </p>
          </div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Super Admin Password <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.superAdminPassword"
            type="password"
            :required="needsSuperAdminPassword"
            minlength="6"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Enter your password"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This is required to temporarily sign you out while creating the staff account
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            v-model="formData.phone"
            type="tel"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="+1234567890"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.position"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="e.g., Sales Associate, Manager"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.role"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="intern">Intern</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hire Date <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.hireDate"
            type="date"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Salary (Optional)
          </label>
          <input
            v-model.number="formData.salary"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.status"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>
    </div>

    <template #footer>
      <Button variant="secondary" @click="handleClose" class="w-full sm:w-auto">Cancel</Button>
      <Button @click="handleSubmit" :disabled="isSubmitting || !isFormValid" class="w-full sm:w-auto">
        <span v-if="isSubmitting" class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isEdit ? 'Updating...' : 'Adding...' }}
        </span>
        <span v-else>{{ isEdit ? 'Update Staff' : 'Add Staff' }}</span>
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import type { Staff } from '~/composables/useStaff'
import { useStaffStore } from '~/stores/staff'
import { useAdminCredentials } from '~/composables/useAdminCredentials'

interface Props {
  modelValue: boolean
  departmentId: string
  staff?: Staff | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
  'error': [error: string]
}>()

const staffStore = useStaffStore()
const { hasCredentials } = useAdminCredentials()

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  superAdminPassword: '',
  phone: '',
  position: '',
  role: 'staff' as 'manager' | 'staff' | 'intern',
  hireDate: new Date().toISOString().split('T')[0]!,
  salary: undefined as number | undefined,
  status: 'active' as 'active' | 'inactive' | 'on_leave',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

// Computed to check if super admin password is needed
const needsSuperAdminPassword = computed(() => {
  if (isEdit.value) return false
  // Always check if credentials are available
  try {
    return !hasCredentials()
  } catch (e) {
    // If check fails, assume credentials are not available
    return true
  }
})

const isEdit = computed(() => !!props.staff)

const isFormValid = computed(() => {
  const baseValid = !!(
    formData.value.firstName &&
    formData.value.lastName &&
    formData.value.email &&
    formData.value.position &&
    formData.value.hireDate
  )
  
  // For new staff, password is required
  if (!isEdit.value) {
    const staffPasswordValid = !!formData.value.password && formData.value.password.length >= 6
    // Super admin password is required if credentials aren't stored
    const superAdminPasswordValid = !needsSuperAdminPassword.value || (!!formData.value.superAdminPassword && formData.value.superAdminPassword.length >= 6)
    return baseValid && staffPasswordValid && superAdminPasswordValid
  }
  
  return baseValid
})

// Reset form when modal opens/closes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
    if (props.staff) {
      formData.value = {
        firstName: props.staff.firstName || '',
        lastName: props.staff.lastName || '',
        email: props.staff.email || '',
        password: '', // Don't show password when editing
        superAdminPassword: '',
        phone: props.staff.phone || '',
        position: props.staff.position || '',
        role: props.staff.role || 'staff',
        hireDate: props.staff.hireDate || new Date().toISOString().split('T')[0]!,
        salary: props.staff.salary,
        status: props.staff.status || 'active',
      }
    }
  } else {
    resetForm()
  }
})

const resetForm = () => {
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    superAdminPassword: '',
    phone: '',
    position: '',
    role: 'staff',
    hireDate: new Date().toISOString().split('T')[0]!,
    salary: undefined,
    status: 'active',
  }
  errorMessage.value = ''
  isSubmitting.value = false
  // Don't reset needsSuperAdminPassword here - it will be set by the watch
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields'
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
        hireDate: formData.value.hireDate || new Date().toISOString().split('T')[0]!,
        salary: formData.value.salary,
        status: formData.value.status,
      })
      emit('success')
      emit('update:modelValue', false)
    } else {
      const deptId = props.departmentId
      if (!deptId) {
        errorMessage.value = 'Department ID is required'
        return
      }

      await staffStore.createStaff({
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        email: formData.value.email,
        password: formData.value.password,
        superAdminPassword: needsSuperAdminPassword.value ? formData.value.superAdminPassword : undefined,
        phone: formData.value.phone || undefined,
        departmentId: deptId,
        position: formData.value.position,
        role: formData.value.role,
        hireDate: formData.value.hireDate || new Date().toISOString().split('T')[0]!,
        salary: formData.value.salary,
        status: formData.value.status,
      })
      emit('success')
      emit('update:modelValue', false)
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save staff member. Please try again.'
    emit('error', errorMessage.value)
  } finally {
    isSubmitting.value = false
  }
}
</script>

