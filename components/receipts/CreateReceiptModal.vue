<template>
  <Modal
    :model-value="props.modelValue"
    title="Create New Receipt"
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <template #default>
      <div class="space-y-4">
        <!-- Step Indicator -->
        <div class="flex items-center justify-between mb-4">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="flex items-center flex-1"
          >
            <div class="flex items-center flex-1">
              <div
                :class="[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  'aspect-square',
                  currentStep >= index
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                ]"
              >
                {{ index + 1 }}
              </div>
              <div class="ml-2 hidden sm:block">
                <p
                  :class="[
                    'text-xs font-medium',
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
                'hidden sm:block h-0.5 flex-1 mx-3 transition-all',
                currentStep > index ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              ]"
            ></div>
          </div>
        </div>

        <!-- Step 1: Select Folder -->
        <div v-if="currentStep === 0" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Select Inventory Folder
            </label>
            
            <!-- Search Bar for Folders -->
            <div class="mb-3">
              <div class="relative">
                <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  v-model="folderSearchQuery"
                  type="text"
                  placeholder="Search folders..."
                  class="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                />
              </div>
            </div>
            
            <div v-if="loadingFolders" class="text-center py-6">
              <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading folders...</p>
            </div>
            <div
              v-else-if="filteredFolders.length === 0"
              class="text-center py-5 border border-gray-200 dark:border-gray-700 rounded-md"
            >
              <FolderIcon class="w-9 h-9 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ folderSearchQuery ? 'No folders found matching your search' : 'No inventory folders found' }}
              </p>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto">
              <button
                v-for="folder in filteredFolders"
                :key="folder.id"
                @click="selectFolder(folder)"
                :class="[
                  'p-3 border-2 rounded-md transition-all text-left',
                  selectedFolder?.id === folder.id
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                ]"
              >
                <div class="flex items-center gap-2.5">
                  <div
                    :class="[
                      'w-8 h-8 rounded-md flex items-center justify-center',
                      getFolderColorClass(folder.color)
                    ]"
                  >
                    <FolderIcon class="w-4 h-4 text-white" />
                  </div>
                  <div class="flex-1">
                    <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ folder.name }}</h3>
                    <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {{ folder.itemCount }} items
                    </p>
                  </div>
                  <CheckCircleIcon
                    v-if="selectedFolder?.id === folder.id"
                    class="w-4 h-4 text-primary-600"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Select Items -->
        <div v-if="currentStep === 1" class="space-y-3">
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Select Items from {{ selectedFolder?.name }}
              </label>
              <button
                @click="loadItems"
                class="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Refresh
              </button>
            </div>
            
            <!-- Search Bar for Items -->
            <div class="mb-3">
              <div class="relative">
                <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  v-model="itemSearchQuery"
                  type="text"
                  :placeholder="selectedFolder?.hasSerialNumbers ? 'Search by item name or serial number...' : 'Search by item name...'"
                  class="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                />
              </div>
            </div>
            <div v-if="loadingItems" class="text-center py-6">
              <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading items...</p>
            </div>
            <div
              v-else-if="availableItems.length === 0"
              class="text-center py-5 border border-gray-200 dark:border-gray-700 rounded-md"
            >
              <CubeIcon class="w-9 h-9 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p class="text-xs text-gray-500 dark:text-gray-400">No items available in this folder</p>
            </div>
            <div v-else class="max-h-[360px] overflow-y-auto space-y-2">
              <div
                v-for="item in filteredAvailableItems"
                :key="item.id"
                :class="[
                  'p-3 border rounded-md transition-all cursor-pointer',
                  selectedItems.find(si => si.id === item.id)
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                ]"
                @click="toggleItemSelection(item)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2.5">
                      <Checkbox
                        :model-value="selectedItems.find(si => si.id === item.id) !== undefined"
                        @update:model-value="(checked) => toggleItemSelection(item, checked)"
                        @click.stop
                        size="sm"
                      />
                      <div class="flex-1">
                        <h4 class="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {{ getItemDisplayName(item) }}
                        </h4>
                        <div class="flex items-center gap-3 mt-0.5 text-[10px] sm:text-xs flex-wrap">
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
                    <div v-if="selectedItems.find(si => si.id === item.id) && !selectedFolder?.hasSerialNumbers && !hasSerialNumberInTemplate" class="mt-2.5 pt-2.5 border-t border-gray-200 dark:border-gray-700">
                      <label class="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        :value="getSelectedItemQuantity(item.id)"
                        @input="updateItemQuantity(item.id, parseInt(($event.target as HTMLInputElement).value) || 1)"
                        @click.stop
                        min="1"
                        :max="getItemField(item, 'stock') || 1"
                        class="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="selectedItems.length > 0" class="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Selected Items ({{ totalSelectedQuantity }})
            </p>
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Total: {{ formatCurrency(receiptTotal) }}
            </p>
          </div>
        </div>

        <!-- Step 3: Receipt Details -->
        <div v-if="currentStep === 2" class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="relative">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Name *
              </label>
              <div class="relative">
              <input
                v-model="receiptForm.customerName"
                type="text"
                required
                  @input="handleCustomerNameInput"
                  @focus="showCustomerSuggestions = true"
                  @blur="handleCustomerNameBlur"
                class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                placeholder="John Doe"
              />
                <MagnifyingGlassIcon 
                  v-if="receiptForm.customerName && matchingCustomers.length > 0"
                  class="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
                />
                <!-- Customer Suggestions Dropdown -->
                <div
                  v-if="showCustomerSuggestions && receiptForm.customerName && matchingCustomers.length > 0"
                  class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  <div
                    v-for="customer in matchingCustomers"
                    :key="customer.id"
                    @mousedown.prevent="selectCustomer(customer)"
                    class="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {{ customer.name }}
                        </p>
                        <div class="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                          <span v-if="customer.email">{{ customer.email }}</span>
                          <span v-if="customer.phone">{{ customer.phone }}</span>
                        </div>
                      </div>
                      <div class="text-[10px] text-gray-400 dark:text-gray-500 ml-3">
                        {{ customer.totalOrders }} order{{ customer.totalOrders !== 1 ? 's' : '' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Email
              </label>
              <input
                v-model="receiptForm.customerEmail"
                type="email"
                class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Phone
              </label>
              <input
                v-model="receiptForm.customerPhone"
                type="tel"
                class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Customer Address
              </label>
              <input
                v-model="receiptForm.customerAddress"
                type="text"
                class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                placeholder="123 Main St, City, State"
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
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
                class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
              >
                <option value="">Select payment method</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
              </div>

              <!-- Split Payment Methods -->
              <div v-else class="space-y-2">
                <div
                  v-for="(payment, index) in splitPayments"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <select
                    v-model="payment.method"
                    required
                    class="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                  >
                    <option value="">Select method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                  <div class="relative w-28">
                    <span class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">$</span>
                    <input
                      v-model.number="payment.amount"
                      type="number"
                      step="0.01"
                      min="0"
                      :max="receiptTotal - splitPaymentsTotal + payment.amount"
                      required
                      class="w-full pl-6 pr-2.5 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    v-if="splitPayments.length > 1"
                    @click="removeSplitPayment(index)"
                    type="button"
                    class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </button>
                </div>
                <button
                  @click="addSplitPayment"
                  type="button"
                  class="w-full px-3 py-1.5 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md border border-primary-300 dark:border-primary-700 transition-colors"
                >
                  + Add Payment Method
                </button>
                <div class="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Total:</span>
                  <div class="text-right">
                    <span class="text-xs font-semibold" :class="splitPaymentsTotal === receiptTotal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      ${{ formatCurrency(splitPaymentsTotal) }} / ${{ formatCurrency(receiptTotal) }}
                    </span>
                    <p v-if="splitPaymentsTotal !== receiptTotal" class="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
                      Amount must equal total
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Status *
              </label>
              <select
                v-model="receiptForm.status"
                required
                class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              v-model="receiptForm.notes"
              rows="2"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60 resize-none"
              placeholder="Additional notes..."
            ></textarea>
          </div>

          <!-- Swap-In Section -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <Checkbox
              v-model="isSwapIn"
              label="This is a swap-in transaction"
              size="sm"
            />

            <div v-if="isSwapIn" class="space-y-3 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Folder for Swapped-In Device *
                </label>
                <div v-if="loadingFolders" class="text-center py-3">
                  <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                </div>
                <div
                  v-else-if="folders.length === 0"
                  class="text-center py-3 border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <p class="text-xs text-gray-500 dark:text-gray-400">No inventory folders found</p>
                </div>
                <select
                  v-else
                  v-model="swapInFolderId"
                  required
                  class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
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
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Swapped-In Device Details
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    v-for="field in swapInFolder.template?.fields || []"
                    :key="field.id || field.name"
                    :class="field.type === 'boolean' ? 'md:col-span-2' : ''"
                  >
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                      class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                    />
                    <!-- Number/Currency Input -->
                    <input
                      v-else-if="field.type === 'number' || field.type === 'currency'"
                      v-model.number="swapInItemForm[field.name]"
                      :required="field.required"
                      type="number"
                      step="any"
                      :placeholder="field.placeholder || `Enter ${field.label || field.name}`"
                      class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                    />
                    <!-- Date Input -->
                    <input
                      v-else-if="field.type === 'date'"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      type="date"
                      class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
                    />
                    <!-- Select Input -->
                    <select
                      v-else-if="field.type === 'select' && field.options"
                      v-model="swapInItemForm[field.name]"
                      :required="field.required"
                      class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500/60"
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
                <p v-if="!swapInFolder.template?.fields || swapInFolder.template.fields.length === 0" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  No template fields defined for this folder.
                </p>
              </div>
            </div>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-xs text-gray-600 dark:text-gray-400">Items</span>
              <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ totalSelectedQuantity }}</span>
            </div>
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-xs text-gray-600 dark:text-gray-400">Subtotal</span>
              <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(receiptTotal) }}</span>
            </div>
            <div class="flex justify-between items-center pt-1.5 border-t border-gray-200 dark:border-gray-700">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Total</span>
              <span class="text-base font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(receiptTotal) }}</span>
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

  <!-- Email Input Modal -->
  <Modal
    :model-value="showEmailModal"
    @update:model-value="showEmailModal = $event"
    size="sm"
    title="Send Receipt via Email"
  >
    <template #default>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            v-model="emailToSend"
            type="email"
            placeholder="Enter email address"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
            @keyup.enter="sendReceiptEmail(lastCreatedReceiptId, lastCreatedReceiptData)"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="showEmailModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            @click="sendReceiptEmail(lastCreatedReceiptId, lastCreatedReceiptData)"
            :disabled="!emailToSend || !isValidEmail(emailToSend) || isSendingEmail"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors"
          >
            {{ isSendingEmail ? 'Sending...' : 'Send' }}
          </button>
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
  EnvelopeIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useInventoryStore, type InventoryFolder, type InventoryItem } from '~/stores/inventory'
