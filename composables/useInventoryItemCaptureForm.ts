import { computed, ref, watch, type Ref } from 'vue'
import type { InventoryFolder } from '~/stores/inventory'
import { COST_PRICE_FIELD_NAME } from '~/utils/inventory-folder-profit'

const defaultTableColumnFields: Array<{
  id?: string
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
  placeholder?: string
}> = [
  { name: 'name', label: 'Product', type: 'text', required: true },
  { name: 'sku', label: 'SKU', type: 'text', required: false },
  { name: 'price', label: 'Price', type: 'currency', required: true },
]

export function useInventoryItemCaptureForm(folders: Ref<InventoryFolder[]>) {
  const folderId = ref('')
  const itemForm = ref<Record<string, unknown>>({})

  const folder = computed(() => folders.value.find((f) => f.id === folderId.value) ?? null)

  const displayFields = computed(() => {
    const templateFields = folder.value?.template?.fields
    if (templateFields && templateFields.length > 0) {
      return templateFields.filter((f: { name: string }) => f.name !== 'model')
    }
    return defaultTableColumnFields
  })

  function fieldLabel(field: { name: string; label?: string }) {
    if (field.name === 'brand') return 'Product model'
    if (field.name === 'name') return 'Product'
    return field.label || field.name
  }

  function fieldPlaceholder(field: {
    name: string
    label?: string
    placeholder?: string
    type?: string
  }) {
    if (field.name === 'brand') return 'Enter product model'
    if (field.name === 'name') return 'Enter product'
    if (field.type === 'currency') return '0.00'
    return field.placeholder || `Enter ${fieldLabel(field)}`
  }

  function resetItemFormForFolder() {
    const fields = displayFields.value
    const next: Record<string, unknown> = {}
    for (const field of fields) {
      if (field.type === 'number' || field.type === 'currency') {
        next[field.name] = 0
      } else if (field.type === 'boolean') {
        next[field.name] = false
      } else if (field.type === 'date') {
        next[field.name] = new Date().toISOString().split('T')[0]
      } else {
        next[field.name] = ''
      }
    }
    const folderTitle = folder.value?.name?.trim()
    if (folderTitle && 'name' in next) {
      next.name = folderTitle
    }
    itemForm.value = next
  }

  function isCostPriceField(field: { name: string; label?: string }): boolean {
    return (
      field.name === COST_PRICE_FIELD_NAME ||
      field.name.toLowerCase() === 'cost' ||
      (field.label || '').toLowerCase().includes('cost price')
    )
  }

  const buybackDisplayFields = computed(() =>
    displayFields.value.filter((field) => !isCostPriceField(field))
  )

  watch(folderId, (id) => {
    if (!id) {
      itemForm.value = {}
      return
    }
    resetItemFormForFolder()
  })

  function validateRequiredFields(options?: { excludeCostPrice?: boolean }): boolean {
    if (!folderId.value || !folder.value) return false
    let fields = displayFields.value
    if (options?.excludeCostPrice) {
      fields = fields.filter((field) => !isCostPriceField(field))
    }
    const requiredFields = fields.filter((f) => f.required)
    for (const field of requiredFields) {
      const value = itemForm.value[field.name]
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        return false
      }
    }
    return true
  }

  function buildItemPayload(): Record<string, unknown> {
    return { ...itemForm.value }
  }

  function reset() {
    folderId.value = ''
    itemForm.value = {}
  }

  return {
    folderId,
    itemForm,
    folder,
    displayFields,
    buybackDisplayFields,
    fieldLabel,
    fieldPlaceholder,
    validateRequiredFields,
    buildItemPayload,
    reset,
  }
}
