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
      const isStaffCreationInProgress =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
          : false

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
        // First try top-level users collection (for superadmins)
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const fetchedData = sanitizeUserData({
            uid: userSnap.id,
            ...userSnap.data(),
          } as UserData)

          // During staff creation, only update if this is the super admin's data
          // Don't update if it's staff data (preserve super admin's profile info)
          if (isStaffCreationInProgress) {
            // Only update if fetched data is for super admin or if we're fetching super admin's own data
            if (
              fetchedData.role === 'superAdmin' ||
              (this.userData?.role === 'superAdmin' && this.userData.uid === userId)
            ) {
              this.userData = fetchedData
            } else {
              // Don't overwrite super admin data with staff data during creation
              // console.log('[UserStore] Ignoring staff data fetch during staff creation - preserving super admin data')
            }
          } else {
            this.userData = fetchedData
          }
        } else {
          const cachedStaff = (await import('./staff')).useStaffStore().getCurrentStaffMember
          if (cachedStaff?.authUid === userId) {
            const { buildStaffUserData } = await import('~/utils/staff-user-bootstrap')
            this.userData = buildStaffUserData(cachedStaff, userId)
            return
          }

          try {
            const { lookupStaffMemberByAuthUid, buildStaffUserData } = await import(
              '~/utils/staff-user-bootstrap'
            )
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
              this.userData = buildStaffUserData(lookup.staff, userId)
              return
            }

            if (lookup.kind === 'inactive') {
              this.error = 'Your staff access has been deactivated. Contact your store admin.'
              if (!isStaffCreationInProgress) {
                this.userData = null
              }
              return
            }

            if (lookup.kind === 'missing') {
              this.error = 'Account not found. Please contact your administrator.'
              console.warn('[UserStore] Staff member not found for auth uid:', userId)
              if (!isStaffCreationInProgress && !this.userData) {
                this.userData = null
              }
              return
            }
          } catch (staffError: any) {
            console.warn(
              '[UserStore] Could not resolve staff member for sign-in:',
              staffError.message
            )
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
    },

    // Clear user data
    clearUserData() {
      this.userData = null
      this.error = null
    },
  },
})
