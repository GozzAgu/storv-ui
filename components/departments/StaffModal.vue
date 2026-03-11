<template>
  <Modal
    :modelValue="props.modelValue"
    @update:modelValue="(value: boolean) => emit('update:modelValue', value)"
    :title="isEdit ? 'Edit Staff Member' : 'Add Staff Member'"
    :subtitle="isEdit ? 'Update staff details.' : 'Add a new staff member with login and role.'"
    size="lg"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            First Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.firstName"
            type="text"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="First name"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Last Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.lastName"
            type="text"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Last name"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.email"
            type="email"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="email@example.com"
          />
        </div>

        <div v-if="!isEdit">
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Password <span class="text-red-500">*</span>
            <span class="text-[10px] text-gray-500 dark:text-gray-400 ml-1">(For staff login)</span>
          </label>
          <input
            v-model="formData.password"
            type="password"
            required
            minlength="6"
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Minimum 6 characters"
          />
          <p class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
            Staff will use this email and password to log in
          </p>
        </div>

        <div v-if="!isEdit && needsSuperAdminPassword" class="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-3 mt-1.5">
          <div class="bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/50 dark:ring-amber-800/40 rounded-xl p-2.5 mb-2.5">
            <p class="text-xs text-amber-800 dark:text-amber-200">
              <strong>Security verification required.</strong> Enter your super admin password to create staff accounts. Credentials are not stored.
            </p>
          </div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Your Super Admin Password <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.superAdminPassword"
            type="password"
            :required="needsSuperAdminPassword"
            minlength="6"
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Enter your password"
          />
          <p class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
            This is required to temporarily sign you out while creating the staff account
          </p>
        </div>
        
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Phone Number
          </label>
          <input
            v-model="formData.phone"
            type="tel"
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="+1234567890"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Position <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.position"
            type="text"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="e.g., Sales Associate, Manager"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Role <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.role"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="intern">Intern</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Hire Date <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.hireDate"
            type="date"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Salary (Optional)
          </label>
          <input
            v-model.number="formData.salary"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Status <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.status"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      <div v-if="errorMessage" class="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <p class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>
    </div>

    <template #footer>
      <Button variant="outline" size="sm" @click="handleClose" class="w-full sm:w-auto !rounded-lg">Cancel</Button>
      <Button size="sm" @click="handleSubmit" :disabled="isSubmitting || !isFormValid" class="w-full sm:w-auto !rounded-lg">
        <span v-if="isSubmitting" class="flex items-center gap-1.5">
          <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    if (!formData.value.password || formData.value.password.length < 6) {
      return false
    }

    if (needsSuperAdminPassword.value && (!formData.value.superAdminPassword || formData.value.superAdminPassword.length < 6)) {
      return false
    }
  }

  return baseValid
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
          password: '',
          superAdminPassword: '',
          phone: props.staff.phone || '',
          position: props.staff.position || '',
          role: (props.staff.role as 'manager' | 'staff' | 'intern') || 'staff',
          hireDate: props.staff.hireDate || new Date().toISOString().split('T')[0]!,
          salary: props.staff.salary,
          status: (props.staff.status as 'active' | 'inactive' | 'on_leave') || 'active',
        }
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
        hireDate: formData.value.hireDate,
        salary: formData.value.salary,
        status: formData.value.status,
      })
    } else {
      await staffStore.createStaff({
        departmentId: props.departmentId,
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        email: formData.value.email,
        password: formData.value.password,
        superAdminPassword: needsSuperAdminPassword.value ? formData.value.superAdminPassword : undefined,
        phone: formData.value.phone || undefined,
        position: formData.value.position,
        role: formData.value.role,
        hireDate: formData.value.hireDate,
        salary: formData.value.salary,
        status: formData.value.status,
      })
    }

    emit('success')
    emit('update:modelValue', false)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save staff member. Please try again.'
    emit('error', errorMessage.value)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // Any initialization logic can go here
})
</script>
