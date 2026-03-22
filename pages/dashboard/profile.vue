<template>
    <!-- Minimal page header -->
    <div class="mb-6 sm:mb-8">
      <p class="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">Account</p>
      <h1 class="mt-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Profile</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
      <!-- Profile card: clean, modern -->
      <div class="lg:col-span-1 w-full shrink-0">
        <div class="relative rounded-2xl bg-white dark:bg-gray-800/90 shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-700/50 overflow-hidden">
          <div class="relative p-6 sm:p-7 flex flex-col items-center text-center">
            <!-- Avatar -->
            <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden bg-primary-400 ring-4 ring-white dark:ring-gray-800 shadow-lg">
              {{ profileAvatarInitials }}
            </div>
            <div v-if="isLoadingProfile" class="space-y-2 w-full mt-4 max-w-[180px] mx-auto">
              <div class="h-4 bg-gray-200/80 dark:bg-gray-700/80 rounded-md animate-pulse" />
              <div class="h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded animate-pulse" />
              <div class="h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded animate-pulse w-3/4 mx-auto" />
            </div>
            <template v-else>
              <p class="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Business</p>
              <h2 class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                {{ leftCardHeading }}
              </h2>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-full px-2" :title="leftCardLine2 || ''">
                {{ leftCardLine2 || '—' }}
              </p>
              <p v-if="leftCardBadgeExtra" class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{{ leftCardBadgeExtra }}</p>
              <span class="mt-2.5 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide text-primary-500 dark:text-primary-400 bg-primary-400/10 dark:bg-primary-500/15 ring-1 ring-primary-400/20 dark:ring-primary-400/20">
                {{ profileData.role === 'staff' ? 'Staff' : (profileData.role === 'superAdmin' ? 'Super Admin' : profileData.role || 'User') }}
              </span>
            </template>
            <!-- Stats: clean row with dividers -->
            <div class="mt-6 w-full flex items-center justify-center gap-0 rounded-xl bg-gray-50/80 dark:bg-gray-900/50 py-3 px-2">
              <div class="flex-1 min-w-0">
                <p v-if="isLoadingStats" class="h-5 bg-gray-200/80 dark:bg-gray-700/80 rounded w-8 mx-auto animate-pulse" />
                <p v-else class="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{{ totalOrders }}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Orders</p>
              </div>
              <div class="w-px h-8 bg-gray-200/80 dark:bg-gray-600/60" />
              <div class="flex-1 min-w-0">
                <p v-if="isLoadingStats" class="h-5 bg-gray-200/80 dark:bg-gray-700/80 rounded w-8 mx-auto animate-pulse" />
                <p v-else class="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{{ totalProducts }}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Products</p>
              </div>
              <div class="w-px h-8 bg-gray-200/80 dark:bg-gray-600/60" />
              <div class="flex-1 min-w-0">
                <p v-if="isLoadingStats" class="h-5 bg-gray-200/80 dark:bg-gray-700/80 rounded w-8 mx-auto animate-pulse" />
                <p v-else class="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{{ totalCustomers }}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p v-if="isStaff" class="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Staff</p>
            <h2 class="text-xs font-semibold text-gray-900 dark:text-gray-100">{{ isStaff ? 'Staff profile' : 'Business profile' }}</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ isStaff ? 'Your details as a team member' : 'Update your business details' }}</p>
          </div>
          <div v-if="!isEditingPersonalInfo">
            <button @click="enableEditing('personal')" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Edit</button>
          </div>
          <div v-else class="flex gap-1.5">
            <button @click="cancelEditing('personal')" class="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button @click="savePersonalInfo" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors">Save changes</button>
          </div>
        </div>
        <div class="p-3 sm:p-4">
          <!-- Super admin: business name + contact -->
          <div v-if="!isStaff" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business name</label>
              <input v-model="profileData.businessName" type="text" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Your business or store name" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input v-model="profileData.email" type="email" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Enter email" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              <input v-model="profileData.phone" type="tel" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Business phone" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
              <textarea v-model="profileData.bio" rows="2" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Tell customers about your business" />
            </div>
          </div>
          <!-- Staff: personal name + contact -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">First name</label>
              <input v-model="profileData.firstName" type="text" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="First name" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last name</label>
              <input v-model="profileData.lastName" type="text" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Last name" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input v-model="profileData.email" type="email" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Work email" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              <input v-model="profileData.phone" type="tel" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Phone" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
              <textarea v-model="profileData.bio" rows="2" :disabled="!isEditingPersonalInfo" :class="['w-full px-3 py-2 text-xs rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30', isEditingPersonalInfo ? 'bg-white dark:bg-gray-800 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60 text-gray-500 cursor-not-allowed']" placeholder="Optional note" />
            </div>
          </div>
        </div>
        </div>

        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
          <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Account settings</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage your account preferences</p>
          </div>
          <div class="p-3 sm:p-4 space-y-0">
            <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <LanguageIcon class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Language</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.language }}</p>
                </div>
              </div>
              <button @click="showLanguageModal = true" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Change</button>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <GlobeAltIcon class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Region</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.region }}</p>
                </div>
              </div>
              <button @click="showRegionModal = true" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Change</button>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CurrencyDollarIcon class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Currency</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.currency }}</p>
                </div>
              </div>
              <button @click="showCurrencyModal = true" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Change</button>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <BellIcon class="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Notifications</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.notifications }}</p>
                </div>
              </div>
              <button @click="showNotificationsModal = true" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Manage</button>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <MoonIcon class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Theme</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.theme }}</p>
                </div>
              </div>
              <button @click="showThemeModal = true" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Change</button>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <CalendarIcon class="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Timezone</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.timezone }}</p>
                </div>
              </div>
              <button @click="showTimezoneModal = true" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Change</button>
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
          <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Security</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage your security settings</p>
          </div>
          <div class="p-3 sm:p-4 space-y-0">
            <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <KeyIcon class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Password</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
                </div>
              </div>
              <button @click="showPasswordModal = true" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors">Change</button>
            </div>
            <div class="flex items-center justify-between py-2.5 border-b border-gray-200/80 dark:border-gray-700/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShieldCheckIcon class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ securitySettings.twoFactor ? 'Enabled' : 'Not enabled' }}</p>
                </div>
              </div>
              <button @click="handle2FAToggle" :class="['px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', securitySettings.twoFactor ? 'bg-red-600 hover:bg-red-700 text-white' : 'ring-1 ring-gray-200/80 dark:ring-gray-600/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300']">{{ securitySettings.twoFactor ? 'Disable' : 'Enable' }}</button>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <DevicePhoneMobileIcon class="w-3.5 h-3.5 text-primary-500 dark:text-primary-400" />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Active sessions</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ securitySettings.activeSessions }} devices</p>
                </div>
              </div>
              <button @click="showSessionsModal = true" class="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">View all</button>
            </div>
          </div>
        </div>

        <div v-if="storeInfo.storeName || isLoadingProfile" class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
          <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Store information</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your store details from onboarding</p>
          </div>
          <div class="p-3 sm:p-4">
            <div v-if="isLoadingProfile" class="space-y-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-xl w-3/4 animate-pulse"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/2 animate-pulse"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-xl w-2/3 animate-pulse"></div>
            </div>
            <div v-else-if="storeInfo.storeName" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Branch name</p>
                  <p class="text-xs text-gray-900 dark:text-gray-100">{{ storeInfo.storeName }}</p>
                </div>
                <div v-if="storeInfo.storeEmail">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Store email</p>
                  <p class="text-xs text-gray-900 dark:text-gray-100">{{ storeInfo.storeEmail }}</p>
                </div>
                <div v-if="storeInfo.storePhone">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Store phone</p>
                  <p class="text-xs text-gray-900 dark:text-gray-100">{{ storeInfo.storePhone }}</p>
                </div>
                <div v-if="storeInfo.storeDescription">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
                  <p class="text-xs text-gray-900 dark:text-gray-100">{{ storeInfo.storeDescription }}</p>
                </div>
              </div>
              <div v-if="storeInfo.storeAddress">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Address</p>
                <p class="text-xs text-gray-900 dark:text-gray-100">{{ storeInfo.storeAddress }}</p>
              </div>
              <div class="pt-4 border-t border-gray-200/80 dark:border-gray-700/80">
                <NuxtLink to="/dashboard/settings" class="text-xs font-medium text-primary-500 dark:text-primary-400 hover:underline inline-flex items-center gap-1.5">Manage store settings →</NuxtLink>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">No store information available.</p>
              <NuxtLink to="/dashboard/settings" class="inline-block px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors">Set up store information</NuxtLink>
            </div>
          </div>
        </div>

        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
          <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xs font-semibold text-gray-900 dark:text-gray-100">Roles & permissions</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your current role and access permissions</p>
            </div>
            <span class="px-2.5 py-1 text-xs font-medium rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">
              {{ profileData.role === 'staff' ? 'Staff Member' : (profileData.role === 'superAdmin' ? 'Super Admin' : profileData.role || 'User') }}
            </span>
          </div>
          <div class="p-3 sm:p-4 space-y-3">
            <div class="p-3 rounded-xl bg-primary-50/80 dark:bg-primary-900/20 ring-1 ring-primary-200/60 dark:ring-primary-700/40">
              <p class="text-xs font-medium text-primary-900 dark:text-primary-100 mb-1.5">
                {{ profileData.role === 'staff' ? 'Staff Member' : (profileData.role === 'superAdmin' ? 'Super Admin' : profileData.role || 'User') }}
              </p>
              <p class="text-xs text-primary-600 dark:text-primary-200 leading-relaxed">
                <template v-if="profileData.role === 'staff'">
                  As a Staff Member, you have access to view and manage inventory, receipts, and customer data within your assigned store and department. Your permissions are managed by your Super Admin.
                </template>
                <template v-else-if="profileData.role === 'superAdmin' || !profileData.role">
                  As a Super Admin, you have full access to all features and settings in the system. You are the account owner and have complete control over your store operations.
                </template>
                <template v-else>
                  Your role: {{ profileData.role }}. Contact your administrator for more information about your permissions.
                </template>
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1.5">Your permissions</p>
              <div v-if="userPermissions.length === 0" class="text-xs text-gray-500 dark:text-gray-400 py-2">Loading permissions...</div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div v-for="permission in userPermissions" :key="permission" class="flex items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/60 dark:ring-gray-600/60">
                  <CheckCircleIcon class="w-3.5 h-3.5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span class="text-xs text-gray-700 dark:text-gray-100">{{ permission }}</span>
                </div>
              </div>
            </div>
            <div class="pt-3 border-t border-gray-200/80 dark:border-gray-700/80">
              <div class="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200/60 dark:ring-blue-700/40">
                <InformationCircleIcon class="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">About your role</p>
                  <p class="text-xs text-gray-600 dark:text-gray-200 leading-relaxed">
                    <template v-if="profileData.role === 'staff'">
                      You are a staff member with access to your assigned store and department. Contact your Super Admin if you need additional permissions or have questions about your access.
                    </template>
                    <template v-else>
                      You created this account and are the primary administrator. You can manage all aspects of the system including team members, settings, and data management.
                    </template>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme Change Modal -->
    <Modal v-model="showThemeModal" title="Change Theme" size="md">
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-400">Select your preferred theme</p>
        <div class="space-y-2">
          <button
            v-for="themeOption in themeOptions"
            :key="themeOption.value"
            @click="selectTheme(themeOption.value as 'light' | 'dark' | 'system')"
            :class="[
              'w-full p-4 rounded-md border-2 transition-all text-left',
              currentThemeValue === themeOption.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ themeOption.label }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ themeOption.description }}</p>
              </div>
              <div v-if="currentThemeValue === themeOption.value" class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <CheckCircleIcon class="w-4 h-4 text-white" />
              </div>
            </div>
          </button>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showThemeModal = false">Close</Button>
      </template>
    </Modal>

    <!-- Language Selection Modal -->
    <Modal v-model="showLanguageModal" title="Change Language" size="md">
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-400">Select your preferred language</p>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <button
            v-for="lang in languages"
            :key="lang.code"
            @click="selectLanguage(lang.code, lang.name)"
            :class="[
              'w-full p-4 rounded-md border-2 transition-all text-left',
              accountSettings.language === lang.name
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ lang.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ lang.nativeName }}</p>
              </div>
              <div v-if="accountSettings.language === lang.name" class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <CheckCircleIcon class="w-4 h-4 text-white" />
              </div>
            </div>
          </button>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showLanguageModal = false">Close</Button>
      </template>
    </Modal>

    <!-- Notifications Settings Modal -->
    <Modal v-model="showNotificationsModal" title="Notification Preferences" size="lg">
      <div class="space-y-4 sm:space-y-5">
        <div class="space-y-4">
          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive notifications via email</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="notificationSettings.email"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive push notifications in browser</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="notificationSettings.push"
                type="checkbox"
                class="sr-only peer"
                @change="handlePushNotificationToggle"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">SMS Notifications</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive notifications via SMS</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="notificationSettings.sms"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between py-4">
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">In-App Notifications</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Show notifications within the app</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="notificationSettings.inApp"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showNotificationsModal = false">Cancel</Button>
        <Button @click="saveNotificationSettings">Save Changes</Button>
      </template>
    </Modal>

    <!-- Password Change Modal -->
    <Modal v-model="showPasswordModal" title="Change Password" size="md">
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-400">Enter your current password and choose a new one</p>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Current Password
            </label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              New Password
            </label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              :minlength="PASSWORD_MIN_LENGTH"
              autocomplete="new-password"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="At least 12 characters, number and capital letter"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              At least {{ PASSWORD_MIN_LENGTH }} characters, one number, one uppercase letter.
            </p>
            <ul
              v-if="passwordForm.newPassword.length > 0"
              class="mt-2 space-y-0.5 text-[10px] leading-tight text-gray-600 dark:text-gray-400"
              aria-label="Password requirements"
            >
              <li v-for="rule in passwordRuleChecks" :key="rule.id" class="flex items-center gap-1.5">
                <span
                  :class="rule.ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'"
                  aria-hidden="true"
                  >{{ rule.ok ? '✓' : '○' }}</span
                >
                <span>{{ rule.label }}</span>
              </li>
            </ul>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Confirm new password"
            />
            <p v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="text-xs text-red-500 mt-1">
              Passwords do not match
            </p>
          </div>
          <div v-if="passwordError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-xs text-red-600 dark:text-red-400">{{ passwordError }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showPasswordModal = false; resetPasswordForm()">Cancel</Button>
        <Button
          @click="handlePasswordChange"
          :disabled="
            isChangingPassword ||
            !passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            passwordForm.newPassword !== passwordForm.confirmPassword ||
            !isPasswordPolicyValid(passwordForm.newPassword)
          "
        >
          <span v-if="isChangingPassword" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Changing...
          </span>
          <span v-else>Change Password</span>
        </Button>
      </template>
    </Modal>

    <!-- Active Sessions Modal -->
    <Modal v-model="showSessionsModal" title="Active Sessions" size="lg">
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-400">Manage devices where you're currently signed in</p>
        <div v-if="isLoadingSessions" class="space-y-3">
          <div v-for="i in 3" :key="i" class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md">
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 animate-pulse"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4 animate-pulse"></div>
            </div>
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-16 animate-pulse"></div>
          </div>
        </div>
        <div v-else-if="activeSessions.length === 0" class="text-center py-8">
          <p class="text-xs text-gray-500 dark:text-gray-400">No active sessions found</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(session, index) in activeSessions"
            :key="index"
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <DevicePhoneMobileIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ session.device }}</p>
                  <span v-if="session.current" class="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                    Current
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ session.location }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Last active: {{ formatDate(session.lastActive) }}</p>
              </div>
              <button
                v-if="!session.current"
                @click="revokeSession(index)"
                class="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showSessionsModal = false">Close</Button>
        <Button variant="danger" @click="revokeAllSessions" v-if="activeSessions.length > 1">Revoke All Others</Button>
      </template>
    </Modal>

    <!-- Region Selection Modal -->
    <Modal v-model="showRegionModal" title="Change Region" size="md">
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-400">Select your region</p>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <button
            v-for="region in regions"
            :key="region.code"
            @click="selectRegion(region.code, region.name)"
            :class="[
              'w-full p-4 rounded-md border-2 transition-all text-left',
              accountSettings.region === region.name
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ region.flag }}</span>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ region.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ region.code }}</p>
                </div>
              </div>
              <div v-if="accountSettings.region === region.name" class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <CheckCircleIcon class="w-4 h-4 text-white" />
              </div>
            </div>
          </button>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showRegionModal = false">Close</Button>
      </template>
    </Modal>

    <!-- Currency Selection Modal -->
    <Modal v-model="showCurrencyModal" title="Change Currency" size="md">
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-400">Select your currency</p>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <button
            v-for="currency in currencies"
            :key="currency.code"
            @click="selectCurrency(currency.code, currency.name, currency.symbol)"
            :class="[
              'w-full p-4 rounded-md border-2 transition-all text-left',
              accountSettings.currency === currency.code
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ currency.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ currency.symbol }} {{ currency.code }}</p>
              </div>
              <div v-if="accountSettings.currency === currency.code" class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <CheckCircleIcon class="w-4 h-4 text-white" />
              </div>
            </div>
          </button>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showCurrencyModal = false">Close</Button>
      </template>
    </Modal>

    <!-- Timezone Selection Modal -->
    <Modal v-model="showTimezoneModal" title="Change Timezone" size="md">
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-400">Select your timezone</p>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Timezone
          </label>
          <select
            v-model="selectedTimezone"
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
              {{ tz.label }}
            </option>
          </select>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showTimezoneModal = false">Cancel</Button>
        <Button @click="saveTimezone">Save</Button>
      </template>
    </Modal>

    <!-- 2FA Setup Modal -->
    <TwoFactorSetup
      v-model="show2FASetupModal"
      @success="handle2FASetupSuccess"
      @error="handle2FAError"
    />

    <!-- 2FA Disable Modal -->
    <Modal v-model="show2FADisableModal" title="Disable Two-Factor Authentication" size="md">
      <div class="space-y-4">
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Please enter your password to disable two-factor authentication.
        </p>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Password
          </label>
          <input
            v-model="disable2FAPassword"
            type="password"
            class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Enter your password"
            @keyup.enter="handleDisable2FA"
          />
        </div>
        <div v-if="disable2FAError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-xs text-red-600 dark:text-red-400">{{ disable2FAError }}</p>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="show2FADisableModal = false; disable2FAPassword = ''; disable2FAError = ''">Cancel</Button>
        <Button variant="danger" @click="handleDisable2FA" :disabled="isDisabling2FA || !disable2FAPassword">
          <span v-if="isDisabling2FA" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Disabling...
          </span>
          <span v-else>Disable 2FA</span>
        </Button>
      </template>
    </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import {
  LanguageIcon,
  BellIcon,
  MoonIcon,
  CalendarIcon,
  KeyIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useTheme } from '~/composables/useTheme'
