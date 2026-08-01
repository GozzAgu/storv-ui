import type { DemoReceipt, DemoState, DemoStoreRecord } from '~/types/demo'
import { DEMO_STORE_ABUJA, DEMO_STORE_LAGOS, DEMO_STORE_PH, DEMO_USER_UID } from '~/utils/demo-mode'

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function lagosStore(): DemoStoreRecord {
  const folderPhones = 'folder_lagos_phones'
  const folderSmartphones = 'folder_lagos_smartphones'
  const folderAccessories = 'folder_lagos_accessories'

  return {
    id: DEMO_STORE_LAGOS,
    name: 'Lagos, Lekki',
    address: '12 Admiralty Way, Lekki, Lagos',
    folders: [
      { id: folderPhones, name: 'Phones', storeId: DEMO_STORE_LAGOS, usesSubcategories: true },
      {
        id: folderSmartphones,
        name: 'Smartphones',
        storeId: DEMO_STORE_LAGOS,
        parentId: folderPhones,
      },
      { id: folderAccessories, name: 'Accessories', storeId: DEMO_STORE_LAGOS },
    ],
    items: [
      {
        id: 'item_lagos_iphone',
        folderId: folderSmartphones,
        storeId: DEMO_STORE_LAGOS,
        name: 'iPhone 13 128GB',
        price: 485000,
        unitCost: 380000,
        quantity: 4,
        sold: 2,
        sku: 'PH-13-128',
      },
      {
        id: 'item_lagos_samsung',
        folderId: folderSmartphones,
        storeId: DEMO_STORE_LAGOS,
        name: 'Samsung A54',
        price: 265000,
        unitCost: 210000,
        quantity: 6,
        sold: 1,
        sku: 'SM-A54',
      },
      {
        id: 'item_lagos_case',
        folderId: folderAccessories,
        storeId: DEMO_STORE_LAGOS,
        name: 'Silicone phone case',
        price: 8500,
        unitCost: 4200,
        quantity: 24,
        sold: 8,
        sku: 'ACC-CASE',
      },
      {
        id: 'item_lagos_charger',
        folderId: folderAccessories,
        storeId: DEMO_STORE_LAGOS,
        name: '20W USB-C charger',
        price: 12000,
        unitCost: 6500,
        quantity: 15,
        sold: 3,
        sku: 'ACC-CHG',
      },
    ],
    customers: [
      {
        id: 'cust_lagos_ada',
        storeId: DEMO_STORE_LAGOS,
        name: 'Ada Okonkwo',
        phone: '0803 111 2233',
        totalOrders: 2,
        totalSpent: 493500,
      },
      {
        id: 'cust_lagos_walkin',
        storeId: DEMO_STORE_LAGOS,
        name: 'Walk-in customer',
        totalOrders: 2,
        totalSpent: 42200,
      },
    ],
    receipts: [],
  }
}

function abujaStore(): DemoStoreRecord {
  const folderElectronics = 'folder_abuja_electronics'
  const folderLaptops = 'folder_abuja_laptops'
  const folderAccessories = 'folder_abuja_accessories'

  return {
    id: DEMO_STORE_ABUJA,
    name: 'Abuja, Wuse',
    address: '22 Adetokunbo Ademola Crescent, Wuse II',
    folders: [
      { id: folderElectronics, name: 'Electronics', storeId: DEMO_STORE_ABUJA, usesSubcategories: true },
      { id: folderLaptops, name: 'Laptops', storeId: DEMO_STORE_ABUJA, parentId: folderElectronics },
      {
        id: folderAccessories,
        name: 'Accessories',
        storeId: DEMO_STORE_ABUJA,
        parentId: folderElectronics,
      },
    ],
    items: [
      {
        id: 'item_abuja_hp',
        folderId: folderLaptops,
        storeId: DEMO_STORE_ABUJA,
        name: 'HP Laptop 15',
        price: 420000,
        unitCost: 340000,
        quantity: 3,
        sold: 0,
        sku: 'HP-15',
      },
      {
        id: 'item_abuja_earbuds',
        folderId: folderAccessories,
        storeId: DEMO_STORE_ABUJA,
        name: 'Wireless earbuds',
        price: 18500,
        quantity: 12,
        sold: 2,
        sku: 'BUD-01',
      },
    ],
    customers: [
      {
        id: 'cust_abuja_tunde',
        storeId: DEMO_STORE_ABUJA,
        name: 'Tunde Bello',
        phone: '0805 444 5566',
        totalOrders: 1,
        totalSpent: 265000,
      },
    ],
    receipts: [],
  }
}

