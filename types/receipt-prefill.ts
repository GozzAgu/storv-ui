/** Optional context when opening the existing Create Receipt modal from another feature. */
export interface ReceiptCreationPrefill {
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  notes?: string
  /** Pre-select an in-stock inventory item when available. */
  inventoryItemId?: string
  /** Seed the item search field on the items step. */
  itemSearchQuery?: string
  /** Start the sale as unpaid (stock held until paid), e.g. when billing a trade partner. */
  paymentSettlement?: 'balance_due'
}
