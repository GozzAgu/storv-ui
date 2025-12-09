<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- Page Header -->
    <div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p class="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your store and application preferences</p>
        </div>
        <div v-if="!canEditSettings" class="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">View Only Mode</p>
          <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Only super admins can edit settings</p>
        </div>
      </div>
    </div>

    <div class="space-y-4 sm:space-y-5">
      <!-- Stores Management (for super admins) -->
      <Card v-if="userStore.isSuperAdmin">
        <div class="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Stores Management</h2>
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Create, edit, and delete your stores</p>
          </div>
          <Button @click="showCreateModal = true" v-if="!isStaff">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Store
          </Button>
        </div>

        <div v-if="storesLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <p class="text-gray-600 dark:text-gray-400 mt-3 text-sm">Loading stores...</p>
        </div>

        <div v-else-if="storesError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-200 text-sm">{{ storesError }}</p>
        </div>

        <div v-else-if="stores.length === 0" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 class="mt-4 text-sm font-medium text-gray-900 dark:text-gray-50">No stores yet</h3>
          <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">Get started by creating your first store.</p>
          <div class="mt-4">
            <Button size="sm" @click="showCreateModal = true">Create Store</Button>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          <Card
            v-for="store in stores"
            :key="store.id"
            padding="sm"
            class="hover:shadow-md transition-shadow overflow-hidden"
            :class="{ 'ring-1 ring-primary-500': currentStore?.id === store.id }"
          >
            <div class="flex flex-col h-full">
              <div class="flex-1 mb-2">
                <div class="flex items-start justify-between mb-1">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1 mb-0.5 flex-wrap">
                      <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-50 truncate">{{ store.name }}</h3>
                      <span
                        v-if="currentStore?.id === store.id"
                        class="px-1 py-0.5 text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded whitespace-nowrap"
                      >
                        Current
                      </span>
                      <span
                        v-else-if="!store.isActive"
                        class="px-1 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded whitespace-nowrap"
                      >
                        Inactive
                      </span>
                    </div>
                    <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 break-words line-clamp-1" v-if="store.description">
                      {{ store.description }}
                    </p>
                    <div class="mt-1 space-y-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <p v-if="store.address" class="break-words line-clamp-1">
                        <svg class="inline w-2.5 h-2.5 mr-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {{ store.address }}
                      </p>
                      <p v-if="store.phone" class="break-words line-clamp-1">
                        <svg class="inline w-2.5 h-2.5 mr-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {{ store.phone }}
                      </p>
                      <p v-if="store.email" class="break-words line-clamp-1">
                        <svg class="inline w-2.5 h-2.5 mr-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {{ store.email }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <button
                  @click="editStore(store)"
                  class="flex-1 px-1.5 py-1 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(store)"
                  :disabled="currentStore?.id === store.id"
                  class="flex-1 px-1.5 py-1 text-[10px] font-medium bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <!-- Store Information -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Store Information</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your business details</p>
          </div>
          <button 
            v-if="canEditSettings && !isEditingStore"
            @click="enableEditing('store')"
            class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Edit
          </button>
          <div v-else-if="canEditSettings && isEditingStore" class="flex gap-2">
            <button 
              @click="cancelEditing('store')"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveStoreInfo"
              class="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white dark:text-white rounded-lg transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
          <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Only
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Store Name
            </label>
            <input
              v-model="storeInfo.name"
              type="text"
              :disabled="!canEditSettings || !isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter store name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business Type
            </label>
            <input
              v-model="storeInfo.businessType"
              type="text"
              :disabled="!canEditSettings || !isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter business type"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              v-model="storeInfo.email"
              type="email"
              :disabled="!canEditSettings || !isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter store email"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              v-model="storeInfo.phone"
              type="tel"
              :disabled="!canEditSettings || !isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter phone number"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              v-model="storeInfo.address"
              rows="2"
              :disabled="!canEditSettings || !isEditingStore"
              :class="[
                'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none',
                isEditingStore
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="Enter store address"
            ></textarea>
          </div>
        </div>
      </Card>

      <!-- Inventory Settings -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory Settings</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure inventory management preferences</p>
          </div>
          <Button 
            v-if="canEditSettings"
            @click="saveInventorySettings" 
            variant="primary"
          >
            Save Changes
          </Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Only
          </div>
        </div>

        <div class="space-y-4 sm:space-y-5">
          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Low Stock Alert Threshold</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive alerts when stock falls below this quantity</p>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model.number="inventorySettings.lowStockThreshold"
                type="number"
                min="1"
                :disabled="!canEditSettings"
                :class="[
                  'w-20 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  canEditSettings
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                ]"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">units</span>
            </div>
          </div>

          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-reorder Enabled</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically create purchase orders when stock is low</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="inventorySettings.autoReorder"
                type="checkbox"
                :disabled="!canEditSettings"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between py-4">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Default Category</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Default category for new products</p>
            </div>
            <select
              v-model="inventorySettings.defaultCategory"
              :disabled="!canEditSettings"
              :class="[
                'px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                canEditSettings
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
            >
              <option value="general">General</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food & Beverages</option>
              <option value="office">Office Supplies</option>
            </select>
          </div>
        </div>
      </Card>

      <!-- Receipt & Invoice Settings -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Receipt & Invoice Settings</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize receipt and invoice preferences</p>
          </div>
          <Button 
            v-if="canEditSettings"
            @click="saveReceiptSettings" 
            variant="primary"
          >
            Save Changes
          </Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Only
          </div>
        </div>

        <div class="space-y-4 sm:space-y-5">
          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Receipt Prefix</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Prefix for receipt numbers (e.g., REC-)</p>
            </div>
            <input
              v-model="receiptSettings.prefix"
              type="text"
              :disabled="!canEditSettings"
              :class="[
                'w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                canEditSettings
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
              placeholder="REC-"
            />
          </div>

          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Next Receipt Number</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Starting number for next receipt</p>
            </div>
            <input
              v-model.number="receiptSettings.nextNumber"
              type="number"
              min="1"
              :disabled="!canEditSettings"
              :class="[
                'w-32 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                canEditSettings
                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              ]"
            />
          </div>

          <div class="flex items-center justify-between py-4">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Print Receipt Automatically</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically print receipt after sale</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="receiptSettings.autoPrint"
                type="checkbox"
                :disabled="!canEditSettings"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </Card>

      <!-- Payment Settings -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Settings</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure available payment methods</p>
          </div>
          <Button 
            v-if="canEditSettings"
            @click="savePaymentSettings" 
            variant="primary"
          >
            Save Changes
          </Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
            View Only
          </div>
      </div>

            <div class="space-y-4 sm:space-y-5">
          <div class="py-4">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Available Payment Methods</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Select the payment methods you accept for sales transactions</p>
            <div class="space-y-3">
              <label :class="['flex items-center gap-3', canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                <input
                  v-model="paymentSettings.paymentMethods"
                  type="checkbox"
                  value="cash"
                  :disabled="!canEditSettings"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Cash</span>
              </label>
              <label :class="['flex items-center gap-3', canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                <input
                  v-model="paymentSettings.paymentMethods"
                  type="checkbox"
                  value="card"
                  :disabled="!canEditSettings"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Card Payment</span>
              </label>
              <label :class="['flex items-center gap-3', canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                <input
                  v-model="paymentSettings.paymentMethods"
                  type="checkbox"
                  value="mobile"
                  :disabled="!canEditSettings"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Mobile Money</span>
              </label>
              <label :class="['flex items-center gap-3', canEditSettings ? 'cursor-pointer' : 'cursor-not-allowed opacity-60']">
                <input
                  v-model="paymentSettings.paymentMethods"
                  type="checkbox"
                  value="bank"
                  :disabled="!canEditSettings"
                  class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Bank Transfer</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <!-- Data Management -->
      <Card>
        <div class="flex items-center justify-between mb-6">
              <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Management</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Backup, export, and manage your data</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Export Section -->
          <div class="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ArrowDownTrayIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Export Data</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Download your data as CSV or JSON</p>
              </div>
            </div>
            <div class="ml-13 space-y-2">
              <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Available exports:</p>
              <div class="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Products/Inventory
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Customers
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Sales/Receipts
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Returns
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  Suppliers
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  All Data (Backup)
                </div>
              </div>
            </div>
            <div class="ml-13 mt-4">
              <button 
                @click="handleExport"
                :disabled="!canEditSettings"
                :class="[
                  'px-4 py-2 text-sm font-medium border rounded-lg transition-colors',
                  canEditSettings
                    ? 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-60'
                ]"
              >
                Export All Data
              </button>
            </div>
          </div>

          <!-- Import Section -->
          <div class="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowUpTrayIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Import Data</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Import data from CSV or JSON file</p>
              </div>
            </div>
            <div class="ml-13 space-y-2">
              <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Supported imports:</p>
              <div class="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Products/Inventory (CSV)
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Customers (CSV)
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Full Backup (JSON)
                </div>
              </div>
            </div>
            <div class="ml-13 mt-4">
              <input
                ref="importFileInput"
                type="file"
                accept=".csv,.json"
                @change="handleImport"
                class="hidden"
              />
              <button 
                @click="triggerImport"
                :disabled="!canEditSettings"
                :class="[
                  'px-4 py-2 text-sm font-medium border rounded-lg transition-colors',
                  canEditSettings
                    ? 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-60'
                ]"
              >
                Choose File to Import
              </button>
            </div>
          </div>

          <!-- Delete Section -->
          <div class="flex items-center justify-between py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrashIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Delete All Data</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Permanently delete all store data (cannot be undone)</p>
              </div>
            </div>
            <button 
              v-if="canEditSettings"
              @click="handleDeleteAll"
              class="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete All
            </button>
            <div v-else class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
              View Only
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Create/Edit Store Modal -->
    <Modal
      v-model="showCreateModal"
      :title="editingStore ? 'Edit Store' : 'Create Store'"
      size="lg"
    >
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Store Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="storeForm.name"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="My Store"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            v-model="storeForm.description"
            rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Store description..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address
          </label>
          <input
            v-model="storeForm.address"
            type="text"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="123 Main St, City, State ZIP"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              v-model="storeForm.phone"
              type="tel"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              v-model="storeForm.email"
              type="email"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="store@example.com"
            />
          </div>
        </div>

        <div v-if="editingStore">
          <label class="flex items-center gap-2">
            <input
              v-model="storeForm.isActive"
              type="checkbox"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </div>

      <template #footer>
        <Button variant="secondary" @click="closeStoreModal">Cancel</Button>
        <Button @click="handleStoreSubmit" :disabled="!storeForm.name || isSubmittingStore">
          {{ isSubmittingStore ? 'Saving...' : editingStore ? 'Update' : 'Create' }}
        </Button>
      </template>
    </Modal>

    <!-- Delete Store Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      title="Delete Store"
      size="md"
    >
      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <strong>{{ storeToDelete?.name }}</strong>? This action cannot be undone.
        </p>
        <p class="text-sm text-red-600 dark:text-red-400">
          Warning: All data associated with this store (departments, staff, inventory, receipts) will need to be handled separately.
        </p>
      </div>

      <template #footer>
        <Button variant="secondary" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="danger" @click="handleStoreDelete" :disabled="isDeletingStore">
          {{ isDeletingStore ? 'Deleting...' : 'Delete' }}
        </Button>
      </template>
    </Modal>

    <!-- Store Selection Modal (shown after first store creation) -->
    <Modal
      v-model="showStoreSelectionModal"
      title="Select Your Store"
      size="md"
      :close-on-backdrop="false"
    >
      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          Your store has been created successfully! Please select this store to continue.
        </p>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <button
            v-for="store in stores"
            :key="store.id"
            @click="handleStoreSelection(store.id)"
            class="w-full text-left p-4 border-2 rounded-xl transition-all"
            :class="
              newlyCreatedStoreId === store.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            "
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ store.name }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1" v-if="store.description">
                  {{ store.description }}
                </p>
                <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="store.address">{{ store.address }}</span>
                  <span v-if="store.phone">{{ store.phone }}</span>
                </div>
              </div>
              <svg
                v-if="newlyCreatedStoreId === store.id"
                class="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useToast } from '~/composables/useToast'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import Modal from '~/components/ui/Modal.vue'
