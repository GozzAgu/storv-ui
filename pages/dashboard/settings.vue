<template>
  <div class="w-full max-w-none space-y-4 pb-10 sm:space-y-5 sm:pb-12">
    <header
      class="rounded-sm bg-white px-4 py-4 dark:!bg-dashboard-card sm:px-5 sm:py-5"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
            Store & app
          </p>
          <h1 class="mt-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl">
            Settings
          </h1>
          <p class="mt-1 max-w-2xl text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            Branches, business details, inventory defaults, and receipts, tuned to match how you work.
          </p>
        </div>
        <div
          v-if="!canEditSettings"
          class="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/90 px-3 py-1.5 dark:border-amber-500/25 dark:bg-amber-950/30"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
          <span class="text-xs font-medium text-amber-800 dark:text-amber-200">View only</span>
        </div>
      </div>
    </header>

    <div class="space-y-4 sm:space-y-5">
      <!-- Account: logo + subscription -->
      <div
        v-if="userStore.isSuperAdmin"
        class="relative overflow-hidden rounded-sm bg-white dark:!bg-dashboard-card"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/90 px-5 py-4 dark:border-gray-800/60 sm:px-6">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Account</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Logo and subscription for your whole account.</p>
          </div>
          <span class="px-2.5 py-1 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            Plan: {{ currentSubscriptionLabel }}
          </span>
        </div>

        <div class="px-5 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- Logo -->
          <div class="flex items-center gap-5">
            <div class="relative shrink-0">
              <div class="w-16 h-16 rounded-sm flex items-center justify-center overflow-hidden ring-2 ring-gray-200/80 dark:ring-gray-600/80 bg-gray-50 dark:bg-gray-800/80">
                <img v-if="accountLogoUrl" :src="displayAccountLogoSrc" alt="Account logo" class="w-full h-full object-cover" />
                <BuildingStorefrontIcon v-else class="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <button
                type="button"
                @click="accountLogoInput?.click()"
                :disabled="isUploadingAccountLogo"
                class="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-primary-400 hover:bg-primary-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all"
                title="Upload logo"
                aria-label="Upload logo"
              >
                <ArrowPathIcon v-if="isUploadingAccountLogo" class="w-3.5 h-3.5 animate-spin" />
                <CameraIcon v-else class="w-3.5 h-3.5" />
              </button>
              <input ref="accountLogoInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="handleAccountLogoUpload" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-gray-900 dark:text-gray-100">Account logo</p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">One logo for all stores. Shown on receipts.</p>
              <button
                v-if="accountLogoUrl"
                type="button"
                @click="removeAccountLogo"
                class="mt-2 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Remove logo
              </button>
            </div>
          </div>

          <!-- Subscription -->
          <div class="flex flex-col justify-between gap-2">
            <div>
              <p class="text-xs font-semibold text-gray-900 dark:text-gray-100">Subscription</p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Upgrade your plan to unlock more features.</p>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-end gap-3">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Upgrade to</label>
                <select
                  v-model="selectedUpgradePlan"
                  :disabled="!canEditSettings || isUpgradingSubscription || upgradeOptions.length === 0"
                  :class="[ 'w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings && !isUpgradingSubscription && upgradeOptions.length > 0 ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed' ]"
                >
                  <option value="" disabled>
                    {{ upgradeOptions.length === 0 ? 'No upgrades available' : 'Select a plan' }}
                  </option>
                  <option v-for="p in upgradeOptions" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                extra-class="!rounded-sm"
                :disabled="!canEditSettings || !selectedUpgradePlan || isUpgradingSubscription || upgradeOptions.length === 0"
                @click="handleUpgradeSubscription"
              >
                {{ isUpgradingSubscription ? 'Upgrading...' : 'Upgrade' }}
              </Button>
            </div>
            <p class="text-[10px] text-gray-500 dark:text-gray-400">
              You’ll be redirected to Paystack to complete payment; your plan updates after payment.
            </p>
            <details class="mt-3 group">
              <summary class="text-[10px] font-medium text-gray-500 dark:text-gray-400 cursor-pointer list-none inline-flex items-center gap-1">
                <span class="group-open:rotate-90 transition-transform">›</span> What’s in each plan?
              </summary>
              <ul class="mt-2 space-y-2 pl-3 border-l border-gray-200 dark:border-gray-600">
                <li v-for="(plan, id) in SUBSCRIPTION_FEATURE_SUMMARY" :key="id" class="text-[10px]">
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{ SUBSCRIPTION_PLANS.find(p => p.id === id)?.name }}</span>
                  <ul class="mt-0.5 text-gray-500 dark:text-gray-400 list-disc list-inside">
                    <li v-for="(line, i) in plan" :key="i">{{ line }}</li>
                  </ul>
                </li>
              </ul>
            </details>
          </div>
        </div>
      </div>

      <!-- Stores -->
      <div
        v-if="userStore.isSuperAdmin"
        class="relative overflow-hidden rounded-sm bg-white dark:!bg-dashboard-card"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/90 px-5 py-4 dark:border-gray-800/60 sm:px-6">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Stores</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Create, edit, and delete your stores</p>
          </div>
          <Button
            v-if="!isStaff"
            @click="openCreateStoreModal"
            size="sm"
            extra-class="!rounded-sm !px-2"
            :title="canAddStore ? 'Create branch' : 'Upgrade to add more stores'"
            aria-label="Create branch"
            :disabled="!canAddStore"
          >
            <PlusIcon class="w-4 h-4" />
          </Button>
        </div>

        <p
          v-if="isMicroSubscription"
          class="mx-5 sm:mx-6 -mt-1 mb-1 text-[11px] sm:text-xs leading-snug font-extralight text-amber-500/75 dark:text-amber-400/50"
        >
          Multiple store branches are not included on Storvv Micro (free). Upgrade to Medium or Enterprise in the
          Account section above to add more stores.
        </p>
        <p
          v-if="hiddenStoreCount > 0"
          class="mx-5 sm:mx-6 -mt-1 mb-3 text-[11px] sm:text-xs leading-snug text-amber-600/90 dark:text-amber-400/80"
        >
          {{ hiddenStoreCount }}
          {{ hiddenStoreCount === 1 ? 'branch is' : 'branches are' }} on your account but not available on your
          current plan. Upgrade in Account above to access them again. The oldest branches stay available first.
        </p>

        <div class="relative px-5 sm:px-6 py-5">
          <div v-if="storesLoading" class="text-center py-10">
            <div class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Loading stores...</p>
          </div>

          <div v-else-if="storesError" class="rounded-sm bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 px-4 py-3">
            <p class="text-xs font-medium text-red-800 dark:text-red-200">{{ storesError }}</p>
          </div>

          <div v-else-if="eligibleStores.length === 0" class="text-center py-10">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm bg-white/80 dark:!bg-dashboard-card/40">
              <BuildingStorefrontIcon class="h-8 w-8 text-gray-400 dark:text-gray-500" stroke-width="1.25" />
            </div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">No stores yet</h3>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Create your first store to get started.</p>
            <Button size="sm" @click="openCreateStoreModal" extra-class="!rounded-sm mt-5">Create branch</Button>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
            <div
              v-for="store in eligibleStores"
              :key="store.id"
              class="group relative flex min-h-[52px] w-full items-center overflow-hidden rounded-sm bg-gradient-to-b from-white to-gray-50/90 px-2.5 py-2 transition-all duration-200 active:scale-[0.99] dark:from-gray-900/35 dark:to-gray-950/30 sm:min-h-[50px] sm:px-0 sm:py-2 sm:hover:-translate-y-px"
              :class="currentStore?.id === store.id ? 'bg-primary-50/90 dark:bg-primary-950/20' : ''"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800/80 sm:ml-2 sm:h-8 sm:w-8"
              >
                <img v-if="store.logoUrl || accountLogoUrl" :src="optimizeCloudinaryLogo(store.logoUrl || accountLogoUrl)" :alt="store.name" class="h-full w-full object-cover" />
                <BuildingStorefrontIcon v-else class="h-5 w-5 text-gray-500 dark:text-gray-400" stroke-width="1.75" />
              </div>
              <div class="flex-1 min-w-0 ml-2.5 sm:ml-2 pr-1.5 sm:pr-2">
                <p class="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" :title="store.name">
                  {{ store.name }}
                </p>
                <span class="text-[10px] text-gray-500 dark:text-gray-400 block leading-tight truncate">{{ store.address || store.description || 'No address' }}</span>
              </div>
              <div class="flex items-center gap-0.5 pr-1 sm:pr-2 shrink-0 self-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="editStore(store)"
                  class="p-1.5 sm:p-1 rounded-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-colors touch-manipulation"
                  title="Edit store"
                  aria-label="Edit store"
                >
                  <PencilSquareIcon class="w-3.5 h-3.5" />
                </button>
                <button
                  @click.stop="confirmDelete(store)"
                  :disabled="currentStore?.id === store.id"
                  class="p-1.5 sm:p-1 rounded-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete store"
                  aria-label="Delete store"
                >
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
              <div v-if="currentStore?.id === store.id" class="absolute top-1.5 right-1.5 z-10 sm:right-10">
                <span class="px-1.5 py-0.5 text-[9px] font-medium rounded-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 whitespace-nowrap">Current</span>
              </div>
              <div v-else-if="!store.isActive" class="absolute top-1.5 right-1.5 z-10 sm:right-10">
                <span class="px-1 py-0.5 text-[9px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full whitespace-nowrap">Inactive</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Store information -->
      <div class="overflow-hidden rounded-sm bg-white dark:!bg-dashboard-card">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/90 px-5 py-4 dark:border-gray-800/60 sm:px-6">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Store information</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Update your business details</p>
          </div>
          <button v-if="canEditSettings && !isEditingStore" @click="enableEditing('store')" class="px-3 py-1.5 text-xs font-medium rounded-sm text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Edit</button>
          <div v-else-if="canEditSettings && isEditingStore" class="flex gap-1.5">
            <button @click="cancelEditing('store')" class="px-3 py-1.5 text-xs font-medium rounded-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button
              @click="saveStoreInfo"
              class="inline-flex items-center justify-center w-9 h-8 rounded-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors"
              title="Done"
              aria-label="Done"
            >
              <CheckIcon class="w-4 h-4" />
            </button>
          </div>
          <div v-else class="px-3 py-1.5 text-xs font-medium rounded-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">View only</div>
        </div>
        <div class="px-5 sm:px-6 py-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Branch name</label>
            <input v-model="storeInfo.name" type="text" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter branch name" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business type</label>
            <input v-model="storeInfo.businessType" type="text" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter business type" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input v-model="storeInfo.email" type="email" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter store email" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
            <input v-model="storeInfo.phone" type="tel" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter phone number" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
            <textarea v-model="storeInfo.address" rows="2" :disabled="!canEditSettings || !isEditingStore" :class="['w-full px-3 py-2 text-xs rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingStore ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter store address" />
          </div>
        </div>
        </div>
      </div>

      <!-- Inventory settings -->
      <div class="overflow-hidden rounded-sm bg-white dark:!bg-dashboard-card">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/90 px-5 py-4 dark:border-gray-800/60 sm:px-6">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Inventory settings</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Configure inventory management preferences</p>
          </div>
          <Button
            v-if="canEditSettings"
            @click="saveInventorySettings"
            variant="primary"
            size="sm"
            extra-class="!rounded-sm !px-2"
            title="Done"
            aria-label="Done"
          >
            <CheckIcon class="w-4 h-4" />
          </Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium rounded-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">View only</div>
        </div>
        <div class="space-y-0 px-5 py-4 sm:px-6">
          <div class="flex items-center justify-between border-b border-gray-100/90 py-3 dark:border-gray-800/60">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Low stock alert threshold</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Alert when stock falls below this quantity</p>
            </div>
            <div class="flex items-center gap-2">
              <input v-model.number="inventorySettings.lowStockThreshold" type="number" min="1" :disabled="!canEditSettings" :class="['w-16 px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" />
              <span class="text-xs text-gray-600 dark:text-gray-400">units</span>
            </div>
          </div>

          <div class="flex items-center justify-between border-b border-gray-100/90 py-3 dark:border-gray-800/60">
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
              <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div class="flex items-center justify-between py-3">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Default category</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Default category for new products</p>
            </div>
            <select v-model="inventorySettings.defaultCategory" :disabled="!canEditSettings" :class="['px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']">
              <option value="general">General</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food & Beverages</option>
              <option value="office">Office Supplies</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Receipt & invoice settings -->
      <div class="overflow-hidden rounded-sm bg-white dark:!bg-dashboard-card">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100/90 px-5 py-4 dark:border-gray-800/60 sm:px-6">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Receipt & invoice settings</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Customize receipt and invoice preferences</p>
          </div>
          <Button
            v-if="canEditSettings"
            @click="saveReceiptSettings"
            variant="primary"
            size="sm"
            extra-class="!rounded-sm !px-2"
            title="Done"
            aria-label="Done"
          >
            <CheckIcon class="w-4 h-4" />
          </Button>
          <div v-else class="px-3 py-1.5 text-xs font-medium rounded-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">View only</div>
        </div>
        <div class="space-y-0 px-5 py-4 sm:px-6">
          <div class="flex items-center justify-between border-b border-gray-100/90 py-3 dark:border-gray-800/60">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Receipt prefix</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Prefix for receipt numbers (e.g. REC-)</p>
            </div>
            <input v-model="receiptSettings.prefix" type="text" :disabled="!canEditSettings" :class="['w-24 px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="REC-" />
          </div>

          <div class="flex items-center justify-between border-b border-gray-100/90 py-3 dark:border-gray-800/60">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Next receipt number</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Starting number for next receipt</p>
            </div>
            <input v-model.number="receiptSettings.nextNumber" type="number" min="1" :disabled="!canEditSettings" :class="['w-24 px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30', canEditSettings ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" />
          </div>

          <div class="flex items-center justify-between py-3">
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
              <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- Create/Edit Branch (slide-over) -->
    <SidePanel
      v-model="showCreateModal"
      :title="editingStore ? 'Edit Branch' : 'Create Branch'"
      :subtitle="editingStore ? 'Update branch details.' : 'Add a new branch with name, description, and contact info.'"
      size="lg"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Branch Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="storeForm.name"
            type="text"
            required
            class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
            placeholder="My Branch"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            v-model="storeForm.description"
            rows="2"
            class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none resize-none"
            placeholder="Store description..."
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
          <input
            v-model="storeForm.address"
            type="text"
            class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
            placeholder="123 Main St, City, State ZIP"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              v-model="storeForm.phone"
              type="tel"
              class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              v-model="storeForm.email"
              type="email"
              class="w-full px-3 py-2 text-xs rounded-sm ring-1 ring-gray-200/70 dark:ring-gray-600/70 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
              placeholder="store@example.com"
            />
          </div>
        </div>

        <div v-if="editingStore">
          <label class="flex items-center gap-2">
            <input
              v-model="storeForm.isActive"
              type="checkbox"
              class="w-3.5 h-3.5 text-primary-500 border-gray-300 rounded focus:ring-primary-400"
            />
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </div>

      <template #footer>
        <Button variant="outline" size="sm" @click="closeStoreModal" extra-class="!rounded-sm">Cancel</Button>
        <Button size="sm" @click="handleStoreSubmit" :disabled="!storeForm.name || isSubmittingStore" extra-class="!rounded-sm">
          {{ isSubmittingStore ? 'Saving...' : editingStore ? 'Update' : 'Create' }}
        </Button>
      </template>
    </SidePanel>

    <!-- Delete Store Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      title="Delete Store"
      subtitle="This action cannot be undone."
      size="md"
    >
      <div class="space-y-3">
        <p class="text-xs text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <strong>{{ storeToDelete?.name }}</strong>?
        </p>
        <p class="text-xs text-red-600 dark:text-red-400">
          All data associated with this store (departments, staff, inventory, receipts) will need to be handled separately.
        </p>
      </div>

      <template #footer>
        <Button variant="outline" size="sm" @click="showDeleteModal = false" extra-class="!rounded-sm">Cancel</Button>
        <Button variant="danger" size="sm" @click="handleStoreDelete" :disabled="isDeletingStore" extra-class="!rounded-sm">
          {{ isDeletingStore ? 'Deleting...' : 'Delete' }}
        </Button>
      </template>
    </Modal>

    <!-- Store Selection Modal (shown after first store creation) -->
    <Modal
      v-model="showStoreSelectionModal"
      title="Select Your Store"
      subtitle="Your store was created. Select it to continue."
      size="md"
      :close-on-backdrop="false"
    >
      <div class="space-y-3">
        <p class="text-xs text-gray-700 dark:text-gray-300">
          Please select this store to continue.
        </p>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <button
            v-for="store in storesStore.stores"
            :key="store.id"
            @click="handleStoreSelection(store.id)"
            class="w-full rounded-sm p-3 text-left transition-all"
            :class="newlyCreatedStoreId === store.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ store.name }}</h3>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5" v-if="store.description">
                  {{ store.description }}
                </p>
                <div class="mt-1.5 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="store.address">{{ store.address }}</span>
                  <span v-if="store.phone">{{ store.phone }}</span>
                </div>
              </div>
              <svg
                v-if="newlyCreatedStoreId === store.id"
                class="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0 ml-3"
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CameraIcon,
  CheckIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useInventoryStore } from '~/stores/inventory'
