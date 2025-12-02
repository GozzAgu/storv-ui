import { ref, computed } from 'vue'

interface ExchangeRates {
  [key: string]: number
}

interface ExchangeRateCache {
  rates: ExchangeRates
  baseCurrency: string
  timestamp: number
}

const EXCHANGE_RATE_CACHE_KEY = 'exchangeRatesCache'
const CACHE_DURATION = 1000 * 60 * 60 * 24 // 24 hours

// Store the base currency (default: USD)
const baseCurrency = ref<string>('USD')

// Store exchange rates cache
const exchangeRatesCache = ref<ExchangeRateCache | null>(null)

/**
 * Currency conversion composable
 * Fetches exchange rates and converts amounts between currencies
 */
export const useCurrencyConversion = () => {
  
  // Load cache from localStorage
  const loadCache = () => {
    if (import.meta.client) {
      try {
        const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY)
        if (cached) {
          const parsed: ExchangeRateCache = JSON.parse(cached)
          // Check if cache is still valid (less than 24 hours old)
          const now = Date.now()
          if (parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
            exchangeRatesCache.value = parsed
            baseCurrency.value = parsed.baseCurrency || 'USD'
            return true
          }
        }
      } catch (error) {
        console.warn('Error loading exchange rate cache:', error)
      }
    }
    return false
  }

  // Save cache to localStorage
  const saveCache = (rates: ExchangeRates, base: string) => {
    if (import.meta.client) {
      try {
        const cache: ExchangeRateCache = {
          rates,
          baseCurrency: base,
          timestamp: Date.now(),
        }
        localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(cache))
        exchangeRatesCache.value = cache
        baseCurrency.value = base
      } catch (error) {
        console.warn('Error saving exchange rate cache:', error)
      }
    }
  }

  // Fetch exchange rates from API
  const fetchExchangeRates = async (fromCurrency: string = 'USD'): Promise<ExchangeRates | null> => {
    try {
      // Use a free API - exchangerate-api.com (no API key required for basic usage)
      // Alternative: exchangerate.host (also free)
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates')
      }

      const data = await response.json()
      
      if (data && data.rates) {
        // Ensure base currency is in rates (1:1)
        const rates: ExchangeRates = {
          ...data.rates,
          [fromCurrency]: 1,
        }
        
        saveCache(rates, fromCurrency)
        return rates
      }
      
      return null
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      
      // Try fallback API
      try {
        const fallbackResponse = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`)
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          if (fallbackData && fallbackData.rates) {
            const rates: ExchangeRates = {
              ...fallbackData.rates,
              [fromCurrency]: 1,
            }
            saveCache(rates, fromCurrency)
            return rates
          }
        }
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError)
      }
      
      // Return cached rates if available, even if expired
      if (exchangeRatesCache.value) {
        console.warn('Using expired cache due to API failure')
        return exchangeRatesCache.value.rates
      }
      
      return null
    }
  }

  // Get exchange rates (from cache or API)
  const getExchangeRates = async (fromCurrency: string = 'USD', forceRefresh: boolean = false): Promise<ExchangeRates | null> => {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const hasCache = loadCache()
      if (hasCache && exchangeRatesCache.value && exchangeRatesCache.value.baseCurrency === fromCurrency) {
        return exchangeRatesCache.value.rates
      }
    }

    // Fetch from API
    return await fetchExchangeRates(fromCurrency)
  }

  // Convert amount from one currency to another
  const convertCurrency = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> => {
    // If same currency, return as is
    if (fromCurrency === toCurrency) {
      return amount
    }

    // Get exchange rates
    const rates = await getExchangeRates(fromCurrency)
    
    if (!rates) {
      console.warn('Exchange rates not available, returning original amount')
      return amount
    }

    // Convert: if fromCurrency is base, use direct rate
    // Otherwise, convert to base first, then to target
    let convertedAmount = amount

    if (rates[toCurrency]) {
      // Direct conversion available
      convertedAmount = amount * rates[toCurrency]
    } else if (rates[fromCurrency] && fromCurrency !== baseCurrency.value) {
      // Need to convert fromCurrency to base first
      const amountInBase = amount / rates[fromCurrency]
      convertedAmount = amountInBase * (rates[toCurrency] || 1)
    }

    return Math.round(convertedAmount * 100) / 100 // Round to 2 decimal places
  }

  // Convert amount synchronously (using cached rates)
  const convertCurrencySync = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    // If same currency, return as is
    if (fromCurrency === toCurrency) {
      return amount
    }

    // Load cache
    loadCache()

    const rates = exchangeRatesCache.value?.rates
    if (!rates) {
      console.warn('Exchange rates not available in cache, returning original amount')
      return amount
    }

    // Ensure base currency rate exists
    const base = exchangeRatesCache.value?.baseCurrency || 'USD'
    
    let convertedAmount = amount

    // If converting from base currency
    if (fromCurrency === base && rates[toCurrency]) {
      convertedAmount = amount * rates[toCurrency]
    }
    // If converting to base currency
    else if (toCurrency === base && rates[fromCurrency]) {
      convertedAmount = amount / rates[fromCurrency]
    }
    // Converting between two non-base currencies
    else if (rates[fromCurrency] && rates[toCurrency]) {
      // Convert to base first, then to target
      const amountInBase = amount / rates[fromCurrency]
      convertedAmount = amountInBase * rates[toCurrency]
    }

    return Math.round(convertedAmount * 100) / 100 // Round to 2 decimal places
  }

  // Initialize and fetch rates on first use
  const initialize = async (defaultBaseCurrency: string = 'USD') => {
    baseCurrency.value = defaultBaseCurrency
    await getExchangeRates(defaultBaseCurrency)
  }

  // Refresh exchange rates (force API call)
  const refreshRates = async (base: string = 'USD') => {
    return await fetchExchangeRates(base)
  }

  return {
    baseCurrency: computed(() => baseCurrency.value),
    exchangeRates: computed(() => exchangeRatesCache.value?.rates || {}),
    convertCurrency,
    convertCurrencySync,
    getExchangeRates,
    initialize,
    refreshRates,
  }
}

