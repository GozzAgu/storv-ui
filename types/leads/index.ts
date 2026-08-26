export type SalesLeadStatus = 'new' | 'contacted' | 'negotiating' | 'won' | 'lost'

export type SalesLeadSource = 'walk_in' | 'phone' | 'whatsapp' | 'referral' | 'other'

export type SalesLeadEventType = 'status_change' | 'note' | 'converted' | 'lost'

export interface SalesLead {
  id: string
  storeId: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  productName: string
  /** Optional link to inventory so convert pre-selects the SKU. */
  inventoryItemId?: string
  estimatedValue?: number
  status: SalesLeadStatus
  source: SalesLeadSource
  notes?: string
  assignedTo?: string
  receiptId?: string
  wonRevenue?: number
  lostReason?: string
  createdBy: string
  createdAt?: Date
  updatedAt?: Date
}

export interface SalesLeadEvent {
  id: string
  storeId: string
  leadId: string
  type: SalesLeadEventType
  description: string
  createdBy: string
  createdAt?: Date
}

export const SALES_LEAD_STATUSES: SalesLeadStatus[] = [
  'new',
  'contacted',
  'negotiating',
  'won',
  'lost',
]

export const SALES_LEAD_SOURCES: SalesLeadSource[] = [
  'walk_in',
  'phone',
  'whatsapp',
  'referral',
  'other',
]

export const SALES_LEAD_STATUS_LABELS: Record<SalesLeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  won: 'Won',
  lost: 'Lost',
}

export const SALES_LEAD_SOURCE_LABELS: Record<SalesLeadSource, string> = {
  walk_in: 'Walk-in',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  other: 'Other',
}

export function isOpenSalesLeadStatus(status: SalesLeadStatus): boolean {
  return status !== 'won' && status !== 'lost'
}
