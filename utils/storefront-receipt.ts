/** Receipt came from public storefront checkout or inquiry fulfillment. */
export function isStorefrontSourcedReceipt(receipt: {
  source?: string | null
  paymentMethod?: string | null
}): boolean {
  const source = String(receipt.source || '')
  if (source === 'storefront' || source === 'storefront_inquiry') return true
  return String(receipt.paymentMethod || '').trim().toLowerCase() === 'storefront'
}
