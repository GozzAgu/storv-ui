import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFirestore } from './useFirestore'
import { collection, doc, setDoc, getDocs, query, where, orderBy, writeBatch } from 'firebase/firestore'

interface PendingOperation {
 id: string
 type: 'create' | 'update' | 'delete'
 collection: string
 docId?: string
 data?: any
 timestamp: number
}

const isOnline = ref(navigator.onLine)
const pendingOperations = ref<PendingOperation[]>([])
const isSyncing = ref(false)

const STORAGE_KEY = 'storv_pending_operations'

export const useOfflineMode = () => {
 const db = useFirestore().getFirestoreInstance()

 // Load pending operations from localStorage
 const loadPendingOperations = () => {
 try {
 const stored = localStorage.getItem(STORAGE_KEY)
 if (stored) {
 pendingOperations.value = JSON.parse(stored)
 }
 } catch (error) {
 console.error('Error loading pending operations:', error)
 }
 }

 // Save pending operations to localStorage
 const savePendingOperations = () => {
 try {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingOperations.value))
 } catch (error) {
 console.error('Error saving pending operations:', error)
 }
 }

 // Add operation to pending queue
 const queueOperation = (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => {
 const pendingOp: PendingOperation = {
 ...operation,
 timestamp: Date.now(),
 id: `${operation.type}_${operation.collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
 }
 
 pendingOperations.value.push(pendingOp)
 savePendingOperations()
 
 // Try to sync immediately if online
 if (isOnline.value) {
 syncPendingOperations()
 }
 }

 // Sync pending operations when online
 const syncPendingOperations = async () => {
 if (!isOnline.value || isSyncing.value || !db || pendingOperations.value.length === 0) {
 return
 }

 isSyncing.value = true
 const operations = [...pendingOperations.value]
 const successfulOps: string[] = []

 try {
 const batch = writeBatch(db)
 let batchCount = 0
 const MAX_BATCH_SIZE = 500 // Firestore limit

 for (const op of operations) {
 try {
 const docRef = op.docId 
 ? doc(db, op.collection, op.docId)
 : doc(collection(db, op.collection))

 switch (op.type) {
 case 'create':
 if (op.data) {
 if (op.docId) {
 await setDoc(docRef, op.data)
 } else {
 await setDoc(docRef, op.data)
 }
 }
 break
 case 'update':
 if (op.data) {
 await setDoc(docRef, op.data, { merge: true })
 }
 break
 case 'delete':
 await setDoc(docRef, { deleted: true }, { merge: true })
 // Note: Actual deletion might need to be handled differently
 break
 }

 successfulOps.push(op.id)
 batchCount++

 // Execute batch if approaching limit
 if (batchCount >= MAX_BATCH_SIZE) {
 await batch.commit()
 batchCount = 0
 }
 } catch (error: any) {
 console.error(`Error syncing operation ${op.id}:`, error)
 // Don't remove failed operations, they'll be retried
 }
 }

 // Commit remaining batch operations
 if (batchCount > 0) {
 await batch.commit()
 }

 // Remove successful operations
 pendingOperations.value = pendingOperations.value.filter(
 op => !successfulOps.includes(op.id)
 )
 savePendingOperations()
 } catch (error: any) {
 console.error('Error syncing pending operations:', error)
 } finally {
 isSyncing.value = false
 }
 }

 // Create document (with offline support)
 const createDoc = async (collectionName: string, data: any, docId?: string) => {
 if (!db) {
 throw new Error('Firestore not initialized')
 }

 try {
 const docRef = docId 
 ? doc(db, collectionName, docId)
 : doc(collection(db, collectionName))
 
 await setDoc(docRef, data)
 
 // Remove from pending if it was queued
 const pendingId = `${docId || docRef.id}`
 pendingOperations.value = pendingOperations.value.filter(
 op => !(op.collection === collectionName && op.docId === pendingId)
 )
 savePendingOperations()
 
 return docRef.id
 } catch (error: any) {
 // If offline, queue the operation
 if (!isOnline.value || error.code === 'unavailable') {
 queueOperation({
 type: 'create',
 collection: collectionName,
 docId: docId,
 data: data
 })
 return docId || `pending_${Date.now()}`
 }
 throw error
 }
 }

 // Update document (with offline support)
 const updateDoc = async (collectionName: string, docId: string, data: any) => {
 if (!db) {
 throw new Error('Firestore not initialized')
 }

 try {
 const docRef = doc(db, collectionName, docId)
 await setDoc(docRef, data, { merge: true })
 
 // Remove from pending if it was queued
 pendingOperations.value = pendingOperations.value.filter(
 op => !(op.collection === collectionName && op.docId === docId && op.type === 'update')
 )
 savePendingOperations()
 } catch (error: any) {
 // If offline, queue the operation
 if (!isOnline.value || error.code === 'unavailable') {
 queueOperation({
 type: 'update',
 collection: collectionName,
 docId: docId,
 data: data
 })
 } else {
 throw error
 }
 }
 }

 // Delete document (with offline support)
 const deleteDoc = async (collectionName: string, docId: string) => {
 if (!db) {
 throw new Error('Firestore not initialized')
 }

 try {
 const docRef = doc(db, collectionName, docId)
 await setDoc(docRef, { deleted: true, deletedAt: new Date() }, { merge: true })
 
 // Remove from pending if it was queued
 pendingOperations.value = pendingOperations.value.filter(
 op => !(op.collection === collectionName && op.docId === docId && op.type === 'delete')
 )
 savePendingOperations()
 } catch (error: any) {
 // If offline, queue the operation
 if (!isOnline.value || error.code === 'unavailable') {
 queueOperation({
 type: 'delete',
 collection: collectionName,
 docId: docId
 })
 } else {
 throw error
 }
 }
 }

 // Listen for online/offline events
 const handleOnline = () => {
 isOnline.value = true
 syncPendingOperations()
 }

 const handleOffline = () => {
 isOnline.value = false
 }

 onMounted(() => {
 loadPendingOperations()
 window.addEventListener('online', handleOnline)
 window.addEventListener('offline', handleOffline)
 
 // Try to sync on mount if online
 if (isOnline.value) {
 syncPendingOperations()
 }
 })

 onUnmounted(() => {
 window.removeEventListener('online', handleOnline)
 window.removeEventListener('offline', handleOffline)
 })

 const pendingCount = computed(() => pendingOperations.value.length)

 return {
 isOnline,
 isSyncing,
 pendingOperations,
 pendingCount,
 createDoc,
 updateDoc,
 deleteDoc,
 syncPendingOperations,
 queueOperation
 }
}
