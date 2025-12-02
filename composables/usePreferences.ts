import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface UserPreferences {
  currency: string // Currency code (e.g., 'USD', 'NGN', 'EUR')
  currencySymbol?: string // Symbol for the currency (e.g., '$', '₦', '€')
  baseCurrency?: string // Base currency for conversion (defaults to first currency set or USD)
  region: string // Region/Country code (e.g., 'US', 'NG', 'GB')
  language: string // Language code (e.g., 'en', 'es', 'fr')
  timezone: string // Timezone (e.g., 'America/New_York', 'Africa/Lagos')
  dateFormat: string // Date format (e.g., 'MM/DD/YYYY', 'DD/MM/YYYY')
  timeFormat: '12h' | '24h' // Time format
}

// Default preferences
const defaultPreferences: UserPreferences = {
  currency: 'USD',
  currencySymbol: '$',
  region: 'US',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
}

// Available currencies
export const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', region: 'US' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'NG' },
  { code: 'GBP', name: 'British Pound', symbol: '£', region: 'GB' },
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'EU' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'AU' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'JP' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'CN' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'IN' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', region: 'ZA' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', region: 'GH' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', region: 'KE' },
]

// Available regions
export const regions = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
]

// Local storage key
const PREFERENCES_KEY = 'userPreferences'
const BASE_CURRENCY_KEY = 'baseCurrency'

// Reactive preferences (initialized from localStorage or defaults)
const preferences = ref<UserPreferences>({ ...defaultPreferences })
const baseCurrency = ref<string>('USD') // Default base currency

/**
 * Load preferences from localStorage or Firestore
 */
