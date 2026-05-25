<template>
 <Modal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" size="lg">
 <template #header>
 <div class="flex items-center justify-between">
 <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Quick Sale</h2>
 <button
 @click="$emit('update:modelValue', false)"
 class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm transition-colors"
 >
 <XMarkIcon class="w-5 h-5" />
 </button>
 </div>
 </template>

 <template #body>
 <div class="space-y-4">
 <SellScreenNoteBanner />
 <!-- Barcode Scanner Toggle -->
 <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-sm border border-blue-200 dark:border-blue-800">
 <div class="flex items-center gap-3">
 <QrCodeIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
 <div>
 <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Barcode Scanner</p>
 <p class="text-xs text-gray-600 dark:text-gray-400">Scan items quickly</p>
 </div>
 </div>
 <button
 @click="toggleScanner"
 :class="[ 'px-4 py-2 rounded-sm text-sm font-medium transition-colors', isScanning ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700' ]"
 >
 {{ isScanning ? 'Stop Scanner' : 'Start Scanner' }}
 </button>
 </div>

 <!-- Scanner View -->
 <div v-if="isScanning" class="relative">
 <div ref="scannerContainer" id="scanner-container" class="w-full h-64 bg-black rounded-sm overflow-hidden">
 <div v-if="!scannerReady" class="flex items-center justify-center h-full text-white">
 <div class="text-center">
 <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
 <p>Initializing camera...</p>
 </div>
 </div>
 </div>
 <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
 Point camera at barcode
 </p>
 </div>

 <!-- Manual Barcode Input -->
 <div>
 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
 Or Enter Barcode Manually
 </label>
 <div class="flex gap-2">
 <input
 v-model="manualBarcode"
 @keyup.enter="searchByBarcode"
 type="text"
 placeholder="Enter barcode..."
 class="flex-1 px-4 py-2 rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
 />
 <Button @click="searchByBarcode" :loading="isSearching">Search</Button>
 </div>
 </div>

 <!-- Folder Selection -->
 <div>
 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
 Select Folder
 </label>
 <select
 v-model="selectedFolderId"
 @change="loadFolderItems"
 class="w-full px-4 py-2 rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
 >
 <option value="">Select a folder...</option>
 <option v-for="folder in folders" :key="folder.id" :value="folder.id">
 {{ folder.name }}
 </option>
 </select>
 </div>

 <!-- Selected Items -->
 <div class="border-t border-gray-200 pt-4">
 <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Selected Items</h3>
 <div v-if="cartItems.length === 0" class="text-center py-8 px-4 rounded-sm bg-gray-50/50 dark:bg-gray-800/30">
 <div class="w-14 h-14 mx-auto mb-3 rounded-sm bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
 <ShoppingBagIcon class="w-7 h-7 text-green-600 dark:text-green-400" />
 </div>
 <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your cart is empty</p>
 <p class="text-xs text-gray-500 dark:text-gray-400">Scan or search to add products</p>
 </div>
 <div v-else class="space-y-2 max-h-64 overflow-y-auto">
 <div
 v-for="(item, index) in cartItems"
 :key="index"
 class="flex items-center justify-between p-3 bg-gray-50 dark:!bg-dashboard-card rounded-sm"
 >
 <div class="flex-1">
 <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ item.name }}</p>
 <p class="text-xs text-gray-600 dark:text-gray-400">
 Qty: {{ item.quantity }} × {{ currencySymbol }}{{ formatCurrency(item.price) }}
 </p>
 </div>
 <div class="flex items-center gap-3">
 <div class="flex items-center gap-2">
 <button
 @click="updateQuantity(index, item.quantity - 1)"
 class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
 >
 <MinusIcon class="w-4 h-4" />
 </button>
 <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
 <button
 @click="updateQuantity(index, item.quantity + 1)"
 class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
 >
 <PlusIcon class="w-4 h-4" />
 </button>
 </div>
 <button
 @click="removeItem(index)"
 class="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
 >
 <TrashIcon class="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>
 </div>

 <!-- Customer Info (Collapsible) -->
 <div class="border-t border-gray-200 pt-4">
 <button
 @click="showCustomerInfo = !showCustomerInfo"
 class="flex items-center justify-between w-full text-left"
 >
 <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Info (Optional)</span>
 <ChevronDownIcon
 :class="['w-5 h-5 transition-transform', showCustomerInfo ? 'rotate-180' : '']"
 />
 </button>
 <div v-if="showCustomerInfo" class="mt-3 space-y-3">
 <input
 v-model="customerName"
 type="text"
 placeholder="Customer Name"
 class="w-full px-4 py-2 rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
 />
 <input
 v-model="customerPhone"
 type="tel"
 placeholder="Phone (Optional)"
 class="w-full px-4 py-2 rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
 />
 </div>
 </div>

 <!-- Payment -->
 <div class="border-t border-gray-200 pt-4">
 <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
 <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Payment</span>
 <Checkbox v-model="useSplitPayment" label="Split payment" size="sm" />
 </div>

 <div v-if="!useSplitPayment" class="grid grid-cols-2 gap-2">
 <button
 v-for="method in ['Cash', 'Card', 'Mobile Money', 'Bank Transfer']"
 :key="method"
 type="button"
 @click="paymentMethod = method"
 :class="[ 'px-4 py-2 rounded-sm text-sm font-medium transition-colors', paymentMethod === method ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600' ]"
 >
 {{ method }}
 </button>
 </div>

 <div v-else class="space-y-2">
 <div
 v-for="(payment, index) in splitPayments"
 :key="index"
 class="flex items-center gap-2 flex-wrap"
 >
 <select
 v-model="payment.method"
 class="flex-1 min-w-[8rem] px-3 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100"
 >
 <option value="">Method</option>
 <option value="Cash">Cash</option>
 <option value="Card">Card</option>
 <option value="Mobile Money">Mobile Money</option>
 <option value="Bank Transfer">Bank Transfer</option>
 </select>
 <div class="relative w-32">
 <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">{{ currencySymbol }}</span>
 <input
 v-model.number="payment.amount"
 type="number"
 step="0.01"
 min="0"
 :max="cartTotal - splitPaymentsTotal + payment.amount"
 class="w-full pl-6 pr-2 py-2 text-sm rounded-sm bg-white dark:!bg-dashboard-card text-gray-900 dark:text-gray-100"
 placeholder="0.00"
 />
 </div>
 <button
 v-if="splitPayments.length > 1"
 type="button"
 class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm"
 @click="removeSplitPayment(index)"
 >
 <XMarkIcon class="w-4 h-4" />
 </button>
 </div>
 <button
 type="button"
 class="w-full px-3 py-1.5 text-xs text-primary-500 dark:text-primary-400 border-0 dark:border-primary-600 rounded-sm"
 @click="addSplitPayment"
 >
 + Add payment line
 </button>
 <div
 class="rounded-sm border p-2.5 space-y-1.5"
 :class="{
 'border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-800/50 dark:bg-emerald-950/25': splitPaymentBalanceUi.tone === 'ok',
 'border-amber-200/80 bg-amber-50/90 dark:border-amber-800/50 dark:bg-amber-950/20': splitPaymentBalanceUi.tone === 'short',
 'border-red-200/80 bg-red-50/90 dark:border-red-800/50 dark:bg-red-950/20': splitPaymentBalanceUi.tone === 'over',
 }"
 >
 <div class="flex justify-between items-start gap-2">
 <span class="text-[10px] font-medium uppercase tracking-wide text-gray-500">Balance</span>
 <div class="text-right">
 <p
 class="text-sm font-semibold tabular-nums"
 :class="{
 'text-emerald-700 dark:text-emerald-300': splitPaymentBalanceUi.tone === 'ok',
 'text-amber-800 dark:text-amber-200': splitPaymentBalanceUi.tone === 'short',
 'text-red-700 dark:text-red-300': splitPaymentBalanceUi.tone === 'over',
 }"
 >
 {{ splitPaymentBalanceUi.headline }}
 </p>
 <p class="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 max-w-[16rem] ml-auto leading-snug">
 {{ splitPaymentBalanceUi.sub }}
 </p>
 </div>
 </div>
 <p class="text-[10px] text-gray-500 tabular-nums pt-1 border-t border-gray-200/80/60">
 Allocated {{ formatCurrency(splitPaymentsTotal) }} of {{ formatCurrency(cartTotal) }}
 </p>
 </div>
 </div>
 </div>

 <!-- Total -->
 <div class="border-t border-gray-200 pt-4">
 <div class="flex items-center justify-between">
 <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">Total</span>
 <span class="text-2xl font-bold text-primary-500 dark:text-primary-400">
 {{ currencySymbol }}{{ formatCurrency(cartTotal) }}
 </span>
 </div>
 </div>
 </div>
 </template>

 <template #footer>
 <div class="flex gap-2 justify-end">
 <Button variant="outline" size="sm" @click="$emit('update:modelValue', false)" extra-class="!rounded-2xl">Cancel</Button>
 <Button
 size="sm"
 @click="completeSale"
 :loading="isProcessing"
 :disabled="!canCompleteQuickSale"
 extra-class="!rounded-2xl"
 >
 Complete Sale ({{ currencySymbol }}{{ formatCurrency(cartTotal) }})
 </Button>
 </div>
 </template>
 </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
 XMarkIcon,
 QrCodeIcon,
 ShoppingBagIcon,
 MinusIcon,
 PlusIcon,
 TrashIcon,
 ChevronDownIcon,
} from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import SellScreenNoteBanner from '~/components/receipts/SellScreenNoteBanner.vue'
import Button from '~/components/ui/Button.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import { useInventoryStore, type InventoryFolder, type InventoryItem } from '~/stores/inventory'
import { useSellerLoanOutsStore } from '~/stores/sellerLoanOuts'
import { useReceiptsStore } from '~/stores/receipts'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import { getReceiptProductDetails } from '~/composables/useReceiptProductDetails'
import { resolveBulkStockFieldAndValue } from '~/utils/inventory-bulk-quantity'