import type { Store } from '~/composables/useStores'
import { collection, query, where, getDocs } from 'firebase/firestore'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Settings - Storv',
})

// Store information
const storeInfo = reactive({
  name: '',
  businessType: '',
  email: '',
  phone: '',
  address: '',
})

const backupStoreInfo = reactive({ ...storeInfo })
const isEditingStore = ref(false)
const importFileInput = ref<HTMLInputElement | null>(null)
const isLoadingStoreInfo = ref(true)

// Get user data and load store info
const { currentUser } = useFirebaseAuth()
const { getUserDocument, updateStoreDetails } = useUser()
const { getFirestoreInstance } = useFirestore()
const userStore = useUserStore()
const storesStore = useStoresStore()
const toast = useToast()

// Check if user is super admin (only super admins can edit settings)
const canEditSettings = computed(() => {
  return userStore.isSuperAdmin
})

// Stores management
const storesLoading = computed(() => storesStore.loading)
const storesError = computed(() => storesStore.error)
const stores = computed(() => storesStore.stores)
const currentStore = computed(() => storesStore.currentStore)
const isStaff = computed(() => userStore.userData?.role === 'staff')
const otherStores = computed(() => {
  const allStores = stores.value
  const current = currentStore.value
  return current ? allStores.filter(s => s.id !== current.id) : allStores
})

