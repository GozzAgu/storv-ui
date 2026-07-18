/**
 * Composable for temporarily storing super admin credentials
 * Used to sign super admin back in after creating staff accounts
 */

const CREDENTIALS_KEY = 'super_admin_credentials'

interface AdminCredentials {
  email: string
  password: string
  timestamp: number
}

const CREDENTIALS_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export const useAdminCredentials = () => {
  // Store super admin credentials securely in sessionStorage
  const storeCredentials = (email: string, password: string) => {
    if (import.meta.server) return

    try {
      const credentials: AdminCredentials = {
        email,
        password,
        timestamp: Date.now(),
      }
      sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
    } catch (error) {
      console.error('Failed to store admin credentials:', error)
    }
  }

  // Retrieve super admin credentials
  const getCredentials = (): { email: string; password: string } | null => {
    if (import.meta.server) return null

    try {
      const stored = sessionStorage.getItem(CREDENTIALS_KEY)
      if (!stored) return null

      const credentials: AdminCredentials = JSON.parse(stored)

      // Check if credentials are expired
      if (Date.now() - credentials.timestamp > CREDENTIALS_EXPIRY) {
        clearCredentials()
        return null
      }

      return {
        email: credentials.email,
        password: credentials.password,
      }
    } catch (error) {
      console.error('Failed to retrieve admin credentials:', error)
      return null
    }
  }

  // Clear stored credentials
  const clearCredentials = () => {
    if (import.meta.server) return

    try {
      sessionStorage.removeItem(CREDENTIALS_KEY)
    } catch (error) {
      console.error('Failed to clear admin credentials:', error)
    }
  }

  // Check if credentials are available
  const hasCredentials = (): boolean => {
    return getCredentials() !== null
  }

  return {
    storeCredentials,
    getCredentials,
    clearCredentials,
    hasCredentials,
  }
}
