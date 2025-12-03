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
            
            <!-- Search Bar for Folders -->
            <div class="mb-4">
              <div class="relative">
                <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  v-model="folderSearchQuery"
                  type="text"
                  placeholder="Search folders..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div v-if="loadingFolders" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading folders...</p>
            </div>
            <div
              v-else-if="filteredFolders.length === 0"
              class="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <FolderIcon class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ folderSearchQuery ? 'No folders found matching your search' : 'No inventory folders found' }}
              </p>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              <button
                v-for="folder in filteredFolders"
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
            
            <!-- Search Bar for Items -->
            <div class="mb-4">
              <div class="relative">
                <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  v-model="itemSearchQuery"
                  type="text"
                  :placeholder="selectedFolder?.hasSerialNumbers ? 'Search by item name or serial number...' : 'Search by item name...'"
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
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
                v-for="item in filteredAvailableItems"
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
                      <Checkbox
                        :model-value="selectedItems.find(si => si.id === item.id) !== undefined"
                        @update:model-value="(checked) => toggleItemSelection(item, checked)"
                        @click.stop
                        size="sm"
                      />
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900 dark:text-gray-100">
                          {{ getItemDisplayName(item) }}
                        </h4>
                        <div class="flex items-center gap-4 mt-1 text-xs flex-wrap">
                          <span v-if="(selectedFolder?.hasSerialNumbers || hasSerialNumberInTemplate) && (getItemField(item, 'serialNo') || getItemField(item, 'serialNumber'))" class="text-gray-500 dark:text-gray-400">
                            Serial: {{ getItemField(item, 'serialNo') || getItemField(item, 'serialNumber') }}
                          </span>
                          <span v-if="getItemField(item, 'sku')" class="text-gray-500 dark:text-gray-400">SKU: {{ getItemField(item, 'sku') }}</span>
                          <span v-if="getItemField(item, 'price')">
                            <span v-if="item.discountedPrice !== undefined && item.discountedPrice !== null" class="flex items-center gap-1">
                              <span class="text-gray-400 dark:text-gray-500 line-through">
                                {{ formatCurrency(parseFloat(getItemField(item, 'price') || '0')) }}
                              </span>
                              <span class="text-green-600 dark:text-green-400 font-semibold">
                                {{ formatCurrency(item.discountedPrice) }}
                              </span>
                              <span class="text-red-600 dark:text-red-400">
                                ({{ item.discountPercentage ? `-${item.discountPercentage}%` : `-${formatCurrency(item.discountAmount || 0)}` }})
                              </span>
                            </span>
                            <span v-else class="text-gray-500 dark:text-gray-400">
                              Price: {{ formatCurrency(parseFloat(getItemField(item, 'price') || '0')) }}
                            </span>
                          </span>
                          <span v-if="!selectedFolder?.hasSerialNumbers && !hasSerialNumberInTemplate && getItemField(item, 'stock')" class="text-gray-500 dark:text-gray-400">
                            Stock: {{ getItemField(item, 'stock') }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div v-if="selectedItems.find(si => si.id === item.id) && !selectedFolder?.hasSerialNumbers && !hasSerialNumberInTemplate" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
              Total: {{ formatCurrency(receiptTotal) }}
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
                Customer Phone
              </label>
              <input
                v-model="receiptForm.customerPhone"
                type="tel"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Address
              </label>
              <input
                v-model="receiptForm.customerAddress"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="123 Main St, City, State"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Method *
              </label>
                <Checkbox
                  v-model="useSplitPayment"
                  label="Split Payment"
                  size="sm"
                />
              </div>
              
              <!-- Single Payment Method -->
              <div v-if="!useSplitPayment">
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

              <!-- Split Payment Methods -->
              <div v-else class="space-y-3">
                <div
                  v-for="(payment, index) in splitPayments"
                  :key="index"
                  class="flex items-center gap-3"
                >
                  <select
                    v-model="payment.method"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                  <div class="relative w-32">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      v-model.number="payment.amount"
                      type="number"
                      step="0.01"
                      min="0"
                      :max="receiptTotal - splitPaymentsTotal + payment.amount"
                      required
                      class="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    v-if="splitPayments.length > 1"
                    @click="removeSplitPayment(index)"
                    type="button"
                    class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                </div>
                <button
                  @click="addSplitPayment"
                  type="button"
                  class="w-full px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg border border-primary-300 dark:border-primary-700 transition-colors"
                >
                  + Add Payment Method
                </button>
                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
                  <div class="text-right">
                    <span class="text-sm font-semibold" :class="splitPaymentsTotal === receiptTotal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      ${{ formatCurrency(splitPaymentsTotal) }} / ${{ formatCurrency(receiptTotal) }}
                    </span>
                    <p v-if="splitPaymentsTotal !== receiptTotal" class="text-xs text-red-600 dark:text-red-400 mt-1">
                      Amount must equal total
                    </p>
                  </div>
                </div>
              </div>
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

          <!-- Swap-In Section -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <Checkbox
              v-model="isSwapIn"
              label="This is a swap-in transaction"
              size="sm"
            />

            <div v-if="isSwapIn" class="space-y-4 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Folder for Swapped-In Device *
                </label>
                <div v-if="loadingFolders" class="text-center py-4">
                  <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
                <div
                  v-else-if="folders.length === 0"
                  class="text-center py-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">No inventory folders found</p>
                </div>
                <select
                  v-else
                  v-model="swapInFolderId"
                  required
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select folder for swapped-in device</option>
                  <option
                    v-for="folder in folders"
                    :key="folder.id"
                    :value="folder.id"
                  >
                    {{ folder.name }}
                  </option>
                </select>
              </div>

              <!-- Swap-In Device Form Fields -->
              <div v-if="swapInFolderId && swapInFolder">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Swapped-In Device Details
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="field in swapInFolder.template?.fields || []"
                    :key="field.id || field.name"
                    :class="field.type === 'boolean' ? 'md:col-span-2' : ''"
                  >
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ field.label || field.name }}
                      <span v-if="field.required" class="text-red-500">*</span>
                    </label>
                    <!-- Text Input -->
                    <input
                      v-if="field.type === 'text'"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      type="text"
                      :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <!-- Number/Currency Input -->
                    <input
                      v-else-if="field.type === 'number' || field.type === 'currency'"
                      v-model.number="swapInItemForm[field.name]"
                      :required="field.required"
                      type="number"
                      step="any"
                      :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <!-- Date Input -->
                    <input
                      v-else-if="field.type === 'date'"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      type="date"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <!-- Select Input -->
                    <select
                      v-else-if="field.type === 'select' && field.options"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select {{ field.label || field.name }}</option>
                      <option v-for="option in field.options" :key="option" :value="option">
                        {{ option }}
                      </option>
                    </select>
                    <!-- Boolean Input -->
                    <Checkbox
                      v-else-if="field.type === 'boolean'"
                      v-model="swapInItemForm[field.name]"
                      :label="field.label || field.name"
                      size="sm"
                    />
                  </div>
                </div>
                <p v-if="!swapInFolder.template?.fields || swapInFolder.template.fields.length === 0" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  No template fields defined for this folder.
                </p>
              </div>
            </div>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Items</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ totalSelectedQuantity }}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(receiptTotal) }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span class="text-base font-semibold text-gray-900 dark:text-gray-100">Total</span>
              <span class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(receiptTotal) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 w-full">
        <Button
          v-if="currentStep > 0"
          variant="outline"
          @click="previousStep"
          class="w-full sm:w-auto order-2 sm:order-1"
        >
          Previous
        </Button>
        <div v-else class="hidden sm:block"></div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            @click="handleCancel"
            class="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            v-if="currentStep < 2"
            variant="primary"
            class="w-full sm:w-auto"
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
            class="w-full sm:w-auto"
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
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useInventoryStore, type InventoryFolder, type InventoryItem } from '~/stores/inventory'
import { useReceiptsStore, type ReceiptItem } from '~/stores/receipts'
import { useCustomersStore } from '~/stores/customers'
import { usePreferences } from '~/composables/usePreferences'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'receipt-created': [receipt: any]
}>()