// Store management state
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const showStoreSelectionModal = ref(false)
const editingStore = ref<Store | null>(null)
const storeToDelete = ref<Store | null>(null)
const isSubmittingStore = ref(false)
const isDeletingStore = ref(false)
const newlyCreatedStoreId = ref<string | null>(null)

const storeForm = ref({
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  isActive: true,
})

// Inventory settings
const inventorySettings = reactive({
  lowStockThreshold: 10,
  autoReorder: false,
  defaultCategory: 'general',
})

// Receipt settings
const receiptSettings = reactive({
  prefix: 'REC-',
  nextNumber: 1001,
  autoPrint: false,
})

// Payment settings
const paymentSettings = reactive({
  paymentMethods: ['cash', 'card'],
})

const switchStore = async (storeId: string) => {
  try {
    toast.info('Switching store...')
    await storesStore.setCurrentStore(storeId)
    toast.success('Store switched successfully')
  } catch (err: any) {
    toast.error(err.message || 'Failed to switch store')
  }
}

// Store management functions
const closeStoreModal = () => {
  showCreateModal.value = false
  editingStore.value = null
  storeForm.value = {
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    isActive: true,
  }
}

const editStore = (store: Store) => {
  editingStore.value = store
  storeForm.value = {
    name: store.name,
    description: store.description || '',
    address: store.address || '',
    phone: store.phone || '',
    email: store.email || '',
    isActive: store.isActive,
  }
  showCreateModal.value = true
}

