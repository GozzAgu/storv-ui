import type { SalesLead } from '~/types/leads'
import { isOpenSalesLeadStatus } from '~/types/leads'

function normalizePhone(value: string | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

function normalizeEmail(value: string | undefined): string {
  return (value || '').trim().toLowerCase()
}

/** Find an open lead with the same phone or email (ignoring self when editing). */
export function findDuplicateOpenLead(
  leads: SalesLead[],
  params: { phone?: string; email?: string; excludeLeadId?: string }
): SalesLead | null {
  const phoneNorm = normalizePhone(params.phone)
  const emailNorm = normalizeEmail(params.email)
  if (!phoneNorm && !emailNorm) return null

  for (const lead of leads) {
    if (params.excludeLeadId && lead.id === params.excludeLeadId) continue
    if (!isOpenSalesLeadStatus(lead.status)) continue

    if (phoneNorm && normalizePhone(lead.customerPhone) === phoneNorm) return lead
    if (emailNorm && normalizeEmail(lead.customerEmail) === emailNorm) return lead
  }

  return null
}