import { useReceiptsStore, type ReceiptItem } from '~/stores/receipts'
import { useCustomersStore } from '~/stores/customers'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
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
const storesStore = useStoresStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const { formatCurrency } = usePreferences()

const isSendingEmail = ref(false)
const showEmailModal = ref(false)
const emailToSend = ref('')
const lastCreatedReceiptId = ref('')
const lastCreatedReceiptData = ref<any>(null)

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
const showCustomerSuggestions = ref(false)
const allCustomers = ref<Array<{ id: string; name: string; email?: string; phone?: string; address?: string; totalOrders: number }>>([])

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

const matchingCustomers = computed(() => {
  if (!receiptForm.value.customerName || receiptForm.value.customerName.trim().length < 2) {
    return []
  }
  const query = receiptForm.value.customerName.toLowerCase().trim()
  return allCustomers.value
    .filter(customer => 
      customer.name.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.includes(query)
    )
    .slice(0, 5) // Limit to 5 suggestions
})

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
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    resetForm()
    loadFolders()
    await loadCustomers()
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

const loadCustomers = async () => {
  try {
    await customersStore.fetchCustomers()
    
    // Staff can search for all customers in their store (no filtering needed)
    allCustomers.value = customersStore.customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      totalOrders: customer.totalOrders,
    }))
  } catch (error) {
    console.error('Error loading customers:', error)
  }
}

