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
      // Check if staff creation is in progress - don't update userData during staff creation
      // This prevents the profile card from showing staff name instead of super admin name
      const isStaffCreationInProgress = typeof window !== 'undefined' 
        ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
        : false
      
      // If staff creation is in progress and we already have super admin data, preserve it
      // Don't fetch staff data during creation process
      if (isStaffCreationInProgress && this.userData?.role === 'superAdmin') {
        console.log('[UserStore] Staff creation in progress - preserving super admin userData, skipping fetch for:', userId)
        return
      }
      
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
          const fetchedData = {
            uid: userSnap.id,
            ...userSnap.data(),
          } as UserData
          
          // During staff creation, only update if this is the super admin's data
          // Don't update if it's staff data (preserve super admin's profile info)
          if (isStaffCreationInProgress) {
            // Only update if fetched data is for super admin or if we're fetching super admin's own data
            if (fetchedData.role === 'superAdmin' || (this.userData?.role === 'superAdmin' && this.userData.uid === userId)) {
              this.userData = fetchedData
            } else {
              // Don't overwrite super admin data with staff data during creation
              console.log('[UserStore] Ignoring staff data fetch during staff creation - preserving super admin data')
            }
          } else {
            this.userData = fetchedData
          }
        } else {
          // Only clear userData if staff creation is not in progress
          if (!isStaffCreationInProgress) {
            this.userData = null
          }
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

      const authStore = useAuthStore()

      try {
        const userRef = doc(db, 'users', userId)
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        // Only update local userData if this is for the currently logged-in user
        // This prevents the profile name from changing when creating staff accounts
        if (authStore.currentUser && authStore.currentUser.uid === userId) {
          this.userData = {
            uid: userId,
            ...userData,
          } as UserData
        }
        // If creating for a different user (e.g., staff), don't update local state
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

