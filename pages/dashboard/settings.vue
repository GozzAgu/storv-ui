<template>
  <div class="pb-8 min-h-screen w-full overflow-x-hidden">
    <div class="mb-4 sm:mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Settings</h1>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Manage your store and application preferences</p>
      </div>
      <div v-if="!canEditSettings" class="rounded-lg bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/60 dark:ring-amber-800/50 px-3 py-2">
        <p class="text-xs font-medium text-amber-800 dark:text-amber-200">View only</p>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Only super admins can edit settings</p>
      </div>
    </div>

    <div class="space-y-4">
      <div v-if="userStore.isSuperAdmin" class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Account logo</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">One logo for all your stores. Shown on receipts.</p>
        </div>
        <div class="p-3 sm:p-4 flex items-center gap-4">
          <div class="relative">
            <div class="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden ring-1 ring-gray-200/80 dark:ring-gray-600/80 bg-gray-100 dark:bg-gray-800">
              <img v-if="accountLogoUrl" :src="accountLogoUrl" alt="Account logo" class="w-full h-full object-cover" />
              <BuildingStorefrontIcon v-else class="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <button
              type="button"
              @click="accountLogoInput?.click()"
              :disabled="isUploadingAccountLogo"
              class="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon v-if="isUploadingAccountLogo" class="w-3 h-3 animate-spin" />
              <CameraIcon v-else class="w-3 h-3" />
            </button>
            <input ref="accountLogoInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="handleAccountLogoUpload" />
          </div>
          <button v-if="accountLogoUrl" type="button" @click="removeAccountLogo" class="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">
            Remove logo
          </button>
        </div>
      </div>

      <div v-if="userStore.isSuperAdmin" class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Stores</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create, edit, and delete your stores</p>
          </div>
          <Button v-if="!isStaff" @click="showCreateModal = true" extra-class="!rounded-lg" size="sm">
            <PlusIcon class="w-3.5 h-3.5" />
            Create branch
          </Button>
        </div>

        <div class="p-3 sm:p-4">
          <div v-if="storesLoading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary-500/30 border-t-primary-600"></div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading stores...</p>
          </div>

          <div v-else-if="storesError" class="rounded-lg bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/60 dark:ring-red-800/50 p-3">
            <p class="text-xs text-red-800 dark:text-red-200">{{ storesError }}</p>
          </div>

          <div v-else-if="stores.length === 0" class="text-center py-8">
            <div class="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <BuildingStorefrontIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
            </div>
            <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-0.5">No stores yet</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Create your first store to get started.</p>
            <Button size="sm" @click="showCreateModal = true" extra-class="!rounded-lg">Create branch</Button>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
            <div
              v-for="store in stores"
              :key="store.id"
              class="group relative flex items-center w-full min-h-[52px] sm:min-h-[50px] rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-700/60 transition-all duration-200 active:scale-[0.99] sm:hover:scale-[1.02] hover:ring-primary-500/30 dark:hover:ring-primary-400/30 overflow-hidden py-2 px-2.5 sm:py-2 sm:px-0"
              :class="currentStore?.id === store.id ? 'ring-2 ring-primary-500/80 dark:ring-primary-400/80' : ''"
            >
              <div class="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 sm:ml-2 rounded-lg shrink-0 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 group-hover:from-primary-500 group-hover:to-primary-700 transition-all duration-200">
                <img v-if="store.logoUrl || accountLogoUrl" :src="store.logoUrl || accountLogoUrl" :alt="store.name" class="w-full h-full object-cover" />
                <BuildingStorefrontIcon v-else class="w-5 h-5 text-white" stroke-width="1.75" />
              </div>
              <div class="flex-1 min-w-0 ml-2.5 sm:ml-2 pr-1.5 sm:pr-2">
                <p class="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" :title="store.name">
                  {{ store.name }}
                </p>
                <span class="text-[10px] text-gray-500 dark:text-gray-400 block leading-tight truncate">{{ store.address || store.description || 'No address' }}</span>
              </div>
              <div class="flex items-center gap-0.5 pr-1 sm:pr-2 shrink-0 self-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="editStore(store)"
                  class="p-1.5 sm:p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors touch-manipulation"
                  title="Edit store"
                  aria-label="Edit store"
                >
                  <PencilSquareIcon class="w-3.5 h-3.5" />
                </button>
                <button
                  @click.stop="confirmDelete(store)"
                  :disabled="currentStore?.id === store.id"
                  class="p-1.5 sm:p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete store"
                  aria-label="Delete store"
                >
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
              <div v-if="currentStore?.id === store.id" class="absolute top-1.5 right-1.5 z-10 sm:right-10">
                <span class="px-1.5 py-0.5 text-[9px] font-medium rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 whitespace-nowrap">Current</span>
              </div>
              <div v-else-if="!store.isActive" class="absolute top-1.5 right-1.5 z-10 sm:right-10">
                <span class="px-1 py-0.5 text-[9px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full whitespace-nowrap">Inactive</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Store information</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update your business details</p>
          </div>
          <button v-if="canEditSettings && !isEditingStore" @click="enableEditing('store')" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Edit</button>
          <div v-else-if="canEditSettings && isEditingStore" class="flex gap-1.5">
            <button @click="cancelEditing('store')" class="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button @click="saveStoreInfo" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors">Save changes</button>
          </div>
          <div v-else class="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">View only</div>
        </div>
        <div class="p-3 sm:p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Branch name</label>
            <input v-model="storeInfo.name" type="text" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter branch name" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business type</label>
            <input v-model="storeInfo.businessType" type="text" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter business type" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input v-model="storeInfo.email" type="email" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter store email" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
            <input v-model="storeInfo.phone" type="tel" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter phone number" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
            <textarea v-model="storeInfo.address" rows="2" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter store address" />
          </div>
        </div>
        </div>
      </div>

      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Inventory settings</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure inventory management preferences</p>
          </div>
          <Button v-if="canEditSettings" @click="saveInventorySettings" variant="primary" extra-class="!rounded-lg" size="sm">Save changes</Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">View only</div>
        </div>
        <div class="p-3 sm:p-4 space-y-0">
          <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Low stock alert threshold</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Alert when stock falls below this quantity</p>
            </div>
            <div class="flex items-center gap-2">
              <input v-model.number="inventorySettings.lowStockThreshold" type="number" min="1" :disabled="!canEditSettings" :class="['w-16 px-2.5 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" />
              <span class="text-xs text-gray-600 dark:text-gray-400">units</span>
            </div>
          </div>

          <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Auto-reorder enabled</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Create purchase orders when stock is low</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="inventorySettings.autoReorder"
                type="checkbox"
                :disabled="!canEditSettings"
                class="sr-only peer"
              />
              <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between py-2.5">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Default category</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Default category for new products</p>
            </div>
            <select v-model="inventorySettings.defaultCategory" :disabled="!canEditSettings" :class="['px-2.5 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']">
              <option value="general">General</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food & Beverages</option>
              <option value="office">Office Supplies</option>
            </select>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Receipt & invoice settings</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Customize receipt and invoice preferences</p>
          </div>
          <Button v-if="canEditSettings" @click="saveReceiptSettings" variant="primary" extra-class="!rounded-lg" size="sm">Save changes</Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">View only</div>
        </div>
        <div class="p-3 sm:p-4 space-y-0">
          <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Receipt prefix</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Prefix for receipt numbers (e.g. REC-)</p>
            </div>
            <input v-model="receiptSettings.prefix" type="text" :disabled="!canEditSettings" :class="['w-24 px-2.5 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="REC-" />
          </div>

          <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Next receipt number</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Starting number for next receipt</p>
            </div>
            <input v-model.number="receiptSettings.nextNumber" type="number" min="1" :disabled="!canEditSettings" :class="['w-24 px-2.5 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" />
          </div>

          <div class="flex items-center justify-between py-2.5">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Print receipt automatically</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Print receipt after sale</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="receiptSettings.autoPrint"
                type="checkbox"
                :disabled="!canEditSettings"
                class="sr-only peer"
              />
              <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Store Modal -->
    <Modal
      v-model="showCreateModal"
      :title="editingStore ? 'Edit Branch' : 'Create Branch'"
      size="lg"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Branch Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="storeForm.name"
            type="text"
            required
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="My Branch"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <button
              type="button"
              @click="generateAIDescription"
              :disabled="isGeneratingDescription || !storeForm.name"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SparklesIcon v-if="!isGeneratingDescription" class="w-3.5 h-3.5" />
              <svg v-else class="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isGeneratingDescription ? 'Generating...' : 'AI Complete' }}
            </button>
          </div>
          <textarea
            v-model="storeForm.description"
            rows="2"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            placeholder="Store description..."
          />
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Address
          </label>
          <input
            v-model="storeForm.address"
            type="text"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="123 Main St, City, State ZIP"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone
            </label>
            <input
              v-model="storeForm.phone"
              type="tel"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <input
              v-model="storeForm.email"
              type="email"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="store@example.com"
            />
          </div>
        </div>

        <div v-if="editingStore">
          <label class="flex items-center gap-2">
            <input
              v-model="storeForm.isActive"
              type="checkbox"
              class="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
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
            class="w-full text-left p-4 border-2 rounded-md transition-all"
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
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CameraIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useInventoryStore } from '~/stores/inventory'
import { useToast } from '~/composables/useToast'
import Button from '~/components/ui/Button.vue'
import Modal from '~/components/ui/Modal.vue'
import type { Store } from '~/composables/useStores'
import { collection, query, where, getDocs } from 'firebase/firestore'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Settings - Storvv',
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
const isLoadingStoreInfo = ref(true)

