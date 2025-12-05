export interface Store {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  ownerId: string // Super admin UID who owns this store
  isActive: boolean
  createdAt: any
  updatedAt?: any
}

export interface StoreWithStats extends Store {
  staffCount?: number
  departmentsCount?: number
  receiptsCount?: number
  inventoryItemsCount?: number
}
