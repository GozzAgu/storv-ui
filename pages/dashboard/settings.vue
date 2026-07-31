<template>
  <div :class="pageClass">
    <DashboardPageHeader>
      <template #eyebrow>
        <p :class="eyebrowClass">Store & app</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Settings</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">
          Branches, business details, inventory defaults, and sales, tuned to match how you work.
        </p>
      </template>
      <template #actions>
        <div v-if="!canEditSettings" :class="viewOnlyBadgeClass">
          <span class="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
          <span>View only</span>
        </div>
      </template>
    </DashboardPageHeader>

    <div :class="pageStackClass">
      <!-- Account: logo + subscription -->
      <DashboardSettingsPanel
        v-if="userStore.isSuperAdmin"
        title="Account"
        subtitle="Logo and subscription for your whole account."
        :badge="`Plan: ${currentSubscriptionLabel}`"
      >
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div class="flex items-start gap-4">
            <div class="relative shrink-0">
              <div
                class="flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-xl bg-gray-50/80 dark:bg-white/[0.03]"
              >
                <img
                  v-if="accountLogoUrl"
                  :src="displayAccountLogoSrc"
                  alt="Account logo"
                  class="h-full w-full object-cover"
                />
                <BuildingStorefrontIcon v-else class="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <button
                type="button"
                class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm transition hover:bg-primary-600 disabled:opacity-50"
                :disabled="isUploadingAccountLogo"
                aria-label="Upload logo"
                @click="accountLogoInput?.click()"
              >
                <ArrowPathIcon v-if="isUploadingAccountLogo" class="h-3.5 w-3.5 animate-spin" />
                <CameraIcon v-else class="h-3.5 w-3.5" />
              </button>
              <input
                ref="accountLogoInput"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                class="hidden"
                @change="handleAccountLogoUpload"
              />
            </div>
            <div class="min-w-0 pt-0.5">
              <p class="text-xs font-semibold text-gray-900 dark:text-gray-100">Account logo</p>
              <p class="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                One logo for all branches. Shown on receipts and store cards.
              </p>
              <button
                v-if="accountLogoUrl"
                type="button"
                class="mt-2 text-[11px] font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                @click="removeAccountLogo"
              >
                Remove logo
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-xs font-semibold text-gray-900 dark:text-gray-100">Subscription</p>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Upgrade to unlock more branches and features.
              </p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div class="min-w-0 flex-1">
                <label :class="labelClass">Billing cycle</label>
                <select
                  v-model="selectedBillingCycle"
                  :disabled="!canEditSettings || isUpgradingSubscription"
                  :class="inputClass(canEditSettings && !isUpgradingSubscription)"
                >
                  <option
                    v-for="cycle in SUBSCRIPTION_BILLING_CYCLES"
                    :key="cycle"
                    :value="cycle"
                  >
                    {{ BILLING_CYCLE_LABELS[cycle] }}
                  </option>
                </select>
              </div>
              <div class="min-w-0 flex-1">
                <label :class="labelClass">Upgrade to</label>
                <select
                  v-model="selectedUpgradePlan"
                  :disabled="
                    !canEditSettings || isUpgradingSubscription || upgradeOptions.length === 0
                  "
                  :class="
                    inputClass(
                      canEditSettings && !isUpgradingSubscription && upgradeOptions.length > 0
                    )
                  "
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
                :class="headerBtnClass"
                :disabled="
                  !canEditSettings ||
                  !selectedUpgradePlan ||
                  isUpgradingSubscription ||
                  upgradeOptions.length === 0
                "
                @click="handleUpgradeSubscription"
              >
                {{ isUpgradingSubscription ? 'Upgrading…' : 'Upgrade' }}
              </Button>
            </div>
            <p class="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
              Paystack checkout · {{ BILLING_CYCLE_LABELS[selectedBillingCycle].toLowerCase() }}
              billing · plan updates after payment completes.
            </p>
            <details class="group rounded-lg bg-gray-50/50 px-3 py-2 dark:bg-white/[0.02]">
              <summary
                class="cursor-pointer list-none text-[11px] font-medium text-gray-600 dark:text-gray-400"
              >
                <span class="inline-block transition group-open:rotate-90">›</span> Compare plans
              </summary>
              <ul class="mt-2 space-y-2 /80 pl-3">
                <li
                  v-for="(plan, id) in SUBSCRIPTION_FEATURE_SUMMARY"
                  :key="id"
                  class="text-[10px]"
                >
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{
                    SUBSCRIPTION_PLANS.find((p) => p.id === id)?.name
                  }}</span>
                  <ul class="mt-0.5 list-inside list-disc text-gray-500 dark:text-gray-400">
                    <li v-for="(line, i) in plan" :key="i">{{ line }}</li>
                  </ul>
                </li>
              </ul>
            </details>
          </div>
        </div>
      </DashboardSettingsPanel>

      <!-- Stores -->
      <DashboardSettingsPanel
        v-if="userStore.isSuperAdmin"
        title="Branches"
        subtitle="Create, edit, and switch between store locations."
      >
        <template #actions>
          <Button
            v-if="!isStaff"
            variant="outline"
            size="sm"
            :class="headerBtnClass"
            :icon="BuildingStorefrontIcon"
            :title="canAddStore ? 'Create branch' : 'Upgrade to add more stores'"
            :disabled="!canAddStore"
            @click="openCreateStoreModal"
          >
            <span :class="headerBtnLabelClass">Add branch</span>
          </Button>
        </template>

        <p
          v-if="isMicroSubscription"
          class="mb-3 text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-400/85"
        >
          Storvv Micro includes one branch. Upgrade in Account above for Medium or Enterprise.
        </p>
        <p
          v-if="hiddenStoreCount > 0"
          class="mb-3 text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-400/85"
        >
          {{ hiddenStoreCount }} {{ hiddenStoreCount === 1 ? 'branch is' : 'branches are' }} on your
          account but not on your current plan. Oldest branches stay available first.
        </p>

        <div class="relative">
          <div
            v-if="storesLoading"
            class="flex items-center gap-2 py-6 text-xs text-gray-500 dark:text-gray-400"
          >
            <div
              class="h-4 w-4 animate-spin rounded-full border-0 border-primary-500/25 border-t-primary-500"
              aria-hidden="true"
            />
            Loading branches…
          </div>

          <div
            v-else-if="storesError"
            class="rounded-sm bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 px-4 py-3"
          >
            <p class="text-xs font-medium text-red-800 dark:text-red-200">{{ storesError }}</p>
          </div>

          <DashboardTableEmptyState
            v-else-if="eligibleStores.length === 0"
            :icon="BuildingStorefrontIcon"
            title="No branches yet"
            description="Create your first branch to organize inventory, staff, and sales by location."
            :tips="[
              'Each branch has its own departments and stock',
              'Switch branches anytime from the sidebar or here',
            ]"
            :fill="false"
            extra-class="py-8"
          >
            <Button size="sm" @click="openCreateStoreModal" extra-class="!rounded-2xl"
              >Create branch</Button
            >
          </DashboardTableEmptyState>

          <div
            v-else
            class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            role="list"
            aria-label="Branches"
          >
            <div v-for="store in eligibleStores" :key="store.id" role="listitem" class="min-w-0">
              <div
                :class="[
                  storeBranchCardClass,
                  currentStore?.id === store.id ? storeBranchCardActiveClass : '',
                  currentStore?.id !== store.id ? 'cursor-pointer' : '',
                ]"
                :role="currentStore?.id !== store.id ? 'button' : undefined"
                :tabindex="currentStore?.id !== store.id ? 0 : undefined"
                @click="currentStore?.id !== store.id && switchStore(store.id)"
                @keydown.enter.prevent="currentStore?.id !== store.id && switchStore(store.id)"
                @keydown.space.prevent="currentStore?.id !== store.id && switchStore(store.id)"
              >
                <div class="flex items-start gap-2">
                  <div
                    class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100/90 dark:bg-white/[0.06]"
                  >
                    <img
                      v-if="store.logoUrl || accountLogoUrl"
                      :src="optimizeCloudinaryLogo(store.logoUrl || accountLogoUrl)"
                      :alt="store.name"
                      class="h-full w-full object-cover"
                    />
                    <BuildingStorefrontIcon
                      v-else
                      class="h-3.5 w-3.5 text-gray-400 dark:text-gray-500"
                      stroke-width="1.75"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="truncate text-[11px] font-medium leading-tight text-gray-900 dark:text-gray-100"
                    >
                      {{ store.name }}
                    </p>
                    <p
                      v-if="store.address || store.description"
                      class="mt-0.5 truncate text-[10px] leading-snug text-gray-500 dark:text-gray-400"
                    >
                      {{ store.address || store.description }}
                    </p>
                  </div>
                </div>
                <div class="mt-1.5 flex items-center justify-between gap-1">
                  <span
                    v-if="currentStore?.id === store.id"
                    class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    Current
                  </span>
                  <span
                    v-else-if="!store.isActive"
                    class="text-[10px] text-gray-400 dark:text-gray-500"
                  >
                    Inactive
                  </span>
                  <span v-else aria-hidden="true" class="block h-px w-px" />
                  <div class="flex shrink-0 items-center gap-0.5" @click.stop>
                    <button
                      type="button"
                      class="rounded-md p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                      aria-label="Edit branch"
                      @click="editStore(store)"
                    >
                      <PencilSquareIcon class="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      class="rounded-md p-0.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      :disabled="currentStore?.id === store.id"
                      aria-label="Delete branch"
                      @click="confirmDelete(store)"
                    >
                      <TrashIcon class="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardSettingsPanel>

      <!-- Staff assignment (read-only) -->
      <DashboardSettingsPanel
        v-if="isStaff"
        title="Your assignment"
        subtitle="Store and department linked to your account."
      >
        <div v-if="isLoadingStoreInfo" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            v-for="i in 4"
            :key="i"
            class="h-10 animate-pulse rounded-sm bg-gray-200/80 dark:bg-white/10"
          />
        </div>
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label :class="labelClass">Branch</label>
            <p class="mt-1 text-xs text-gray-900 dark:text-gray-100">{{ storeInfo.name || '-' }}</p>
          </div>
          <div>
            <label :class="labelClass">Department</label>
            <p class="mt-1 text-xs text-gray-900 dark:text-gray-100">
              {{ staffWorkspace.departmentName || '-' }}
            </p>
          </div>
          <div v-if="staffWorkspace.position">
            <label :class="labelClass">Position</label>
            <p class="mt-1 text-xs text-gray-900 dark:text-gray-100">
              {{ staffWorkspace.position }}
            </p>
          </div>
          <div v-if="staffWorkspace.staffRole">
            <label :class="labelClass">Team role</label>
            <p class="mt-1 text-xs capitalize text-gray-900 dark:text-gray-100">
              {{ staffWorkspace.staffRole }}
            </p>
          </div>
        </div>
      </DashboardSettingsPanel>

      <!-- Store information -->
      <DashboardSettingsPanel
        :title="isStaff ? 'Branch details' : 'Store information'"
        :subtitle="
          isStaff
            ? 'Contact details for your assigned branch (view only).'
            : 'Business details for the active branch.'
        "
      >
        <template #actions>
          <button
            v-if="canEditSettings && !isEditingStore"
            type="button"
            :class="editLinkClass"
            @click="enableEditing('store')"
          >
            Edit
          </button>
          <template v-else-if="canEditSettings && isEditingStore">
            <button type="button" :class="cancelLinkClass" @click="cancelEditing('store')">
              Cancel
            </button>
            <button
              type="button"
              :class="editLinkClass"
              aria-label="Save store information"
              @click="saveStoreInfo"
            >
              Save
            </button>
          </template>
          <span v-else :class="viewOnlyBadgeClass">View only</span>
        </template>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label :class="labelClass">Branch name</label>
            <input
              v-model="storeInfo.name"
              type="text"
              :disabled="!canEditSettings || !isEditingStore"
              :class="inputClass(canEditSettings && isEditingStore)"
              placeholder="Enter branch name"
            />
          </div>
          <div>
            <label :class="labelClass">Business type</label>
            <input
              v-model="storeInfo.businessType"
              type="text"
              :disabled="!canEditSettings || !isEditingStore"
              :class="inputClass(canEditSettings && isEditingStore)"
              placeholder="Enter business type"
            />
          </div>
          <div>
            <label :class="labelClass">Email</label>
            <input
              v-model="storeInfo.email"
              type="email"
              :disabled="!canEditSettings || !isEditingStore"
              :class="inputClass(canEditSettings && isEditingStore)"
              placeholder="Enter store email"
            />
          </div>
          <div>
            <label :class="labelClass">Phone</label>
            <input
              v-model="storeInfo.phone"
              type="tel"
              :disabled="!canEditSettings || !isEditingStore"
              :class="inputClass(canEditSettings && isEditingStore)"
              placeholder="Enter phone number"
            />
          </div>
          <div class="sm:col-span-2">
            <label :class="labelClass">Address</label>
            <textarea
              v-model="storeInfo.address"
              rows="2"
              :disabled="!canEditSettings || !isEditingStore"
              :class="[inputClass(canEditSettings && isEditingStore), 'resize-none']"
              placeholder="Enter store address"
            />
          </div>
        </div>
      </DashboardSettingsPanel>

      <!-- Inventory settings -->
      <DashboardSettingsPanel
        title="Inventory"
        subtitle="Stock alerts and defaults for new products."
        compact
      >
        <template #actions>
          <Button
            v-if="canEditSettings"
            variant="primary"
            size="sm"
            :class="headerBtnClass"
            aria-label="Save inventory settings"
            @click="saveInventorySettings"
          >
            Save
          </Button>
          <span v-else :class="viewOnlyBadgeClass">View only</span>
        </template>

        <div class="space-y-0">
          <div :class="settingRowClass">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                Low stock alert threshold
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Alert when stock falls below this quantity
              </p>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="inventorySettings.lowStockThreshold"
                type="number"
                min="1"
                :disabled="!canEditSettings"
                :class="[
                  'w-16 px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30',
                  canEditSettings
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    : 'bg-gray-100 dark:bg-gray-800/80 text-gray-500 cursor-not-allowed',
                ]"
              />
              <span class="text-xs text-gray-600 dark:text-gray-400">units</span>
            </div>
          </div>

          <div :class="settingRowClass">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                Auto-reorder enabled
              </p>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Create purchase orders when stock is low
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="inventorySettings.autoReorder"
                type="checkbox"
                :disabled="!canEditSettings"
                class="sr-only peer"
              />
              <div
                class="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-500"
              ></div>
            </label>
          </div>

          <div :class="[settingRowClass, '!border-0']">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Default category</p>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Default category for new products
              </p>
            </div>
            <select
              v-model="inventorySettings.defaultCategory"
              :disabled="!canEditSettings"
              :class="[inputClass(canEditSettings), '!w-auto min-w-[8rem]']"
            >
              <option value="general">General</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food & Beverages</option>
              <option value="office">Office Supplies</option>
            </select>
          </div>
        </div>
      </DashboardSettingsPanel>

      <!-- Payment methods at checkout -->
      <DashboardSettingsPanel
        title="Checkout payments"
        subtitle="Tender types on sales, including OPay, Moniepoint, transfer, and cash."
        compact
      >
        <template #actions>
          <Button
            v-if="canEditSettings"
            variant="primary"
            size="sm"
            :class="headerBtnClass"
            aria-label="Save payment methods"
            @click="savePaymentSettings"
          >
            Save
          </Button>
          <span v-else :class="viewOnlyBadgeClass">View only</span>
        </template>

        <div class="space-y-3">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">
            These appear on new sales and balance payments. Add labels your staff use at the
            counter.
          </p>
          <ul class="flex flex-wrap gap-1.5">
            <li
              v-for="(tender, index) in paymentTenders"
              :key="`${tender}-${index}`"
              class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 dark:bg-white/[0.08] dark:text-gray-200"
            >
              {{ tender }}
              <button
                v-if="canEditSettings"
                type="button"
                class="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                aria-label="Remove"
                @click="removePaymentTender(index)"
              >
                ×
              </button>
            </li>
          </ul>
          <div v-if="canEditSettings" class="flex flex-wrap items-center gap-2">
            <input
              v-model="newPaymentTender"
              type="text"
              :class="[inputClass(true), 'min-w-[10rem] flex-1']"
              placeholder="e.g. OPay, Moniepoint"
              @keydown.enter.prevent="addPaymentTender"
            />
            <Button variant="outline" size="sm" @click="addPaymentTender">Add</Button>
            <button
              type="button"
              class="text-[11px] font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              @click="resetPaymentTendersToDefault"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </DashboardSettingsPanel>

      <!-- Receipt & invoice settings -->
      <DashboardSettingsPanel
        title="Sales & receipts"
        subtitle="Numbering, prefixes, and print behavior."
        compact
      >
        <template #actions>
          <Button
            v-if="canEditSettings"
            variant="primary"
            size="sm"
            :class="headerBtnClass"
            aria-label="Save sales and receipt settings"
            @click="saveReceiptSettings"
          >
            Save
          </Button>
          <span v-else :class="viewOnlyBadgeClass">View only</span>
        </template>

        <div class="space-y-0">
          <div :class="settingRowClass">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Receipt prefix</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Prefix for receipt numbers (e.g. REC-)
              </p>
            </div>
            <input
              v-model="receiptSettings.prefix"
              type="text"
              :disabled="!canEditSettings"
              :class="[
                'w-24 px-2.5 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30',
                canEditSettings
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'bg-gray-100 dark:bg-gray-800/80 text-gray-500 cursor-not-allowed',
              ]"
              placeholder="REC-"
            />
          </div>

          <div :class="settingRowClass">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                Next receipt number
              </p>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Starting number for next receipt
              </p>
            </div>
            <input
              v-model.number="receiptSettings.nextNumber"
              type="number"
              min="1"
              :disabled="!canEditSettings"
              :class="[inputClass(canEditSettings), '!w-24']"
            />
          </div>

          <div :class="[settingRowClass, '!border-0']">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                Print receipt automatically
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Print receipt after sale
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="receiptSettings.autoPrint"
                type="checkbox"
                :disabled="!canEditSettings"
                class="sr-only peer"
              />
              <div
                class="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-500"
              ></div>
            </label>
          </div>
        </div>
      </DashboardSettingsPanel>

      <!-- Data export -->
      <DashboardSettingsPanel
        title="Data export"
        subtitle="Download Excel backups of inventory (by category folder), sales, buybacks, and stock loans for this branch."
        compact
      >
        <div class="space-y-4">
          <p class="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            Inventory exports as a ZIP: one folder per category, each with an
            <code class="rounded bg-black/5 px-1 py-0.5 text-[10px] dark:bg-white/10">items.xlsx</code>
            file, plus a
            <code class="rounded bg-black/5 px-1 py-0.5 text-[10px] dark:bg-white/10">categories.xlsx</code>
            index. Sales, buybacks, and stock loans download as separate Excel files. Large stores may
            take a moment to gather.
          </p>

          <ul class="grid gap-2 sm:grid-cols-2">
            <li
              v-for="item in dataExportItems"
              :key="item.key"
              class="rounded-lg bg-gray-50/70 px-3 py-2.5 text-[11px] text-gray-600 dark:bg-white/[0.03] dark:text-gray-400"
            >
              <p class="font-medium text-gray-800 dark:text-gray-200">{{ item.label }}</p>
              <p class="mt-0.5">{{ item.description }}</p>
            </li>
          </ul>

          <div class="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :class="headerBtnClass"
              :disabled="dataExporting"
              :loading="dataExporting && !dataExportStatus"
              @click="handleExportAllStoreData"
            >
              {{ dataExporting && !dataExportStatus ? 'Exporting…' : 'Export all to Excel' }}
            </Button>
            <p v-if="dataExportStatus" class="text-[11px] text-gray-500 dark:text-gray-400">
              {{ dataExportStatus }}
            </p>
          </div>
        </div>
      </DashboardSettingsPanel>
    </div>
  </div>

  <!-- Create/Edit Branch (slide-over) -->
  <SidePanel
    v-model="showCreateModal"
    :title="editingStore ? 'Edit Branch' : 'Create Branch'"
    :subtitle="
      editingStore
        ? 'Update branch details.'
        : 'Add a new branch with name, description, and contact info.'
    "
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
          class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
          placeholder="My Branch"
        />
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
          >Description</label
        >
        <textarea
          v-model="storeForm.description"
          rows="2"
          class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none resize-none"
          placeholder="Store description..."
        />
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Sell screen note
        </label>
        <p class="mb-1.5 text-[10px] text-gray-500 dark:text-gray-400">
          Shown on Quick Sale and when adding line items / checkout for this branch (e.g. today’s
          promo, price list).
        </p>
        <textarea
          v-model="storeForm.sellScreenNote"
          rows="3"
          class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none resize-y"
          placeholder="e.g. Promo: 10% off accessories today"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Address</label
        >
        <input
          v-model="storeForm.address"
          type="text"
          class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
          placeholder="123 Main St, City, State ZIP"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Phone</label
          >
          <input
            v-model="storeForm.phone"
            type="tel"
            class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
            placeholder="+1234567890"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Email</label
          >
          <input
            v-model="storeForm.email"
            type="email"
            class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30 outline-none"
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
      <Button variant="outline" size="sm" @click="closeStoreModal" extra-class="!rounded-2xl"
        >Cancel</Button
      >
      <Button
        size="sm"
        @click="handleStoreSubmit"
        :disabled="!storeForm.name || isSubmittingStore"
        extra-class="!rounded-2xl"
      >
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
        Are you sure you want to delete <strong>{{ storeToDelete?.name }}</strong
        >?
      </p>
      <p class="text-xs text-red-600 dark:text-red-400">
        All data associated with this store (departments, staff, inventory, sales) will need to
        be handled separately.
      </p>
    </div>

    <template #footer>
      <Button
        variant="outline"
        size="sm"
        @click="showDeleteModal = false"
        extra-class="!rounded-2xl"
        >Cancel</Button
      >
      <Button
        variant="danger"
        size="sm"
        @click="handleStoreDelete"
        :disabled="isDeletingStore"
        extra-class="!rounded-2xl"
      >
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
      <p class="text-xs text-gray-700 dark:text-gray-300">Please select this store to continue.</p>
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <button
          v-for="store in storesStore.stores"
          :key="store.id"
          @click="handleStoreSelection(store.id)"
          class="w-full rounded-sm p-3 text-left transition-all"
          :class="
            newlyCreatedStoreId === store.id
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          "
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {{ store.name }}
              </h3>
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
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  </Modal>

  <TotpConfirmModal
    v-model="totpModalOpen"
    title="Confirm upgrade"
    description="Enter your authenticator code to start the subscription upgrade."
    @confirm="confirmTotp"
    @cancel="cancelTotp"
  />
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
  TrashIcon,
} from '~/utils/app-icons'
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
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_FEATURE_SUMMARY,
  type SubscriptionPlan,
} from '~/types/subscription'
import {
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_BILLING_CYCLES,
  type SubscriptionBillingCycle,
} from '~/types/subscription-billing'
import {
  initializePaystackSubscription,
  type PaystackInitializeFetcher,
} from '~/utils/paystack-upgrade'
import { getEffectiveApiBase } from '~/utils/capacitor-api-base'
import TotpConfirmModal from '~/components/security/TotpConfirmModal.vue'
import { useTotpConfirmModal } from '~/composables/useTotpConfirmModal'
import { resolveTotpForSensitiveAction } from '~/utils/security-api-errors'
import {
  BILLING_BLOCKED_USER_MESSAGE,
  extractUploadFailureMessage,
  isBillingDelinquentMessage,
} from '~/utils/storage-billing-errors'
import { isCloudinaryUrl, optimizeCloudinaryLogo } from '~/utils/cloudinary'
import {
  resolveStaffWorkspaceContext,
  applyWorkspaceToSettingsStoreInfo,
  fillSettingsStoreInfoFromStore,
  type StaffWorkspaceContext,
} from '~/composables/useStaffWorkspaceContext'
import { DEFAULT_PAYMENT_TENDERS, normalizePaymentTenderList } from '~/utils/payment-tenders'
import { useStoreDataExport } from '~/composables/useStoreDataExport'

