import type { DemoTransfer } from '~/types/demo'
import { DEMO_USER_UID } from '~/utils/demo-mode'
import { useDemoAppStore } from '~/stores/demoApp'
import { demoId } from '~/utils/demo-seed'
import { syncDemoToPinia } from '~/utils/demo-bridge'

export interface DemoConsolidatedReport {
  totalRevenue: number
  totalSales: number
  totalItems: number
  avgOrderValue: number
  storeBreakdown: Array<{
    id: string
    name: string
    revenue: number
    sales: number
    items: number
  }>
}

export function getDemoConsolidatedReport(
  dateRange: string,
  storeFilter: string
): DemoConsolidatedReport {
  const demo = useDemoAppStore()
  demo.hydrate()

  const days = dateRange === 'all' ? null : Number.parseInt(dateRange, 10)
  const startMs = days && Number.isFinite(days) ? Date.now() - days * 24 * 60 * 60 * 1000 : null

  let stores = demo.state.stores
  if (storeFilter !== 'all') {
    stores = stores.filter((s) => s.id === storeFilter)
  }

  let totalRevenue = 0
  let totalSales = 0
  let totalItems = 0
  const storeBreakdown: DemoConsolidatedReport['storeBreakdown'] = []

  for (const store of stores) {
    let receipts = store.receipts.filter((r) => r.status === 'completed')
    if (startMs) {
      receipts = receipts.filter((r) => new Date(r.date).getTime() >= startMs)
    }

    const revenue = receipts.reduce((sum, r) => sum + r.total, 0)
    const sales = receipts.length
    const items = receipts.reduce(
      (sum, r) => sum + r.items.reduce((n, line) => n + line.quantity, 0),
      0
    )

    totalRevenue += revenue
    totalSales += sales
    totalItems += items

    storeBreakdown.push({
      id: store.id,
      name: store.name,
      revenue,
      sales,
      items,
    })
  }

  return {
    totalRevenue,
    totalSales,
    totalItems,
    avgOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
    storeBreakdown,
  }
}

export function getDemoTransfers(): DemoTransfer[] {
  const demo = useDemoAppStore()
  demo.hydrate()
  return [...demo.state.transfers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function addDemoTransferRequest(
  payload: Omit<DemoTransfer, 'id' | 'createdAt' | 'createdBy' | 'status'>
) {
  const demo = useDemoAppStore()
  demo.hydrate()
  const transfer: DemoTransfer = {
    ...payload,
    id: demoId('xfer'),
    status: 'pending_approval',
    createdBy: DEMO_USER_UID,
    createdAt: new Date().toISOString(),
  }
  demo.state.transfers.unshift(transfer)
  demo.persist()
  await syncDemoToPinia()
  return transfer.id
}

export async function updateDemoTransferStatus(
  transferId: string,
  status: DemoTransfer['status'],
  extra?: Partial<DemoTransfer>
) {
  const demo = useDemoAppStore()
  const transfer = demo.state.transfers.find((t) => t.id === transferId)
  if (!transfer) throw new Error('Transfer not found')
  transfer.status = status
  if (extra) Object.assign(transfer, extra)
  demo.persist()
  await syncDemoToPinia()
}

/** Move stock between demo stores when a transfer is completed. */
export async function executeDemoTransfer(transfer: DemoTransfer) {
  const demo = useDemoAppStore()
  const source = demo.getStore(transfer.sourceStoreId)
  const dest = demo.getStore(transfer.destinationStoreId)
  if (!source || !dest) throw new Error('Store not found')

  for (const line of transfer.items) {
    const sourceItem = source.items.find((i) => i.id === line.itemId)
    if (!sourceItem) throw new Error(`Item not found at source: ${line.itemName}`)
    const available = sourceItem.quantity - sourceItem.sold
    if (line.quantity > available) {
      throw new Error(`Not enough stock for ${line.itemName}`)
    }
    sourceItem.quantity -= line.quantity

    let destItem = dest.items.find((i) => i.name === line.itemName || i.sku === sourceItem.sku)
    if (destItem) {
      destItem.quantity += line.quantity
    } else {
      dest.items.push({
        id: demoId('item'),
        folderId: transfer.destinationFolderId,
        storeId: dest.id,
        name: line.itemName,
        price: sourceItem.price,
        quantity: line.quantity,
        sold: 0,
        sku: sourceItem.sku,
      })
    }
  }

  transfer.status = 'completed'
  demo.persist()
  await syncDemoToPinia()
}
