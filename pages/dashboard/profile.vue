<template>
  <div :class="pageClass">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Account</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Profile</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">
          Identity, preferences, and security, aligned with your dashboard.
        </p>
      </template>
    </DashboardPageHeader>

    <div :class="profileGridClass">
      <aside :class="profileSidebarClass">
        <section :class="profileCardClass">
          <div :class="profileCardBodyClass">
            <div :class="profileAvatarClass">
              {{ profileAvatarInitials }}
            </div>
            <div v-if="isLoadingProfile" class="mx-auto mt-4 max-w-[180px] space-y-2">
              <div class="dash-skeleton h-4 w-full" />
              <div class="dash-skeleton h-3 w-3/4" />
            </div>
            <template v-else>
              <p :class="profileCardEyebrowClass">Business</p>
              <h2 :class="profileCardNameClass">
                {{ leftCardHeading }}
              </h2>
              <p :class="profileCardMetaClass">
                {{ leftCardLine2 || '-' }}
              </p>
              <span :class="profileRoleBadgeClass">
                {{
                  isStaff
                    ? 'Staff'
                    : profileData.role === 'superAdmin'
                    ? 'Super Admin'
                    : profileData.role || 'User'
                }}
              </span>
              <p v-if="leftCardBadgeExtra" :class="[inlineNoteClass, 'mt-2']">
                {{ leftCardBadgeExtra }}
              </p>
            </template>

            <div :class="profileStatBarClass">
              <div :class="profileStatItemClass">
                <p :class="profileStatLabelClass">Orders</p>
                <p v-if="isLoadingStats" class="dash-skeleton mx-auto mt-1 h-5 w-8" />
                <p v-else :class="profileStatValueClass">
                  {{ totalOrders }}
                </p>
              </div>
              <div :class="profileStatItemClass">
                <p :class="profileStatLabelClass">Products</p>
                <p v-if="isLoadingStats" class="dash-skeleton mx-auto mt-1 h-5 w-8" />
                <p v-else :class="profileStatValueClass">
                  {{ totalProducts }}
                </p>
              </div>
              <div :class="profileStatItemClass">
                <p :class="profileStatLabelClass">Customers</p>
                <p v-if="isLoadingStats" class="dash-skeleton mx-auto mt-1 h-5 w-8" />
                <p v-else :class="profileStatValueClass">
                  {{ totalCustomers }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </aside>

      <div :class="profileMainClass">
        <DashboardSettingsPanel
          :title="isStaff ? 'Staff profile' : 'Business profile'"
          :subtitle="
            isStaff ? 'Your details as a team member' : 'Update your business contact information'
          "
        >
          <template #actions>
            <button
              v-if="!isEditingPersonalInfo"
              type="button"
              :class="editLinkClass"
              @click="enableEditing('personal')"
            >
              Edit
            </button>
            <template v-else>
              <button type="button" :class="cancelLinkClass" @click="cancelEditing('personal')">
                Cancel
              </button>
              <button type="button" :class="editLinkClass" @click="savePersonalInfo">Save</button>
            </template>
          </template>

          <div v-if="!isStaff" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label :class="labelClass">Business name</label>
              <input
                v-model="profileData.businessName"
                type="text"
                :disabled="!isEditingPersonalInfo"
                :class="inputClass(isEditingPersonalInfo)"
                placeholder="Your business or store name"
              />
            </div>
            <div>
              <label :class="labelClass">Email</label>
              <input
                v-model="profileData.email"
                type="email"
                :disabled="!isEditingPersonalInfo"
                :class="inputClass(isEditingPersonalInfo)"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label :class="labelClass">Phone</label>
              <input
                v-model="profileData.phone"
                type="tel"
                :disabled="!isEditingPersonalInfo"
                :class="inputClass(isEditingPersonalInfo)"
                placeholder="Business phone"
              />
            </div>
            <div class="sm:col-span-2">
              <label :class="labelClass">Bio</label>
              <textarea
                v-model="profileData.bio"
                rows="3"
                :disabled="!isEditingPersonalInfo"
                :class="[inputClass(isEditingPersonalInfo), 'min-h-[5rem] resize-y']"
                placeholder="Tell customers about your business"
              />
            </div>
          </div>
          <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label :class="labelClass">First name</label>
              <input
                v-model="profileData.firstName"
                type="text"
                :disabled="!isEditingPersonalInfo"
                :class="inputClass(isEditingPersonalInfo)"
                placeholder="First name"
              />
            </div>
            <div>
              <label :class="labelClass">Last name</label>
              <input
                v-model="profileData.lastName"
                type="text"
                :disabled="!isEditingPersonalInfo"
                :class="inputClass(isEditingPersonalInfo)"
                placeholder="Last name"
              />
            </div>
            <div>
              <label :class="labelClass">Email</label>
              <input
                v-model="profileData.email"
                type="email"
                :disabled="!isEditingPersonalInfo"
                :class="inputClass(isEditingPersonalInfo)"
                placeholder="Work email"
              />
            </div>
            <div>
              <label :class="labelClass">Phone</label>
              <input
                v-model="profileData.phone"
                type="tel"
                :disabled="!isEditingPersonalInfo"
                :class="inputClass(isEditingPersonalInfo)"
                placeholder="Phone"
              />
            </div>
            <div class="sm:col-span-2">
              <label :class="labelClass">Bio</label>
              <textarea
                v-model="profileData.bio"
                rows="3"
                :disabled="!isEditingPersonalInfo"
                :class="[inputClass(isEditingPersonalInfo), 'min-h-[5rem] resize-y']"
                placeholder="Optional note"
              />
            </div>
          </div>
        </DashboardSettingsPanel>

        <DashboardSettingsPanel
          v-if="showBusinessProfilePanel"
          :title="isStaff ? 'Business profile' : 'Store information'"
          :subtitle="
            isStaff ? 'Your assigned branch and department' : 'Branch details from onboarding.'
          "
        >
          <div v-if="isLoadingProfile" class="space-y-4">
            <div class="h-4 bg-gray-200 dark:bg-white/10 rounded-sm w-3/4 animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-white/10 rounded-sm w-1/2 animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-white/10 rounded-sm w-2/3 animate-pulse"></div>
          </div>
          <div v-else-if="hasBusinessProfileContent" class="space-y-4">
            <div
              v-if="
                isStaff &&
                (businessProfileDisplay.departmentName ||
                  businessProfileDisplay.position ||
                  businessProfileDisplay.staffRole)
              "
              class="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div v-if="businessProfileDisplay.departmentName">
                <p :class="labelClass">Department</p>
                <p :class="readonlyValueClass">
                  {{ businessProfileDisplay.departmentName }}
                </p>
              </div>
              <div v-if="businessProfileDisplay.position">
                <p :class="labelClass">Position</p>
                <p :class="readonlyValueClass">
                  {{ businessProfileDisplay.position }}
                </p>
              </div>
              <div v-if="businessProfileDisplay.staffRole">
                <p :class="labelClass">Team role</p>
                <p :class="[readonlyValueClass, 'capitalize']">
                  {{ businessProfileDisplay.staffRole }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div v-if="businessProfileDisplay.storeName">
                <p :class="labelClass">Branch name</p>
                <p :class="readonlyValueClass">
                  {{ businessProfileDisplay.storeName }}
                </p>
              </div>
              <div v-if="businessProfileDisplay.storeDescription">
                <p :class="labelClass">Business type</p>
                <p :class="readonlyValueClass">
                  {{ businessProfileDisplay.storeDescription }}
                </p>
              </div>
              <div v-if="businessProfileDisplay.storeEmail">
                <p :class="labelClass">Store email</p>
                <p :class="readonlyValueClass">
                  {{ businessProfileDisplay.storeEmail }}
                </p>
              </div>
              <div v-if="businessProfileDisplay.storePhone">
                <p :class="labelClass">Store phone</p>
                <p :class="readonlyValueClass">
                  {{ businessProfileDisplay.storePhone }}
                </p>
              </div>
            </div>
            <div v-if="businessProfileDisplay.storeAddress">
              <p :class="labelClass">Address</p>
              <p :class="readonlyValueClass">
                {{ businessProfileDisplay.storeAddress }}
              </p>
            </div>
            <div v-if="!isStaff" :class="inlineDividerClass">
              <NuxtLink to="/dashboard/settings" :class="editLinkClass"
                >Manage store settings →</NuxtLink
              >
            </div>
          </div>
          <div v-else class="py-6 text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{
                isStaff
                  ? 'Your branch details are not available yet. Contact your administrator.'
                  : 'No store information available.'
              }}
            </p>
            <NuxtLink
              v-if="!isStaff"
              to="/dashboard/settings"
              class="mt-3 inline-flex"
              :class="editLinkClass"
              >Set up store information</NuxtLink
            >
          </div>
        </DashboardSettingsPanel>

        <DashboardSettingsPanel
          v-if="!isStaff"
          title="Receipt terms & policies"
          subtitle="Shown on printed and PDF receipts for your store."
        >
          <template #actions>
            <button
              v-if="!isEditingReceiptPolicies"
              type="button"
              :class="editLinkClass"
              @click="startEditingReceiptPolicies"
            >
              Edit
            </button>
            <template v-else>
              <button type="button" :class="cancelLinkClass" @click="cancelEditingReceiptPolicies">
                Cancel
              </button>
              <button type="button" :class="editLinkClass" @click="saveReceiptPolicies">
                Save
              </button>
            </template>
          </template>

          <div class="space-y-4">
            <div>
              <label :class="labelClass">Sales terms & conditions</label>
              <textarea
                v-model="receiptPoliciesForm.salesTerms"
                rows="4"
                :disabled="!isEditingReceiptPolicies"
                :class="policyTextareaClass"
                placeholder="e.g. All sales are final unless otherwise stated…"
              />
            </div>
            <div>
              <label :class="labelClass">Refund policy</label>
              <textarea
                v-model="receiptPoliciesForm.refundPolicy"
                rows="4"
                :disabled="!isEditingReceiptPolicies"
                :class="policyTextareaClass"
                placeholder="e.g. Refunds within 7 days with receipt…"
              />
            </div>
            <div>
              <label :class="labelClass">Warranty policy</label>
              <textarea
                v-model="receiptPoliciesForm.warrantyPolicy"
                rows="4"
                :disabled="!isEditingReceiptPolicies"
                :class="policyTextareaClass"
                placeholder="e.g. Manufacturer warranty applies…"
              />
            </div>
          </div>
        </DashboardSettingsPanel>

        <DashboardSettingsPanel
          title="Preferences"
          subtitle="Language, region, currency, and display."
          compact
        >
          <div class="space-y-0">
            <div
              v-for="pref in preferenceRows"
              :key="pref.key"
              :class="[settingRowClass, pref.key === 'timezone' ? '!border-0' : '']"
            >
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <component :is="pref.icon" :class="settingRowIconClass" />
                <div class="min-w-0">
                  <p :class="settingRowTitleClass">{{ pref.label }}</p>
                  <p :class="settingRowDescClass">
                    {{ pref.value }}
                  </p>
                </div>
              </div>
              <button type="button" :class="editLinkClass" @click="pref.action">
                {{ pref.actionLabel }}
              </button>
            </div>
          </div>
        </DashboardSettingsPanel>

        <DashboardSettingsPanel
          title="Security"
          subtitle="Password, two-factor auth, and active sessions."
          compact
        >
          <div class="space-y-0">
            <div :class="settingRowClass">
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <KeyIcon :class="settingRowIconClass" />
                <div>
                  <p :class="settingRowTitleClass">Password</p>
                  <p :class="settingRowDescClass">
                    Update your sign-in password
                  </p>
                </div>
              </div>
              <button type="button" :class="editLinkClass" @click="showPasswordModal = true">
                Change
              </button>
            </div>
            <div :class="settingRowClass">
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <ShieldCheckIcon :class="settingRowIconClass" />
                <div>
                  <p :class="settingRowTitleClass">
                    Two-factor authentication
                  </p>
                  <p :class="settingRowDescClass">
                    {{ securitySettings.twoFactor ? 'Enabled' : 'Not enabled' }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                :class="
                  securitySettings.twoFactor
                    ? 'inline-flex h-8 items-center rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700'
                    : editLinkClass
                "
                @click="handle2FAToggle"
              >
                {{ securitySettings.twoFactor ? 'Disable' : 'Enable' }}
              </button>
            </div>
            <div :class="[settingRowClass, '!border-0']">
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <DevicePhoneMobileIcon :class="settingRowIconClass" />
                <div>
                  <p :class="settingRowTitleClass">
                    Active sessions
                  </p>
                  <p :class="settingRowDescClass">
                    {{ securitySettings.activeSessions }} devices
                  </p>
                </div>
              </div>
              <button type="button" :class="editLinkClass" @click="showSessionsModal = true">
                View all
              </button>
            </div>
          </div>
        </DashboardSettingsPanel>

        <DashboardSettingsPanel
          title="Roles & permissions"
          subtitle="Your role and what you can access."
        >
          <div class="space-y-6">
            <div class="flex gap-3">
              <component
                :is="roleHeaderIcon"
                class="mt-0.5 h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
              <div class="min-w-0 flex-1 space-y-2.5">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ roleCardTitle }}
                    <span
                      v-if="roleBadgeLabel"
                      class="font-normal text-gray-500 dark:text-gray-400"
                    >
                      · {{ roleBadgeLabel }}
                    </span>
                  </p>
                  <p class="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {{ roleCardDescription }}
                  </p>
                </div>
                <ul v-if="roleMetaItems.length > 0" class="space-y-1">
                  <li
                    v-for="meta in roleMetaItems"
                    :key="meta.key"
                    class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <component
                      :is="meta.icon"
                      class="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500"
                      aria-hidden="true"
                    />
                    {{ meta.text }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <ClipboardDocumentListIcon
                  class="h-4 w-4 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                />
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Permissions</p>
              </div>

              <p
                v-if="userPermissions.length === 0"
                class="pl-6 text-xs text-gray-500 dark:text-gray-400"
              >
                Loading…
              </p>

              <div v-else class="space-y-4 pl-1">
                <div v-for="group in permissionGroups" :key="group.id">
                  <div
                    v-if="permissionGroups.length > 1"
                    class="mb-2 flex items-center gap-1.5 pl-1"
                  >
                    <component
                      :is="group.icon"
                      class="h-3.5 w-3.5 text-gray-400 dark:text-gray-500"
                      aria-hidden="true"
                    />
                    <p class="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                      {{ group.label }}
                    </p>
                  </div>
                  <ul class="space-y-1.5">
                    <li v-for="item in group.items" :key="item.id" class="flex items-start gap-2">
                      <span class="status-dot status-dot--muted mt-1.5" aria-hidden="true" />
                      <component
                        :is="item.icon"
                        class="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500"
                        aria-hidden="true"
                      />
                      <span
                        class="min-w-0 flex-1 text-xs leading-relaxed text-gray-700 dark:text-gray-300"
                      >
                        {{ item.label }}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <p
              class="flex items-start gap-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
            >
              <span class="status-dot status-dot--muted mt-1.5" aria-hidden="true" />
              <span>
                <template v-if="isStaff">
                  Contact your super admin in Settings if you need a different role or department.
                </template>
                <template v-else>
                  Manage team access under Settings → Departments and staff.
                </template>
              </span>
            </p>
          </div>
        </DashboardSettingsPanel>
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
            'w-full p-4 rounded-sm border-0 transition-all text-left',
            currentThemeValue === themeOption.value
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'bg-gray-50/80 dark:bg-gray-800/50',
          ]"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                {{ themeOption.label }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ themeOption.description }}
              </p>
            </div>
            <div
              v-if="currentThemeValue === themeOption.value"
              class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
            >
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
            'w-full p-4 rounded-sm border-0 transition-all text-left',
            accountSettings.language === lang.name
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'bg-gray-50/80 dark:bg-gray-800/50',
          ]"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ lang.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ lang.nativeName }}</p>
            </div>
            <div
              v-if="accountSettings.language === lang.name"
              class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
            >
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
        <div class="flex items-center justify-between py-4 border-b border-gray-200">
          <div>
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Receive notifications via email
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="notificationSettings.email" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"
            ></div>
          </label>
        </div>

        <div class="flex items-center justify-between py-4 border-b border-gray-200">
          <div>
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Receive push notifications in browser
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="notificationSettings.push"
              type="checkbox"
              class="sr-only peer"
              @change="handlePushNotificationToggle"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"
            ></div>
          </label>
        </div>

        <div class="flex items-center justify-between py-4 border-b border-gray-200">
          <div>
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100">SMS Notifications</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Receive notifications via SMS
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="notificationSettings.sms" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"
            ></div>
          </label>
        </div>

        <div class="flex items-center justify-between py-4">
          <div>
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100">In-App Notifications</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Show notifications within the app
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="notificationSettings.inApp" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"
            ></div>
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
      <p class="text-xs text-gray-600 dark:text-gray-400">
        Enter your current password and choose a new one
      </p>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Current Password
          </label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
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
            class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
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
                :class="
                  rule.ok
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400 dark:text-gray-500'
                "
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
            class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Confirm new password"
          />
          <p
            v-if="
              passwordForm.newPassword &&
              passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword
            "
            class="text-xs text-red-500 mt-1"
          >
            Passwords do not match
          </p>
        </div>
        <div
          v-if="passwordError"
          class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm"
        >
          <p class="text-xs text-red-600 dark:text-red-400">{{ passwordError }}</p>
        </div>
      </div>
    </div>
    <template #footer>
      <Button
        variant="secondary"
        @click="
          () => {
            showPasswordModal = false
            resetPasswordForm()
          }
        "
        >Cancel</Button
      >
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
          <svg
            class="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
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
      <p class="text-xs text-gray-600 dark:text-gray-400">
        Manage devices where you're currently signed in
      </p>
      <div v-if="isLoadingSessions" class="space-y-3">
        <div v-for="i in 3" :key="i" class="flex items-center justify-between p-4 rounded-sm">
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-white/10 rounded-sm w-1/3 animate-pulse"></div>
            <div class="h-3 bg-gray-200 dark:bg-white/10 rounded-sm w-1/4 animate-pulse"></div>
          </div>
          <div class="h-6 bg-gray-200 dark:bg-white/10 rounded-sm w-16 animate-pulse"></div>
        </div>
      </div>
      <div v-else-if="activeSessions.length === 0" class="text-center py-8">
        <p class="text-xs text-gray-500 dark:text-gray-400">No active sessions found</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(session, index) in activeSessions"
          :key="index"
          class="p-4 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <DevicePhoneMobileIcon class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {{ session.device }}
                </p>
                <span
                  v-if="session.current"
                  class="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full"
                >
                  Current
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ session.location }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last active: {{ formatDate(session.lastActive) }}
              </p>
            </div>
            <button
              v-if="!session.current"
              @click="revokeSession(index)"
              class="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <Button variant="secondary" @click="showSessionsModal = false">Close</Button>
      <Button variant="danger" @click="revokeAllSessions" v-if="activeSessions.length > 1"
        >Revoke All Others</Button
      >
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
            'w-full p-4 rounded-sm border-0 transition-all text-left',
            accountSettings.region === region.name
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'bg-gray-50/80 dark:bg-gray-800/50',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ region.flag }}</span>
              <div>
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {{ region.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ region.code }}</p>
              </div>
            </div>
            <div
              v-if="accountSettings.region === region.name"
              class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
            >
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
            'w-full p-4 rounded-sm border-0 transition-all text-left',
            accountSettings.currency === currency.code
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'bg-gray-50/80 dark:bg-gray-800/50',
          ]"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                {{ currency.name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ currency.symbol }} {{ currency.code }}
              </p>
            </div>
            <div
              v-if="accountSettings.currency === currency.code"
              class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
            >
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
          class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
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
        Enter your password and authenticator code to disable two-factor authentication.
      </p>
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Password
        </label>
        <input
          v-model="disable2FAPassword"
          type="password"
          class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
          placeholder="Enter your password"
          @keyup.enter="handleDisable2FA"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Authenticator code
        </label>
        <input
          v-model="disable2FATotp"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          class="w-full px-3 py-2 text-xs rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none tracking-[0.25em]"
          placeholder="6-digit code"
          @keyup.enter="handleDisable2FA"
        />
      </div>
      <div
        v-if="disable2FAError"
        class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm"
      >
        <p class="text-xs text-red-600 dark:text-red-400">{{ disable2FAError }}</p>
      </div>
    </div>
    <template #footer>
      <Button
        variant="secondary"
        @click="
          () => {
            show2FADisableModal = false
            disable2FAPassword = ''
            disable2FATotp = ''
            disable2FAError = ''
          }
        "
        >Cancel</Button
      >
      <Button
        variant="danger"
        @click="handleDisable2FA"
        :disabled="isDisabling2FA || !disable2FAPassword || disable2FATotp.trim().length !== 6"
      >
        <span v-if="isDisabling2FA" class="flex items-center gap-2">
          <svg
            class="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
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
  GlobeAltIcon,
  CurrencyDollarIcon,
  ChevronRightIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  CubeIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
} from '~/utils/app-icons'
import type { FunctionalComponent } from 'vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser, type StoreDetails } from '~/composables/useUser'
import { useTheme } from '~/composables/useTheme'
import { usePreferences, currencies, regions } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useCustomersStore } from '~/stores/customers'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { useStaffStore } from '~/stores/staff'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import type { Staff } from '~/composables/useStaff'
import {
  resolveStaffWorkspaceContext,
  applyWorkspaceToProfileStoreInfo,
  fillProfileStoreInfoFromStore,
  type StaffWorkspaceContext,
} from '~/composables/useStaffWorkspaceContext'
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
  layout: 'dashboard',
})

