<template>
  <Modal
    :model-value="props.modelValue"
    title="Create New Receipt"
    size="xl"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <div class="space-y-6">
        <!-- Step Indicator -->
        <div class="flex items-center justify-between mb-6">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="flex items-center flex-1"
          >
            <div class="flex items-center flex-1">
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                  currentStep >= index
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                ]"
              >
                {{ index + 1 }}
              </div>
              <div class="ml-3 hidden sm:block">
                <p
                  :class="[
                    'text-sm font-medium',
                    currentStep >= index
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                  ]"
                >
                  {{ step.label }}
                </p>
              </div>
            </div>
            <div
              v-if="index < steps.length - 1"
              :class="[
                'hidden sm:block h-0.5 flex-1 mx-4 transition-all',
                currentStep > index ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              ]"
            ></div>
          </div>
        </div>

        <!-- Step 1: Select Folder -->
        <div v-if="currentStep === 0" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Inventory Folder
            </label>
            <div v-if="loadingFolders" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading folders...</p>
            </div>
            <div
              v-else-if="folders.length === 0"
              class="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <FolderIcon class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p class="text-sm text-gray-500 dark:text-gray-400">No inventory folders found</p>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              <button
                v-for="folder in folders"
                :key="folder.id"
                @click="selectFolder(folder)"
                :class="[
                  'p-4 border-2 rounded-xl transition-all text-left',
                  selectedFolder?.id === folder.id
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      getFolderColorClass(folder.color)
                    ]"
                  >
                    <FolderIcon class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ folder.name }}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ folder.itemCount }} items
                    </p>
                  </div>
                  <CheckCircleIcon
                    v-if="selectedFolder?.id === folder.id"
                    class="w-5 h-5 text-primary-600"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Select Items -->
        <div v-if="currentStep === 1" class="space-y-4">
          <div>
            <div class="flex items-center justify-between mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Items from {{ selectedFolder?.name }}
              </label>
              <button
                @click="loadItems"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Refresh
              </button>
            </div>
            <div v-if="loadingItems" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading items...</p>
            </div>
            <div
              v-else-if="availableItems.length === 0"
              class="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <CubeIcon class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p class="text-sm text-gray-500 dark:text-gray-400">No items available in this folder</p>
            </div>
            <div v-else class="max-h-[400px] overflow-y-auto space-y-2">
              <div
                v-for="item in availableItems"
                :key="item.id"
                :class="[
                  'p-4 border rounded-lg transition-all cursor-pointer',
                  selectedItems.find(si => si.id === item.id)
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                ]"
                @click="toggleItemSelection(item)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <input
                        type="checkbox"
                        :checked="selectedItems.find(si => si.id === item.id) !== undefined"
                        @change="toggleItemSelection(item)"
                        @click.stop
                        class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900 dark:text-gray-100">
                          {{ getItemDisplayName(item) }}
                        </h4>
                        <div class="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span v-if="getItemField(item, 'sku')">SKU: {{ getItemField(item, 'sku') }}</span>
                          <span v-if="getItemField(item, 'price')">
                            Price: ${{ formatCurrency(parseFloat(getItemField(item, 'price') || '0')) }}
                          </span>
                          <span v-if="getItemField(item, 'stock')">
                            Stock: {{ getItemField(item, 'stock') }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div v-if="selectedItems.find(si => si.id === item.id)" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        :value="getSelectedItemQuantity(item.id)"
                        @input="updateItemQuantity(item.id, parseInt(($event.target as HTMLInputElement).value) || 1)"
                        @click.stop
                        min="1"
                        :max="getItemField(item, 'stock') || 1"
                        class="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="selectedItems.length > 0" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Items ({{ totalSelectedQuantity }})
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Total: ${{ formatCurrency(calculateTotal()) }}
            </p>
          </div>
        </div>

        <!-- Step 3: Receipt Details -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Name *
              </label>
              <input
                v-model="receiptForm.customerName"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Email
              </label>
              <input
                v-model="receiptForm.customerEmail"
                type="email"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method *
              </label>
              <select
                v-model="receiptForm.paymentMethod"
                required
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select payment method</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                v-model="receiptForm.status"
                required
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              v-model="receiptForm.notes"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Additional notes..."
            ></textarea>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Items</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ totalSelectedQuantity }}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">${{ formatCurrency(calculateTotal()) }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span class="text-base font-semibold text-gray-900 dark:text-gray-100">Total</span>
              <span class="text-lg font-bold text-gray-900 dark:text-gray-100">${{ formatCurrency(calculateTotal()) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between">
        <Button
          v-if="currentStep > 0"
          variant="outline"
          @click="previousStep"
        >
          Previous
        </Button>
        <div v-else></div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            @click="handleCancel"
          >
            Cancel
          </Button>
          <Button
            v-if="currentStep < 2"
            variant="primary"
            @click="nextStep"
            :disabled="!canProceed"
          >
            Next
          </Button>
          <Button
            v-else
            variant="primary"
            @click="handleCreateReceipt"
            :disabled="!isFormValid || isCreating"
          >
            <span v-if="isCreating">Creating...</span>
            <span v-else>Create Receipt</span>
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  FolderIcon,
  CubeIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { useInventoryStore, type InventoryFolder, type InventoryItem } from '~/stores/inventory'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'receipt-created': [receipt: any]
}>()

const inventoryStore = useInventoryStore()

const steps = [
  { id: 'folder', label: 'Select Folder' },
  { id: 'items', label: 'Select Items' },
  { id: 'details', label: 'Receipt Details' },
]

const currentStep = ref(0)
const loadingFolders = ref(false)
const loadingItems = ref(false)
const isCreating = ref(false)
const selectedFolder = ref<InventoryFolder | null>(null)
const selectedItems = ref<Array<{ id: string; quantity: number; item: InventoryItem }>>([])
const availableItems = ref<InventoryItem[]>([])

const receiptForm = ref({
  customerName: '',
  customerEmail: '',
  paymentMethod: '',
  status: 'completed' as 'completed' | 'pending',
  notes: '',
})

const folders = computed(() => inventoryStore.folders)

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return selectedFolder.value !== null
  }
  if (currentStep.value === 1) {
    return selectedItems.value.length > 0
  }
  return false
})