// Get user data and load store info
const { currentUser } = useFirebaseAuth()
const { getUserDocument, updateStoreDetails, updateUserDocument } = useUser()
const { getFirestoreInstance } = useFirestore()
const userStore = useUserStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const inventoryStore = useInventoryStore()
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
const isGeneratingDescription = ref(false)

const storeForm = ref({
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  isActive: true,
})
const accountLogoInput = ref<HTMLInputElement | null>(null)
const isUploadingAccountLogo = ref(false)

const accountLogoUrl = computed(() => userStore.userData?.storeLogoUrl || '')

const handleAccountLogoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !authStore.currentUser || !userStore.isSuperAdmin) return

  isUploadingAccountLogo.value = true
  input.value = ''

  try {
    const { uploadImage } = useFirebaseStorage()
    const userId = authStore.currentUser.uid
    const { url } = await uploadImage(file, userId, {
      folder: 'account-logo',
    })

    await updateUserDocument(userId, { storeLogoUrl: url })
    userStore.$patch((state) => {
      if (state.userData) state.userData = { ...state.userData, storeLogoUrl: url }
    })
    await storesStore.updateAllStoresLogo(url)
    toast.success('Logo updated for all stores')
  } catch (err: any) {
    toast.error(err.message || 'Failed to upload logo')
  } finally {
    isUploadingAccountLogo.value = false
  }
}