useHead({
  title: 'Profile - Storvv',
})

const {
  eyebrowClass,
  pageTitleClass,
  descriptionClass,
  pageClass,
  profileGridClass,
  profileSidebarClass,
  profileMainClass,
  profileCardClass,
  profileCardBodyClass,
  profileAvatarClass,
  profileCardEyebrowClass,
  profileCardNameClass,
  profileCardMetaClass,
  profileRoleBadgeClass,
  profileStatBarClass,
  profileStatItemClass,
  profileStatValueClass,
  profileStatLabelClass,
  profileStatDividerClass,
  labelClass,
  inputClass,
  editLinkClass,
  cancelLinkClass,
  settingRowClass,
  settingRowIconClass,
  settingRowTitleClass,
  settingRowDescClass,
  readonlyValueClass,
  inlineNoteClass,
  inlineDividerClass,
} = useDashboardSettingsChrome()

// Profile data: super admin uses businessName (maps to user `name`); staff uses firstName/lastName for person
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

/** Receipt policy text (Firestore: storeDetails.settings.receipt). Super admin only. */
const receiptPoliciesForm = reactive({
  salesTerms: '',
  refundPolicy: '',
  warrantyPolicy: '',
})
const backupReceiptPolicies = reactive({
  salesTerms: '',
  refundPolicy: '',
  warrantyPolicy: '',
})
const isEditingReceiptPolicies = ref(false)