const inventoryStore = useInventoryStore()
const receiptsStore = useReceiptsStore()
const customersStore = useCustomersStore()
const { formatCurrency } = usePreferences()

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
const folderSearchQuery = ref('')
const itemSearchQuery = ref('')

const receiptForm = ref({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  paymentMethod: '',
  status: 'completed' as 'completed' | 'pending',
  notes: '',
})

// Swap-in state
const isSwapIn = ref(false)
const swapInFolderId = ref<string>('')
const swapInItemForm = ref<Record<string, any>>({})

// Split payment state
const useSplitPayment = ref(false)
const splitPayments = ref<Array<{ method: string; amount: number }>>([
  { method: '', amount: 0 }
])

const folders = computed(() => inventoryStore.folders)

const filteredFolders = computed(() => {
  if (!folderSearchQuery.value.trim()) {
    return folders.value
  }
  const query = folderSearchQuery.value.toLowerCase()
  return folders.value.filter(folder =>
    folder.name.toLowerCase().includes(query) ||
    folder.description.toLowerCase().includes(query)
  )
})

const hasSerialNumberInTemplate = computed(() => {
  if (!selectedFolder.value?.template?.fields) return false
  return selectedFolder.value.template.fields.some(
    field => field.name.toLowerCase() === 'serialno' || 
             field.name.toLowerCase() === 'serialnumber' ||
             field.name.toLowerCase().includes('serial')
  )
})

