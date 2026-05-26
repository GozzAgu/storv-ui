import type { DemoTransfer } from '~/types/demo'
import { DEMO_USER_UID } from '~/utils/demo-mode'
import { useDemoAppStore } from '~/stores/demoApp'
import { demoId } from '~/utils/demo-seed'
import { syncDemoToPinia } from '~/utils/demo-bridge'

export function getDemoTransfers(): DemoTransfer[] {
  const demo = useDemoAppStore()
  demo.hydrate()
  return [...demo.state.transfers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function addDemoTransferRequest(payload: Omit<DemoTransfer, 'id' | 'createdAt' | 'createdBy' | 'status'>) {
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
  extra?: Partial<DemoTransfer>,
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

    let destItem = dest.items.find(
      (i) => i.name === line.itemName || i.sku === sourceItem.sku,
    )
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
