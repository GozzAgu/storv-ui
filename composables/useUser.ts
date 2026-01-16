import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from './useFirestore'

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

// UserPreferences is exported from usePreferences.ts to avoid duplication
// Re-export for backward compatibility
export type { UserPreferences } from '~/composables/usePreferences'

export interface UserData {
  uid: string
  email: string
  name: string
  role: 'superAdmin' | 'admin' | 'user' | 'staff'
  storeDetails?: StoreDetails
  preferences?: UserPreferences
  hasCompletedOnboarding: boolean
  hasCompletedTutorial: boolean
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
    const db = getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized. Please ensure Firebase is properly configured.')
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
          ...userData
        }
        
        await setDoc(userRef, newUserData)
        return newUserData
      } else {
        // Update existing user document
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        })
        
        const updatedDoc = await getDoc(userRef)
        return updatedDoc.data() as UserData
      }
    } catch (error: any) {
      // Handle Firestore permission errors specifically
      if (error.code === 'permission-denied') {
        throw new Error('PERMISSION_DENIED: Firestore security rules are blocking access. Please:\n1. Go to Firebase Console → Firestore Database → Rules\n2. Copy the rules from firestore.rules file\n3. Paste and click Publish\n\nSee FIRESTORE_SETUP.md for detailed instructions.')
      }
      // Handle other Firestore errors
      if (error.code) {
        throw new Error(`Firestore error (${error.code}): ${error.message}`)
      }
      throw error
    }
  }

  // Get user document
  const getUserDocument = async (uid: string): Promise<UserData | null> => {
    const db = getFirestoreInstance()
    if (!db) {
      console.warn('Firestore not initialized')
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
    const db = getFirestoreInstance()
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })

    const updatedDoc = await getDoc(userRef)
    return updatedDoc.data() as UserData
  }

  // Update store details
  const updateStoreDetails = async (uid: string, storeDetails: StoreDetails) => {
    return updateUserDocument(uid, {
      storeDetails,
      hasCompletedOnboarding: true
    })
  }

  // Mark tutorial as completed
  const completeTutorial = async (uid: string) => {
    return updateUserDocument(uid, {
      hasCompletedTutorial: true
    })
  }

  return {
    createUserDocument,
    getUserDocument,
    updateUserDocument,
    updateStoreDetails,
    completeTutorial
  }
}

