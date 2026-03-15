<template>
  <Modal
    :modelValue="props.modelValue"
    @update:modelValue="(value: boolean) => emit('update:modelValue', value)"
    :title="isEdit ? 'Edit Staff Member' : 'Add Staff Member'"
    :subtitle="isEdit ? 'Update staff details.' : 'Add a staff member with sign-in. You\u2019ll get a one-time password to share (no email invite).'"
    size="lg"
  >
    <div class="space-y-4">
      <!-- Success: show one-time password to copy and share (no email invite) -->
      <div
        v-if="showTemporaryPassword"
        class="flex flex-col items-center text-center py-2"
      >
        <div class="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center mb-4">
          <CheckCircleIcon class="w-6 h-6 text-emerald-600 dark:text-emerald-400" stroke-width="2" />
        </div>
        <h4 class="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-1">
          Account created
        </h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">
          Share this one-time password with <span class="font-medium text-gray-700 dark:text-gray-300">{{ formData.email }}</span>. They sign in with email + this password, then can change it in Profile.
        </p>
        <div class="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
          <div class="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-600/80">
            <code class="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 tracking-wide select-all truncate">{{ temporaryPasswordToShow }}</code>
            <button
              type="button"
              @click="copyTemporaryPassword"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors"
            >
              <ClipboardDocumentIcon v-if="!copiedPassword" class="w-4 h-4 shrink-0" stroke-width="1.75" />
              <CheckCircleIcon v-else class="w-4 h-4 shrink-0 text-emerald-500" stroke-width="2" />
              {{ copiedPassword ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">
          From the staff list, use the menu on their row to generate a new password if needed.
        </p>
        <Button size="sm" class="!rounded-xl w-full sm:w-auto min-w-[120px]" @click="closeAfterSuccess">
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
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
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
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
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
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Phone
          </label>
          <input
            v-model="formData.phone"
            type="tel"
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
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
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
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
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="intern">Intern</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Hire date <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.hireDate"
            type="date"
            required
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
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
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
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
            class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-colors"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      <div v-if="errorMessage" class="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40">
        <p class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>
    </div>

    <template #footer>
      <template v-if="!showTemporaryPassword">
        <Button variant="outline" size="sm" @click="handleClose" class="w-full sm:w-auto !rounded-xl">Cancel</Button>
        <Button size="sm" @click="handleSubmit" :disabled="isSubmitting || !isFormValid" class="w-full sm:w-auto !rounded-xl">
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
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import type { Staff } from '~/composables/useStaff'
import { useStaffStore } from '~/stores/staff'

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

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  role: 'staff' as 'manager' | 'staff' | 'intern',
  hireDate: new Date().toISOString().split('T')[0]!,
  salary: undefined as number | undefined,
  status: 'active' as 'active' | 'inactive' | 'on_leave',
})

const isSubmitting = ref(false)
const errorMessage = ref('')
const showTemporaryPassword = ref(false)
const temporaryPasswordToShow = ref('')
const copiedPassword = ref(false)

const isEdit = computed(() => !!props.staff)

const isFormValid = computed(() => !!(
  formData.value.firstName &&
  formData.value.lastName &&
  formData.value.email &&
  formData.value.position &&
  formData.value.hireDate
))

const resetForm = () => {
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    role: 'staff',
    hireDate: new Date().toISOString().split('T')[0]!,
    salary: undefined,
    status: 'active',
  }
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
    setTimeout(() => { copiedPassword.value = false }, 2000)
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
      const result = await staffStore.createStaff({
        departmentId: props.departmentId,
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
      const created = result as { staffId: string; temporaryPassword?: string }
      if (created?.temporaryPassword) {
        temporaryPasswordToShow.value = created.temporaryPassword
        showTemporaryPassword.value = true
        return
      }
    }

    emit('success')
    emit('update:modelValue', false)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Failed to save staff member. Please try again.'
    emit('error', errorMessage.value)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // Any initialization logic can go here
})
</script>