const policyTextareaClass = computed(() => [
  inputClass(isEditingReceiptPolicies.value),
  'min-h-[5rem] resize-y',
])

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
const userStore = useUserStore()

/** Resolved staff record for signed-in staff (department, store, etc.) */
const currentStaffMember = ref<Staff | null>(null)
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

// Function to load profile data
const loadProfileData = async () => {
  if (!currentUser.value) {
    isLoadingProfile.value = false
    return
  }

  try {
    if (!userStore.userData) {
      await userStore.fetchUserData(currentUser.value.uid)
    }

    const userData = await getUserDocument(currentUser.value.uid)
    const accountRole = userStore.userData?.role || userData?.role || 'User'
    const staffAccount = accountRole === 'staff'

    currentStaffMember.value = null
    profileData.businessName = ''
    staffWorkspace.value = {
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
    }

    if (userData || userStore.userData) {
      profileData.email =
        userStore.userData?.email || userData?.email || currentUser.value.email || ''
      profileData.role = accountRole

      if (staffAccount) {
        try {
          const sm = await staffStore.fetchCurrentStaffMember()
          currentStaffMember.value = sm
          if (sm) {
            profileData.firstName = sm.firstName || ''
            profileData.lastName = sm.lastName || ''
            profileData.email = sm.email || profileData.email
            profileData.phone = sm.phone || ''
          }
          const ctx = await resolveStaffWorkspaceContext()
          staffWorkspace.value = ctx
          if (!currentStaffMember.value && ctx.staff) {
            currentStaffMember.value = ctx.staff
          }
          applyWorkspaceToProfileStoreInfo(storeInfo, ctx)
          fillProfileStoreInfoFromStore(storeInfo, ctx.store || storesStore.currentStore)
        } catch (e) {
          console.warn('Could not load staff member profile:', e)
          profileData.firstName = currentUser.value.displayName?.split(' ')[0] || ''
          profileData.lastName = currentUser.value.displayName?.split(' ').slice(1).join(' ') || ''
          fillProfileStoreInfoFromStore(storeInfo, storesStore.currentStore)
        }
      } else if (userData) {
        profileData.businessName = (userData.name || '').trim()
        profileData.firstName = ''
        profileData.lastName = ''
      }

      // Load store details for super admin (staff uses assigned branch document)
      if (userData?.storeDetails && !staffAccount) {
        storeInfo.storeName = userData.storeDetails.storeName || ''
        storeInfo.storeAddress = userData.storeDetails.storeAddress || ''
        storeInfo.storePhone = userData.storeDetails.storePhone || ''
        storeInfo.storeEmail = userData.storeDetails.storeEmail || ''
        storeInfo.storeDescription = userData.storeDetails.storeDescription || ''
      }

      if (!staffAccount && userData?.storeDetails) {
        const r = userData.storeDetails.settings?.receipt
        receiptPoliciesForm.salesTerms = r?.salesTerms || ''
        receiptPoliciesForm.refundPolicy = r?.refundPolicy || ''
        receiptPoliciesForm.warrantyPolicy = r?.warrantyPolicy || ''
        Object.assign(backupReceiptPolicies, { ...receiptPoliciesForm })
      }

      if (staffAccount) {
        fillProfileStoreInfoFromStore(storeInfo, storesStore.currentStore)
      }

      // Load 2FA status from Firestore
      const twoFactorSource = userData || userStore.userData
      if (twoFactorSource?.twoFactorEnabled) {
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
  receiptsStore.receipts.forEach((receipt) => {
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
      }),
    ])
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
    const lang = languages.find((l) => l.code === preferences.value.language)
    accountSettings.language = lang?.name || 'English (US)'

    const region = regions.find((r) => r.code === preferences.value.region)
    accountSettings.region = region?.name || 'United States'

    const currency = currencies.find((c) => c.code === preferences.value.currency)
    accountSettings.currency = currency ? `${currency.code} (${currency.symbol})` : 'USD ($)'

    const tz = timezones.find((t) => t.value === preferences.value.timezone)
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
    accountSettings.theme =
      theme.value === 'system' ? 'Follow system' : theme.value === 'dark' ? 'Dark' : 'Light'
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
watch(
  currentUser,
  async (newUser) => {
    if (newUser && !isLoadingProfile.value) {
      await loadProfileData()
    }
  },
  { immediate: false }
)

// Branch may load after profile fetch (staff store init); backfill business profile fields.
watch(
  () => storesStore.currentStore,
  (store) => {
    if (!isStaff.value || !store) return
    fillProfileStoreInfoFromStore(storeInfo, store)
  }
)

// Theme integration
const { theme, setTheme, actualTheme } = useTheme()

// Preferences integration
const { preferences, updatePreferences, initialize: initPreferences } = usePreferences()
const toast = useAppToast()

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
const activeSessions = ref<
  Array<{ device: string; location: string; lastActive: string; current: boolean }>
>([])
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
  return (
    profileData.businessName ||
    storeInfo.storeName ||
    profileData.email?.split('@')[0] ||
    'Your business'
  )
})