type AccountLogoUploadResult = { url: string; path: string }

definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Settings - Storvv',
})

const {
  eyebrowClass,
  pageTitleClass,
  descriptionClass,
  pageClass,
  pageStackClass,
  headerBtnClass,
  headerBtnLabelClass,
  labelClass,
  inputClass,
  editLinkClass,
  cancelLinkClass,
  viewOnlyBadgeClass,
  settingRowClass,
  storeBranchCardClass,
  storeBranchCardActiveClass,
} = useDashboardSettingsChrome()

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
const { authFetch, getAuthHeaders } = useAuthenticatedFetch()
const inventoryStore = useInventoryStore()
const toast = useAppToast()

const {
  exporting: dataExporting,
  exportStatus: dataExportStatus,
  exportAllStoreData,
} = useStoreDataExport()

const dataExportItems = [
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'ZIP archive — one folder per category with items.xlsx inside.',
  },
  {
    key: 'receipts',
    label: 'Sales',
    description: 'Sales with line items, totals, and payment status.',
  },
  {
    key: 'buybacks',
    label: 'Customer buybacks',
    description: 'Items bought from customers, prices, and payment method.',
  },
  {
    key: 'stock-loans',
    label: 'Stock loans',
    description: 'Loaned inventory with borrower details and item lines.',
  },
] as const

