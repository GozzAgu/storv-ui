/** Message shown when a product without a Unit Price is added to a sale. */
export const NO_PRICE_SALE_MESSAGE = 'Set a Unit Price for this product in Inventory first.'

/**
 * Whether the product has a Unit Price to sell at. Swap-ins can be taken in without one, and
 * selling such an item would record a ₦0 sale. A discount (even to 0) counts as priced: the owner
 * set the price and chose to discount it.
 */
export function hasSaleUnitPrice(item: object): boolean {
  const record = item as Record<string, unknown>
  for (const key of ['price', 'Price', 'originalPrice']) {
    const raw = record[key]
    if (raw === undefined || raw === null || raw === '') continue
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
    if (Number.isFinite(n) && n > 0) return true
  }
  return false
}

/** An unsold swap-in taken in without a Unit Price: it can't be sold until someone prices it. */
export function swapInNeedsPrice(item: object): boolean {
  const record = item as Record<string, unknown>
  return record.swapIn === true && !record.dateOut && !hasSaleUnitPrice(item)
}