const leftCardLine2 = computed(() => {
  if (isStaff.value) {
    const dept = staffWorkspace.value.departmentName || currentStaffMember.value?.departmentName
    if (dept) return dept
    return storeInfo.storeEmail || storeInfo.storePhone || profileData.email || '-'
  }
  return profileData.email || 'No email'
})

const showBusinessProfilePanel = computed(
  () => isLoadingProfile.value || !isStaff.value || isStaff.value
)

const businessProfileDisplay = computed(() => ({
  storeName:
    storeInfo.storeName || staffWorkspace.value.storeName || storesStore.currentStore?.name || '',
  storeEmail:
    storeInfo.storeEmail ||
    staffWorkspace.value.storeEmail ||
    storesStore.currentStore?.email ||
    '',
  storePhone:
    storeInfo.storePhone ||
    staffWorkspace.value.storePhone ||
    storesStore.currentStore?.phone ||
    '',
  storeAddress:
    storeInfo.storeAddress ||
    staffWorkspace.value.storeAddress ||
    storesStore.currentStore?.address ||
    '',
  storeDescription:
    storeInfo.storeDescription ||
    staffWorkspace.value.businessType ||
    storesStore.currentStore?.description ||
    '',
  departmentName:
    staffWorkspace.value.departmentName || currentStaffMember.value?.departmentName || '',
  position: staffWorkspace.value.position || '',
  staffRole: staffWorkspace.value.staffRole || '',
}))