import { useAppToast } from '~/composables/useAppToast'
import Button from '~/components/ui/Button.vue'
import Modal from '~/components/ui/Modal.vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import type { Store } from '~/composables/useStores'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_FEATURE_SUMMARY, type SubscriptionPlan } from '~/types/subscription'
import {
  initializePaystackSubscription,
  type PaystackInitializeFetcher,
} from '~/utils/paystack-upgrade'
import {
  BILLING_BLOCKED_USER_MESSAGE,
  extractUploadFailureMessage,
  isBillingDelinquentMessage,
} from '~/utils/storage-billing-errors'
import { isCloudinaryUrl, optimizeCloudinaryLogo } from '~/utils/cloudinary'

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
const toast = useAppToast()
const { limits } = useSubscriptionFeatures()
const { eligibleStores, hiddenStoreCount } = usePlanEligibleStores()
const route = useRoute()

// Check if user is super admin (only super admins can edit settings)
const canEditSettings = computed(() => {
  return userStore.isSuperAdmin
})

// Subscription
const subscriptionOrder: SubscriptionPlan[] = ['storvv_micro', 'storvv_medium', 'storvv_enterprise']
const currentSubscription = computed<SubscriptionPlan>(() => {
  return (userStore.userData?.subscription as SubscriptionPlan) || 'storvv_micro'
})
const currentSubscriptionLabel = computed(() => {
  return SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.value)?.name || 'Storvv Micro'
})

