import { FieldValue } from 'firebase-admin/firestore'

/**
 * What a sold serial unit records about its sale, so Inventory can show its Unit Price next to
 * what it actually sold for, and who changed the price at checkout. Bulk rows keep this on the
 * receipt only, since one row covers many sales.
 */
export interface SoldPrice {
  soldPrice: number
  receiptId: string
  /** The inventory price, only when the price was changed at checkout. */
  listPrice?: number
  changedBy?: string
  changedByName?: string
}

export function soldPriceStamp(sale: SoldPrice): Record<string, unknown> {
  const changed = sale.listPrice !== undefined && Boolean(sale.changedBy)
  return {
    soldPrice: sale.soldPrice,
    soldReceiptId: sale.receiptId,
    listPriceAtSale: changed ? sale.listPrice : FieldValue.delete(),
    priceChangedBy: changed ? sale.changedBy : FieldValue.delete(),
    priceChangedByName: changed ? sale.changedByName || '' : FieldValue.delete(),
  }
}

/** Removes the sale stamp when a unit goes back into stock (refund, deleted receipt). */
export function clearSoldPriceStamp(): Record<string, unknown> {
  return {
    soldPrice: FieldValue.delete(),
    soldReceiptId: FieldValue.delete(),
    listPriceAtSale: FieldValue.delete(),
    priceChangedBy: FieldValue.delete(),
    priceChangedByName: FieldValue.delete(),
  }
}

/** The stamp for a receipt line written by createSale (used when a held order completes). */
export function soldPriceFromReceiptLine(
  line: Record<string, unknown>,
  receiptId: string
): Record<string, unknown> | null {
  const price = Number(line.price)
  if (!Number.isFinite(price) || price < 0) return null
  const listPrice = Number(line.listPrice)
  return soldPriceStamp({
    soldPrice: price,
    receiptId,
    ...(line.priceChanged === true &&
      Number.isFinite(listPrice) && {
        listPrice,
        changedBy: typeof line.priceChangedBy === 'string' ? line.priceChangedBy : undefined,
        changedByName:
          typeof line.priceChangedByName === 'string' ? line.priceChangedByName : undefined,
      }),
  })
}
