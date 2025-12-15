<template>
  <Modal
    :modelValue="props.modelValue"
    @update:modelValue="(value: boolean) => emit('update:modelValue', value)"
    :title="isEdit ? 'Edit Department' : 'Create New Department'"
    size="lg"
  >
    <div class="space-y-4">
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Department Type <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.departmentType"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">Select department type</option>
            <option v-for="deptType in coreDepartments" :key="deptType" :value="deptType">
              {{ deptType }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Department Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Enter department name"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            placeholder="Brief description of the department..."
          ></textarea>
        </div>
      </div>

      <div v-if="errorMessage" class="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <p class="text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>
    </div>

    <template #footer>
      <Button variant="secondary" @click="handleClose" class="w-full sm:w-auto text-xs px-3 py-1.5">Cancel</Button>
      <Button @click="handleSubmit" :disabled="isSubmitting || !formData.name || !formData.departmentType" class="w-full sm:w-auto text-xs px-3 py-1.5">
        <span v-if="isSubmitting" class="flex items-center gap-1.5">
          <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isEdit ? 'Updating...' : 'Creating...' }}
        </span>
        <span v-else>{{ isEdit ? 'Update Department' : 'Create Department' }}</span>
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { CORE_DEPARTMENTS } from '~/composables/useDepartments'
import type { Department } from '~/composables/useDepartments'

interface Props {
  modelValue: boolean
  department?: Department | null
  storeId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  department: null,
  storeId: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [action?: 'create' | 'update']
  'error': [error: string]
}>()

const departmentsStore = useDepartmentsStore()
const storesStore = useStoresStore()

const coreDepartments = CORE_DEPARTMENTS

const formData = ref({
  name: '',
  description: '',
  departmentType: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

const isEdit = computed(() => !!props.department)

// Reset form when modal opens/closes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
    if (props.department) {
      formData.value = {
        name: props.department.name || '',
        description: props.department.description || '',
        departmentType: props.department.departmentType || '',
      }
    }
  } else {
    resetForm()
  }
})

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    departmentType: '',
  }
  errorMessage.value = ''
  isSubmitting.value = false
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!formData.value.name || !formData.value.departmentType) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    if (isEdit.value && props.department) {
      await departmentsStore.updateDepartment(props.department.id, {
        name: formData.value.name,
        description: formData.value.description || undefined,
        departmentType: formData.value.departmentType,
      })
      emit('success', 'update')
      emit('update:modelValue', false)
    } else {
      // If storeId prop is provided, temporarily switch store context for creation
      const originalStoreId = storesStore.currentStoreId
      let shouldRestoreStore = false
      
      if (props.storeId && props.storeId !== storesStore.currentStoreId) {
        try {
          await storesStore.setCurrentStore(props.storeId)
          shouldRestoreStore = true
        } catch (error) {
          console.warn('Could not switch store context, using current store:', error)
        }
      }

      try {
        await departmentsStore.createDepartment({
          name: formData.value.name,
          description: formData.value.description || undefined,
          departmentType: formData.value.departmentType,
        })
        // Department is automatically added to the store's local state
        // No need to refetch since it's already in local state
        emit('success', 'create')
        emit('update:modelValue', false)
      } finally {
        // Restore original store context if we switched it
        if (shouldRestoreStore && originalStoreId) {
          try {
            await storesStore.setCurrentStore(originalStoreId)
          } catch (error) {
            console.warn('Could not restore store context:', error)
          }
        }
      }
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save department. Please try again.'
    emit('error', errorMessage.value)
  } finally {
    isSubmitting.value = false
  }
}
</script>
