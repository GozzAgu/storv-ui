<template>
  <AuthShell
    panel-eyebrow="Set up your store"
    panel-title="A few details and you're in"
    panel-description="This takes about a minute. You can change all of it later in Settings."
    :steps="onboardingSteps"
    :active-step="checkingProfile ? -1 : currentStep - 1"
    steps-label="Store setup"
    wide
  >
    <div v-if="checkingProfile" class="s-auth-status" role="status">
      <SSpinner :size="28" label="Loading your account" />
      <p class="s-auth-status__body">Loading your account…</p>
    </div>

    <template v-else>
      <div class="s-onboarding__progress">
        <p class="s-onboarding__step-count">Step {{ currentStep }} of {{ totalSteps }}</p>
        <div
          class="s-onboarding__track"
          role="progressbar"
          :aria-valuenow="currentStep"
          aria-valuemin="1"
          :aria-valuemax="totalSteps"
          :aria-valuetext="`Step ${currentStep} of ${totalSteps}`"
        >
          <span
            class="s-onboarding__fill"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          />
        </div>
      </div>

      <AuthPageHeader :title="stepCopy.title" :subtitle="stepCopy.subtitle" />

      <form class="auth-form" novalidate @submit.prevent="nextStep">
        <Transition name="s-onboarding-step" mode="out-in">
          <div v-if="currentStep === 1" key="step-1" class="s-form">
            <SSelect
              id="currency"
              v-model="selectedCurrency"
              label="Currency"
              placeholder="Choose a currency"
              hint="Used for every price, sale and report in your account."
              :options="currencyOptions"
              required
            />
            <SCountrySelect
              id="country"
              v-model="selectedCountry"
              label="Country"
              placeholder="Choose your country"
              hint="Sets how dates, times and numbers are shown."
              :countries="regions"
              required
            />
          </div>

          <div v-else-if="currentStep === 2" key="step-2" class="s-form">
            <ExperienceModePicker
              v-model="selectedExperienceMode"
              :show-changes="false"
              aria-label="How you run your business"
            />
          </div>

          <div v-else key="step-3" class="s-form">
            <SSelect
              v-if="availableCities.length > 0"
              id="storeName"
              v-model="storeDetails.storeName"
              label="Head branch"
              placeholder="Choose a city"
              :hint="`Cities in ${selectedRegionLabel}.`"
              :options="cityOptions"
              required
            />
            <SInput
              v-else
              id="storeName"
              v-model="storeDetails.storeName"
              label="Head branch"
              placeholder="For example, Lekki"
              hint="The name of your main store location."
              required
            />

            <fieldset class="s-onboarding__optional">
              <legend>Optional, shown on receipts</legend>
              <STextarea
                id="storeAddress"
                v-model="storeDetails.storeAddress"
                label="Address"
                placeholder="Street, area and city"
                :rows="2"
              />
              <div class="s-onboarding__pair">
                <SInput
                  id="storePhone"
                  v-model="storeDetails.storePhone"
                  type="tel"
                  label="Phone"
                  autocomplete="tel"
                  placeholder="+234 800 000 0000"
                />
                <SInput
                  id="storeEmail"
                  v-model="storeDetails.storeEmail"
                  type="email"
                  label="Email"
                  autocomplete="email"
                  placeholder="store@example.com"
                />
              </div>
              <STextarea
                id="storeDescription"
                v-model="storeDetails.storeDescription"
                label="What you sell"
                placeholder="For example, perfumes and body care"
                :rows="2"
              />
            </fieldset>
          </div>
        </Transition>

        <AuthAlert v-if="errorMessage" title="Can't continue yet" :message="errorMessage" />

        <div class="s-onboarding__actions">
          <SButton v-if="currentStep > 1" :disabled="isLoading" @click="previousStep">
            <template #leading
              ><ArrowLeft :size="16" :stroke-width="2" aria-hidden="true"
            /></template>
            Back
          </SButton>
          <SButton v-if="currentStep === 2" variant="ghost" @click="skipExperienceStep">
            Skip for now
          </SButton>
          <SButton
            type="submit"
            variant="primary"
            class="s-onboarding__next"
            :loading="isLoading"
            :disabled="isLoading || !canContinue"
          >
            {{
              isLoading ? 'Setting up…' : currentStep === totalSteps ? 'Finish setup' : 'Continue'
            }}
            <template v-if="!isLoading" #trailing>
              <ArrowRight :size="16" :stroke-width="2" aria-hidden="true" />
            </template>
          </SButton>
        </div>
      </form>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthPageHeader from '~/components/auth/AuthPageHeader.vue'
