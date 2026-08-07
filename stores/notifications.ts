import { defineStore } from 'pinia'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import {
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  limit,
  startAfter,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import {
  getNotificationsCollection,
  getNotificationDocument,
  getQueryUserId,
} from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'

export type NotificationType =
  | 'receipt_created'
  | 'receipt_refunded'
  | 'receipt_deleted'
  | 'item_created'
  | 'item_updated'
  | 'item_deleted'
  | 'item_discount_applied'
  | 'item_discount_removed'
  | 'folder_created'
  | 'folder_updated'
  | 'folder_deleted'
  | 'staff_created'
  | 'staff_updated'
  | 'staff_deleted'
  | 'department_created'
  | 'department_updated'
  | 'department_deleted'
  | 'import_completed'
  | 'export_completed'
  | 'swap_in_completed'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  userId: string // Super admin UID (for data isolation)
  actorId?: string // The user who performed the action
  read: boolean
  metadata?: {
    receiptId?: string
    itemId?: string
    folderId?: string
    staffId?: string
    departmentId?: string
    [key: string]: any
  }
  createdAt: Date | any
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    unreadCount: 0,
    loading: false,
    error: null as string | null,
    lastDoc: null as QueryDocumentSnapshot | null,
    hasMore: true,
  }),

  getters: {
    unreadNotifications: (state) => state.notifications.filter((n) => !n.read),
    readNotifications: (state) => state.notifications.filter((n) => n.read),
    notificationsByType: (state) => (type: NotificationType) =>
      state.notifications.filter((n) => n.type === type),
  },

  actions: {
    isWithinRetentionWindow(createdAt: Date | unknown): boolean {
      const createdTime =
        createdAt instanceof Date
          ? createdAt.getTime()
          : createdAt
          ? new Date(createdAt as string | number).getTime()
          : 0
      if (!Number.isFinite(createdTime) || createdTime <= 0) return false
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      return createdTime >= cutoff
    },

    async clearExpiredNotifications(userId: string, storeId: string) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) return

      const db = useFirestore().getFirestoreInstance()
      if (!db) return

      const notificationsRef = getNotificationsCollection(db, userId, storeId)
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000)

      // Delete in chunks to keep batch sizes safe.
      while (true) {
        const expiredQuery = query(
          notificationsRef,
          where('createdAt', '<=', cutoffDate),
          limit(200)
        )
        const snapshot = await getDocs(expiredQuery)
        if (snapshot.empty) break

        const batch = writeBatch(db)
        snapshot.docs.forEach((notificationDoc) => {
          batch.delete(notificationDoc.ref)
        })
        await batch.commit()

        if (snapshot.size < 200) break
      }
    },

    // Create a notification
    async createNotification(
      type: NotificationType,
      title: string,
      message: string,
      metadata?: Notification['metadata'],
      actorId?: string
    ) {
      const { isDemoModeActive, DEMO_USER_UID } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { setDemoExtrasNotifications, getDemoExtrasNotifications } = await import(
          '~/utils/demo-extras'
        )
        const id = `demo_notif_${Math.random().toString(36).slice(2, 9)}`
        const notification: Notification = {
          id,
          type,
          title,
          message,
          userId: DEMO_USER_UID,
          actorId: actorId || DEMO_USER_UID,
          read: false,
          metadata: metadata || {},
          createdAt: new Date(),
        }
        const next = [notification, ...getDemoExtrasNotifications()]
        setDemoExtrasNotifications(next)
        this.notifications = next
        this.unreadCount = next.filter((n) => !n.read).length
        return id
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        console.error(CLOUD_UNAVAILABLE_MESSAGE)
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        console.error('User must be authenticated to create notifications')
        return
      }

      // Get userId (superadmin's UID for staff)
      const userId = await getQueryUserId()
      if (!userId) {
        console.error('User ID not available')
        return
      }

      // Get current store ID
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        console.error('No store selected. Please select a store first.')
        return
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/notifications
        const notificationsRef = getNotificationsCollection(db, userId, storeId)
        const newNotificationRef = doc(notificationsRef)

        const notification: Omit<Notification, 'id'> = {
          type,
          title,
          message,
          userId, // Keep for backward compatibility
          actorId: actorId || authStore.currentUser.uid,
          read: false,
          metadata: metadata || {},
          createdAt: serverTimestamp(),
        }

        await setDoc(newNotificationRef, notification)

        // Add to local state
        const notificationForState: Notification = {
          id: newNotificationRef.id,
          ...notification,
          createdAt: new Date(),
        }

        this.notifications.unshift(notificationForState)
        this.unreadCount = this.unreadNotifications.length

        return newNotificationRef.id
      } catch (error: any) {
        console.error('Error creating notification:', error)
        throw new Error(error.message || 'Failed to create notification')
      }
    },

    // Fetch notifications
    async fetchNotifications(loadMore = false) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { getDemoSampleNotifications } = await import('~/utils/demo-bridge')
        const sample = getDemoSampleNotifications()
        this.notifications = sample
        this.unreadCount = sample.filter((n) => !n.read).length
        this.loading = false
        this.error = null
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = CLOUD_UNAVAILABLE_MESSAGE
        this.loading = false
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        this.error = 'User must be authenticated'
        this.loading = false
        return
      }

      // Get userId (superadmin's UID for staff)
      const userId = await getQueryUserId()
      if (!userId) {
        this.error = 'User ID not available'
        this.loading = false
        return
      }

      // Get current store ID
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        this.error = 'No store selected. Please select a store first.'
        this.loading = false
        return
      }

      this.loading = true
      this.error = null

      try {
        await this.clearExpiredNotifications(userId, storeId)

        // Use hierarchical path: users/{userId}/stores/{storeId}/notifications
        const notificationsRef = getNotificationsCollection(db, userId, storeId)
        let notificationsQuery = query(notificationsRef, orderBy('createdAt', 'desc'), limit(20))

        if (loadMore && this.lastDoc) {
          notificationsQuery = query(
            notificationsRef,
            orderBy('createdAt', 'desc'),
            startAfter(this.lastDoc),
            limit(20)
          )
        }

        let snapshot
        try {
          snapshot = await getDocs(notificationsQuery)
        } catch (indexError: any) {
          // If index error, try fetching without orderBy and sort in memory
          if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
            // Check if warning was already shown for notifications
            let warned =
              typeof window !== 'undefined' ? (window as any).__firestoreIndexWarned : null

            // Convert to object if it's a boolean (from other stores)
            if (warned && typeof warned !== 'object') {
              ;(window as any).__firestoreIndexWarned = {}
              warned = (window as any).__firestoreIndexWarned
            }

            // Initialize as object if it doesn't exist
            if (!warned) {
              ;(window as any).__firestoreIndexWarned = {}
              warned = (window as any).__firestoreIndexWarned
            }

            // Only warn once
            if (!warned.notifications) {
              const indexUrlMatch = indexError.message?.match(/https:\/\/[^\s]+/)
              const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null
              console.warn(
                '[NotificationsStore] Firestore index not created yet. Fetching without orderBy and sorting in memory.'
              )
              if (indexUrl) {
                console.info('[NotificationsStore] Create the index here:', indexUrl)
              }
              warned.notifications = true
            }

            const fallbackQuery = query(
              notificationsRef,
              limit(100) // Limit to reasonable number for in-memory sort
            )
            snapshot = await getDocs(fallbackQuery)
          } else {
            throw indexError
          }
        }

        const notifications: Notification[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Notification)
        })

        // Sort in memory if we used fallback query (no orderBy in Firestore)
        if (notifications.length > 0 && (!loadMore || !this.lastDoc)) {
          notifications.sort((a, b) => {
            const dateA =
              a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
            const dateB =
              b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
            return dateB - dateA // Descending order
          })

          // If we fetched more than limit, take only the first 20
          if (notifications.length > 20) {
            notifications.splice(20)
          }
        }

        const freshNotifications = notifications.filter((notification) =>
          this.isWithinRetentionWindow(notification.createdAt)
        )

        if (loadMore) {
          this.notifications.push(...freshNotifications)
        } else {
          this.notifications = freshNotifications
        }

        this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null
        this.hasMore = snapshot.docs.length === 20
        this.unreadCount = this.unreadNotifications.length
      } catch (error: any) {
        console.error('Error fetching notifications:', error)
        this.error = error.message || 'Failed to fetch notifications'
      } finally {
        this.loading = false
      }
    },

    // Mark notification as read
    async markAsRead(notificationId: string) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { setDemoExtrasNotifications } = await import('~/utils/demo-extras')
        this.notifications = this.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
        this.unreadCount = this.notifications.filter((n) => !n.read).length
        setDemoExtrasNotifications(this.notifications)
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = CLOUD_UNAVAILABLE_MESSAGE
        return
      }

      // Get userId and storeId for hierarchical path
      const userId = await getQueryUserId()
      if (!userId) {
        this.error = 'User ID not available'
        return
      }

      const storeId = await getCurrentStoreId()
      if (!storeId) {
        this.error = 'No store selected. Please select a store first.'
        return
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/notifications/{notificationId}
        const notificationRef = getNotificationDocument(db, userId, storeId, notificationId)
        await updateDoc(notificationRef, {
          read: true,
        })

        // Update local state
        const index = this.notifications.findIndex((n) => n.id === notificationId)
        if (index > -1 && this.notifications[index]) {
          this.notifications[index].read = true
          this.unreadCount = this.unreadNotifications.length
        }
      } catch (error: any) {
        console.error('Error marking notification as read:', error)
        throw new Error(error.message || 'Failed to mark notification as read')
      }
    },

    // Mark all notifications as read
    async markAllAsRead() {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { setDemoExtrasNotifications } = await import('~/utils/demo-extras')
        this.notifications = this.notifications.map((n) => ({ ...n, read: true }))
        this.unreadCount = 0
        setDemoExtrasNotifications(this.notifications)
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = CLOUD_UNAVAILABLE_MESSAGE
        return
      }

      // Get userId and storeId for hierarchical path
      const userId = await getQueryUserId()
      if (!userId) {
        this.error = 'User ID not available'
        return
      }

      const storeId = await getCurrentStoreId()
      if (!storeId) {
        this.error = 'No store selected. Please select a store first.'
        return
      }

      try {
        const unreadNotifications = this.unreadNotifications
        if (unreadNotifications.length === 0) return

        const batch = writeBatch(db)
        unreadNotifications.forEach((notification) => {
          // Use hierarchical path: users/{userId}/stores/{storeId}/notifications/{notificationId}
          const notificationRef = getNotificationDocument(db, userId, storeId, notification.id)
          batch.update(notificationRef, { read: true })
        })

        await batch.commit()

        // Update local state
        this.notifications.forEach((n) => {
          n.read = true
        })
        this.unreadCount = 0
      } catch (error: any) {
        console.error('Error marking all notifications as read:', error)
        throw new Error(error.message || 'Failed to mark all notifications as read')
      }
    },
  },
})