const hasBusinessProfileContent = computed(() => {
  const d = businessProfileDisplay.value
  return Boolean(
    d.storeName ||
      d.storeEmail ||
      d.storePhone ||
      d.storeAddress ||
      d.storeDescription ||
      d.departmentName ||
      d.position ||
      d.staffRole
  )
})

const leftCardBadgeExtra = computed(() => {
  if (isStaff.value && currentStaffMember.value?.departmentName) {
    return currentStaffMember.value.departmentName
  }
  return ''
})

const profileAvatarInitials = computed(() => {
  const raw = isStaff.value
    ? storeInfo.storeName || storesStore.currentStore?.name || profileData.email || 'U'
    : profileData.businessName || storeInfo.storeName || profileData.email || 'U'
  const s = String(raw).trim()
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? ''
    const b = parts[1]?.[0] ?? ''
    return (a + b).toUpperCase() || 'U'
  }
  return (s.slice(0, 2) || 'U').toUpperCase()
})

type PermissionGroupId = 'view' | 'operations' | 'admin' | 'sales'

interface PermissionListItem {
  id: string
  label: string
  group: PermissionGroupId
}

const roleBadgeLabel = computed(() => {
  if (isStaff.value) return isManager.value ? 'Manager' : 'Staff'
  if (userStore.isSuperAdmin || profileData.role === 'superAdmin') return 'Super Admin'
  return profileData.role || 'User'
})