function phStore(): DemoStoreRecord {
  const folderToyota = 'folder_ph_toyota'
  const folderFurniture = 'folder_ph_furniture'
  const folderAccessories = 'folder_ph_accessories'

  return {
    id: DEMO_STORE_PH,
    name: 'Port Harcourt, GRA',
    address: '8 Harold Wilson Drive, Port Harcourt',
    folders: [
      { id: folderToyota, name: 'Toyota', storeId: DEMO_STORE_PH, usesSubcategories: true },
      { id: 'folder_ph_corolla', name: 'Corolla', storeId: DEMO_STORE_PH, parentId: folderToyota },
      { id: 'folder_ph_camry', name: 'Camry', storeId: DEMO_STORE_PH, parentId: folderToyota },
      {
        id: 'folder_ph_highlander',
        name: 'Highlander',
        storeId: DEMO_STORE_PH,
        parentId: folderToyota,
      },
      { id: folderFurniture, name: 'Furniture', storeId: DEMO_STORE_PH, usesSubcategories: true },
      { id: 'folder_ph_chairs', name: 'Chairs', storeId: DEMO_STORE_PH, parentId: folderFurniture },
      {
        id: 'folder_ph_office_chairs',
        name: 'Office Chairs',
        storeId: DEMO_STORE_PH,
        parentId: folderFurniture,
      },
      { id: folderAccessories, name: 'Accessories', storeId: DEMO_STORE_PH },
    ],
    items: [
      {
        id: 'item_ph_corolla',
        folderId: 'folder_ph_corolla',
        storeId: DEMO_STORE_PH,
        name: 'Toyota Corolla 2022',
        price: 12500000,
        quantity: 2,
        sold: 0,
        sku: 'TOY-COR',
      },
      {
        id: 'item_ph_powerbank',
        folderId: folderAccessories,
        storeId: DEMO_STORE_PH,
        name: 'Power bank 20,000mAh',
        price: 22000,
        quantity: 8,
        sold: 1,
        sku: 'PB-20K',
      },
      {
        id: 'item_ph_cable',
        folderId: folderAccessories,
        storeId: DEMO_STORE_PH,
        name: 'USB-C cable 2m',
        price: 4500,
        quantity: 30,
        sold: 5,
        sku: 'CBL-2M',
      },
    ],
    customers: [
      {
        id: 'cust_ph_grace',
        storeId: DEMO_STORE_PH,
        name: 'Grace Etim',
        phone: '0807 222 3344',
        totalOrders: 1,
        totalSpent: 22000,
      },
    ],
    receipts: [],
  }
}

