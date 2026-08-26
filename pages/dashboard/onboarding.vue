<template>
  <div class="min-h-screen bg-gray-50 dark:!bg-dashboard-card">
    <div
      v-if="checkingProfile"
      class="flex min-h-screen items-center justify-center px-4"
    >
      <div class="text-center">
        <div
          class="mx-auto mb-4 inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500"
        />
        <p class="text-sm text-gray-600 dark:text-gray-400">Loading your account…</p>
      </div>
    </div>

    <div v-else class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Progress Indicator -->
      <div class="mb-5 sm:mb-6">
        <div class="flex items-center justify-between mb-1.5">
          <h2 class="text-xs font-medium text-gray-600 dark:text-gray-400">Account Setup</h2>
          <span class="text-xs font-medium text-primary-500 dark:text-primary-400"
            >Step {{ currentStep }} of {{ totalSteps }}</span
          >
        </div>
        <div class="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10">
          <div
            class="bg-gradient-to-r from-primary-400 to-primary-500 h-1.5 rounded-full transition-[width] duration-300 ease-out"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Form Card -->
      <div class="bg-white dark:!bg-dashboard-card rounded-sm p-5 sm:p-6">
        <Transition name="step-fade" mode="out-in">
          <!-- Step 1: Currency & Country Selection -->
          <div v-if="currentStep === 1" key="step-1" class="space-y-4 sm:space-y-5">
            <div class="text-center mb-4 sm:mb-5">
              <div
                class="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-2.5"
              >
                <GlobeAltIcon class="h-5 w-5 text-white" />
              </div>
              <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Welcome to Storvv!
              </h1>
              <p class="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Let's set up your account. Choose your currency and country to get started.
              </p>
            </div>

            <!-- Currency Selection -->
            <div>
              <label
                for="currency"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Select Currency <span class="text-red-500">*</span>
              </label>
              <select
                id="currency"
                v-model="selectedCurrency"
                required
                class="onboarding-input app-field w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-sm focus:ring-2 focus:ring-primary-400/30 outline-none text-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>Choose a currency...</option>
                <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                  {{ currency.symbol }} {{ currency.name }} ({{ currency.code }})
                </option>
              </select>
              <p class="mt-1.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                This currency will be used throughout your account for all transactions and reports.
              </p>
            </div>

            <!-- Country Selection -->
            <div>
              <label
                for="country"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Select Country <span class="text-red-500">*</span>
              </label>
              <select
                id="country"
                v-model="selectedCountry"
                required
                class="onboarding-input app-field w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-sm focus:ring-2 focus:ring-primary-400/30 outline-none text-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>Choose your country...</option>
                <option v-for="region in regions" :key="region.code" :value="region.code">
                  {{ region.flag }} {{ region.name }}
                </option>
              </select>
              <p class="mt-1.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                This helps us format dates, times, and numbers according to your location.
              </p>
            </div>
          </div>

          <!-- Step 2: Store Information -->
          <div v-else key="step-2" class="space-y-3">
            <div class="text-center mb-4 sm:mb-5">
              <div
                class="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-2.5"
              >
                <BuildingStorefrontIcon class="h-5 w-5 text-white" />
              </div>
              <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Store Information
              </h1>
              <p class="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                Tell us about your store. This information will be used on receipts and reports.
              </p>
            </div>

            <!-- Head store branch -->
            <div>
              <label
                for="storeName"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Head store branch <span class="text-red-500">*</span>
              </label>
              <select
                v-if="availableCities.length > 0"
                id="storeName"
                v-model="storeDetails.storeName"
                required
                class="onboarding-input app-field w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-sm focus:ring-2 focus:ring-primary-400/30 outline-none text-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>Choose a city...</option>
                <option v-for="city in availableCities" :key="city" :value="city">
                  {{ city }}
                </option>
              </select>
              <input
                v-else
                id="storeName"
                v-model="storeDetails.storeName"
                type="text"
                required
                class="onboarding-input app-field w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-sm focus:ring-2 focus:ring-primary-400/30 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter head store branch"
              />
              <p class="mt-1.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                Cities in {{ selectedRegionLabel }} based on your country selection.
              </p>
            </div>

            <!-- Store Address -->
            <div>
              <label
                for="storeAddress"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Store Address
              </label>
              <textarea
                id="storeAddress"
                v-model="storeDetails.storeAddress"
                rows="3"
                class="onboarding-input app-field w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-sm focus:ring-2 focus:ring-primary-400/30 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="123 Main Street, City, State 12345"
              ></textarea>
            </div>

            <!-- Store Phone -->
            <div>
              <label
                for="storePhone"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Store Phone
              </label>
              <input
                id="storePhone"
                v-model="storeDetails.storePhone"
                type="tel"
                class="onboarding-input app-field w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-sm focus:ring-2 focus:ring-primary-400/30 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <!-- Store Email -->
            <div>
              <label
                for="storeEmail"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Store Email
              </label>
              <input
                id="storeEmail"
                v-model="storeDetails.storeEmail"
                type="email"
                class="onboarding-input app-field w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-sm focus:ring-2 focus:ring-primary-400/30 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="store@example.com"
              />
            </div>

            <!-- Store Description -->
            <div>
              <label
                for="storeDescription"
                class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Store Description
              </label>
              <textarea
                id="storeDescription"
                v-model="storeDetails.storeDescription"
                rows="3"
                class="onboarding-input app-field w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 rounded-sm focus:ring-2 focus:ring-primary-400/30 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Tell us about your store..."
              ></textarea>
            </div>
          </div>
        </Transition>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm mb-4"
        >
          <p class="text-xs text-red-600 dark:text-red-400 text-center">{{ errorMessage }}</p>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <Button
            v-if="currentStep > 1"
            variant="outline"
            size="sm"
            type="button"
            @click="previousStep"
          >
            Previous
          </Button>
          <div v-else aria-hidden="true" />

          <Button
            variant="primary"
            size="sm"
            type="button"
            :icon="ArrowRightIcon"
            icon-right
            :loading="isLoading"
            :disabled="isLoading || !canContinue"
            @click="nextStep"
          >
            {{
              isLoading ? 'Saving...' : currentStep === totalSteps ? 'Complete Setup' : 'Continue'
            }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import {
  GlobeAltIcon,
  ArrowRightIcon,
  BuildingStorefrontIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser, type StoreDetails } from '~/composables/useUser'
import { usePreferences, currencies, regions } from '~/composables/usePreferences'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { getCitiesForRegion, isCityInRegion } from '~/utils/region-cities'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const { currentUser, loading: authLoading } = useFirebaseAuth()
const { getUserDocument, updateUserDocument, updateStoreDetails } = useUser()
const { updatePreferences } = usePreferences()
const storesStore = useStoresStore()
const userStore = useUserStore()

const currentStep = ref(1)
const totalSteps = 2
const isLoading = ref(false)
const checkingProfile = ref(true)
const errorMessage = ref('')
const selectedCurrency = ref('')
const selectedCountry = ref('')

const storeDetails = ref<StoreDetails>({
  storeName: '',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  storeDescription: '',
})

// Get currency symbol from selected currency
const selectedCurrencySymbol = computed(() => {
  const currency = currencies.find((c) => c.code === selectedCurrency.value)
  return currency?.symbol || '$'
})

const selectedRegionLabel = computed(() => {
  const region = regions.find((r) => r.code === selectedCountry.value)
  return region ? `${region.flag} ${region.name}` : 'your country'
})

const availableCities = computed(() => getCitiesForRegion(selectedCountry.value))

watch(selectedCountry, () => {
  if (
    storeDetails.value.storeName &&
    !isCityInRegion(storeDetails.value.storeName, selectedCountry.value)
  ) {
    storeDetails.value.storeName = ''
  }
})

const canContinue = computed(() => {
  if (currentStep.value === 1) {
    return !!selectedCurrency.value && !!selectedCountry.value
  }
  return !!storeDetails.value.storeName?.trim()
})

onMounted(async () => {
  try {
    await nextTick()
    if (!authLoading.value && !currentUser.value) {
      await navigateTo('/signin')
      return
    }

    if (!currentUser.value) return

    if (!userStore.userData) {
      await userStore.fetchUserData(currentUser.value.uid)
    }

    const session = userStore.userData
    if (session?.role === 'staff') {
      await navigateTo(session.mustChangePassword ? '/dashboard/change-password' : '/dashboard')
      return
    }

    const userData = await getUserDocument(currentUser.value.uid)
    if (userData?.hasCompletedOnboarding) {
      await navigateTo('/dashboard')
    }
  } finally {
    checkingProfile.value = false
  }
})

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    errorMessage.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    const currency = currencies.find((c) => c.code === selectedCurrency.value)
    const region = regions.find((r) => r.code === selectedCountry.value)

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
      timeFormat: '12h',
    })

    // Save store details
    await updateStoreDetails(currentUser.value.uid, storeDetails.value)

    // Create the first store during onboarding and set it as the current/default store.
    // Existing users who already have stores keep their existing list.
    await storesStore.fetchStores()
    if (storesStore.stores.length === 0) {
      await storesStore.createStore(
        {
          name: storeDetails.value.storeName.trim(),
          description: storeDetails.value.storeDescription?.trim() || '',
          address: storeDetails.value.storeAddress?.trim() || '',
          phone: storeDetails.value.storePhone?.trim() || '',
          email: storeDetails.value.storeEmail?.trim() || '',
        },
        { setAsCurrent: true }
      )
    }

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

<style scoped>
.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.step-fade-enter-from,
.step-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* Native selects: align height with compact inputs (browser default line-height can look tall) */
.onboarding-input {
  min-height: 2.25rem;
}
select.onboarding-input {
  min-height: 2.25rem;
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
textarea.onboarding-input {
  min-height: auto;
}
</style>