const handleStoreSubmit = async () => {
  if (!storeForm.value.name) return

  isSubmittingStore.value = true
  try {
    if (editingStore.value) {
      await storesStore.updateStore(editingStore.value.id, storeForm.value)
      toast.success('Store updated successfully')
      closeStoreModal()
    } else {
      const wasFirstStore = stores.value.length === 0
      const newStoreId = await storesStore.createStore(storeForm.value)
      toast.success('Store created successfully')
      closeStoreModal()
      await storesStore.fetchStores()
      
      // If this was the first store, show store selection modal
      if (wasFirstStore) {
        newlyCreatedStoreId.value = newStoreId
        showStoreSelectionModal.value = true
      }
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to save store')
  } finally {
    isSubmittingStore.value = false
  }
}

const handleStoreSelection = async (storeId: string) => {
  try {
    await storesStore.setCurrentStore(storeId)
    toast.success('Store selected successfully')
    showStoreSelectionModal.value = false
    newlyCreatedStoreId.value = null
  } catch (err: any) {
    toast.error(err.message || 'Failed to select store')
  }
}

const confirmDelete = (store: Store) => {
  storeToDelete.value = store
  showDeleteModal.value = true
}

const handleStoreDelete = async () => {
  if (!storeToDelete.value) return

  isDeletingStore.value = true
  try {
    await storesStore.deleteStore(storeToDelete.value.id)
    toast.success('Store deleted successfully')
    showDeleteModal.value = false
    storeToDelete.value = null
    await storesStore.fetchStores()
  } catch (err: any) {
    toast.error(err.message || 'Failed to delete store')
  } finally {
    isDeletingStore.value = false
  }
}

// Helper function to get the correct user ID (super admin UID if staff)
const getTargetUserId = async (): Promise<string | null> => {
  if (!currentUser.value) return null
  
  // Fetch user data if not loaded
  if (!userStore.userData) {
    await userStore.fetchUserData(currentUser.value.uid)
  }
  
  let userId = currentUser.value.uid
  
  // If the current user is staff, get the super admin UID from the staff document
  if (userStore.userData?.role === 'staff') {
    try {
      const db = getFirestoreInstance()
      if (!db) {
        console.warn('[Settings] Firestore not initialized')
        return userId
      }
      
      // Find the staff document for this user
      const staffRef = collection(db, 'staff')
      const staffQuery = query(staffRef, where('authUid', '==', userId))
      const staffSnapshot = await getDocs(staffQuery)
      
      if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
        const staffDoc = staffSnapshot.docs[0]
        if (staffDoc) {
          const staffData = staffDoc.data()
          // Use the super admin's UID who created this staff member
          if (staffData.createdBy) {
            userId = staffData.createdBy
            console.log('[Settings] Staff user detected, using super admin UID:', userId)
          }
        }
      }
    } catch (error: any) {
      console.warn('[Settings] Could not fetch staff document, using current user UID:', error.message)
    }
  }
  
  return userId
}