const handleCustomerNameInput = () => {
  showCustomerSuggestions.value = true
}

const handleCustomerNameBlur = () => {
  // Delay hiding suggestions to allow click events to fire
  setTimeout(() => {
    showCustomerSuggestions.value = false
  }, 200)
}

const selectCustomer = (customer: { id: string; name: string; email?: string; phone?: string; address?: string }) => {
  receiptForm.value.customerName = customer.name
  if (customer.email) {
    receiptForm.value.customerEmail = customer.email
  }
  if (customer.phone) {
    receiptForm.value.customerPhone = customer.phone
  }
  if (customer.address) {
    receiptForm.value.customerAddress = customer.address
  }
  showCustomerSuggestions.value = false
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
    purple: 'bg-primary-500',
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
  // Reset customer suggestions
  showCustomerSuggestions.value = false
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
    
    // Get current store and user information
    const currentStore = storesStore.currentStore
    const currentStoreId = storesStore.currentStoreId
    if (!currentStoreId) {
      alert('No store selected. Please select a store first.')
      isCreating.value = false
      return
    }
    
    const storeBranchName = currentStore?.name || 'Unknown Store'
    
    // Get user name (staff member or super admin)
    let createdByUserName = 'Unknown User'
    if (userStore.userData?.role === 'staff') {
      // For staff, get their name from staff document
      const staffMember = await staffStore.fetchCurrentStaffMember()
      if (staffMember) {
        createdByUserName = `${staffMember.firstName} ${staffMember.lastName}`.trim() || staffMember.email || 'Staff Member'
      }
    } else if (userStore.userData) {
      // For super admin, use their name or email
      createdByUserName = userStore.userData.name || userStore.userData.email || 'Super Admin'
    }
    
    // Create receipt in Firestore
    const receiptData: any = {
      receiptNumber,
      customerName: receiptForm.value.customerName,
      customerEmail: receiptForm.value.customerEmail || '',
      customerPhone: receiptForm.value.customerPhone || undefined,
      customerAddress: receiptForm.value.customerAddress || undefined,
      date: new Date(),
      items: receiptItems,
      itemsCount: totalSelectedQuantity.value,
      total: calculateTotal(),
      paymentMethod: useSplitPayment.value ? 'Split Payment' : receiptForm.value.paymentMethod,
      status: receiptForm.value.status as 'completed' | 'pending',
      notes: receiptForm.value.notes || '',
      folderId: selectedFolder.value.id,
      itemIds,
      storeId: currentStoreId, // Store ID where receipt was created
      storeBranchName, // Store branch name
      createdByUserName, // User who created the receipt
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
    
    // Store receipt data for email sending
    lastCreatedReceiptId.value = receiptId
    lastCreatedReceiptData.value = receiptData
    
    // Show email prompt after receipt creation
    const emailAddress = receiptForm.value.customerEmail || ''
    emailToSend.value = emailAddress // Pre-fill if available
    showEmailModal.value = true
    
    resetForm()
    emit('update:modelValue', false)
  } catch (error: any) {
    console.error('Error creating receipt:', error)
    alert(`Error creating receipt: ${error.message || 'Unknown error'}`)
  } finally {
    isCreating.value = false
  }
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const sendReceiptEmail = async (receiptId: string, receiptData: any) => {
  if (!emailToSend.value || !isValidEmail(emailToSend.value)) {
    alert('Please enter a valid email address')
    return
  }

  isSendingEmail.value = true
  try {
    // Note: For CreateReceiptModal, we send receiptData only
    // The server can generate PDF from receipt data if needed
    // For now, we'll rely on the HTML email body
    // To attach PDF, you would need to either:
    // 1. Open ViewReceiptModal to generate PDF from DOM
    // 2. Generate PDF on server side from receipt data
    const response = await $fetch('/api/receipts/send-email', {
      method: 'POST',
      body: {
        receiptId,
        receiptNumber: receiptData.receiptNumber,
        customerEmail: emailToSend.value,
        receiptData,
        // pdfBase64 is optional - only sent if available
      },
    })

    if (!response.success) {
      const errorMessage = ('error' in response && response.error) ? String(response.error) : 'Failed to send email'
      throw new Error(errorMessage)
    }

    alert('Receipt sent to email successfully!')
    showEmailModal.value = false
    emailToSend.value = ''
  } catch (error: any) {
    console.error('Error sending receipt email:', error)
    throw error
  } finally {
    isSendingEmail.value = false
  }
}
</script>