import AuthAlert from '~/components/auth/AuthAlert.vue'
import SButton from '~/components/s/SButton.vue'
import SCountrySelect from '~/components/s/SCountrySelect.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import STextarea from '~/components/s/STextarea.vue'
import ExperienceModePicker from '~/components/settings/ExperienceModePicker.vue'
import { DEFAULT_EXPERIENCE_MODE } from '~/types/business-experience'
import { suggestOnboardingLocale } from '~/utils/onboarding-locale'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser, type StoreDetails } from '~/composables/useUser'
import { usePreferences, currencies, regions } from '~/composables/usePreferences'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { getCitiesForRegion, isCityInRegion } from '~/utils/region-cities'
import type { ExperienceMode } from '~/types/business-experience'
import { withOnboardingExperienceChoice } from '~/utils/onboarding-experience'
import { useFunnelAnalytics } from '~/composables/useFunnelAnalytics'

definePageMeta({
  layout: false,
  middleware: 'auth',
})

useHead({ title: 'Set up your store - Storvv' })

const onboardingSteps = [
  { label: 'Currency and country' },
  { label: 'How you work' },
  { label: 'Your head branch' },
]

const STEP_COPY = [
  {
    title: 'Welcome to Storvv',
    subtitle: 'Choose the currency and country your business runs in.',
  },
  {
    title: 'How do you run your business?',
    subtitle: 'Pick what fits today. You can turn on more tools later in Settings.',
  },
  {
    title: 'Add your head branch',
    subtitle: 'This becomes your first store. Add more branches any time.',
  },
] as const

const { currentUser, loading: authLoading } = useFirebaseAuth()
const { getUserDocument, updateUserDocument, updateStoreDetails } = useUser()
const { updatePreferences } = usePreferences()
const storesStore = useStoresStore()
const userStore = useUserStore()
const { recordMilestone } = useFunnelAnalytics()

const currentStep = ref(1)
const totalSteps = 3
const isLoading = ref(false)
const checkingProfile = ref(true)
const errorMessage = ref('')
const selectedCurrency = ref('')
const selectedCountry = ref('')
const selectedExperienceMode = ref<ExperienceMode | ''>('')

const storeDetails = ref<StoreDetails>({
  storeName: '',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  storeDescription: '',
})

const stepCopy = computed(() => STEP_COPY[currentStep.value - 1] ?? STEP_COPY[0])

const currencyOptions = currencies.map((currency) => ({
  value: currency.code,
  label: `${currency.symbol} ${currency.name} (${currency.code})`,
}))
const cityOptions = computed(() =>
  availableCities.value.map((city) => ({ value: city, label: city }))
)

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
  if (currentStep.value === 2) {
    return selectedExperienceMode.value === 'solo' || selectedExperienceMode.value === 'business'
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
      return
    }

    if (!selectedCountry.value && !selectedCurrency.value) {
      const suggestion = suggestOnboardingLocale(navigator.languages ?? [], regions, currencies)
      selectedCountry.value = suggestion.country
      selectedCurrency.value = suggestion.currency
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

function skipExperienceStep() {
  selectedExperienceMode.value = DEFAULT_EXPERIENCE_MODE
  errorMessage.value = ''
  currentStep.value = 3
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    return
  }

  if (currentStep.value === 2) {
    if (selectedExperienceMode.value !== 'solo' && selectedExperienceMode.value !== 'business') {
      errorMessage.value = 'Please choose how you run your business to continue'
      return
    }
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  if (currentStep.value === totalSteps) {
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

    // Save store details + explicit experience choice (new signups only)
    const detailsToSave = withOnboardingExperienceChoice(
      storeDetails.value,
      selectedExperienceMode.value
    )
    await updateStoreDetails(currentUser.value.uid, detailsToSave)

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

    // Redirect to dashboard with first-win banner
    await recordMilestone('onboardingCompletedAt', {
      experience_mode: selectedExperienceMode.value,
      currency: selectedCurrency.value,
      country: selectedCountry.value,
    })
    await navigateTo('/dashboard?welcome=1')
  } catch (error: any) {
    console.error('Onboarding error:', error)
    errorMessage.value = error.message || 'Failed to save information. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
