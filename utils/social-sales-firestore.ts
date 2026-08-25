import type {
  SocialEvent,
  SocialEventType,
  SocialLead,
  SocialLeadStatus,
  SocialSalesPlatform,
} from '~/types/social-sales'

const PLATFORMS: SocialSalesPlatform[] = ['whatsapp', 'instagram', 'walk_in', 'referral', 'other']
const STATUSES: SocialLeadStatus[] = [
  'new',
  'contacted',
  'negotiating',
  'payment_pending',
  'won',
  'lost',
]
const EVENT_TYPES: SocialEventType[] = [
  'status_change',
  'note',
  'customer_linked',
  'converted_to_sale',
  'created',
]

export function snapshotToDate(v: unknown): Date {
  if (
    v &&
    typeof v === 'object' &&
    'toDate' in v &&
    typeof (v as { toDate: () => Date }).toDate === 'function'
  ) {
    return (v as { toDate: () => Date }).toDate()
  }
  if (v instanceof Date) return v
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    if (Number.isFinite(d.getTime())) return d
  }
  return new Date()
}

function asPlatform(v: unknown): SocialSalesPlatform {
  return PLATFORMS.includes(v as SocialSalesPlatform) ? (v as SocialSalesPlatform) : 'other'
}

function asStatus(v: unknown): SocialLeadStatus {
  return STATUSES.includes(v as SocialLeadStatus) ? (v as SocialLeadStatus) : 'new'
}

function asEventType(v: unknown): SocialEventType {
  return EVENT_TYPES.includes(v as SocialEventType) ? (v as SocialEventType) : 'note'
}

export function mapSocialLeadDoc(id: string, data: Record<string, unknown>): SocialLead {
  return {
    id,
    storeId: (data.storeId as string) || '',
    customerId: typeof data.customerId === 'string' ? data.customerId : undefined,
    customerName: (data.customerName as string) || 'Unknown',
    customerPhone: typeof data.customerPhone === 'string' ? data.customerPhone : undefined,
    instagramUsername:
      typeof data.instagramUsername === 'string' ? data.instagramUsername : undefined,
    whatsappNumber: typeof data.whatsappNumber === 'string' ? data.whatsappNumber : undefined,
    platform: asPlatform(data.platform),
    productId: typeof data.productId === 'string' ? data.productId : undefined,
    productName: (data.productName as string) || '',
    estimatedValue: Number(data.estimatedValue) || 0,
    wonRevenue: data.wonRevenue != null ? Number(data.wonRevenue) : undefined,
    status: asStatus(data.status),
    assignedTo: typeof data.assignedTo === 'string' ? data.assignedTo : undefined,
    assignedToName: typeof data.assignedToName === 'string' ? data.assignedToName : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    source: asPlatform(data.source ?? data.platform),
    receiptId: typeof data.receiptId === 'string' ? data.receiptId : undefined,
    createdAt: snapshotToDate(data.createdAt),
    updatedAt: snapshotToDate(data.updatedAt),
    createdBy: (data.createdBy as string) || '',
  }
}

export function mapSocialEventDoc(id: string, data: Record<string, unknown>): SocialEvent {
  return {
    id,
    leadId: (data.leadId as string) || '',
    type: asEventType(data.type),
    description: (data.description as string) || '',
    createdBy: (data.createdBy as string) || '',
    createdByName: typeof data.createdByName === 'string' ? data.createdByName : undefined,
    timestamp: snapshotToDate(data.timestamp ?? data.createdAt),
  }
}

export function socialLeadToFirestore(
  lead: Partial<SocialLead> & { storeId: string; createdBy: string }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    storeId: lead.storeId,
    customerName: lead.customerName ?? '',
    platform: lead.platform ?? 'other',
    productName: lead.productName ?? '',
    estimatedValue: Number(lead.estimatedValue) || 0,
    status: lead.status ?? 'new',
    source: lead.source ?? lead.platform ?? 'other',
    createdBy: lead.createdBy,
  }
  if (lead.customerId) payload.customerId = lead.customerId
  if (lead.customerPhone) payload.customerPhone = lead.customerPhone
  if (lead.instagramUsername) payload.instagramUsername = lead.instagramUsername
  if (lead.whatsappNumber) payload.whatsappNumber = lead.whatsappNumber
  if (lead.productId) payload.productId = lead.productId
  if (lead.assignedTo) payload.assignedTo = lead.assignedTo
  if (lead.assignedToName) payload.assignedToName = lead.assignedToName
  if (lead.notes) payload.notes = lead.notes
  if (lead.wonRevenue != null) payload.wonRevenue = lead.wonRevenue
  if (lead.receiptId) payload.receiptId = lead.receiptId
  return payload
}