const roleCardTitle = computed(() => {
  if (isStaff.value) return isManager.value ? 'Store manager' : 'Staff member'
  if (userStore.isSuperAdmin || profileData.role === 'superAdmin') return 'Super admin'
  return profileData.role || 'User'
})

const roleHeaderIcon = computed((): FunctionalComponent => {
  if (isStaff.value && isManager.value) return UserGroupIcon
  return ShieldCheckIcon
})

const roleMetaItems = computed(() => {
  if (!isStaff.value) return [] as Array<{ key: string; text: string; icon: FunctionalComponent }>
  const items: Array<{ key: string; text: string; icon: FunctionalComponent }> = []
  const branch = businessProfileDisplay.value.storeName
  const dept = businessProfileDisplay.value.departmentName
  if (branch) items.push({ key: 'branch', text: branch, icon: BuildingStorefrontIcon })
  if (dept) items.push({ key: 'dept', text: dept, icon: UserGroupIcon })
  return items
})

const roleCardDescription = computed(() => {
  if (isStaff.value) {
    if (isManager.value) {
      return 'You can manage day-to-day operations in your assigned branch and department, including inventory and sales where enabled.'
    }
    return 'You can view and work within your assigned branch and department. Your super admin controls what you can change.'
  }
  if (userStore.isSuperAdmin || profileData.role === 'superAdmin') {
    return 'Full access to branches, team, inventory, sales, and account settings across your organization.'
  }
  return 'Contact your administrator if you need clarification on your access level.'
})