const filteredAvailableItems = computed(() => {
  if (!itemSearchQuery.value.trim()) {
    return availableItems.value
  }
  const query = itemSearchQuery.value.toLowerCase()
  return availableItems.value.filter(item => {
    // Search by item name
    const itemName = getItemDisplayName(item).toLowerCase()
    if (itemName.includes(query)) return true
    
    // Search by serial number if folder has serial numbers
    if (selectedFolder.value?.hasSerialNumbers || hasSerialNumberInTemplate.value) {
      const serialNo = getItemField(item, 'serialNo') || 
                       getItemField(item, 'serialNumber') ||
                       getItemField(item, 'serial')
      if (serialNo && serialNo.toLowerCase().includes(query)) return true
    }
    
    // Search by SKU
    const sku = getItemField(item, 'sku')
    if (sku && sku.toLowerCase().includes(query)) return true
    
    return false
  })
})

// Swap-in folder
const swapInFolder = computed(() => {
  if (!swapInFolderId.value) return null
  return inventoryStore.folders.find(f => f.id === swapInFolderId.value) || null
})

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
  const baseValid = receiptForm.value.customerName.trim() !== '' &&
    selectedItems.value.length > 0
  
  // Payment validation
  if (useSplitPayment.value) {
    if (splitPayments.value.length === 0) return false
    if (splitPayments.value.some(p => !p.method || p.amount <= 0)) return false
    if (Math.abs(splitPaymentsTotal.value - receiptTotal.value) > 0.01) return false
  } else {
    if (!receiptForm.value.paymentMethod) return false
  }
  
  // If swap-in is enabled, validate swap-in fields
  if (isSwapIn.value) {
    if (!swapInFolderId.value) return false
    if (!swapInFolder.value) return false
    
    // Check required fields
    const requiredFields = swapInFolder.value.template?.fields?.filter(f => f.required) || []
    for (const field of requiredFields) {
      const value = swapInItemForm.value[field.name]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return false
      }
    }
  }
  
  return baseValid
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

// Watch for swap-in folder selection to initialize form
watch(() => swapInFolderId.value, (folderId) => {
  if (folderId && swapInFolder.value?.template?.fields) {
    // Initialize form with empty values for all template fields
    swapInItemForm.value = {}
    swapInFolder.value.template.fields.forEach(field => {
      if (field.type === 'number' || field.type === 'currency') {
        swapInItemForm.value[field.name] = 0
      } else if (field.type === 'boolean') {
        swapInItemForm.value[field.name] = false
      } else if (field.type === 'date') {
        swapInItemForm.value[field.name] = new Date().toISOString().split('T')[0]
      } else {
        swapInItemForm.value[field.name] = ''
      }
    })
  } else {
    swapInItemForm.value = {}
  }
})