// Load store information and settings from Firestore
onMounted(async () => {
  if (currentUser.value) {
    try {
      // Fetch current user data first to check permissions
      if (!userStore.userData) {
        await userStore.fetchUserData(currentUser.value.uid)
      }

      // Load stores if super admin
      if (userStore.isSuperAdmin) {
        await storesStore.fetchStores()
        await storesStore.initializeCurrentStore()
      }
      
      const targetUserId = await getTargetUserId()
      if (!targetUserId) {
        isLoadingStoreInfo.value = false
        return
      }
      
      const userData = await getUserDocument(targetUserId)
      if (userData?.storeDetails) {
        storeInfo.name = userData.storeDetails.storeName || ''
        storeInfo.email = userData.storeDetails.storeEmail || ''
        storeInfo.phone = userData.storeDetails.storePhone || ''
        storeInfo.address = userData.storeDetails.storeAddress || ''
        storeInfo.businessType = userData.storeDetails.storeDescription || ''
        
        // Update backup
        Object.assign(backupStoreInfo, { ...storeInfo })
        
        // Load settings
        if (userData.storeDetails.settings) {
          const settings = userData.storeDetails.settings
          
          if (settings.inventory) {
            inventorySettings.lowStockThreshold = settings.inventory.lowStockThreshold ?? 10
            inventorySettings.autoReorder = settings.inventory.autoReorder ?? false
            inventorySettings.defaultCategory = settings.inventory.defaultCategory || 'general'
          }
          
          if (settings.receipt) {
            receiptSettings.prefix = settings.receipt.prefix || 'REC-'
            receiptSettings.nextNumber = settings.receipt.nextNumber ?? 1001
            receiptSettings.autoPrint = settings.receipt.autoPrint ?? false
          }
          
          if (settings.payment) {
            paymentSettings.paymentMethods = settings.payment.paymentMethods || ['cash', 'card']
          }
        }
      }
    } catch (error) {
      console.error('Error loading store info:', error)
    } finally {
      isLoadingStoreInfo.value = false
    }
  } else {
    isLoadingStoreInfo.value = false
  }
})

// Functions
const enableEditing = (section: string) => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  
  if (section === 'store') {
    isEditingStore.value = true
    Object.assign(backupStoreInfo, { ...storeInfo })
  }
}

const cancelEditing = (section: string) => {
  if (section === 'store') {
    isEditingStore.value = false
    Object.assign(storeInfo, { ...backupStoreInfo })
  }
}

// Helper function to update store settings
const updateStoreSettings = async (settings: any) => {
  if (!currentUser.value) {
    toast.error('You must be signed in to save settings')
    return
  }

  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) {
      toast.error('Unable to determine target user. Please try again.')
      return
    }
    
    const userData = await getUserDocument(targetUserId)
    const currentStoreDetails = userData?.storeDetails || {}
    const currentSettings = (currentStoreDetails as any).settings || {}
    
    const { updateUserDocument } = useUser()
    await updateUserDocument(targetUserId, {
      storeDetails: {
        ...currentStoreDetails,
        settings: {
          ...currentSettings,
          ...settings,
        },
      },
    } as any)
    
    toast.success('Settings saved successfully!')
  } catch (error: any) {
    console.error('Error saving settings:', error)
    toast.error(error.message || 'Failed to save settings. Please try again.')
  }
}