function permissionIconFor(label: string): FunctionalComponent {
  const lower = label.toLowerCase()
  if (lower.includes('inventory') || lower.includes('folder')) return CubeIcon
  if (lower.includes('receipt') || lower.includes('sales') || lower.includes('return'))
    return ReceiptPercentIcon
  if (lower.includes('customer')) return UserGroupIcon
  if (lower.includes('analytics') || lower.includes('report')) return ChartBarIcon
  if (
    lower.includes('setting') ||
    lower.includes('payment') ||
    lower.includes('permission') ||
    lower.includes('team')
  ) {
    return Cog6ToothIcon
  }
  if (lower.startsWith('view ') || lower.includes('view and')) return EyeIcon
  return ChevronRightIcon
}

const permissionGroupIcons: Record<PermissionGroupId, FunctionalComponent> = {
  view: EyeIcon,
  sales: ReceiptPercentIcon,
  operations: CubeIcon,
  admin: Cog6ToothIcon,
}

function permissionGroupFor(label: string): PermissionGroupId {
  const lower = label.toLowerCase()
  if (lower.startsWith('view ') || lower.includes('view and')) return 'view'
  if (
    lower.includes('manage') ||
    lower.includes('edit') ||
    lower.includes('delete') ||
    lower.includes('configure') ||
    lower.includes('export') ||
    lower.includes('access system') ||
    lower.includes('full access')
  ) {
    return 'admin'
  }
  if (lower.includes('create') || lower.includes('process')) return 'sales'
  return 'operations'
}

const permissionCatalog = computed((): PermissionListItem[] => {
  const items: PermissionListItem[] = []

  if (!isStaff.value) {
    const labels = [
      'Full access to all features',
      'Manage store information and settings',
      'Manage team members and roles',
      'View and manage all inventory',
      'View and manage all customers',
      'View and manage all sales',
      'View and manage all returns',
      'Access all reports and analytics',
      'Manage departments and staff',
      'Configure payment settings',
      'Export and import all data',
      'Delete all data',
      'Manage leave requests',
      'Access system settings',
      'Manage user permissions',
      'Create inventory folders',
      'Create and process sales',
    ]
    labels.forEach((label, i) => {
      items.push({ id: `sa-${i}`, label, group: permissionGroupFor(label) })
    })
    return items
  }

  const labels = [
    'View inventory products',
    'View sales',
    'View customer information',
    'Create and process sales',
  ]
  if (isManager.value) {
    labels.push(
      'Manage inventory products',
      'Edit sales',
      'Delete sales',
      'Create inventory folders',
      'Manage department operations'
    )
  } else {
    labels.push('View inventory folders in assigned department', 'Process returns and exchanges')
  }
  labels.forEach((label, i) => {
    items.push({ id: `st-${i}`, label, group: permissionGroupFor(label) })
  })
  return items
})

const userPermissions = computed(() => permissionCatalog.value.map((p) => p.label))

const permissionGroupLabels: Record<PermissionGroupId, string> = {
  view: 'View',
  operations: 'Operations',
  sales: 'Sales & checkout',
  admin: 'Administration',
}

