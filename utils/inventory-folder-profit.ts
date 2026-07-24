import type { InventoryFolder, InventoryItem, TemplateField } from '~/stores/inventory'
import {
  isItemAwaitingPayment,
  isItemOnStockLoan,
  isItemSold,
} from '~/utils/inventory-availability'
import { getItemSellPrice, resolveItemUnitCost } from '~/utils/inventory-item-cost'
import {
  quantityFieldName,
  unitsForItem,
} from '~/utils/inventory-folder-availability'

export const COST_PRICE_FIELD_NAME = 'unitCost'
export const COST_PRICE_FIELD_LABEL = 'Cost price'

export interface FolderProfitStats {
  /** Gross profit on available stock (sell − cost) × units. */
  grossProfitOnHand: number
  unitsWithCost: number
}

export function folderTracksProfit(
  folder: Pick<InventoryFolder, 'trackProfit'> | null | undefined
): boolean {
  return folder?.trackProfit === true
}

export function templateHasCostPriceField(fields: TemplateField[] | undefined): boolean {
  return fields?.some((f) => f.name === COST_PRICE_FIELD_NAME) ?? false
}

export function createCostPriceTemplateField(): TemplateField {
  return {
    id: `field-${COST_PRICE_FIELD_NAME}-${Date.now()}`,
    name: COST_PRICE_FIELD_NAME,
    label: COST_PRICE_FIELD_LABEL,
    type: 'currency',
    required: false,
  }
}

export function ensureCostPriceTemplateField(fields: TemplateField[]): void {
  if (templateHasCostPriceField(fields)) return
  fields.push(createCostPriceTemplateField())
}

export function removeCostPriceTemplateField(fields: TemplateField[]): TemplateField[] {
  return fields.filter((f) => f.name !== COST_PRICE_FIELD_NAME)
}

/** Sum gross profit for available units where acquisition cost is recorded. */
export function computeFolderGrossProfitOnHand(
  items: InventoryItem[],
  folder: Pick<InventoryFolder, 'hasSerialNumbers' | 'template' | 'trackProfit'>
): FolderProfitStats | null {
  if (!folderTracksProfit(folder)) return null

  const qtyField = quantityFieldName(folder)
  let grossProfitOnHand = 0
  let unitsWithCost = 0

  for (const item of items) {
    if (isItemSold(item) || isItemOnStockLoan(item) || isItemAwaitingPayment(item)) continue

    const units = unitsForItem(item, folder.hasSerialNumbers, qtyField)
    if (units <= 0) continue

    const unitCost = resolveItemUnitCost(item)
    if (unitCost === undefined) continue

    const sell = getItemSellPrice(item)
    grossProfitOnHand += units * (sell - unitCost)
    unitsWithCost += units
  }

  return { grossProfitOnHand, unitsWithCost }
}

export function sumFolderGrossProfitOnHand(
  profits: Record<string, FolderProfitStats | null | undefined>
): number {
  return Object.values(profits).reduce((sum, stats) => sum + (stats?.grossProfitOnHand ?? 0), 0)
}
