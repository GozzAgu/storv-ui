import { describe, expect, it } from 'vitest'
import {
  computeSocialSalesAnalytics,
  computeSocialSalesDashboardMetrics,
} from '~/composables/social-sales/useSocialSalesMetrics'
import { mapSocialLeadDoc } from '~/utils/social-sales-firestore'
import type { SocialLead } from '~/types/social-sales'

const sampleLeads: SocialLead[] = [
  {
    id: '1',
    storeId: 's1',
    customerName: 'Ada',
    platform: 'whatsapp',
    productName: 'iPhone',
    estimatedValue: 100000,
    wonRevenue: 95000,
    status: 'won',
    source: 'whatsapp',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-12'),
    createdBy: 'u1',
  },
  {
    id: '2',
    storeId: 's1',
    customerName: 'Chi',
    platform: 'instagram',
    productName: 'MacBook',
    estimatedValue: 200000,
    status: 'lost',
    source: 'instagram',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-09'),
    createdBy: 'u1',
  },
  {
    id: '3',
    storeId: 's1',
    customerName: 'Walk',
    platform: 'walk_in',
    productName: 'Watch',
    estimatedValue: 50000,
    wonRevenue: 48000,
    status: 'won',
    source: 'walk_in',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-06'),
    createdBy: 'u1',
  },
]

describe('social-sales mappers', () => {
  it('maps Firestore lead documents', () => {
    const lead = mapSocialLeadDoc('abc', {
      storeId: 'store-1',
      customerName: 'Test User',
      platform: 'whatsapp',
      productName: 'Phone',
      estimatedValue: 5000,
      status: 'new',
      source: 'whatsapp',
      createdBy: 'uid-1',
    })
    expect(lead.id).toBe('abc')
    expect(lead.platform).toBe('whatsapp')
    expect(lead.estimatedValue).toBe(5000)
  })
})

describe('social-sales metrics', () => {
  it('computes dashboard KPIs', () => {
    const m = computeSocialSalesDashboardMetrics(sampleLeads)
    expect(m.totalLeads).toBe(3)
    expect(m.wonLeads).toBe(2)
    expect(m.lostLeads).toBe(1)
    expect(m.conversionRate).toBe(66.7)
    expect(m.revenueWhatsapp).toBe(95000)
    expect(m.revenueWalkIn).toBe(48000)
  })

  it('computes analytics breakdowns', () => {
    const a = computeSocialSalesAnalytics(sampleLeads)
    expect(a.leadsByPlatform.find((r) => r.platform === 'whatsapp')?.count).toBe(1)
    expect(a.topProducts.length).toBeGreaterThan(0)
  })
})
