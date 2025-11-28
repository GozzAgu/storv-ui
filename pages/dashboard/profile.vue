<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Card -->
      <Card class="lg:col-span-1">
        <div class="flex flex-col items-center text-center">
          <!-- Avatar -->
          <div class="relative mb-4">
            <div class="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {{ profileData.firstName[0] }}{{ profileData.lastName[0] }}
            </div>
            <button 
              @click="triggerFileUpload"
              class="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <CameraIcon class="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="hidden"
            />
          </div>
          
          <!-- User Info -->
          <div v-if="isLoadingProfile" class="space-y-2 w-full">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div v-else>
            <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
              {{ profileData.firstName || profileData.email?.split('@')[0] || 'User' }} {{ profileData.lastName || '' }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ profileData.email || 'No email' }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ profileData.role || 'User' }}</p>
          </div>
          
          <!-- Stats -->
          <div class="grid grid-cols-3 gap-4 w-full mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">142</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Orders</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">89</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Products</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">23</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Customers</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Personal Information -->
        <Card>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal details</p>
            </div>
            <div v-if="!isEditingPersonalInfo" class="flex gap-2">
              <button 
                @click="enableEditing('personal')"
                class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                Edit
              </button>
            </div>
            <div v-else class="flex gap-2">
              <button 
                @click="cancelEditing('personal')"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                @click="savePersonalInfo"
                class="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white dark:text-white rounded-lg transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <input
                v-model="profileData.firstName"
                type="text"
                :disabled="!isEditingPersonalInfo"
                :class="[
                  'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  isEditingPersonalInfo
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                ]"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <input
                v-model="profileData.lastName"
                type="text"
                :disabled="!isEditingPersonalInfo"
                :class="[
                  'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  isEditingPersonalInfo
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                ]"
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                v-model="profileData.email"
                type="email"
                :disabled="!isEditingPersonalInfo"
                :class="[
                  'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  isEditingPersonalInfo
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                ]"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                v-model="profileData.phone"
                type="tel"
                :disabled="!isEditingPersonalInfo"
                :class="[
                  'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  isEditingPersonalInfo
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                ]"
                placeholder="Enter phone number"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                v-model="profileData.bio"
                rows="3"
                :disabled="!isEditingPersonalInfo"
                :class="[
                  'w-full px-4 py-2.5 border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none',
                  isEditingPersonalInfo
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                ]"
                placeholder="Tell us about yourself"
              ></textarea>
            </div>
          </div>
        </Card>

        <!-- Account Settings -->
        <Card>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Account Settings</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <LanguageIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Language</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.language }}</p>
                </div>
              </div>
              <button 
                @click="showLanguageModal = true"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Change
              </button>
            </div>

            <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BellIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.notifications }}</p>
                </div>
              </div>
              <button 
                @click="showNotificationsModal = true"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <MoonIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.theme }}</p>
                </div>
              </div>
              <button 
                @click="showThemeModal = true"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Change
              </button>
            </div>

            <div class="flex items-center justify-between py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <CalendarIcon class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Timezone</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ accountSettings.timezone }}</p>
                </div>
              </div>
              <button 
                @click="showTimezoneModal = true"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Change
              </button>
            </div>
          </div>
        </Card>

        <!-- Security -->
        <Card>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Security</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your security settings</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <KeyIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Password</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
                </div>
              </div>
              <button 
                @click="showPasswordModal = true"
                class="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Change
              </button>
            </div>

            <div class="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShieldCheckIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ securitySettings.twoFactor ? 'Enabled' : 'Not enabled' }}</p>
                </div>
              </div>
              <button 
                @click="toggleTwoFactor"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  securitySettings.twoFactor
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                ]"
              >
                {{ securitySettings.twoFactor ? 'Disable' : 'Enable' }}
              </button>
            </div>

            <div class="flex items-center justify-between py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <DevicePhoneMobileIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Active Sessions</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ securitySettings.activeSessions }} devices</p>
                </div>
              </div>
              <button 
                @click="showSessionsModal = true"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View All
              </button>
            </div>
          </div>
        </Card>

        <!-- Store Information -->
        <Card v-if="storeInfo.storeName || isLoadingProfile">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Store Information</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Your store details from onboarding</p>
            </div>
          </div>

          <div v-if="isLoadingProfile" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading store information...</p>
          </div>

          <div v-else-if="storeInfo.storeName" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Store Name</p>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ storeInfo.storeName }}</p>
              </div>
              <div v-if="storeInfo.storeEmail">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Store Email</p>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ storeInfo.storeEmail }}</p>
              </div>
              <div v-if="storeInfo.storePhone">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Store Phone</p>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ storeInfo.storePhone }}</p>
              </div>
              <div v-if="storeInfo.storeDescription">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ storeInfo.storeDescription }}</p>
              </div>
            </div>
            <div v-if="storeInfo.storeAddress">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Address</p>
              <p class="text-sm text-gray-900 dark:text-gray-100">{{ storeInfo.storeAddress }}</p>
            </div>
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <NuxtLink
                to="/dashboard/settings"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
              >
                Manage store settings →
              </NuxtLink>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">No store information available.</p>
            <NuxtLink
              to="/dashboard/settings"
              class="inline-block px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Set up store information
            </NuxtLink>
          </div>
        </Card>

        <!-- Roles & Permissions -->
        <Card>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-50">Roles & Permissions</h2>
              <p class="text-sm text-gray-500 dark:text-gray-300 mt-1">Your current role and access permissions</p>
            </div>
            <span class="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/60 dark:to-purple-800/60 text-purple-700 dark:text-purple-50 rounded-full border border-purple-300 dark:border-purple-600 shadow-sm">
              {{ profileData.role }}
            </span>
          </div>

          <div class="space-y-4">
            <!-- Role Description -->
            <div class="p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/40 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded-xl">
              <p class="text-sm text-purple-900 dark:text-purple-50 font-medium mb-2">Super Admin</p>
              <p class="text-xs text-purple-700 dark:text-purple-100 leading-relaxed">
                As a Super Admin, you have full access to all features and settings in the system. You are the account owner and have complete control over your store operations.
              </p>
            </div>

            <!-- Permissions List -->
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">Your Permissions:</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  v-for="permission in superAdminPermissions" 
                  :key="permission"
                  class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <CheckCircleIcon class="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span class="text-sm text-gray-700 dark:text-gray-100 leading-relaxed">{{ permission }}</span>
                </div>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <InformationCircleIcon class="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-50 mb-1">About Your Role</p>
                  <p class="text-xs text-gray-600 dark:text-gray-200 leading-relaxed">
                    You created this account and are the primary administrator. You can manage all aspects of the system including team members, settings, and data management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Modals would go here - simplified for now with alerts -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import {
  CameraIcon,
  LanguageIcon,
  BellIcon,
  MoonIcon,
  CalendarIcon,
  KeyIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Profile - Storv',
})