interface Props {
 modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
 'update:modelValue': [value: boolean]
 'sale-completed': []
}>()

const inventoryStore = useInventoryStore()
const sellerLoanOutsStore = useSellerLoanOutsStore()
const receiptsStore = useReceiptsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const { formatCurrency, preferences } = usePreferences()

const currencySymbol = computed(() => preferences.value?.currencySymbol || '$')
const { success: showSuccessToast, error: showErrorToast, warning: showWarningToast } = useAppToast()

const folders = computed(() => inventoryStore.folders)
const selectedFolderId = ref<string>('')
const selectedFolder = computed(() =>
 selectedFolderId.value ? inventoryStore.getFolderById(selectedFolderId.value) : undefined
)
const isScanning = ref(false)
const scannerReady = ref(false)
const scannerContainer = ref<HTMLElement | null>(null)
const manualBarcode = ref('')
const isSearching = ref(false)
const cartItems = ref<Array<{ id: string; name: string; price: number; quantity: number; item: InventoryItem }>>([])
const showCustomerInfo = ref(false)
const customerName = ref('')
const customerPhone = ref('')
const paymentMethod = ref<'Cash' | 'Card' | 'Mobile Money' | 'Bank Transfer' | string>('Cash')
const useSplitPayment = ref(false)
const splitPayments = ref<Array<{ method: string; amount: number }>>([{ method: '', amount: 0 }])
const isProcessing = ref(false)

