export interface CustomerTotalsInput {
 receipts?: string[]
 totalOrders?: number
 totalSpent?: number
}

export interface CustomerTotalsResult {
 deleteCustomer: boolean
 receipts: string[]
 totalOrders: number
 totalSpent: number
}

export function computeCustomerAfterReceiptDelete(
 customer: CustomerTotalsInput,
 receiptId: string,
 receiptTotal: number
): CustomerTotalsResult {
 const currentReceipts = Array.isArray(customer.receipts) ? customer.receipts : []
 const updatedReceipts = currentReceipts.filter((id) => id !== receiptId)
 if (updatedReceipts.length === 0) {
 return {
 deleteCustomer: true,
 receipts: [],
 totalOrders: 0,
 totalSpent: 0,
 }
 }

 return {
 deleteCustomer: false,
 receipts: updatedReceipts,
 totalOrders: Math.max(0, Number(customer.totalOrders || 1) - 1),
 totalSpent: Math.max(0, Number(customer.totalSpent || receiptTotal) - receiptTotal),
 }
}