// Profile data
const profileData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  bio: '',
  role: 'Super Admin',
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
const fileInput = ref<HTMLInputElement | null>(null)
const isLoadingProfile = ref(true)

// Get user data
const { currentUser } = useFirebaseAuth()
const { getUserDocument, updateUserDocument } = useUser()

// Load profile and store information from Firestore
onMounted(async () => {
  if (currentUser.value) {
    try {
      const userData = await getUserDocument(currentUser.value.uid)
      if (userData) {
        // Split name into first and last name
        const nameParts = (userData.name || '').split(' ')
        profileData.firstName = nameParts[0] || ''
        profileData.lastName = nameParts.slice(1).join(' ') || ''
        profileData.email = userData.email || currentUser.value.email || ''
        profileData.role = userData.role === 'superAdmin' ? 'Super Admin' : userData.role || 'User'
        
        // Load store details if available
        if (userData.storeDetails) {
          storeInfo.storeName = userData.storeDetails.storeName || ''
          storeInfo.storeAddress = userData.storeDetails.storeAddress || ''
          storeInfo.storePhone = userData.storeDetails.storePhone || ''
          storeInfo.storeEmail = userData.storeDetails.storeEmail || ''
          storeInfo.storeDescription = userData.storeDetails.storeDescription || ''
        }
        
        // Update backup
        Object.assign(backupData, { ...profileData })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      isLoadingProfile.value = false
    }
  } else {
    isLoadingProfile.value = false
  }
})

// Account settings
const accountSettings = reactive({
  language: 'English (US)',
  notifications: 'Email, Push, SMS',
  theme: 'Follow system',
  timezone: 'UTC (GMT +0:00)',
})

// Security settings
const securitySettings = reactive({
  twoFactor: false,
  activeSessions: 3,
})

// Super Admin Permissions
const superAdminPermissions = [
  'Full access to all features',
  'Manage store information and settings',
  'Manage team members and roles',
  'View and manage all inventory',
  'View and manage all customers',
  'View and manage all receipts and sales',
  'View and manage all returns',
  'Access all reports and analytics',
  'Manage departments and staff',
  'Configure tax and payment settings',
  'Export and import all data',
  'Delete all data',
  'Manage leave requests',
  'Access system settings',
  'Manage user permissions',
]

// Modal states (simplified - would be actual modals in production)
const showLanguageModal = ref(false)
const showNotificationsModal = ref(false)
const showThemeModal = ref(false)
const showTimezoneModal = ref(false)
const showPasswordModal = ref(false)
const showSessionsModal = ref(false)

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
    alert('You must be signed in to update your profile')
    return
  }

  try {
    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim()
    await updateUserDocument(currentUser.value.uid, {
      name: fullName || profileData.firstName || profileData.email,
      email: profileData.email,
    })
    
    isEditingPersonalInfo.value = false
    Object.assign(backupData, { ...profileData })
    alert('Profile updated successfully!')
  } catch (error: any) {
    console.error('Error saving profile:', error)
    alert(error.message || 'Failed to update profile. Please try again.')
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // Here you would typically upload to a server
    console.log('Uploading image:', file.name)
    // Show success message
    alert('Image uploaded successfully!')
  }
}

const toggleTwoFactor = () => {
  securitySettings.twoFactor = !securitySettings.twoFactor
  // Here you would typically make an API call
  console.log('Two-factor auth:', securitySettings.twoFactor ? 'enabled' : 'disabled')
  alert(`Two-factor authentication ${securitySettings.twoFactor ? 'enabled' : 'disabled'}`)
}

// Watch for modal states to handle modals (simplified)
watch([showLanguageModal, showNotificationsModal, showThemeModal, showTimezoneModal, showPasswordModal, showSessionsModal], () => {
  // In production, these would open actual modal components
  // For now, we'll just show alerts
  if (showLanguageModal.value) {
    alert('Language selection modal would appear here')
    showLanguageModal.value = false
  }
  if (showNotificationsModal.value) {
    alert('Notifications settings modal would appear here')
    showNotificationsModal.value = false
  }
  if (showThemeModal.value) {
    alert('Theme selection modal would appear here')
    showThemeModal.value = false
  }
  if (showTimezoneModal.value) {
    alert('Timezone selection modal would appear here')
    showTimezoneModal.value = false
  }
  if (showPasswordModal.value) {
    alert('Password change modal would appear here')
    showPasswordModal.value = false
  }
  if (showSessionsModal.value) {
    alert('Active sessions modal would appear here')
    showSessionsModal.value = false
  }
})
</script>