import { usePreferences, currencies, regions } from '~/composables/usePreferences'
import { useToast } from '~/composables/useToast'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomersStore } from '~/stores/customers'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { useStaffStore } from '~/stores/staff'
import { useStoresStore } from '~/stores/stores'
import type { Staff } from '~/composables/useStaff'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import TwoFactorSetup from '~/components/auth/TwoFactorSetup.vue'
import {
  PASSWORD_MIN_LENGTH,
  getPasswordRuleChecks,
  isPasswordPolicyValid,
  getPasswordPolicyErrors,
} from '~/utils/passwordPolicy'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Profile - Storvv',
})

// Profile data — super admin uses businessName (maps to user `name`); staff uses firstName/lastName for person
const profileData = reactive({
  businessName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  bio: '',
  role: '',
})

// Store information
const storeInfo = reactive({
  storeName: '',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  storeDescription: '',
})

// Backup for cancel
const backupData = reactive({ ...profileData })

// Edit state
const isEditingPersonalInfo = ref(false)
const isLoadingProfile = ref(true)
const isLoadingStats = ref(true)

// Get user data
const { currentUser, loading: authLoading } = useFirebaseAuth()
const { getUserDocument, updateUserDocument } = useUser()
const authStore = useAuthStore()
const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const customersStore = useCustomersStore()
const staffStore = useStaffStore()
const storesStore = useStoresStore()

