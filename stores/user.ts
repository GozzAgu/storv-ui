import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import type { UserData, StoreDetails } from '~/composables/useUser'

export const useUserStore = defineStore('user', {
  state: () => ({
    userData: null as UserData | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isSuperAdmin: (state) => state.userData?.role === 'superAdmin',
    hasCompletedOnboarding: (state) => state.userData?.hasCompletedOnboarding ?? false,
    hasCompletedTutorial: (state) => state.userData?.hasCompletedTutorial ?? false,
    storeDetails: (state) => state.userData?.storeDetails,
  },

  actions: {
    // Fetch user data from Firestore
    async fetchUserData(userId: string) {
      this.loading = true
      this.error = null

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = 'Firestore not initialized'
        this.loading = false
        return
      }

      try {
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          this.userData = {
            uid: userSnap.id,
            ...userSnap.data(),
          } as UserData
        } else {
          this.userData = null
        }
      } catch (error: any) {
        console.error('Error fetching user data:', error)
        this.error = error.message || 'Failed to fetch user data'
      } finally {
        this.loading = false
      }
    },

    // Create user document
    async createUserDocument(userId: string, userData: Omit<UserData, 'uid' | 'createdAt' | 'updatedAt'>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      try {
        const userRef = doc(db, 'users', userId)
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        this.userData = {
          uid: userId,
          ...userData,
        } as UserData
      } catch (error: any) {
        console.error('Error creating user document:', error)
        throw new Error(error.message || 'Failed to create user document')
      }
    },

    // Update user document
    async updateUserDocument(userId: string, updates: Partial<Omit<UserData, 'uid' | 'createdAt'>>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      try {
        const userRef = doc(db, 'users', userId)
        await updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        })

        // Update local state
        if (this.userData && this.userData.uid === userId) {
          this.userData = {
            ...this.userData,
            ...updates,
          } as UserData
        }
      } catch (error: any) {
        console.error('Error updating user document:', error)
        throw new Error(error.message || 'Failed to update user document')
      }
    },

    // Update store details
    async updateStoreDetails(userId: string, storeDetails: StoreDetails) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      try {
        const userRef = doc(db, 'users', userId)
        await updateDoc(userRef, {
          storeDetails,
          updatedAt: serverTimestamp(),
        })

        // Update local state
        if (this.userData && this.userData.uid === userId) {
          this.userData.storeDetails = storeDetails
        }
      } catch (error: any) {
        console.error('Error updating store details:', error)
        throw new Error(error.message || 'Failed to update store details')
      }
    },

    // Complete tutorial
    async completeTutorial(userId: string) {
      await this.updateUserDocument(userId, {
        hasCompletedTutorial: true,
      })
    },

    // Complete onboarding
    async completeOnboarding(userId: string) {
      await this.updateUserDocument(userId, {
        hasCompletedOnboarding: true,
      })
    },

    // Clear user data
    clearUserData() {
      this.userData = null
      this.error = null
    },
  },
})