const removeAccountLogo = async () => {
  if (!authStore.currentUser || !userStore.isSuperAdmin) return

  const currentLogoUrl = accountLogoUrl.value
  try {
    if (currentLogoUrl) {
      const { deleteImageByUrl } = useFirebaseStorage()
      await deleteImageByUrl(currentLogoUrl)
    }
    await updateUserDocument(authStore.currentUser!.uid, { storeLogoUrl: '' })
    userStore.$patch((state) => {
      if (state.userData) state.userData = { ...state.userData, storeLogoUrl: '' }
    })
    await storesStore.updateAllStoresLogo('')
    toast.success('Logo removed from all stores')
  } catch (err: any) {
    toast.error(err.message || 'Failed to remove logo')
  }
}

const generateAIDescription = async () => {
  if (!storeForm.value.name?.trim()) {
    toast.error('Please enter a branch name first')
    return
  }

  isGeneratingDescription.value = true

  try {
    const response = await $fetch<{ success: boolean; description?: string; error?: string }>('/api/ai/generate-store-description', {
      method: 'POST',
      body: {
        storeName: storeForm.value.name.trim(),
        storeAddress: storeForm.value.address?.trim() || '',
        storeType: 'general'
      }
    })

    if (response.success && response.description) {
      storeForm.value.description = response.description
      toast.success('Description generated successfully')
    } else {
      toast.error(response.error || 'Failed to generate description. Please try again.')
    }
  } catch (err: any) {
    console.error('AI generation error:', err)
    toast.error(err.message || 'Failed to generate description. Please try again.')
  } finally {
    isGeneratingDescription.value = false
  }
}

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
      const logoUrl = userStore.userData?.storeLogoUrl || ''
      const newStoreId = await storesStore.createStore({ ...storeForm.value, logoUrl })
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
  
  // Refresh user data to get updated settings
  if (currentUser.value) {
    await userStore.fetchUserData(currentUser.value.uid)
  }
  
  // Update low stock counts for all folders with the new threshold
  try {
    const folders = inventoryStore.folders
    for (const folder of folders) {
      await inventoryStore.updateLowStockCount(folder.id)
    }
    toast.success('Low stock counts updated with new threshold!')
  } catch (error: any) {
    console.error('Error updating low stock counts:', error)
    // Don't show error to user, just log it - the threshold is saved anyway
  }
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


</script>

