import { defineStore } from 'pinia'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import type { UserData, StoreDetails } from '~/composables/useUser'
import type { Staff } from '~/composables/useStaff'
import { sanitizeUserData } from '~/utils/sanitize-user-data'
import {
  markOnboardingCompleteForSession,
  clearOnboardingCompleteForSession,
} from '~/utils/onboarding-session'

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
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { syncDemoToPinia } = await import('~/utils/demo-bridge')
        await syncDemoToPinia()
        this.loading = false
        return
      }

      // Check if staff creation is in progress - don't update userData during staff creation
      // This prevents the profile card from showing staff name instead of super admin name
      const isStaffCreationInProgress = (await import('~/utils/staff-creation-session')).isStaffCreationInProgress()

      // If staff creation is in progress and we already have super admin data, preserve it
      // Don't fetch staff data during creation process
      if (isStaffCreationInProgress && this.userData?.role === 'superAdmin') {
        // console.log('[UserStore] Staff creation in progress - preserving super admin userData, skipping fetch for:', userId)
        return
      }

      this.loading = true
      this.error = null

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = CLOUD_UNAVAILABLE_MESSAGE
        this.loading = false
        return
      }

      try {
        if (!isStaffCreationInProgress) {
          const cachedStaff = (await import('./staff')).useStaffStore().getCurrentStaffMember
          if (cachedStaff?.authUid === userId) {
            const { buildStaffUserDataWithOwnerContext } = await import(
              '~/utils/staff-user-bootstrap'
            )
            this.userData = await buildStaffUserDataWithOwnerContext(db, cachedStaff, userId)
            return
          }

          const { lookupStaffMemberByAuthUid, buildStaffUserDataWithOwnerContext } =
            await import('~/utils/staff-user-bootstrap')
          const lookup = await lookupStaffMemberByAuthUid(db, userId)

          if (lookup.kind === 'active') {
            const { useStaffStore } = await import('./staff')
            const staffStore = useStaffStore()
            const existingIndex = staffStore.staff.findIndex((s) => s.id === lookup.staff.id)
            if (existingIndex === -1) {
              staffStore.staff.push(lookup.staff)
            } else {
              staffStore.staff[existingIndex] = lookup.staff
            }
            this.userData = await buildStaffUserDataWithOwnerContext(db, lookup.staff, userId)
            return
          }

          if (lookup.kind === 'inactive') {
            this.error = 'Your staff access has been deactivated. Contact your store admin.'
            this.userData = null
            return
          }
        }

        // Super admin / owner accounts use top-level users/{uid}.
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const fetchedData = sanitizeUserData({
            uid: userSnap.id,
            ...userSnap.data(),
          } as UserData)

          if (isStaffCreationInProgress) {
            if (
              fetchedData.role === 'superAdmin' ||
              (this.userData?.role === 'superAdmin' && this.userData.uid === userId)
            ) {
              this.userData = fetchedData
            }
          } else {
            this.userData = fetchedData
          }
          return
        }

        if (!isStaffCreationInProgress) {
          this.error = 'Account not found. Please contact your administrator.'
          console.warn('[UserStore] Staff member not found for auth uid:', userId)
          if (!this.userData) {
            this.userData = null
          }
        }
      } catch (staffError: any) {
        console.warn('[UserStore] Could not resolve user for sign-in:', staffError.message)
        if (
          staffError.message?.includes('permission') ||
          staffError.code === 'permission-denied'
        ) {
          this.error =
            'Could not load your staff profile. Ask your admin to confirm Firestore rules and indexes are deployed.'
        } else if (staffError.code === 'failed-precondition') {
          this.error =
            'Could not load your staff profile. If this is a new account, wait a few minutes for Firestore indexes to finish building, then try again.'
        } else if (!this.error) {
          this.error = 'Account not found. Please contact your administrator.'
        }
        if (!isStaffCreationInProgress && !this.userData) {
          this.userData = null
        }
      } finally {
        this.loading = false
        if (this.userData?.uid === userId && this.userData.hasCompletedOnboarding) {
          markOnboardingCompleteForSession(userId)
        }
      }
    },

    // Create user document
    async createUserDocument(
      userId: string,
      userData: Omit<UserData, 'uid' | 'createdAt' | 'updatedAt'>
    ) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
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
    async updateUserDocument(
      userId: string,
      updates: Partial<Omit<UserData, 'uid' | 'createdAt'>>
    ) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
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
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
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
      markOnboardingCompleteForSession(userId)
    },

    // Clear user data
    clearUserData() {
      clearOnboardingCompleteForSession(this.userData?.uid)
      this.userData = null
      this.error = null
    },
  },
})
