import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, type Firestore } from 'firebase/firestore'
import { useFirebase } from './useFirebase'

/**
 * Composable for Firestore operations
 */
export const useFirestore = () => {
  const { getApp } = useFirebase()
  
  // Get Firestore instance
  const getFirestoreInstance = (): Firestore | null => {
    if (import.meta.server) return null
    
    const app = getApp()
    if (!app) {
      console.warn('Firebase app not initialized')
      return null
    }
    
    return getFirestore(app)
  }

  return {
    getFirestoreInstance
  }
}

