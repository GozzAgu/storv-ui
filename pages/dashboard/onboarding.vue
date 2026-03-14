<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Progress Indicator -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-medium text-gray-600 dark:text-gray-400">Account Setup</h2>
          <span class="text-sm font-medium text-primary-500 dark:text-primary-400">Step {{ currentStep }} of {{ totalSteps }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-primary-400 to-primary-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Form Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 sm:p-10 border border-gray-200 dark:border-gray-700">
        <!-- Step 1: Currency & Country Selection -->
        <div v-if="currentStep === 1" class="space-y-6 sm:space-y-8">
          <div class="text-center mb-6 sm:mb-8">
            <div class="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-3 sm:mb-4">
              <GlobeAltIcon class="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Storvv!
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Let's set up your account. Choose your currency and country to get started.
            </p>
          </div>

          <!-- Currency Selection -->
          <div>
            <label for="currency" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Select Currency <span class="text-red-500">*</span>
            </label>
            <select
              id="currency"
              v-model="selectedCurrency"
              required
              class="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100"
            >
              <option value="" disabled>Choose a currency...</option>
              <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                {{ currency.symbol }} {{ currency.name }} ({{ currency.code }})
              </option>
            </select>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              This currency will be used throughout your account for all transactions and reports.
            </p>
          </div>

          <!-- Country Selection -->
          <div>
            <label for="country" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Select Country <span class="text-red-500">*</span>
            </label>
            <select
              id="country"
              v-model="selectedCountry"
              required
              class="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100"
            >
              <option value="" disabled>Choose your country...</option>
              <option v-for="region in regions" :key="region.code" :value="region.code">
                {{ region.flag }} {{ region.name }}
              </option>
            </select>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              This helps us format dates, times, and numbers according to your location.
            </p>
          </div>
        </div>

        <!-- Step 2: Store Information -->
        <div v-if="currentStep === 2" class="space-y-4 sm:space-y-5">
          <div class="text-center mb-6 sm:mb-8">
            <div class="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-3 sm:mb-4">
              <BuildingStorefrontIcon class="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Store Information
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Tell us about your store. This information will be used on receipts and reports.
            </p>
          </div>

          <!-- Head store branch -->
          <div>
            <label for="storeName" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Head store branch <span class="text-red-500">*</span>
            </label>
            <input
              id="storeName"
              v-model="storeDetails.storeName"
              type="text"
              required
              class="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter head store branch"
            />
          </div>

          <!-- Store Address -->
          <div>
            <label for="storeAddress" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Store Address
            </label>
            <textarea
              id="storeAddress"
              v-model="storeDetails.storeAddress"
              rows="3"
              class="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="123 Main Street, City, State 12345"
            ></textarea>
          </div>

          <!-- Store Phone -->
          <div>
            <label for="storePhone" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Store Phone
            </label>
            <input
              id="storePhone"
              v-model="storeDetails.storePhone"
              type="tel"
              class="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <!-- Store Email -->
          <div>
            <label for="storeEmail" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Store Email
            </label>
            <input
              id="storeEmail"
              v-model="storeDetails.storeEmail"
              type="email"
              class="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="store@example.com"
            />
          </div>

          <!-- Store Description -->
          <div>
            <label for="storeDescription" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Store Description
            </label>
            <textarea
              id="storeDescription"
              v-model="storeDetails.storeDescription"
              rows="3"
              class="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-200 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Tell us about your store..."
            ></textarea>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-6">
          <p class="text-sm text-red-600 dark:text-red-400 text-center">{{ errorMessage }}</p>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            type="button"
            class="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          <div v-else></div>

          <button
            @click="nextStep"
            :disabled="isLoading || (currentStep === 1 && (!selectedCurrency || !selectedCountry)) || (currentStep === 2 && !storeDetails.storeName?.trim())"
            type="button"
            class="px-6 py-2.5 bg-gradient-to-r from-primary-400 to-primary-500 text-white rounded-md font-semibold text-sm hover:brightness-110 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 flex items-center gap-2"
          >
            <span v-if="!isLoading">
              {{ currentStep === totalSteps ? 'Complete Setup' : 'Continue' }}
              <ArrowRightIcon class="inline-block w-4 h-4 ml-1" />
            </span>
            <span v-else class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { GlobeAltIcon, ArrowRightIcon, BuildingStorefrontIcon } from '@heroicons/vue/24/outline'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser, type StoreDetails } from '~/composables/useUser'
import { usePreferences, currencies, regions } from '~/composables/usePreferences'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { currentUser, loading: authLoading } = useFirebaseAuth()
const { getUserDocument, updateUserDocument, updateStoreDetails } = useUser()
const { updatePreferences } = usePreferences()

const currentStep = ref(1)
const totalSteps = 2
const isLoading = ref(false)
const errorMessage = ref('')
const selectedCurrency = ref('')
const selectedCountry = ref('')

const storeDetails = ref<StoreDetails>({
  storeName: '',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  storeDescription: ''
})

// Get currency symbol from selected currency
const selectedCurrencySymbol = computed(() => {
  const currency = currencies.find(c => c.code === selectedCurrency.value)
  return currency?.symbol || '$'
})

onMounted(async () => {
  // Redirect if not authenticated
  await nextTick()
  if (!authLoading.value && !currentUser.value) {
    navigateTo('/signin')
    return
  }

  // Check if user has already completed onboarding
  if (currentUser.value) {
    const userData = await getUserDocument(currentUser.value.uid)
    if (userData?.hasCompletedOnboarding) {
      navigateTo('/dashboard')
    }
  }
})

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    errorMessage.value = ''
  }
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    // Validate currency and country
    if (!selectedCurrency.value || !selectedCountry.value) {
      errorMessage.value = 'Please select both currency and country to continue'
      return
    }
    currentStep.value++
  } else if (currentStep.value === totalSteps) {
    // Complete onboarding
    await completeOnboarding()
  }
}

const completeOnboarding = async () => {
  if (!currentUser.value) {
    navigateTo('/signin')
    return
  }

  // Validate head store branch
  if (!storeDetails.value.storeName?.trim()) {
    errorMessage.value = 'Head store branch is required'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // Get the selected currency details
    const currency = currencies.find(c => c.code === selectedCurrency.value)
    const region = regions.find(r => r.code === selectedCountry.value)

    if (!currency || !region) {
      throw new Error('Invalid currency or country selection')
    }

    // Save preferences to user account
    await updatePreferences({
      currency: selectedCurrency.value,
      currencySymbol: currency.symbol,
      region: selectedCountry.value,
      baseCurrency: selectedCurrency.value, // Set as base currency on first setup
      language: 'en', // Default language
      timezone: 'UTC', // Will be updated based on region if needed
      dateFormat: selectedCountry.value === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
      timeFormat: '12h'
    })

    // Save store details
    await updateStoreDetails(currentUser.value.uid, storeDetails.value)
    
    // Redirect to dashboard (tutorial will start there)
    await navigateTo('/dashboard')
  } catch (error: any) {
    console.error('Onboarding error:', error)
    errorMessage.value = error.message || 'Failed to save information. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