let html5QrCode: any = null

const cartTotal = computed(() => {
 return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const splitPaymentsTotal = computed(() =>
 splitPayments.value.reduce((sum, p) => sum + (p.amount || 0), 0),
)

const SPLIT_PAY_EPS = 0.01
const splitPaymentRemaining = computed(() => {
 const left = cartTotal.value - splitPaymentsTotal.value
 return Math.round(left * 100) / 100
})

const splitPaymentBalanceUi = computed(() => {
 const rem = splitPaymentRemaining.value
 if (Math.abs(rem) < SPLIT_PAY_EPS) {
 return { tone: 'ok' as const, headline: 'Balanced', sub: 'Payment lines match the sale total.' }
 }
 if (rem > 0) {
 return {
 tone: 'short' as const,
 headline: `${formatCurrency(rem)} left`,
 sub: `Enter the rest so the sum equals ${formatCurrency(cartTotal.value)}.`,
 }
 }
 return {
 tone: 'over' as const,
 headline: `Over by ${formatCurrency(Math.abs(rem))}`,
 sub: 'Adjust amounts so the split total matches the sale.',
 }
})

const addSplitPayment = () => {
 splitPayments.value.push({ method: '', amount: 0 })
}

const removeSplitPayment = (index: number) => {
 splitPayments.value.splice(index, 1)
 if (splitPayments.value.length === 0) {
 splitPayments.value.push({ method: '', amount: 0 })
 }
}

const canCompleteQuickSale = computed(() => {
 if (cartItems.value.length === 0 || !selectedFolderId.value) return false
 if (useSplitPayment.value) {
 if (splitPayments.value.length === 0) return false
 if (splitPayments.value.some((p) => !p.method || p.amount <= 0)) return false
 return Math.abs(splitPaymentRemaining.value) < SPLIT_PAY_EPS
 }
 return !!paymentMethod.value
})

const toggleScanner = async () => {
 if (isScanning.value) {
 stopScanner()
 } else {
 await startScanner()
 }
}

const startScanner = async () => {
 if (!scannerContainer.value) return
 
 try {
 // Dynamically import html5-qrcode
 const { Html5Qrcode } = await import('html5-qrcode')
 const containerId = scannerContainer.value.id || 'scanner-container'
 html5QrCode = new Html5Qrcode(containerId)
 
 const config = {
 fps: 10,
 qrbox: { width: 250, height: 250 },
 aspectRatio: 1.0,
 }
 
 await html5QrCode.start(
 { facingMode: 'environment' }, // Use back camera on mobile
 config,
 onScanSuccess,
 onScanError
 )
 
 isScanning.value = true
 scannerReady.value = true
 } catch (error: any) {
 console.error('Scanner error:', error)
 showErrorToast('Failed to start camera. Please check permissions.')
 isScanning.value = false
 scannerReady.value = false
 }
}

const stopScanner = async () => {
 if (html5QrCode) {
 try {
 await html5QrCode.stop()
 await html5QrCode.clear()
 html5QrCode = null
 } catch (error) {
 console.error('Error stopping scanner:', error)
 }
 }
 isScanning.value = false
 scannerReady.value = false
}

const onScanSuccess = (decodedText: string) => {
 manualBarcode.value = decodedText
 searchByBarcode()
 // Optionally stop scanner after successful scan
 // stopScanner()
}

const onScanError = (errorMessage: string) => {
 // Ignore continuous scan errors
}

const loadFolderItems = async (): Promise<InventoryItem[]> => {
 if (!selectedFolderId.value) return []
 try {
 return await inventoryStore.fetchItemsAllChunked(selectedFolderId.value, { force: true })
 } catch (error: any) {
 showErrorToast('Failed to load folder items')
 return []
 }
}

const searchByBarcode = async () => {
 if (!manualBarcode.value.trim() || !selectedFolderId.value) {
 showWarningToast('Please select a folder and enter a barcode')
 return
 }
 
 isSearching.value = true
 try {
 const items = await loadFolderItems()
 
 // Search for item by barcode (assuming barcode is stored in a field)
 const barcodeField = 'barcode'
 const foundItem: InventoryItem | undefined = items.find((item: InventoryItem) => {
 const barcode = (item as any)[barcodeField] || 
 (item as any).serialNo || 
 (item as any).serialNumber
 return barcode?.toString().toLowerCase() === manualBarcode.value.toLowerCase()
 })
 
 if (!foundItem) {
 showWarningToast('Product not found')
 manualBarcode.value = ''
 return
 }

 // Check if item is already in cart
 const existingIndex = cartItems.value.findIndex(ci => ci.id === foundItem.id)
 if (existingIndex >= 0 && cartItems.value[existingIndex]) {
 const usesSerial = selectedFolder.value?.hasSerialNumbers
 if (!usesSerial) {
 const stock = resolveBulkStockFieldAndValue(foundItem as Record<string, unknown>, selectedFolder.value)
 const maxQty = stock?.value ?? 0
 if (cartItems.value[existingIndex].quantity + 1 > maxQty) {
 showWarningToast('Not enough stock')
 manualBarcode.value = ''
 return
 }
 }
 cartItems.value[existingIndex].quantity++
 } else {
 const usesSerial = selectedFolder.value?.hasSerialNumbers
 if (usesSerial) {
 if (foundItem.dateOut) {
 showErrorToast('This product has already been sold')
 manualBarcode.value = ''
 return
 }
 if (foundItem.pendingSaleReceiptId) {
 showErrorToast('This product is reserved on an outstanding order')
 manualBarcode.value = ''
 return
 }
 } else {
 const stock = resolveBulkStockFieldAndValue(foundItem as Record<string, unknown>, selectedFolder.value)
 const onHand = stock?.value ?? 0
 if (onHand <= 0) {
 showErrorToast('This product is out of stock')
 manualBarcode.value = ''
 return
 }
 }
 
 // Get item price
 const priceField = 'price'
 const price = parseFloat((foundItem as any)[priceField] || '0')
 const itemName = Object.keys(foundItem).find(key => 
 key.toLowerCase().includes('name') || 
 key.toLowerCase().includes('item') ||
 key.toLowerCase().includes('product')
 )
 const name = itemName ? (foundItem as any)[itemName] : `Product ${foundItem.id.slice(0, 8)}`
 
 cartItems.value.push({
 id: foundItem.id,
 name,
 price,
 quantity: 1,
 item: foundItem,
 })
 }
 
 manualBarcode.value = ''
 showSuccessToast('Product added to cart')
 } catch (error: any) {
 showErrorToast('Error searching for product')
 } finally {
 isSearching.value = false
 }
}

const updateQuantity = (index: number, newQuantity: number) => {
 if (newQuantity <= 0) {
 removeItem(index)
 return
 }
 if (cartItems.value[index]) {
 cartItems.value[index].quantity = newQuantity
 }
}

const removeItem = (index: number) => {
 cartItems.value.splice(index, 1)
}

const completeSale = async () => {
 if (!canCompleteQuickSale.value) return

 isProcessing.value = true
 try {
 const receiptNumber = `REC-${Date.now().toString().slice(-6)}`
 
 const receiptItems = cartItems.value.map(ci => ({
 itemId: ci.id,
 quantity: ci.quantity,
 price: ci.price,
 itemName: ci.name,
 serialNo: String((ci.item as any).serialNo || (ci.item as any).serialNumber || ''),
 brand: String((ci.item as any).brand || ''),
 model: String((ci.item as any).model || ''),
 sku: String((ci.item as any).sku || ''),
 productDetails: getReceiptProductDetails(ci.item),
 }))
 
 const itemIds = cartItems.value.map(ci => ci.id)
 const hasSerialNumbers = selectedFolder.value?.hasSerialNumbers ?? false

 if (selectedFolderId.value && itemIds.length > 0) {
 const saleLines = cartItems.value.map((ci) => ({
 itemId: ci.id,
 quantitySold: hasSerialNumbers ? 1 : ci.quantity,
 }))
 await inventoryStore.applyReceiptSaleToInventory(selectedFolderId.value, saleLines, {
 hasSerialNumbers,
 })
 await sellerLoanOutsStore.fetchSellerLoanOuts(true).catch(() => {})
 }
 
 // Get current store and user information
 const currentStore = storesStore.currentStore
 const currentStoreId = storesStore.currentStoreId
 if (!currentStoreId) {
 showErrorToast('No store selected. Please select a store first.')
 isProcessing.value = false
 return
 }
 
 const storeBranchName = currentStore?.name || 'Unknown Store'
 
 // Get user name (staff member or super admin)
 let createdByUserName = 'Unknown User'
 if (userStore.userData?.role === 'staff') {
 // For staff, get their name from staff document
 const staffMember = await staffStore.fetchCurrentStaffMember()
 if (staffMember) {
 createdByUserName = `${staffMember.firstName} ${staffMember.lastName}`.trim() || staffMember.email || 'Staff Member'
 }
 } else if (userStore.userData) {
 // For super admin, use their name or email
 createdByUserName = userStore.userData.name || userStore.userData.email || 'Super Admin'
 }
 
 // Create receipt
 const receiptData: any = {
 receiptNumber,
 customerName: customerName.value || 'Walk-in Customer',
 customerEmail: '',
 customerPhone: customerPhone.value || '',
 date: new Date(),
 items: receiptItems,
 itemsCount: cartItems.value.reduce((sum, ci) => sum + ci.quantity, 0),
 total: cartTotal.value,
 paymentMethod: useSplitPayment.value ? 'Split Payment' : (paymentMethod.value || 'Cash'),
 status: 'completed' as const,
 notes: 'Quick Sale',
 folderId: selectedFolderId.value || '',
 itemIds,
 storeId: currentStoreId, // Store ID where receipt was created
 storeBranchName, // Store branch name
 storeLogoUrl: storesStore.currentStore?.logoUrl || userStore.userData?.storeLogoUrl || '', // Account logo - empty string if none (Firestore rejects undefined)
 createdByUserName, // User who created the receipt
 }

 if (useSplitPayment.value && splitPayments.value.length > 0) {
 receiptData.splitPayments = splitPayments.value.map((p) => ({
 method: p.method,
 amount: p.amount,
 }))
 }

 await receiptsStore.createReceipt(receiptData)
 
 showSuccessToast('Sale completed successfully!')
 resetForm()
 emit('update:modelValue', false)
 emit('sale-completed')
 } catch (error: any) {
 showErrorToast(error.message || 'Failed to complete sale')
 } finally {
 isProcessing.value = false
 }
}

const resetForm = () => {
 cartItems.value = []
 customerName.value = ''
 customerPhone.value = ''
 paymentMethod.value = 'Cash'
 useSplitPayment.value = false
 splitPayments.value = [{ method: '', amount: 0 }]
 manualBarcode.value = ''
 showCustomerInfo.value = false
 stopScanner()
}

watch(() => props.modelValue, (isOpen) => {
 if (isOpen) {
 inventoryStore.fetchFolders()
 if (folders.value.length === 1 && folders.value[0]) {
 selectedFolderId.value = folders.value[0].id
 loadFolderItems()
 }
 } else {
 resetForm()
 }
})

onMounted(() => {
 inventoryStore.fetchFolders()
})

onUnmounted(() => {
 stopScanner()
})
</script>

<style scoped>
#scanner-container {
 width: 100%;
 height: 100%;
}
</style>