function seedReceipts(state: DemoState) {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const lagos = state.stores.find((s) => s.id === DEMO_STORE_LAGOS)!
  const abuja = state.stores.find((s) => s.id === DEMO_STORE_ABUJA)!

  lagos.receipts = [
    {
      id: 'rcpt_lagos_1',
      storeId: DEMO_STORE_LAGOS,
      receiptNumber: 'DEMO-1001',
      customerName: 'Ada Okonkwo',
      customerPhone: '0803 111 2233',
      date: new Date(now - day).toISOString(),
      items: [
        { itemId: 'item_lagos_iphone', itemName: 'iPhone 13 128GB', quantity: 1, price: 485000 },
      ],
      total: 485000,
      paymentMethod: 'Transfer',
      status: 'completed',
      folderId: 'folder_lagos_smartphones',
    },
    {
      id: 'rcpt_lagos_2',
      storeId: DEMO_STORE_LAGOS,
      receiptNumber: 'DEMO-1002',
      customerName: 'Walk-in customer',
      date: new Date(now - day * 0.2).toISOString(),
      items: [
        { itemId: 'item_lagos_case', itemName: 'Silicone phone case', quantity: 2, price: 8500 },
        { itemId: 'item_lagos_charger', itemName: '20W USB-C charger', quantity: 1, price: 12000 },
      ],
      total: 25000,
      paymentMethod: 'Cash',
      status: 'completed',
      folderId: 'folder_lagos_accessories',
    },
    {
      id: 'rcpt_lagos_3',
      storeId: DEMO_STORE_LAGOS,
      receiptNumber: 'DEMO-1003',
      customerName: 'Ada Okonkwo',
      customerPhone: '0803 111 2233',
      date: new Date(now - day * 4).toISOString(),
      items: [
        { itemId: 'item_lagos_samsung', itemName: 'Samsung A54', quantity: 1, price: 265000 },
      ],
      total: 265000,
      paymentMethod: 'Transfer',
      status: 'balance_due',
      amountPaid: 145000,
      balanceDue: 120000,
      folderId: 'folder_lagos_smartphones',
    },
    {
      id: 'rcpt_lagos_4',
      storeId: DEMO_STORE_LAGOS,
      receiptNumber: 'DEMO-1004',
      customerName: 'Walk-in customer',
      date: new Date(now - day * 6).toISOString(),
      items: [
        { itemId: 'item_lagos_case', itemName: 'Silicone phone case', quantity: 1, price: 8500 },
      ],
      total: 8500,
      paymentMethod: 'Cash',
      status: 'refunded',
      refundReason: 'Wrong color',
      folderId: 'folder_lagos_accessories',
    },
  ]

  abuja.receipts = [
    {
      id: 'rcpt_abuja_1',
      storeId: DEMO_STORE_ABUJA,
      receiptNumber: 'DEMO-2001',
      customerName: 'Tunde Bello',
      customerPhone: '0805 444 5566',
      date: new Date(now - day * 2).toISOString(),
      items: [{ itemId: 'item_abuja_hp', itemName: 'HP Laptop 15', quantity: 1, price: 420000 }],
      total: 420000,
      paymentMethod: 'Transfer',
      status: 'completed',
      folderId: 'folder_abuja_laptops',
    },
  ]
}

export function createDemoSeedState(): DemoState {
  const state: DemoState = {
    version: 7,
    currentStoreId: DEMO_STORE_LAGOS,
    currencyCode: 'NGN',
    currencySymbol: '₦',
    stores: [lagosStore(), abujaStore(), phStore()],
    transfers: [
      {
        id: 'xfer_demo_1',
        sourceStoreId: DEMO_STORE_LAGOS,
        destinationStoreId: DEMO_STORE_ABUJA,
        folderId: 'folder_lagos_accessories',
        destinationFolderId: 'folder_abuja_electronics',
        items: [{ itemId: 'item_lagos_charger', quantity: 2, itemName: '20W USB-C charger' }],
        itemsCount: 1,
        hasSerialNumbers: false,
        notes: 'Restock Abuja from Lagos warehouse',
        status: 'completed',
        createdBy: DEMO_USER_UID,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'xfer_demo_2',
        sourceStoreId: DEMO_STORE_PH,
        destinationStoreId: DEMO_STORE_LAGOS,
        folderId: 'folder_ph_accessories',
        destinationFolderId: 'folder_lagos_accessories',
        items: [{ itemId: 'item_ph_cable', quantity: 5, itemName: 'USB-C cable 2m' }],
        itemsCount: 1,
        hasSerialNumbers: false,
        notes: 'Pending approval',
        status: 'pending_approval',
        createdBy: DEMO_USER_UID,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ],
  }
  seedReceipts(state)
  return state
}

export function nextDemoReceiptNumber(receipts: DemoReceipt[]): string {
  const nums = receipts
    .map((r) => r.receiptNumber.match(/DEMO-(\d+)/))
    .filter(Boolean)
    .map((m) => Number(m![1]))
  const next = (nums.length ? Math.max(...nums) : 1000) + 1
  return `DEMO-${next}`
}

export { id as demoId }
