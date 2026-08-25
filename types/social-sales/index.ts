/** Platform attribution for social sales leads and revenue reporting. */
export type SocialSalesPlatform = 'whatsapp' | 'instagram' | 'walk_in' | 'referral' | 'other'

export type SocialLeadStatus =
  | 'new'
  | 'contacted'
  | 'negotiating'
  | 'payment_pending'
  | 'won'
  | 'lost'

export type SocialEventType =
  | 'status_change'
  | 'note'
  | 'customer_linked'
  | 'converted_to_sale'
  | 'created'

export interface SocialLead {
  id: string
  storeId: string
  customerId?: string
  customerName: string
  customerPhone?: string
  instagramUsername?: string
  whatsappNumber?: string
  platform: SocialSalesPlatform
  productId?: string
  productName: string
  estimatedValue: number
  /** Revenue recorded when lead is won (mock until receipt link in Phase 5). */
  wonRevenue?: number
  status: SocialLeadStatus
  assignedTo?: string
  assignedToName?: string
  notes?: string
  source: SocialSalesPlatform
  receiptId?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface SocialEvent {
  id: string
  leadId: string
  type: SocialEventType
  description: string
  createdBy: string
  createdByName?: string
  timestamp: Date
}

export const SOCIAL_LEAD_STATUSES: Array<{ value: SocialLeadStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

export const SOCIAL_SALES_PLATFORMS: Array<{ value: SocialSalesPlatform; label: string }> = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
]

export function socialPlatformLabel(platform: SocialSalesPlatform): string {
  return SOCIAL_SALES_PLATFORMS.find((p) => p.value === platform)?.label ?? platform
}

export function socialLeadStatusLabel(status: SocialLeadStatus): string {
  return SOCIAL_LEAD_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function isSocialLeadClosed(status: SocialLeadStatus): boolean {
  return status === 'won' || status === 'lost'
}
