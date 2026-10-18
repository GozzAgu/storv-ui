export const RECEIPT_CHANGED_WHILE_SAVING =
  'The sale changed while it was saving. Check the cart and try again.'

/**
 * A receipt with item lines but no item count was built from a cart that emptied mid-save (it
 * once saved as a ₦0 sale). Throws instead of letting that reach the database.
 */
export function assertReceiptConsistent(receipt: {
  items?: Array<{ quantity?: number }> | null
  itemsCount?: number | null
}): void {
  const lines = receipt.items ?? []
  if (lines.length === 0 || receipt.itemsCount == null) return
  const lineQuantity = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
  if (lineQuantity > 0 && receipt.itemsCount <= 0) {
    throw new Error(RECEIPT_CHANGED_WHILE_SAVING)
  }
}