const isFormValid = computed(() => {
  return receiptForm.value.customerName.trim() !== '' &&
    receiptForm.value.paymentMethod !== '' &&
    selectedItems.value.length > 0
})

const totalSelectedQuantity = computed(() => {
  return selectedItems.value.reduce((sum, si) => sum + si.quantity, 0)
})

// Watch for modal opening to reset state
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
    loadFolders()
  }
})

// Load folders when component mounts or modal opens
onMounted(() => {
  if (props.modelValue) {
    loadFolders()
  }
})

const loadFolders = async () => {
  if (inventoryStore.folders.length === 0) {
    loadingFolders.value = true
    try {
      await inventoryStore.fetchFolders()
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      loadingFolders.value = false
    }
  }
}

const selectFolder = async (folder: InventoryFolder) => {
  selectedFolder.value = folder
  await loadItems()
}

const loadItems = async () => {
  if (!selectedFolder.value) return

  loadingItems.value = true
  try {
    await inventoryStore.fetchItems(selectedFolder.value.id)
    const items = inventoryStore.items[selectedFolder.value.id] || []
    // Only show items that haven't been sold yet (no dateOut)
    availableItems.value = items.filter(item => !item.dateOut)
  } catch (error) {
    console.error('Error loading items:', error)
  } finally {
    loadingItems.value = false
  }
}

const toggleItemSelection = (item: InventoryItem) => {
  const index = selectedItems.value.findIndex(si => si.id === item.id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push({
      id: item.id,
      quantity: 1,
      item,
    })
  }
}

const getSelectedItemQuantity = (itemId: string) => {
  const selected = selectedItems.value.find(si => si.id === itemId)
  return selected?.quantity || 1
}

const updateItemQuantity = (itemId: string, quantity: number) => {
  const selected = selectedItems.value.find(si => si.id === itemId)
  if (selected) {
    const maxStock = getItemField(selected.item, 'stock')
    selected.quantity = Math.max(1, Math.min(quantity, maxStock ? parseInt(maxStock) : quantity))
  }
}

const calculateTotal = () => {
  return selectedItems.value.reduce((total, si) => {
    const price = parseFloat(getItemField(si.item, 'price') || '0')
    return total + (price * si.quantity)
  }, 0)
}

const getItemDisplayName = (item: InventoryItem) => {
  // Try to find a name field in the item
  const nameField = Object.keys(item).find(key => 
    key.toLowerCase().includes('name') || 
    key.toLowerCase().includes('item') ||
    key === 'title'
  )
  return nameField ? item[nameField] : `Item ${item.id.slice(0, 8)}`
}

const getItemField = (item: InventoryItem, fieldName: string): string => {
  // Try exact match first
  if (item[fieldName]) return String(item[fieldName])
  
  // Try case-insensitive match
  const key = Object.keys(item).find(k => k.toLowerCase() === fieldName.toLowerCase())
  return key ? String(item[key]) : ''
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const getFolderColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    yellow: 'bg-yellow-500',
  }
  return colorMap[color] || 'bg-gray-500'
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const resetForm = () => {
  currentStep.value = 0
  selectedFolder.value = null
  selectedItems.value = []
  availableItems.value = []
  receiptForm.value = {
    customerName: '',
    customerEmail: '',
    paymentMethod: '',
    status: 'completed',
    notes: '',
  }
}

const handleCancel = () => {
  resetForm()
  emit('update:modelValue', false)
}

const handleCreateReceipt = async () => {
  if (!isFormValid.value || !selectedFolder.value) return

  isCreating.value = true
  try {
    // Generate receipt number
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`
    
    // Create receipt object
    const receipt = {
      id: Date.now().toString(),
      receiptNumber,
      customerName: receiptForm.value.customerName,
      customerEmail: receiptForm.value.customerEmail || '',
      date: new Date().toISOString(),
      itemsCount: totalSelectedQuantity.value,
      total: calculateTotal(),
      paymentMethod: receiptForm.value.paymentMethod,
      status: receiptForm.value.status,
      notes: receiptForm.value.notes || '',
    }

    // Update dateOut for selected items
    const itemIds = selectedItems.value.map(si => si.id)
    if (itemIds.length > 0 && selectedFolder.value) {
      await inventoryStore.updateItemsDateOut(selectedFolder.value.id, itemIds)
    }

    emit('receipt-created', receipt)
    resetForm()
  } catch (error: any) {
    console.error('Error creating receipt:', error)
    alert(`Error creating receipt: ${error.message || 'Unknown error'}`)
  } finally {
    isCreating.value = false
  }
}
</script>

