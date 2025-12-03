import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc, limit, startAfter, writeBatch, type QueryDocumentSnapshot } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'

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
    unreadNotifications: (state) => state.notifications.filter(n => !n.read),
    readNotifications: (state) => state.notifications.filter(n => n.read),
    notificationsByType: (state) => (type: NotificationType) => 
      state.notifications.filter(n => n.type === type),
  },

  actions: {
    // Create a notification
    async createNotification(
      type: NotificationType,
      title: string,
      message: string,
      metadata?: Notification['metadata'],
      actorId?: string
    ) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        console.error('Firestore not initialized')
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        console.error('User must be authenticated to create notifications')
        return
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let userId = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID from the staff document
      if (userStore.userData?.role === 'staff') {
        try {
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
          const staffSnapshot = await getDocs(staffQuery)

          if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
            const staffDoc = staffSnapshot.docs[0]
            if (staffDoc) {
              const staffData = staffDoc.data()
              if (staffData?.createdBy) {
                userId = staffData.createdBy
              }
            }
          }
        } catch (error: any) {
          console.warn('Could not fetch staff document for notification creation:', error.message)
        }
      }

      try {
        const notificationsRef = collection(db, 'notifications')
        const newNotificationRef = doc(notificationsRef)

        const notification: Omit<Notification, 'id'> = {
          type,
          title,
          message,
          userId,
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
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = 'Firestore not initialized'
        this.loading = false
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        this.error = 'User must be authenticated'
        this.loading = false
        return
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let userId = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID from the staff document
      if (userStore.userData?.role === 'staff') {
        try {
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
          const staffSnapshot = await getDocs(staffQuery)

          if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
            const staffDoc = staffSnapshot.docs[0]
            if (staffDoc) {
              const staffData = staffDoc.data()
              if (staffData?.createdBy) {
                userId = staffData.createdBy
              }
            }
          }
        } catch (error: any) {
          console.warn('Could not fetch staff document for notifications:', error.message)
        }
      }

      this.loading = true
      this.error = null

      try {
        const notificationsRef = collection(db, 'notifications')
        let notificationsQuery = query(
          notificationsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(20)
        )

        if (loadMore && this.lastDoc) {
          notificationsQuery = query(
            notificationsRef,
            where('userId', '==', userId),
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
            console.warn('Firestore index not created yet. Fetching without orderBy and sorting in memory.')
            const fallbackQuery = query(
              notificationsRef,
              where('userId', '==', userId),
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
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
            return dateB - dateA // Descending order
          })
          
          // If we fetched more than limit, take only the first 20
          if (notifications.length > 20) {
            notifications.splice(20)
          }
        }

        if (loadMore) {
          this.notifications.push(...notifications)
        } else {
          this.notifications = notifications
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
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = 'Firestore not initialized'
        return
      }

      try {
        const notificationRef = doc(db, 'notifications', notificationId)
        await updateDoc(notificationRef, {
          read: true,
        })

        // Update local state
        const index = this.notifications.findIndex(n => n.id === notificationId)
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
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = 'Firestore not initialized'
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        this.error = 'User must be authenticated'
        return
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let userId = authStore.currentUser.uid

      if (userStore.userData?.role === 'staff') {
        try {
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
          const staffSnapshot = await getDocs(staffQuery)

          if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
            const staffDoc = staffSnapshot.docs[0]
            if (staffDoc) {
              const staffData = staffDoc.data()
              if (staffData?.createdBy) {
                userId = staffData.createdBy
              }
            }
          }
        } catch (error: any) {
          console.warn('Could not fetch staff document:', error.message)
        }
      }

      try {
        const unreadNotifications = this.unreadNotifications
        if (unreadNotifications.length === 0) return

        const batch = writeBatch(db)
        unreadNotifications.forEach(notification => {
          const notificationRef = doc(db, 'notifications', notification.id)
          batch.update(notificationRef, { read: true })
        })

        await batch.commit()

        // Update local state
        this.notifications.forEach(n => {
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