const saveStoreInfo = async () => {
  if (!currentUser.value) {
    toast.error('You must be signed in to save store information')
    return
  }

  if (!canEditSettings.value) {
    toast.error('Only super admins can edit store settings')
    return
  }

  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) {
      toast.error('Unable to determine target user. Please try again.')
      return
    }
    
    await updateStoreDetails(targetUserId, {
      storeName: storeInfo.name,
      storeEmail: storeInfo.email,
      storePhone: storeInfo.phone,
      storeAddress: storeInfo.address,
      storeDescription: storeInfo.businessType,
    })
    
    isEditingStore.value = false
    Object.assign(backupStoreInfo, { ...storeInfo })
    toast.success('Store information updated successfully!')
  } catch (error: any) {
    console.error('Error saving store info:', error)
    toast.error(error.message || 'Failed to save store information. Please try again.')
  }
}

// Save inventory settings
const saveInventorySettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  
  await updateStoreSettings({
    inventory: {
      lowStockThreshold: inventorySettings.lowStockThreshold,
      autoReorder: inventorySettings.autoReorder,
      defaultCategory: inventorySettings.defaultCategory,
    },
  })
}

// Save receipt settings
const saveReceiptSettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  
  await updateStoreSettings({
    receipt: {
      prefix: receiptSettings.prefix,
      nextNumber: receiptSettings.nextNumber,
      autoPrint: receiptSettings.autoPrint,
    },
  })
}

// Save payment settings
const savePaymentSettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  
  await updateStoreSettings({
    payment: {
      paymentMethods: paymentSettings.paymentMethods,
    },
  })
}

// Data Management Functions
const handleExport = () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can export data')
    return
  }
  
  // In production, this would generate and download files
  const exportData = {
    products: 'Export includes: Name, SKU, Category, Price, Quantity, Cost, Supplier, etc.',
    customers: 'Export includes: Name, Email, Phone, Address, Total Orders, Total Spent, etc.',
    receipts: 'Export includes: Receipt #, Date, Customer, Items, Total, Payment Method, etc.',
    returns: 'Export includes: Return #, Original Receipt, Items, Reason, Date, Status, etc.',
    suppliers: 'Export includes: Name, Contact, Email, Products Supplied, Payment Terms, etc.',
    settings: 'Export includes: Store Info, Inventory Settings, Payment Methods, etc.',
  }
  
  console.log('Exporting data:', exportData)
  // Simulate download
  toast.info('Data export started! This would download:\n- Products.csv\n- Customers.csv\n- Receipts.csv\n- Returns.csv\n- Suppliers.csv\n- Settings.json\n\nAll files would be downloaded as a ZIP archive.', 5000)
}

const triggerImport = () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can import data')
    return
  }
  importFileInput.value?.click()
}

const handleImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const fileType = file.name.split('.').pop()?.toLowerCase()
    console.log('Importing file:', file.name, 'Type:', fileType)
    
    if (fileType === 'csv') {
      toast.info(`Importing ${file.name}...\n\nCSV files should have columns matching:\n- Products: Name, SKU, Category, Price, Quantity\n- Customers: Name, Email, Phone, Address`, 5000)
    } else if (fileType === 'json') {
      toast.info(`Importing backup file ${file.name}...\n\nThis will restore all data from the backup file.`, 5000)
    } else {
      toast.error('Unsupported file type. Please use CSV or JSON files.')
    }
    
    // Reset file input
    if (target) target.value = ''
  }
}

const handleDeleteAll = () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can delete data')
    return
  }
  
  const confirmed = confirm(
    '⚠️ WARNING: This will permanently delete ALL your data!\n\n' +
    'This includes:\n' +
    '- All products/inventory\n' +
    '- All customers\n' +
    '- All receipts and sales history\n' +
    '- All returns\n' +
    '- All suppliers\n\n' +
    'This action CANNOT be undone. Are you absolutely sure?'
  )
  
  if (confirmed) {
    const doubleConfirm = confirm('Last chance! Type "DELETE" in the next prompt to confirm.')
    if (doubleConfirm) {
      console.log('Deleting all data...')
      alert('All data has been deleted. (This is a demo - no data was actually deleted)')
    }
  }
}
</script>

