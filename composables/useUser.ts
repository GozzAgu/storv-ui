import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from './useFirestore'
import {
  PERMISSION_DENIED_MESSAGE,
  CLOUD_UNAVAILABLE_MESSAGE,
} from '~/utils/cloud-user-messages'
import type { SubscriptionPlan } from '~/types/subscription'
import type { UserPreferences } from '~/composables/usePreferences'

export interface StoreSettings {
  inventory?: {
    lowStockThreshold?: number
    autoReorder?: boolean
    defaultCategory?: string
  }
  receipt?: {
    prefix?: string
    nextNumber?: number
    autoPrint?: boolean
    /** Printed / emailed receipts; set from Profile (super admin). */
    salesTerms?: string
    refundPolicy?: string
    warrantyPolicy?: string
  }
  payment?: {
    paymentMethods?: string[]
  }
}

export interface StoreDetails {
  storeName: string
  storeAddress?: string
  storePhone?: string
  storeEmail?: string
  storeDescription?: string
  settings?: StoreSettings
}

export interface UserData {
  uid: string
  email: string
  name: string
  role: 'superAdmin' | 'admin' | 'user' | 'staff'
  subscription: SubscriptionPlan
  photoURL?: string
  storeLogoUrl?: string // Account logo - applies to all stores, shown on receipts
  storeDetails?: StoreDetails
  preferences?: UserPreferences
  hasCompletedOnboarding: boolean
  hasCompletedTutorial: boolean
  mustChangePassword?: boolean // Staff: must change password on next login
  twoFactorEnabled?: boolean
  twoFactorMethod?: 'totp' | 'phone' | null
  twoFactorSecret?: string | null
  twoFactorEnabledAt?: string | null
  createdAt: any
  updatedAt: any
}

/**
 * Composable for user data management in Firestore
 */
export const useUser = () => {
  const { getFirestoreInstance } = useFirestore()

  // Create or update user document
  const createUserDocument = async (uid: string, userData: Partial<UserData>) => {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      const { getDemoUserDocument } = await import('~/utils/demo-bridge')
      return (
        getDemoUserDocument(uid) ??
        ({
          uid,
          email: userData.email || 'demo@storvv.app',
          name: userData.name || 'Demo User',
          role: 'superAdmin',
          subscription: 'storvv_enterprise',
          hasCompletedOnboarding: true,
          hasCompletedTutorial: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as UserData)
      )
    }

    const db = getFirestoreInstance()
    if (!db) {
      throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
    }

    try {
      const userRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        // Create new user document
        const newUserData: UserData = {
          uid,
          email: userData.email || '',
          name: userData.name || '',
          role: 'superAdmin', // First user is always superAdmin
          hasCompletedOnboarding: false,
          hasCompletedTutorial: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...userData,
          // Ensure default subscription isn't overwritten by undefined
          subscription: (userData.subscription as SubscriptionPlan) || 'storvv_micro',
        }

        await setDoc(userRef, newUserData)
        return newUserData
      } else {
        // Update existing user document
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp(),
        })

        const updatedDoc = await getDoc(userRef)
        return updatedDoc.data() as UserData
      }
    } catch (error: any) {
      // Handle Firestore permission errors specifically
      if (error.code === 'permission-denied') {
        throw new Error(`PERMISSION_DENIED: ${PERMISSION_DENIED_MESSAGE}`)
      }
      // Handle other database errors
      if (error.code) {
        throw new Error(`Cloud error (${error.code}): ${error.message}`)
      }
      throw error
    }
  }

  // Get user document
  const getUserDocument = async (uid: string): Promise<UserData | null> => {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      const { getDemoUserDocument } = await import('~/utils/demo-bridge')
      return getDemoUserDocument(uid)
    }

    const db = getFirestoreInstance()
    if (!db) {
      console.warn(CLOUD_UNAVAILABLE_MESSAGE)
      return null
    }

    try {
      const userRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        return null
      }

      return userDoc.data() as UserData
    } catch (error: any) {
      // Log error but don't throw - allow auth to proceed even if Firestore fails
      console.error('Error getting user document:', error)
      if (error.code === 'permission-denied') {
        console.error('Firestore permission denied. Please set up security rules.')
      }
      return null
    }
  }

  // Update user document
  const updateUserDocument = async (uid: string, updates: Partial<UserData>) => {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      const { syncDemoToPinia } = await import('~/utils/demo-bridge')
      await syncDemoToPinia()
      const { useUserStore } = await import('~/stores/user')
      const current = useUserStore().userData
      if (!current) return null
      return { ...current, ...updates, updatedAt: new Date() } as UserData
    }

    const db = getFirestoreInstance()
    if (!db) {
      throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
    }

    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })

    const updatedDoc = await getDoc(userRef)
    return updatedDoc.data() as UserData
  }

  // Update store details
  const updateStoreDetails = async (uid: string, storeDetails: StoreDetails) => {
    return updateUserDocument(uid, {
      storeDetails,
      hasCompletedOnboarding: true,
    })
  }

  // Mark tutorial as completed
  const completeTutorial = async (uid: string) => {
    return updateUserDocument(uid, {
      hasCompletedTutorial: true,
    })
  }

  return {
    createUserDocument,
    getUserDocument,
    updateUserDocument,
    updateStoreDetails,
    completeTutorial,
  }
}