/** Free tier: single store; show upgrade message for multiple branches */
const isMicroSubscription = computed(() => currentSubscription.value === 'storvv_micro')
const upgradeOptions = computed(() => {
  const currentIdx = subscriptionOrder.indexOf(currentSubscription.value)
  return SUBSCRIPTION_PLANS.filter(p => subscriptionOrder.indexOf(p.id) > currentIdx)
})
const selectedUpgradePlan = ref<SubscriptionPlan | ''>('')
const isUpgradingSubscription = ref(false)

const handleUpgradeSubscription = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can upgrade subscription')
    return
  }
  if (!currentUser.value) {
    toast.error('You must be signed in to upgrade')
    return
  }
  if (!selectedUpgradePlan.value) return

  isUpgradingSubscription.value = true
  try {
    const result = await initializePaystackSubscription(
      {
        planId: selectedUpgradePlan.value,
        email: currentUser.value.email || '',
        userId: currentUser.value.uid,
      },
      $fetch as PaystackInitializeFetcher,
      useRuntimeConfig().public.apiBase || undefined
    )
    if (result.ok) {
      window.location.href = result.authorizationUrl
      return
    }
    toast.error(result.message)
  } finally {
    isUpgradingSubscription.value = false
  }
}

// Stores management
const storesLoading = computed(() => storesStore.loading)
const storesError = computed(() => storesStore.error)
const currentStore = computed(() => storesStore.currentStore)
const isStaff = computed(() => userStore.userData?.role === 'staff')