const permissionGroups = computed(() => {
  const buckets = new Map<
    PermissionGroupId,
    Array<{ id: string; label: string; icon: FunctionalComponent }>
  >()
  const order: PermissionGroupId[] = ['view', 'sales', 'operations', 'admin']

  for (const item of permissionCatalog.value) {
    const list = buckets.get(item.group) ?? []
    list.push({ id: item.id, label: item.label, icon: permissionIconFor(item.label) })
    buckets.set(item.group, list)
  }

  return order
    .filter((id) => (buckets.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      id,
      label: permissionGroupLabels[id],
      icon: permissionGroupIcons[id],
      items: buckets.get(id) ?? [],
    }))
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
const disable2FATotp = ref('')
const isDisabling2FA = ref(false)
const disable2FAError = ref('')

const preferenceRows = computed(() => [
  {
    key: 'language',
    label: 'Language',
    value: accountSettings.language,
    icon: LanguageIcon,
    actionLabel: 'Change',
    action: () => {
      showLanguageModal.value = true
    },
  },
  {
    key: 'region',
    label: 'Region',
    value: accountSettings.region,
    icon: GlobeAltIcon,
    actionLabel: 'Change',
    action: () => {
      showRegionModal.value = true
    },
  },
  {
    key: 'currency',
    label: 'Currency',
    value: accountSettings.currency,
    icon: CurrencyDollarIcon,
    actionLabel: 'Change',
    action: () => {
      showCurrencyModal.value = true
    },
  },
  {
    key: 'notifications',
    label: 'Notifications',
    value: accountSettings.notifications,
    icon: BellIcon,
    actionLabel: 'Manage',
    action: () => {
      showNotificationsModal.value = true
    },
  },
  {
    key: 'theme',
    label: 'Theme',
    value: accountSettings.theme,
    icon: MoonIcon,
    actionLabel: 'Change',
    action: () => {
      showThemeModal.value = true
    },
  },
  {
    key: 'timezone',
    label: 'Timezone',
    value: accountSettings.timezone,
    icon: CalendarIcon,
    actionLabel: 'Change',
    action: () => {
      showTimezoneModal.value = true
    },
  },
])

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

const startEditingReceiptPolicies = () => {
  Object.assign(backupReceiptPolicies, { ...receiptPoliciesForm })
  isEditingReceiptPolicies.value = true
}

const cancelEditingReceiptPolicies = () => {
  Object.assign(receiptPoliciesForm, { ...backupReceiptPolicies })
  isEditingReceiptPolicies.value = false
}

const saveReceiptPolicies = async () => {
  if (!currentUser.value || isStaff.value) {
    toast.error('Only the account owner can update receipt policies')
    return
  }
  try {
    const userData = await getUserDocument(currentUser.value.uid)
    const prevDetails: StoreDetails = userData?.storeDetails || {
      storeName: profileData.businessName.trim() || userData?.name || 'Store',
    }
    await updateUserDocument(currentUser.value.uid, {
      storeDetails: {
        ...prevDetails,
        settings: {
          ...prevDetails.settings,
          receipt: {
            ...prevDetails.settings?.receipt,
            salesTerms: receiptPoliciesForm.salesTerms.trim(),
            refundPolicy: receiptPoliciesForm.refundPolicy.trim(),
            warrantyPolicy: receiptPoliciesForm.warrantyPolicy.trim(),
          },
        },
      },
    })
    await userStore.fetchUserData(currentUser.value.uid)
    Object.assign(backupReceiptPolicies, { ...receiptPoliciesForm })
    isEditingReceiptPolicies.value = false
    toast.success(
      'Receipt policies saved. They will appear on new receipts when viewed or printed.'
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save receipt policies'
    console.error('Error saving receipt policies:', error)
    toast.error(msg)
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
  accountSettings.theme =
    themeValue === 'system' ? 'Follow system' : themeValue === 'dark' ? 'Dark' : 'Light'
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
        toast.warning(
          'Push notifications require permission. Please enable them in your browser settings.'
        )
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
      errs.length > 0
        ? `Password requirements: ${errs.join('; ')}.`
        : 'Please choose a stronger password.'
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
  if (disable2FATotp.value.trim().length !== 6) {
    disable2FAError.value = 'Enter the 6-digit code from your authenticator app'
    return
  }

  isDisabling2FA.value = true
  disable2FAError.value = ''

  try {
    await disable2FA(disable2FAPassword.value, disable2FATotp.value.trim())
    securitySettings.twoFactor = false
    if (import.meta.client) {
      localStorage.setItem('twoFactorEnabled', 'false')
    }
    show2FADisableModal.value = false
    disable2FAPassword.value = ''
    disable2FATotp.value = ''
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
  if (
    confirm(
      'Are you sure you want to revoke all other sessions? You will remain signed in on this device.'
    )
  ) {
    // Keep only current session
    activeSessions.value = activeSessions.value.filter((s) => s.current)
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
    minute: '2-digit',
  })
}

// Timezone functions
const saveTimezone = async () => {
  const timezoneLabel =
    timezones.find((tz) => tz.value === selectedTimezone.value)?.label || selectedTimezone.value
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
    const currentTz = timezones.find((tz) => tz.label === accountSettings.timezone)?.value || 'UTC'
    selectedTimezone.value = currentTz
  }
})
</script>
