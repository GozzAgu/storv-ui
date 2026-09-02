<template>
  <SidePanel
    :modelValue="props.modelValue"
    @update:modelValue="(value: boolean) => emit('update:modelValue', value)"
    :title="isEdit ? 'Edit department' : 'Create department'"
    size="lg"
    dense
  >
    <IosForm layout="fill" @submit="handleSubmit">
      <IosFormSection fixed>
        <IosFormField label="Department type" required>
          <IosFormSelect v-model="formData.departmentType" required>
            <option value="">Select department type</option>
            <option v-for="deptType in coreDepartments" :key="deptType" :value="deptType">
              {{ deptType }}
            </option>
          </IosFormSelect>
        </IosFormField>

        <IosFormField label="Department name" required>
          <IosFormInput
            v-model="formData.name"
            required
            placeholder="Enter department name"
          />
        </IosFormField>

        <IosFormField label="Description" hint="Optional">
          <IosFormTextarea
            v-model="formData.description"
            :rows="3"
            extra-class="resize-none"
            placeholder="Brief description of the department"
          />
        </IosFormField>
      </IosFormSection>

      <p v-if="errorMessage" class="ios-form__error">{{ errorMessage }}</p>
    </IosForm>

    <template #footer>
      <IosDrawerActions
        :primary-label="isEdit ? 'Update department' : 'Create department'"
        :primary-loading="isSubmitting"
        :primary-disabled="isSubmitting || !formData.name || !formData.departmentType"
        @cancel="handleClose"
        @primary="handleSubmit"
      />
    </template>
  </SidePanel>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import {
  IosForm,
  IosFormSection,
  IosFormField,
  IosFormInput,
  IosFormTextarea,
  IosFormSelect,
} from '~/components/ios/forms'
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
  success: [action?: 'create' | 'update']
  error: [error: string]
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

watch(
  () => props.modelValue,
  (isOpen) => {
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
  }
)

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
        emit('success', 'create')
        emit('update:modelValue', false)
      } finally {
        if (shouldRestoreStore && originalStoreId) {
          try {
            await storesStore.setCurrentStore(originalStoreId)
          } catch (error) {
            console.warn('Could not restore store context:', error)
          }
        }
      }
    }
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to save department. Please try again.'
    emit('error', errorMessage.value)
  } finally {
    isSubmitting.value = false
  }
}
</script>