async function handleExportAllStoreData() {
  try {
    const summary = await exportAllStoreData()
    toast.success(
      `Exported: inventory ZIP (${summary.inventory.folders} categories, ${summary.inventory.items} product(s)), ${summary.receipts.count} sale(s), ${summary.buybacks.count} buyback(s), ${summary.stockLoans.count} stock loan(s).`
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed'
    toast.error(message)
  }
}
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
  return SUBSCRIPTION_PLANS.find((p) => p.id === currentSubscription.value)?.name || 'Storvv Micro'
})

/** Free tier: single store; show upgrade message for multiple branches */
const isMicroSubscription = computed(() => currentSubscription.value === 'storvv_micro')
const upgradeOptions = computed(() => {
  const currentIdx = subscriptionOrder.indexOf(currentSubscription.value)
  return SUBSCRIPTION_PLANS.filter((p) => subscriptionOrder.indexOf(p.id) > currentIdx)
})
const selectedUpgradePlan = ref<SubscriptionPlan | ''>('')
const selectedBillingCycle = ref<SubscriptionBillingCycle>('monthly')
const isUpgradingSubscription = ref(false)
const {
  open: totpModalOpen,
  prompt: promptTotp,
  confirm: confirmTotp,
  cancel: cancelTotp,
} = useTotpConfirmModal()

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
    const totpCode = await resolveTotpForSensitiveAction(promptTotp)
    const headers = await getAuthHeaders()
    const result = await initializePaystackSubscription(
      {
        planId: selectedUpgradePlan.value,
        email: currentUser.value.email || '',
        userId: currentUser.value.uid,
        billingCycle: selectedBillingCycle.value,
        totpCode,
      },
      $fetch as PaystackInitializeFetcher,
      getEffectiveApiBase() || undefined,
      headers
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

const staffWorkspace = ref<StaffWorkspaceContext>({
  staff: null,
  store: null,
  storeName: '',
  storeEmail: '',
  storePhone: '',
  storeAddress: '',
  businessType: '',
  departmentName: '',
  departmentId: '',
  staffRole: '',
  position: '',
})

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
  sellScreenNote: '',
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
    const body = new FormData()
    body.append('file', file)
    try {
      return await authFetch<AccountLogoUploadResult>('/api/storage/upload-account-logo', {
        method: 'POST',
        body,
      })
    } catch (apiErr: unknown) {
      const serverHint = extractUploadFailureMessage(apiErr)
      if (isBillingDelinquentMessage(serverHint)) {
        throw new Error(BILLING_BLOCKED_USER_MESSAGE)
      }
      throw new Error(
        `Could not complete upload (${serverHint}). Please try again or contact Storvv support if this continues.`
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
    const msg = err instanceof Error ? err.message : getFirebaseStorageErrorMessage(err)
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

const paymentTenders = ref<string[]>([...DEFAULT_PAYMENT_TENDERS])
const newPaymentTender = ref('')

function addPaymentTender() {
  const label = newPaymentTender.value.trim()
  if (!label) return
  if (!paymentTenders.value.some((t) => t.toLowerCase() === label.toLowerCase())) {
    paymentTenders.value.push(label)
  }
  newPaymentTender.value = ''
}

function removePaymentTender(index: number) {
  paymentTenders.value.splice(index, 1)
}

function resetPaymentTendersToDefault() {
  paymentTenders.value = [...DEFAULT_PAYMENT_TENDERS]
}

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
    sellScreenNote: '',
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
    sellScreenNote: store.sellScreenNote || '',
    address: store.address || '',
    phone: store.phone || '',
    email: store.email || '',
    isActive: store.isActive,
  }
  showCreateModal.value = true
}

const openCreateStoreModal = () => {
  if (!canAddStore.value) {
    toast.error(
      'Storvv Micro allows 1 store. Upgrade your plan in the Account section to add more.'
    )
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
    const storePayload = {
      name: storeForm.value.name,
      description: storeForm.value.description,
      sellScreenNote: storeForm.value.sellScreenNote.trim(),
      address: storeForm.value.address,
      phone: storeForm.value.phone,
      email: storeForm.value.email,
      isActive: storeForm.value.isActive,
    }
    if (editingStore.value) {
      await storesStore.updateStore(editingStore.value.id, storePayload)
      toast.success('Store updated successfully')
      closeStoreModal()
    } else {
      const wasFirstStore = storesStore.stores.length === 0
      const logoUrl = userStore.userData?.storeLogoUrl || ''
      const newStoreId = await storesStore.createStore({ ...storePayload, logoUrl })
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
            // console.log('[Settings] Staff user detected, using super admin UID:', userId)
          }
        }
      }
    } catch (error: any) {
      console.warn(
        '[Settings] Could not fetch staff document, using current user UID:',
        error.message
      )
    }
  }

  return userId
}