const canAddStore = computed(() => {
  const max = limits.value.maxStores
  if (max < 0) return true
  return storesStore.stores.length < max
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
const accountLogoInput = ref<HTMLInputElement | null>(null)
const isUploadingAccountLogo = ref(false)

const accountLogoUrl = computed(() => userStore.userData?.storeLogoUrl || '')
const displayAccountLogoSrc = computed(() => optimizeCloudinaryLogo(accountLogoUrl.value))

function isFirebaseStorageUnknown(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'storage/unknown'
  )
}

/**
 * When Cloudinary env is set, upload there (no Firebase Storage / billing required for logos).
 * Otherwise: Firebase client → server Admin fallback.
 */
async function uploadAccountLogoWithFallback(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const cloudinary = useCloudinary()
  if (cloudinary.isConfigured.value) {
    const { url } = await cloudinary.uploadImage(file)
    if (import.meta.dev) console.info('[Account logo] Uploaded via Cloudinary')
    return { url, path: '' }
  }

  const { uploadImage } = useFirebaseStorage()
  try {
    return await uploadImage(file, userId, { folder: 'account-logo' })
  } catch (err) {
    if (!isFirebaseStorageUnknown(err)) throw err
    if (import.meta.dev) {
      console.warn('[Account logo] Browser Storage upload failed; retrying via server…', err)
    }
    const token = await authStore.currentUser!.getIdToken()
    const body = new FormData()
    body.append('file', file)
    try {
      return await $fetch<{ url: string; path: string }>(
        '/api/storage/upload-account-logo',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        }
      )
    } catch (apiErr: unknown) {
      const serverHint = extractUploadFailureMessage(apiErr)
      if (isBillingDelinquentMessage(serverHint)) {
        throw new Error(BILLING_BLOCKED_USER_MESSAGE)
      }
      throw new Error(
        `Could not complete upload (${serverHint}). ` +
          'If this is not a billing issue: for local dev set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env and restart. ' +
          'Set NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET to the exact value from Firebase Console → Project settings.'
      )
    }
  }
}

const handleAccountLogoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !authStore.currentUser || !userStore.isSuperAdmin) return

  isUploadingAccountLogo.value = true
  input.value = ''

  try {
    const userId = authStore.currentUser.uid
    const { url } = await uploadAccountLogoWithFallback(file, userId)

    await updateUserDocument(userId, { storeLogoUrl: url })
    userStore.$patch((state) => {
      if (state.userData) state.userData = { ...state.userData, storeLogoUrl: url }
    })
    await storesStore.updateAllStoresLogo(url)
    toast.success('Logo updated for all stores')
  } catch (err: unknown) {
    if (import.meta.dev) console.error('[Account logo upload]', err)
    const { getFirebaseStorageErrorMessage } = useFirebaseStorage()
    const msg =
      err instanceof Error ? err.message : getFirebaseStorageErrorMessage(err)
    toast.error(msg)
  } finally {
    isUploadingAccountLogo.value = false
  }
}

const removeAccountLogo = async () => {
  if (!authStore.currentUser || !userStore.isSuperAdmin) return

  const currentLogoUrl = accountLogoUrl.value
  try {
    if (currentLogoUrl && !isCloudinaryUrl(currentLogoUrl)) {
      const { deleteImageByUrl } = useFirebaseStorage()
      await deleteImageByUrl(currentLogoUrl)
    }
    await updateUserDocument(authStore.currentUser!.uid, { storeLogoUrl: '' })
    userStore.$patch((state) => {
      if (state.userData) state.userData = { ...state.userData, storeLogoUrl: '' }
    })
    await storesStore.updateAllStoresLogo('')
    toast.success('Logo removed from all stores')
  } catch (err: unknown) {
    const { getFirebaseStorageErrorMessage } = useFirebaseStorage()
    toast.error(getFirebaseStorageErrorMessage(err))
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

const openCreateStoreModal = () => {
  if (!canAddStore.value) {
    toast.error('Storvv Micro allows 1 store. Upgrade your plan in the Account section to add more.')
    return
  }
  showCreateModal.value = true
}

const handleStoreSubmit = async () => {
  if (!storeForm.value.name) return
  if (!editingStore.value && !canAddStore.value) {
    toast.error('Storvv Micro allows 1 store. Upgrade your plan to add more.')
    return
  }

  isSubmittingStore.value = true
  try {
    if (editingStore.value) {
      await storesStore.updateStore(editingStore.value.id, storeForm.value)
      toast.success('Store updated successfully')
      closeStoreModal()
    } else {
      const wasFirstStore = storesStore.stores.length === 0
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
  // Handle Paystack callback after payment redirect
  const refParam = route.query.reference as string | undefined
  const isPaystackCallback = route.query.paystack_callback === '1' || (refParam && String(refParam).startsWith('storvv_'))
  if (currentUser.value && refParam && isPaystackCallback) {
    try {
      const verify = await $fetch<{ success?: boolean; paid?: boolean; userId?: string; planId?: string; message?: string }>(
        `/api/paystack/verify?reference=${encodeURIComponent(refParam)}`
      )
      if (verify.paid && verify.userId === currentUser.value.uid && verify.planId) {
        // Subscription is persisted server-side during verification; refresh local user data.
        await userStore.fetchUserData(currentUser.value.uid)
        toast.success(`Upgraded to ${SUBSCRIPTION_PLANS.find(p => p.id === verify.planId)?.name || 'new plan'}`)
        selectedUpgradePlan.value = ''
        if (import.meta.client && window.history.replaceState) {
          window.history.replaceState({}, '', '/dashboard/settings')
        }
      } else if (!verify.paid && verify.message) {
        toast.error(verify.message)
        if (import.meta.client && window.history.replaceState) {
          window.history.replaceState({}, '', '/dashboard/settings')
        }
      }
    } catch (e) {
      toast.error('Could not verify payment')
      if (import.meta.client && window.history.replaceState) {
        window.history.replaceState({}, '', '/dashboard/settings')
      }
    }
  }

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