export const usePreferences = () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  // Load base currency from localStorage
  const loadBaseCurrency = () => {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(BASE_CURRENCY_KEY)
        if (saved) {
          baseCurrency.value = saved
        } else if (preferences.value.currency) {
          // If no base currency stored, use current currency as base
          baseCurrency.value = preferences.value.currency
        }
      } catch (error) {
        console.warn('Error loading base currency from localStorage:', error)
      }
    }
  }

  // Load preferences from localStorage on init
  const loadFromLocalStorage = () => {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(PREFERENCES_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          preferences.value = { ...defaultPreferences, ...parsed }
          
          // Set base currency if not set
          if (parsed.baseCurrency) {
            baseCurrency.value = parsed.baseCurrency
          } else if (!baseCurrency.value || baseCurrency.value === 'USD') {
            // If no base currency in prefs, use current currency or default
            baseCurrency.value = parsed.currency || 'USD'
          }
        }
        loadBaseCurrency()
      } catch (error) {
        console.warn('Error loading preferences from localStorage:', error)
      }
    }
  }

  // Load preferences from Firestore user document
  const loadFromFirestore = async () => {
    if (!authStore.currentUser) return

    try {
      // Ensure user data is loaded
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      // Check if preferences exist in user document
      if (userStore.userData && (userStore.userData as any).preferences) {
        const firestorePrefs = (userStore.userData as any).preferences as Partial<UserPreferences>
        preferences.value = { ...defaultPreferences, ...firestorePrefs }
        
        // Set base currency from preferences or use current currency
        if (firestorePrefs.baseCurrency) {
          baseCurrency.value = firestorePrefs.baseCurrency
        } else if (firestorePrefs.currency) {
          // First time setting currency - use it as base
          baseCurrency.value = firestorePrefs.currency
        }
        
        // Sync to localStorage
        if (import.meta.client) {
          localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences.value))
          localStorage.setItem(BASE_CURRENCY_KEY, baseCurrency.value)
        }
      } else {
        // No preferences in Firestore, use localStorage or defaults
        loadFromLocalStorage()
      }
    } catch (error) {
      console.warn('Error loading preferences from Firestore:', error)
      loadFromLocalStorage()
    }
  }

  // Save preferences to localStorage
  const saveToLocalStorage = (prefs: UserPreferences) => {
    if (import.meta.client) {
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
      } catch (error) {
        console.warn('Error saving preferences to localStorage:', error)
      }
    }
  }

  // Save preferences to Firestore
  const saveToFirestore = async (prefs: UserPreferences) => {
    if (!authStore.currentUser) return

    try {
      // Get the correct user ID (super admin UID if staff)
      let userId = authStore.currentUser.uid
      
      if (userStore.userData?.role === 'staff') {
        const db = useFirestore().getFirestoreInstance()
        if (db) {
          try {
            const staffRef = collection(db, 'staff')
            const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
            const staffSnapshot = await getDocs(staffQuery)

            if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
              const staffDoc = staffSnapshot.docs[0]
              if (staffDoc) {
                const staffData = staffDoc.data()
                if (staffData?.createdBy) {
                  userId = staffData.createdBy
                }
              }
            }
          } catch (error: any) {
            console.warn('Could not fetch staff document for preferences:', error.message)
          }
        }
      }
      
      // Ensure baseCurrency is included in preferences
      const prefsWithBase = {
        ...prefs,
        baseCurrency: baseCurrency.value,
      }
      
      const { updateUserDocument } = useUser()
      await updateUserDocument(userId, {
        preferences: prefsWithBase,
      } as any)

      // Update userStore
      await userStore.fetchUserData(userId)
    } catch (error) {
      console.warn('Error saving preferences to Firestore:', error)
    }
  }

  // Update preferences
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const oldCurrency = preferences.value.currency
    preferences.value = { ...preferences.value, ...updates }
    
    // If base currency is not set, set it to the current currency (first time)
    if (!baseCurrency.value || baseCurrency.value === 'USD') {
      if (preferences.value.currency) {
        baseCurrency.value = preferences.value.currency
      }
    }
    
    // Save base currency to localStorage
    if (import.meta.client) {
      localStorage.setItem(BASE_CURRENCY_KEY, baseCurrency.value)
    }
    
    saveToLocalStorage(preferences.value)
    await saveToFirestore(preferences.value)
    
    // If currency changed, refresh exchange rates
    if (updates.currency && updates.currency !== oldCurrency) {
      try {
        const { useCurrencyConversion } = await import('~/composables/useCurrencyConversion')
        const { refreshRates } = useCurrencyConversion()
        await refreshRates(baseCurrency.value)
      } catch (error) {
        console.warn('Error refreshing exchange rates:', error)
      }
    }
  }

  // Format currency with conversion
  const formatCurrency = (value: number, options?: { showSymbol?: boolean; fromCurrency?: string }) => {
    if (!import.meta.client) {
      // SSR fallback - just format without conversion
      const locale = preferences.value.region === 'NG' ? 'en-NG' : 
        preferences.value.region === 'GB' ? 'en-GB' : 
        preferences.value.region === 'EU' ? 'de-DE' : 'en-US'
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: preferences.value.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    }
    
    const { showSymbol = true, fromCurrency } = options || {}
    
    // Get the target currency (user's preference)
    const targetCurrency = preferences.value.currency
    const sourceCurrency = fromCurrency || baseCurrency.value
    
    // Convert currency if needed
    let convertedValue = value
    
    // Only convert if currencies are different
    if (sourceCurrency !== targetCurrency) {
      try {
        // Use synchronous conversion with cached rates
        const { useCurrencyConversion } = require('~/composables/useCurrencyConversion')
        const currencyConversion = useCurrencyConversion()
        convertedValue = currencyConversion.convertCurrencySync(value, sourceCurrency, targetCurrency)
      } catch (error) {
        // If conversion fails, use original value
        console.warn('Currency conversion failed, using original value:', error)
        convertedValue = value
      }
    }
    
    // Format the converted value
    const locale = preferences.value.region === 'NG' ? 'en-NG' : 
      preferences.value.region === 'GB' ? 'en-GB' : 
      preferences.value.region === 'EU' ? 'de-DE' : 'en-US'
    
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedValue)

    return formatted
  }

  // Format date
  const formatDate = (date: Date | string | any, options?: { includeTime?: boolean }) => {
    const { includeTime = false } = options || {}
    if (!date) return ''

    try {
      let dateObj: Date
      
      // Handle Firestore Timestamp
      if (date && typeof date === 'object' && typeof date.toDate === 'function') {
        dateObj = date.toDate()
      } else if (date && typeof date === 'object' && 'seconds' in date) {
        dateObj = new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000)
      } else if (date instanceof Date) {
        dateObj = date
      } else {
        dateObj = new Date(date)
      }

      if (isNaN(dateObj.getTime())) return ''

      // Convert to user's timezone
      const timeZone = preferences.value.timezone || 'UTC'
      const locale = preferences.value.language === 'en' ? 
        (preferences.value.region === 'GB' ? 'en-GB' : 'en-US') :
        preferences.value.language

      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone,
      }

      if (includeTime) {
        dateOptions.hour = '2-digit'
        dateOptions.minute = '2-digit'
        if (preferences.value.timeFormat === '24h') {
          dateOptions.hour12 = false
        }
      }

      return dateObj.toLocaleDateString(locale, dateOptions)
    } catch (error) {
      console.warn('Error formatting date:', error)
      return ''
    }
  }

  // Format time
  const formatTime = (date: Date | string | any) => {
    return formatDate(date, { includeTime: true })
  }

  // Initialize preferences
  const initialize = async () => {
    loadFromLocalStorage()
    await loadFromFirestore()
    
    // Initialize currency conversion with base currency
    if (import.meta.client) {
      try {
        const { useCurrencyConversion } = await import('~/composables/useCurrencyConversion')
        const { initialize: initConversion } = useCurrencyConversion()
        await initConversion(baseCurrency.value || preferences.value.currency || 'USD')
      } catch (error) {
        console.warn('Error initializing currency conversion:', error)
      }
    }
  }

  return {
    preferences: computed(() => preferences.value),
    baseCurrency: computed(() => baseCurrency.value),
    currencies,
    regions,
    updatePreferences,
    formatCurrency,
    formatDate,
    formatTime,
    initialize,
  }
}

