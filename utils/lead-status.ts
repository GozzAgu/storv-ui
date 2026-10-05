import type { SalesLeadStatus } from '~/types/leads'

export type LeadStatusTone = 'info' | 'accent' | 'warning' | 'success' | 'error'

/** SBadge tone for a lead status: open stages move from info to warning, then won or lost. */
export function leadStatusTone(status: SalesLeadStatus): LeadStatusTone {
  switch (status) {
    case 'new':
      return 'info'
    case 'contacted':
      return 'accent'
    case 'negotiating':
      return 'warning'
    case 'won':
      return 'success'
    case 'lost':
      return 'error'
  }
}
