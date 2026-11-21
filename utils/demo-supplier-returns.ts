import type { SupplierReturn, SupplierReturnStatus } from '~/types/supplier-returns'

/** Sample supplier returns for the public demo (in memory only). */

const day = 86_400_000
const ago = (days: number) => new Date(Date.now() - days * day).toISOString()

function row(
  partial: Omit<
    SupplierReturn,
    | 'history'
    | 'storeId'
    | 'createdByName'
    | 'customerReturn'
    | 'writeOffId'
    | 'restockedAt'
    | 'restockedItemId'
  > & {
    history?: SupplierReturn['history']
  }
): SupplierReturn {
  const events: SupplierReturn['history'] = [
    {
      status: 'ready',
      at: partial.createdAt ?? ago(0),
      byName: 'Ada (Owner)',
      note: partial.defect,
    },
  ]
  const push = (status: SupplierReturnStatus, at: string | null) => {
    if (at) events.push({ status, at, byName: 'Ada (Owner)' })
  }
  if (partial.sentAt) push('with_supplier', partial.sentAt)
  if (partial.closedAt) push(partial.status, partial.closedAt)
  return {
    storeId: 'demo',
    createdByName: 'Ada (Owner)',
    history: events,
    customerReturn: null,
    writeOffId: null,
    restockedAt: null,
    restockedItemId: null,
    ...partial,
  }
}

export function demoSupplierReturns(): SupplierReturn[] {
  return [
    row({
      id: 'demo-sr-1',
      status: 'ready',
      item: {
        inventoryItemId: 'demo-camry',
        folderId: 'sedan',
        folderName: 'Sedan',
        name: 'Toyota Camry 2021',
        details: { serialNumber: '4T1BF1FK5MU123456', color: 'Silver' },
        serial: true,
        quantity: 1,
        unitCost: 18_500_000,
        inventoryAction: 'removed',
      },
      origin: { kind: 'stock', addedAt: ago(48), addedByName: 'Ada (Owner)' },
      defect: 'Gearbox slipping on the pre-sale test drive',
      supplierName: 'Apapa Auto Imports',
      supplierReference: '',
      outcome: null,
      notes: '',
      costValue: 18_500_000,
      createdAt: ago(1),
      sentAt: null,
      closedAt: null,
    }),
    row({
      id: 'demo-sr-2',
      status: 'with_supplier',
      item: {
        inventoryItemId: 'demo-rx350',
        folderId: 'suv',
        folderName: "SUV's",
        name: 'Lexus RX350',
        details: { serialNumber: '2T2BZMCA7KC198765' },
        serial: true,
        quantity: 1,
        unitCost: 24_000_000,
        inventoryAction: 'removed',
      },
      origin: {
        kind: 'transfer',
        addedAt: ago(30),
        addedByName: 'Kunle (Manager)',
        fromBranchName: 'Port Harcourt',
        originalAddedAt: ago(70),
      },
      defect: 'Dashboard warning lights, ECU fault',
      supplierName: 'Cotonou Motors',
      supplierReference: 'INV-88213',
      outcome: null,
      notes: '',
      costValue: 24_000_000,
      createdAt: ago(6),
      sentAt: ago(4),
      closedAt: null,
    }),
    row({
      id: 'demo-sr-3',
      status: 'resolved',
      item: {
        inventoryItemId: 'demo-civic',
        folderId: 'sedan',
        folderName: 'Sedan',
        name: 'Honda Civic',
        details: { serialNumber: '19XFC2F59KE045512' },
        serial: true,
        quantity: 1,
        unitCost: 7_200_000,
        inventoryAction: 'removed',
      },
      origin: {
        kind: 'buyback',
        addedAt: ago(40),
        addedByName: 'Ada (Owner)',
        customerName: 'Pedro',
      },
      defect: 'Arrived with a cracked radiator',
      supplierName: 'Apapa Auto Imports',
      supplierReference: 'RMA-2041',
      outcome: 'credit_note',
      notes: '',
      costValue: 7_200_000,
      createdAt: ago(12),
      sentAt: ago(11),
      closedAt: ago(5),
    }),
    row({
      id: 'demo-sr-4',
      status: 'rejected',
      item: {
        inventoryItemId: 'demo-tyres',
        folderId: 'bicycles',
        folderName: 'Bicycles',
        name: 'Bicycle tyres 26"',
        details: {},
        serial: false,
        quantity: 4,
        unitCost: 15_000,
        inventoryAction: 'reduced',
      },
      origin: { kind: 'stock', addedAt: ago(60), addedByName: 'Folu Osho' },
      defect: 'Sidewalls split, found on delivery check',
      supplierName: 'Lagos Cycle Parts',
      supplierReference: '',
      outcome: null,
      notes: 'Supplier says fitting damage, not a manufacturing fault.',
      costValue: 60_000,
      createdAt: ago(21),
      sentAt: ago(20),
      closedAt: ago(15),
    }),
  ]
}