/** Resolved staff record for signed-in staff (department, store, etc.) */
const currentStaffMember = ref<Staff | null>(null)

// Function to load profile data
const loadProfileData = async () => {
  if (!currentUser.value) {
    isLoadingProfile.value = false
    return
  }

  try {
    const userData = await getUserDocument(currentUser.value.uid)
    currentStaffMember.value = null
    profileData.businessName = ''

    if (userData) {
      profileData.email = userData.email || currentUser.value.email || ''
      profileData.role = userData.role || 'User'

      if (userData.role === 'staff') {
        try {
          const sm = await staffStore.fetchCurrentStaffMember()
          currentStaffMember.value = sm
          if (sm) {
            profileData.firstName = sm.firstName || ''
            profileData.lastName = sm.lastName || ''
            profileData.email = sm.email || userData.email || currentUser.value.email || ''
            profileData.phone = sm.phone || ''
          }
        } catch (e) {
          console.warn('Could not load staff member profile:', e)
          profileData.firstName = currentUser.value.displayName?.split(' ')[0] || ''
          profileData.lastName = currentUser.value.displayName?.split(' ').slice(1).join(' ') || ''
        }
      } else {
        profileData.businessName = (userData.name || '').trim()
        profileData.firstName = ''
        profileData.lastName = ''
      }

      // Load store details if available (super admin; staff may inherit org store info)
      if (userData.storeDetails) {
        storeInfo.storeName = userData.storeDetails.storeName || ''
        storeInfo.storeAddress = userData.storeDetails.storeAddress || ''
        storeInfo.storePhone = userData.storeDetails.storePhone || ''
        storeInfo.storeEmail = userData.storeDetails.storeEmail || ''
        storeInfo.storeDescription = userData.storeDetails.storeDescription || ''
      }

      if (userData.role === 'staff' && !storeInfo.storeName && storesStore.currentStore?.name) {
        storeInfo.storeName = storesStore.currentStore.name
      }

      // Load 2FA status from Firestore
      if (userData.twoFactorEnabled) {
        securitySettings.twoFactor = true
        if (import.meta.client) {
          localStorage.setItem('twoFactorEnabled', 'true')
        }
      }

      Object.assign(backupData, { ...profileData })
    } else {
      profileData.email = currentUser.value.email || ''
      profileData.firstName = currentUser.value.displayName?.split(' ')[0] || ''
      profileData.lastName = currentUser.value.displayName?.split(' ').slice(1).join(' ') || ''
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    if (currentUser.value?.email) {
      profileData.email = currentUser.value.email
    }
  } finally {
    isLoadingProfile.value = false
  }
}

// Computed properties for real stats
const totalOrders = computed(() => {
  return receiptsStore.totalReceipts || 0
})

const totalProducts = computed(() => {
  return inventoryStore.totalItems || 0
})

// Get unique customers from receipts (since customers store might not be used everywhere)
const totalCustomers = computed(() => {
  // Try to get from customers store first
  if (customersStore.customers.length > 0) {
    return customersStore.totalCustomers || 0
  }
  
  // Fallback: Count unique customers from receipts
  const customersMap = new Map<string, boolean>()
  receiptsStore.receipts.forEach(receipt => {
    if (receipt.customerEmail) {
      customersMap.set(receipt.customerEmail, true)
    }
  })
  return customersMap.size
})

// Load stats data
const loadStatsData = async () => {
  if (!authStore.currentUser) {
    isLoadingStats.value = false
    return
  }
  
  isLoadingStats.value = true
  
  try {
    // Fetch data in parallel
    await Promise.all([
      receiptsStore.fetchReceipts(),
      inventoryStore.fetchFolders(),
      customersStore.fetchCustomers().catch(() => {
        // If customers store fetch fails, we'll use receipts-based calculation
        console.warn('Could not fetch customers, will use receipts-based count')
      })
    ])
    
    // Load items for each folder to get accurate product count
    if (inventoryStore.folders.length > 0) {
      await Promise.all(
        inventoryStore.folders.map(folder => 
          inventoryStore.fetchItems(folder.id).catch(() => {
            // Ignore errors for individual folder item fetches
          })
        )
      )
    }
  } catch (error) {
    console.error('Error loading stats data:', error)
  } finally {
    isLoadingStats.value = false
  }
}

// Load profile and store information from Firestore + settings
onMounted(async () => {
  // Initialize preferences first
  await initPreferences()
  
  // Load stats data
  await loadStatsData()
  
  // Load preferences into accountSettings
  if (preferences.value) {
    const lang = languages.find(l => l.code === preferences.value.language)
    accountSettings.language = lang?.name || 'English (US)'
    
    const region = regions.find(r => r.code === preferences.value.region)
    accountSettings.region = region?.name || 'United States'
    
    const currency = currencies.find(c => c.code === preferences.value.currency)
    accountSettings.currency = currency ? `${currency.code} (${currency.symbol})` : 'USD ($)'
    
    const tz = timezones.find(t => t.value === preferences.value.timezone)
    accountSettings.timezone = tz?.label || 'UTC (GMT +0:00)'
    selectedTimezone.value = preferences.value.timezone || 'UTC'
  }
  
  if (import.meta.client) {
    // Load settings from localStorage
    // Load notification settings
    const savedNotifications = localStorage.getItem('notificationSettings')
    if (savedNotifications) {
      try {
        Object.assign(notificationSettings, JSON.parse(savedNotifications))
      } catch (e) {
        console.error('Error loading notification settings:', e)
      }
    }
    
    // Update notifications display
    const enabledTypes: string[] = []
    if (notificationSettings.email) enabledTypes.push('Email')
    if (notificationSettings.push) enabledTypes.push('Push')
    if (notificationSettings.sms) enabledTypes.push('SMS')
    if (notificationSettings.inApp) enabledTypes.push('In-App')
    accountSettings.notifications = enabledTypes.length > 0 ? enabledTypes.join(', ') : 'None'
    
    // Load 2FA status from localStorage (fallback)
    const saved2FA = localStorage.getItem('twoFactorEnabled')
    if (saved2FA !== null) {
      securitySettings.twoFactor = saved2FA === 'true'
    }
    
    // Update theme display
    accountSettings.theme = theme.value === 'system' ? 'Follow system' : theme.value === 'dark' ? 'Dark' : 'Light'
  }
  
  // Wait for auth to finish loading before loading profile data
  if (authLoading.value) {
    await new Promise((resolve) => {
      let resolved = false
      const unwatch = watch(authLoading, (val) => {
        if (!val && !resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      })
      
      // Timeout after 3 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      }, 3000)
    })
  }
  
  // Load profile data after auth is ready
  await loadProfileData()
})

// Watch for currentUser changes and reload profile data
watch(currentUser, async (newUser) => {
  if (newUser && !isLoadingProfile.value) {
    await loadProfileData()
  }
}, { immediate: false })

// Theme integration
const { theme, setTheme, actualTheme } = useTheme()

// Preferences integration
const { preferences, updatePreferences, initialize: initPreferences } = usePreferences()
const toast = useToast()

// Account settings
const accountSettings = reactive({
  language: 'English (US)',
  region: 'United States',
  currency: 'USD ($)',
  notifications: 'Email, Push, SMS',
  theme: 'Follow system',
  timezone: 'UTC (GMT +0:00)',
})

// Notification settings
const notificationSettings = reactive({
  email: true,
  push: false,
  sms: false,
  inApp: true,
})

// Password form
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref('')
const isChangingPassword = ref(false)

const passwordRuleChecks = computed(() => getPasswordRuleChecks(passwordForm.newPassword))

// Helper function to reset password form
const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordError.value = ''
}

// Security settings
const securitySettings = reactive({
  twoFactor: false,
  activeSessions: 3,
})

// Active sessions
const activeSessions = ref<Array<{ device: string; location: string; lastActive: string; current: boolean }>>([])
const isLoadingSessions = ref(false)

// Timezone
const selectedTimezone = ref('UTC')
const timezones = [
  { value: 'UTC', label: 'UTC (GMT +0:00)' },
  { value: 'America/New_York', label: 'Eastern Time (GMT -5:00)' },
  { value: 'America/Chicago', label: 'Central Time (GMT -6:00)' },
  { value: 'America/Denver', label: 'Mountain Time (GMT -7:00)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (GMT -8:00)' },
  { value: 'Europe/London', label: 'London (GMT +0:00)' },
  { value: 'Europe/Paris', label: 'Paris (GMT +1:00)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT +4:00)' },
  { value: 'Asia/Kolkata', label: 'Mumbai (GMT +5:30)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (GMT +8:00)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT +9:00)' },
  { value: 'Africa/Lagos', label: 'Lagos (GMT +1:00)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (GMT +2:00)' },
]

// Languages
const languages = [
  { code: 'en', name: 'English (US)', nativeName: 'English' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
]

// Theme options
const themeOptions = [
  { value: 'light', label: 'Light', description: 'Light theme for daytime use' },
  { value: 'dark', label: 'Dark', description: 'Dark theme for nighttime use' },
  { value: 'system', label: 'Follow system', description: 'Automatically match your device theme' },
]

const currentThemeValue = computed(() => theme.value || 'system')

// Get permissions
const {
  isStaff,
  isManager,
  canManage,
  isReadOnly,
  canCreate,
  canEditReceipts,
  canDeleteReceipts,
  canManageInventoryItems,
  canCreateInventoryFolders,
  canCreateStaff,
} = usePermissions()

/** Left column: business / store identity */
const leftCardHeading = computed(() => {
  if (isStaff.value) {
    return storeInfo.storeName || storesStore.currentStore?.name || 'Business'
  }
  return profileData.businessName || storeInfo.storeName || profileData.email?.split('@')[0] || 'Your business'
})

const leftCardLine2 = computed(() => {
  if (isStaff.value) {
    return storeInfo.storeEmail || storeInfo.storePhone || profileData.email || '—'
  }
  return profileData.email || 'No email'
})

const leftCardBadgeExtra = computed(() => {
  if (isStaff.value && currentStaffMember.value?.departmentName) {
    return currentStaffMember.value.departmentName
  }
  return ''
})

const profileAvatarInitials = computed(() => {
  const raw = isStaff.value
    ? (storeInfo.storeName || storesStore.currentStore?.name || profileData.email || 'U')
    : (profileData.businessName || storeInfo.storeName || profileData.email || 'U')
  const s = String(raw).trim()
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? ''
    const b = parts[1]?.[0] ?? ''
    return (a + b).toUpperCase() || 'U'
  }
  return (s.slice(0, 2) || 'U').toUpperCase()
})

// Computed property for user's actual permissions
const userPermissions = computed(() => {
  const permissions: string[] = []

  // Super Admin permissions
  if (!isStaff.value) {
    permissions.push('Full access to all features')
    permissions.push('Manage store information and settings')
    permissions.push('Manage team members and roles')
    permissions.push('View and manage all inventory')
    permissions.push('View and manage all customers')
    permissions.push('View and manage all receipts and sales')
    permissions.push('View and manage all returns')
    permissions.push('Access all reports and analytics')
    permissions.push('Manage departments and staff')
    permissions.push('Configure payment settings')
    permissions.push('Export and import all data')
    permissions.push('Delete all data')
    permissions.push('Manage leave requests')
    permissions.push('Access system settings')
    permissions.push('Manage user permissions')
    permissions.push('Create inventory folders')
    permissions.push('Create and process sales')
  } else {
    // Staff permissions (all staff can view and create)
    permissions.push('View inventory products')
    permissions.push('View receipts')
    permissions.push('View customer information')
    permissions.push('Create and process sales')
    
    // Manager-specific permissions
    if (isManager.value) {
      permissions.push('Manage inventory products')
      permissions.push('Edit receipts')
      permissions.push('Delete receipts')
      permissions.push('Create inventory folders')
      permissions.push('Manage department operations')
    } else {
      // Regular staff (read-only)
      permissions.push('View inventory folders in assigned department')
      permissions.push('Process returns and exchanges')
    }
  }
  
  return permissions
})

// Modal states (simplified - would be actual modals in production)
const showLanguageModal = ref(false)
const showRegionModal = ref(false)
const showCurrencyModal = ref(false)
const showNotificationsModal = ref(false)
const showThemeModal = ref(false)
const showTimezoneModal = ref(false)
const showPasswordModal = ref(false)
const showSessionsModal = ref(false)
const show2FASetupModal = ref(false)
const show2FADisableModal = ref(false)
const disable2FAPassword = ref('')
const isDisabling2FA = ref(false)
const disable2FAError = ref('')

// Functions
const enableEditing = (section: string) => {
  if (section === 'personal') {
    isEditingPersonalInfo.value = true
    // Backup current data
    Object.assign(backupData, { ...profileData })
  }
}

const cancelEditing = (section: string) => {
  if (section === 'personal') {
    isEditingPersonalInfo.value = false
    // Restore backup
    Object.assign(profileData, { ...backupData })
  }
}

const savePersonalInfo = async () => {
  if (!currentUser.value) {
    toast.error('You must be signed in to update your profile')
    return
  }

  try {
    if (isStaff.value) {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim()
      await updateUserDocument(currentUser.value.uid, {
        name: fullName || profileData.firstName || profileData.email,
        email: profileData.email,
      })
    } else {
      await updateUserDocument(currentUser.value.uid, {
        name: profileData.businessName.trim() || profileData.email,
        email: profileData.email,
      })
    }

    isEditingPersonalInfo.value = false
    Object.assign(backupData, { ...profileData })
    toast.success('Profile updated successfully!')
  } catch (error: any) {
    console.error('Error saving profile:', error)
    toast.error(error.message || 'Failed to update profile. Please try again.')
  }
}

const { updateUserPassword, getActiveSessions, is2FAEnabled, disable2FA } = useFirebaseAuth()

// Theme functions
const selectTheme = (themeValue: 'light' | 'dark' | 'system') => {
  setTheme(themeValue)
  accountSettings.theme = themeValue === 'system' ? 'Follow system' : themeValue === 'dark' ? 'Dark' : 'Light'
  setTimeout(() => {
    showThemeModal.value = false
  }, 300)
}

// Language functions
const selectLanguage = async (code: string, name: string) => {
  accountSettings.language = name
  try {
    await updatePreferences({ language: code })
    toast.success('Language updated successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to update language')
  }
  setTimeout(() => {
    showLanguageModal.value = false
  }, 300)
}

// Region functions
const selectRegion = async (code: string, name: string) => {
  accountSettings.region = name
  try {
    await updatePreferences({ region: code })
    toast.success('Region updated successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to update region')
  }
  setTimeout(() => {
    showRegionModal.value = false
  }, 300)
}

// Currency functions
const selectCurrency = async (code: string, name: string, symbol: string) => {
  accountSettings.currency = `${code} (${symbol})`
  try {
    // Show loading toast
    const loadingToast = toast.info('Updating currency and fetching exchange rates...')
    
    // Update preferences (this will trigger exchange rate refresh)
    await updatePreferences({ currency: code, currencySymbol: symbol })
    
    // Refresh exchange rates explicitly
    if (import.meta.client) {
      try {
        const { useCurrencyConversion } = await import('~/composables/useCurrencyConversion')
        const { refreshRates, baseCurrency } = useCurrencyConversion()
        const base = baseCurrency.value || preferences.value.currency || 'USD'
        await refreshRates(base)
      } catch (error) {
        console.warn('Error refreshing exchange rates:', error)
      }
    }
    
    toast.success(`Currency updated to ${code}. All prices will be converted automatically.`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to update currency')
  }
  setTimeout(() => {
    showCurrencyModal.value = false
  }, 300)
}

// Notification functions
const saveNotificationSettings = () => {
  if (import.meta.client) {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
    
    // Update display text
    const enabledTypes: string[] = []
    if (notificationSettings.email) enabledTypes.push('Email')
    if (notificationSettings.push) enabledTypes.push('Push')
    if (notificationSettings.sms) enabledTypes.push('SMS')
    if (notificationSettings.inApp) enabledTypes.push('In-App')
    
    accountSettings.notifications = enabledTypes.length > 0 ? enabledTypes.join(', ') : 'None'
  }
  showNotificationsModal.value = false
}

const handlePushNotificationToggle = async () => {
  if (notificationSettings.push) {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        notificationSettings.push = false
        toast.warning('Push notifications require permission. Please enable them in your browser settings.')
      }
    } else if (Notification.permission === 'denied') {
      notificationSettings.push = false
      toast.warning('Push notifications are blocked. Please enable them in your browser settings.')
    }
  }
}