async function loadSettingsFromFirestore() {
  if (!currentUser.value) {
    isLoadingStoreInfo.value = false
    return
  }
  isLoadingStoreInfo.value = true
  try {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      await userStore.fetchUserData(currentUser.value.uid)
      await storesStore.fetchStores()
      await storesStore.initializeCurrentStore()
      const userData = userStore.userData
      if (userData?.storeDetails) {
        storeInfo.name = userData.storeDetails.storeName || storeInfo.name
        storeInfo.email = userData.storeDetails.storeEmail || storeInfo.email
        storeInfo.phone = userData.storeDetails.storePhone || storeInfo.phone
        storeInfo.address = userData.storeDetails.storeAddress || storeInfo.address
        storeInfo.businessType = userData.storeDetails.storeDescription || storeInfo.businessType
        const settings = userData.storeDetails.settings
        if (settings?.inventory) {
          inventorySettings.lowStockThreshold =
            settings.inventory.lowStockThreshold ?? inventorySettings.lowStockThreshold
          inventorySettings.autoReorder =
            settings.inventory.autoReorder ?? inventorySettings.autoReorder
          inventorySettings.defaultCategory =
            settings.inventory.defaultCategory || inventorySettings.defaultCategory
        }
        if (settings?.receipt) {
          receiptSettings.prefix = settings.receipt.prefix || receiptSettings.prefix
          receiptSettings.nextNumber = settings.receipt.nextNumber ?? receiptSettings.nextNumber
          receiptSettings.autoPrint = settings.receipt.autoPrint ?? receiptSettings.autoPrint
        }
        if (settings?.payment?.paymentMethods) {
          paymentTenders.value = normalizePaymentTenderList(settings.payment.paymentMethods)
        }
        Object.assign(backupStoreInfo, { ...storeInfo })
      }
      return
    }
    if (!userStore.userData) {
      await userStore.fetchUserData(currentUser.value.uid)
    }
    if (userStore.isSuperAdmin) {
      await storesStore.fetchStores()
      await storesStore.initializeCurrentStore()
    } else if (isStaff.value) {
      const ctx = await resolveStaffWorkspaceContext()
      staffWorkspace.value = ctx
      applyWorkspaceToSettingsStoreInfo(storeInfo, ctx)
      fillSettingsStoreInfoFromStore(storeInfo, ctx.store || storesStore.currentStore)
      Object.assign(backupStoreInfo, { ...storeInfo })
    }
    const targetUserId = await getTargetUserId()
    if (!targetUserId) return
    const userData = await getUserDocument(targetUserId)
    if (userData?.storeDetails) {
      if (!isStaff.value) {
        storeInfo.name = userData.storeDetails.storeName || ''
        storeInfo.email = userData.storeDetails.storeEmail || ''
        storeInfo.phone = userData.storeDetails.storePhone || ''
        storeInfo.address = userData.storeDetails.storeAddress || ''
        storeInfo.businessType = userData.storeDetails.storeDescription || ''
        Object.assign(backupStoreInfo, { ...storeInfo })
      } else if (!storeInfo.name) {
        storeInfo.name = userData.storeDetails.storeName || ''
        storeInfo.email = userData.storeDetails.storeEmail || storeInfo.email
        storeInfo.phone = userData.storeDetails.storePhone || storeInfo.phone
        storeInfo.address = userData.storeDetails.storeAddress || storeInfo.address
        storeInfo.businessType = userData.storeDetails.storeDescription || storeInfo.businessType
        Object.assign(backupStoreInfo, { ...storeInfo })
      }
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
        if (settings.payment?.paymentMethods) {
          paymentTenders.value = normalizePaymentTenderList(settings.payment.paymentMethods)
        }
      }
    }
  } catch (error) {
    console.error('Error loading store info:', error)
  } finally {
    isLoadingStoreInfo.value = false
  }
}

// Load store information and settings from Firestore
onMounted(async () => {
  // Handle Paystack callback after payment redirect
  const refParam = route.query.reference as string | undefined
  const isPaystackCallback =
    route.query.paystack_callback === '1' || (refParam && String(refParam).startsWith('storvv_'))
  if (currentUser.value && refParam && isPaystackCallback) {
    try {
      const verify = (await authFetch(
        `/api/paystack/verify?reference=${encodeURIComponent(refParam)}`
      )) as {
        success?: boolean
        paid?: boolean
        userId?: string
        planId?: string
        message?: string
      }
      if (verify.paid && verify.userId === currentUser.value.uid && verify.planId) {
        // Subscription is persisted server-side during verification; refresh local user data.
        await userStore.fetchUserData(currentUser.value.uid)
        toast.success(
          `Upgraded to ${
            SUBSCRIPTION_PLANS.find((p) => p.id === verify.planId)?.name || 'new plan'
          }`
        )
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
    await loadSettingsFromFirestore()
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

const savePaymentSettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  const methods = normalizePaymentTenderList(paymentTenders.value)
  paymentTenders.value = methods
  await updateStoreSettings({
    payment: { paymentMethods: methods },
  })
  toast.success('Payment methods saved')
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
