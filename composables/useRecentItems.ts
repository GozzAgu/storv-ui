import { ref, computed } from 'vue'

export interface RecentItem {
 id: string
 type: 'receipt' | 'customer' | 'inventory' | 'folder'
 name: string
 path: string
 timestamp: number
 metadata?: {
 receiptNumber?: string
 customerName?: string
 folderName?: string
 itemName?: string
 }
}

const MAX_RECENT_ITEMS = 10
const recentItems = ref<RecentItem[]>([])

// Load from localStorage on client
if (import.meta.client) {
 try {
 const saved = localStorage.getItem('recent-items')
 if (saved) {
 recentItems.value = JSON.parse(saved)
 }
 } catch (e) {
 console.warn('Failed to load recent items from localStorage:', e)
 }
}

// Save to localStorage whenever items change
const saveToLocalStorage = () => {
 if (import.meta.client) {
 try {
 localStorage.setItem('recent-items', JSON.stringify(recentItems.value))
 } catch (e) {
 console.warn('Failed to save recent items to localStorage:', e)
 }
 }
}

export const useRecentItems = () => {
 const addRecentItem = (item: Omit<RecentItem, 'timestamp'>) => {
 const newItem: RecentItem = {
 ...item,
 timestamp: Date.now(),
 }

 // Remove existing item with same id and type
 recentItems.value = recentItems.value.filter(
 i => !(i.id === newItem.id && i.type === newItem.type)
 )

 // Add to beginning
 recentItems.value.unshift(newItem)

 // Keep only MAX_RECENT_ITEMS
 if (recentItems.value.length > MAX_RECENT_ITEMS) {
 recentItems.value = recentItems.value.slice(0, MAX_RECENT_ITEMS)
 }

 saveToLocalStorage()
 }

 const removeRecentItem = (id: string, type: RecentItem['type']) => {
 recentItems.value = recentItems.value.filter(
 i => !(i.id === id && i.type === type)
 )
 saveToLocalStorage()
 }

 const clearRecentItems = () => {
 recentItems.value = []
 saveToLocalStorage()
 }

 const getRecentItems = (type?: RecentItem['type']) => {
 if (type) {
 return recentItems.value.filter(item => item.type === type)
 }
 return recentItems.value
 }

 return {
 recentItems: computed(() => recentItems.value),
 addRecentItem,
 removeRecentItem,
 clearRecentItems,
 getRecentItems,
 }
}