// Password change function
const handlePasswordChange = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    passwordError.value = 'Please fill in all fields'
    return
  }

  if (!isPasswordPolicyValid(passwordForm.newPassword)) {
    const errs = getPasswordPolicyErrors(passwordForm.newPassword)
    passwordError.value =
      errs.length > 0 ? `Password requirements: ${errs.join('; ')}.` : 'Please choose a stronger password.'
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    return
  }

  isChangingPassword.value = true
  passwordError.value = ''

  try {
    await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword)
    toast.success('Password changed successfully!')
    showPasswordModal.value = false
    resetPasswordForm()
  } catch (error: any) {
    passwordError.value = error.message || 'Failed to change password. Please try again.'
  } finally {
    isChangingPassword.value = false
  }
}

// 2FA functions
const handle2FAToggle = () => {
  if (securitySettings.twoFactor) {
    // Show disable modal
    show2FADisableModal.value = true
  } else {
    // Show setup modal
    show2FASetupModal.value = true
  }
}

const handle2FASetupSuccess = async () => {
  // Reload 2FA status
  const enabled = await is2FAEnabled()
  securitySettings.twoFactor = enabled
  if (import.meta.client) {
    localStorage.setItem('twoFactorEnabled', enabled ? 'true' : 'false')
  }
  show2FASetupModal.value = false
}