// Watch for swap-in toggle to reset form when disabled
watch(() => isSwapIn.value, (enabled) => {
  if (!enabled) {
    swapInFolderId.value = ''
    swapInItemForm.value = {}
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

const toggleItemSelection = (item: InventoryItem, checked?: boolean) => {
  // Determine if quantity should be available (not for serial number items)
  const hasSerialNumbers = selectedFolder.value?.hasSerialNumbers || hasSerialNumberInTemplate.value
  const defaultQuantity = hasSerialNumbers ? 1 : 1
  
  // If called from checkbox component, use the checked value; otherwise toggle
  if (checked !== undefined) {
    if (checked) {
      const index = selectedItems.value.findIndex(si => si.id === item.id)
      if (index === -1) {
        selectedItems.value.push({
          id: item.id,
          quantity: defaultQuantity,
          item,
        })
      }
    } else {
      const index = selectedItems.value.findIndex(si => si.id === item.id)
      if (index > -1) {
        selectedItems.value.splice(index, 1)
      }
    }
  } else {
    const index = selectedItems.value.findIndex(si => si.id === item.id)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      selectedItems.value.push({
        id: item.id,
        quantity: defaultQuantity,
        item,
      })
    }
  }
}

const getSelectedItemQuantity = (itemId: string) => {
  const selected = selectedItems.value.find(si => si.id === itemId)
  return selected?.quantity || 1
}

const updateItemQuantity = (itemId: string, quantity: number) => {
  const selected = selectedItems.value.find(si => si.id === itemId)
  if (selected) {
    // If folder has serial numbers, quantity should always be 1
    if (selectedFolder.value?.hasSerialNumbers || hasSerialNumberInTemplate.value) {
      selected.quantity = 1
      return
    }
    const maxStock = getItemField(selected.item, 'stock')
    selected.quantity = Math.max(1, Math.min(quantity, maxStock ? parseInt(maxStock) : quantity))
  }
}

const getEffectivePrice = (item: InventoryItem): number => {
  // If item has a discount, use discounted price; otherwise use regular price
  if (item.discountedPrice !== undefined && item.discountedPrice !== null) {
    return item.discountedPrice
  }
  // Try to get price from item
  const priceField = getItemField(item, 'price')
  return parseFloat(priceField || '0')
}

const getOriginalPrice = (item: InventoryItem): number => {
  // If item has originalPrice stored (from discount), use it
  if (item.originalPrice !== undefined && item.originalPrice !== null) {
    return item.originalPrice
  }
  // Otherwise get from price field
  const priceField = getItemField(item, 'price')
  return parseFloat(priceField || '0')
}

const calculateTotal = () => {
  return selectedItems.value.reduce((total, si) => {
    const price = getEffectivePrice(si.item)
    return total + (price * si.quantity)
  }, 0)
}

const receiptTotal = computed(() => calculateTotal())

const splitPaymentsTotal = computed(() => {
  return splitPayments.value.reduce((sum, payment) => sum + (payment.amount || 0), 0)
})

const addSplitPayment = () => {
  splitPayments.value.push({ method: '', amount: 0 })
}

const removeSplitPayment = (index: number) => {
  splitPayments.value.splice(index, 1)
  if (splitPayments.value.length === 0) {
    splitPayments.value.push({ method: '', amount: 0 })
  }
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

// formatCurrency is now imported from usePreferences for currency conversion

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
  folderSearchQuery.value = ''
  itemSearchQuery.value = ''
  receiptForm.value = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: '',
    status: 'completed',
    notes: '',
  }
  // Reset swap-in state
  isSwapIn.value = false
  swapInFolderId.value = ''
  swapInItemForm.value = {}
  // Reset split payment state
  useSplitPayment.value = false
  splitPayments.value = [{ method: '', amount: 0 }]
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
    
    // Create receipt items array
    const hasSerialNumbers = selectedFolder.value?.hasSerialNumbers || hasSerialNumberInTemplate.value
    const receiptItems: ReceiptItem[] = selectedItems.value.map(si => {
      const effectivePrice = getEffectivePrice(si.item)
      const originalPrice = getOriginalPrice(si.item)
      const hasDiscount = si.item.discountedPrice !== undefined && si.item.discountedPrice !== null
      
      // Force quantity to 1 for serial number items
      const itemQuantity = hasSerialNumbers ? 1 : si.quantity
      
      return {
        itemId: si.id,
        quantity: itemQuantity,
        price: effectivePrice, // Final price after discount
        itemName: getItemDisplayName(si.item),
        // Include discount information if applicable
        ...(hasDiscount && {
          originalPrice: originalPrice,
          discountPercentage: si.item.discountPercentage,
          discountAmount: si.item.discountAmount,
          hasDiscount: true,
        }),
      }
    })
    
    // Update dateOut for selected items
    const itemIds = selectedItems.value.map(si => si.id)
    if (itemIds.length > 0 && selectedFolder.value) {
      await inventoryStore.updateItemsDateOut(selectedFolder.value.id, itemIds)
    }
    
    // Handle swap-in: Create inventory item for swapped-in device
    let swapInItemId: string | undefined = undefined
    if (isSwapIn.value && swapInFolderId.value && swapInFolder.value) {
      try {
        // Prepare item data from form
        const swapInItemData: Record<string, any> = {
          ...swapInItemForm.value,
          swapIn: true, // Mark as swap-in item
        }
        
        // Create the swap-in inventory item
        swapInItemId = await inventoryStore.createItem(swapInFolderId.value, swapInItemData)
      } catch (error: any) {
        console.error('Error creating swap-in item:', error)
        throw new Error(`Failed to create swap-in item: ${error.message}`)
      }
    }
    
    // Create receipt in Firestore
    const receiptData: any = {
      receiptNumber,
      customerName: receiptForm.value.customerName,
      customerEmail: receiptForm.value.customerEmail || '',
      date: new Date(),
      items: receiptItems,
      itemsCount: totalSelectedQuantity.value,
      total: calculateTotal(),
      paymentMethod: useSplitPayment.value ? 'Split Payment' : receiptForm.value.paymentMethod,
      status: receiptForm.value.status as 'completed' | 'pending',
      notes: receiptForm.value.notes || '',
      folderId: selectedFolder.value.id,
      itemIds,
    }
    
    // Add split payments if enabled
    if (useSplitPayment.value && splitPayments.value.length > 0) {
      receiptData.splitPayments = splitPayments.value.map(p => ({
        method: p.method,
        amount: p.amount
      }))
    }
    
    // Add swap-in fields if enabled
    if (isSwapIn.value && swapInFolderId.value && swapInItemId) {
      receiptData.isSwapIn = true
      receiptData.swapInFolderId = swapInFolderId.value
      receiptData.swapInItemId = swapInItemId
    }
    
    // Create receipt first
    const receiptId = await receiptsStore.createReceipt(receiptData)
    
    // Update swap-in item to link it to the receipt (if created)
    if (swapInItemId && swapInFolderId.value) {
      try {
        // Update the item to link it to the receipt
        await inventoryStore.updateItem(swapInFolderId.value, swapInItemId, {
          swapInReceiptId: receiptId,
        })
      } catch (error: any) {
        console.error('Error updating swap-in item with receipt ID:', error)
        // Don't fail receipt creation if swap-in update fails
      }
    }

    // Create or update customer automatically
    try {
      await customersStore.createOrUpdateCustomerFromReceipt(receiptId, {
        customerName: receiptForm.value.customerName,
        customerEmail: receiptForm.value.customerEmail || undefined,
        customerPhone: receiptForm.value.customerPhone || undefined,
        customerAddress: receiptForm.value.customerAddress || undefined,
        total: calculateTotal(),
        date: new Date(),
      })
    } catch (error: any) {
      console.error('Error creating/updating customer:', error)
      // Don't fail the receipt creation if customer creation fails
    }

    emit('receipt-created', { ...receiptData, id: receiptId })
    resetForm()
    emit('update:modelValue', false)
  } catch (error: any) {
    console.error('Error creating receipt:', error)
    alert(`Error creating receipt: ${error.message || 'Unknown error'}`)
  } finally {
    isCreating.value = false
  }
}
</script>