const handleDisable2FA = async () => {
  if (!disable2FAPassword.value) {
    disable2FAError.value = 'Please enter your password'
    return
  }

  isDisabling2FA.value = true
  disable2FAError.value = ''

  try {
    await disable2FA(disable2FAPassword.value)
    securitySettings.twoFactor = false
    if (import.meta.client) {
      localStorage.setItem('twoFactorEnabled', 'false')
    }
    show2FADisableModal.value = false
    disable2FAPassword.value = ''
    toast.success('Two-factor authentication has been disabled')
  } catch (error: any) {
    disable2FAError.value = error.message || 'Failed to disable 2FA. Please try again.'
  } finally {
    isDisabling2FA.value = false
  }
}

const handle2FAError = (error: string) => {
  toast.error(error)
}

// Sessions functions
const loadActiveSessions = async () => {
  isLoadingSessions.value = true
  try {
    const sessions = await getActiveSessions()
    activeSessions.value = sessions
    securitySettings.activeSessions = sessions.length
  } catch (error) {
    console.error('Error loading sessions:', error)
  } finally {
    isLoadingSessions.value = false
  }
}

const revokeSession = async (index: number) => {
  if (confirm('Are you sure you want to revoke this session?')) {
    // Remove session from list
    activeSessions.value.splice(index, 1)
    securitySettings.activeSessions = activeSessions.value.length
    // In production, you'd revoke the actual session token
    toast.success('Session revoked successfully')
  }
}

const revokeAllSessions = async () => {
  if (confirm('Are you sure you want to revoke all other sessions? You will remain signed in on this device.')) {
    // Keep only current session
    activeSessions.value = activeSessions.value.filter(s => s.current)
    securitySettings.activeSessions = activeSessions.value.length
    // In production, you'd revoke all other session tokens
    toast.success('All other sessions have been revoked')
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Timezone functions
const saveTimezone = async () => {
  const timezoneLabel = timezones.find(tz => tz.value === selectedTimezone.value)?.label || selectedTimezone.value
  accountSettings.timezone = timezoneLabel
  try {
    await updatePreferences({ timezone: selectedTimezone.value })
    toast.success('Timezone updated successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to update timezone')
  }
  showTimezoneModal.value = false
}

// Watch for sessions modal to load sessions
watch(showSessionsModal, (isOpen) => {
  if (isOpen) {
    loadActiveSessions()
  }
})

// Initialize timezone when modal opens
watch(showTimezoneModal, (isOpen) => {
  if (isOpen) {
    // Set selected timezone to current
    const currentTz = timezones.find(tz => tz.label === accountSettings.timezone)?.value || 'UTC'
    selectedTimezone.value = currentTz
  }
})
</script>
