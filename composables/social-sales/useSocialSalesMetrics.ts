import type { SocialLead, SocialSalesPlatform } from '~/types/social-sales'
import { isSocialLeadClosed } from '~/types/social-sales'

export interface SocialSalesDashboardMetrics {
  totalLeads: number
  whatsappLeads: number
  instagramLeads: number
  wonLeads: number
  lostLeads: number
  conversionRate: number
  revenueWhatsapp: number
  revenueInstagram: number
  revenueWalkIn: number
}

function leadRevenue(lead: SocialLead): number {
  if (lead.status !== 'won') return 0
  return lead.wonRevenue ?? lead.estimatedValue
}

function platformRevenue(leads: SocialLead[], platform: SocialSalesPlatform): number {
  return leads
    .filter((l) => l.platform === platform && l.status === 'won')
    .reduce((sum, l) => sum + leadRevenue(l), 0)
}

export function computeSocialSalesDashboardMetrics(leads: SocialLead[]): SocialSalesDashboardMetrics {
  const openLeads = leads.filter((l) => !isSocialLeadClosed(l.status))
  const wonLeads = leads.filter((l) => l.status === 'won')
  const lostLeads = leads.filter((l) => l.status === 'lost')
  const closedCount = wonLeads.length + lostLeads.length

  return {
    totalLeads: leads.length,
    whatsappLeads: leads.filter((l) => l.platform === 'whatsapp').length,
    instagramLeads: leads.filter((l) => l.platform === 'instagram').length,
    wonLeads: wonLeads.length,
    lostLeads: lostLeads.length,
    conversionRate: closedCount > 0 ? Math.round((wonLeads.length / closedCount) * 1000) / 10 : 0,
    revenueWhatsapp: platformRevenue(leads, 'whatsapp'),
    revenueInstagram: platformRevenue(leads, 'instagram'),
    revenueWalkIn: platformRevenue(leads, 'walk_in'),
    // openLeads reserved for future KPI
    ...(openLeads.length >= 0 ? {} : {}),
  }
}

export interface SocialSalesAnalytics {
  leadsByPlatform: Array<{ platform: SocialSalesPlatform; count: number }>
  salesByPlatform: Array<{ platform: SocialSalesPlatform; count: number }>
  revenueByPlatform: Array<{ platform: SocialSalesPlatform; revenue: number }>
  monthlyConversion: Array<{ month: string; rate: number; won: number; lost: number }>
  topProducts: Array<{ productName: string; count: number; revenue: number }>
}

const PLATFORMS: SocialSalesPlatform[] = ['whatsapp', 'instagram', 'walk_in', 'referral', 'other']

export function computeSocialSalesAnalytics(leads: SocialLead[]): SocialSalesAnalytics {
  const leadsByPlatform = PLATFORMS.map((platform) => ({
    platform,
    count: leads.filter((l) => l.platform === platform).length,
  })).filter((row) => row.count > 0)

  const won = leads.filter((l) => l.status === 'won')
  const salesByPlatform = PLATFORMS.map((platform) => ({
    platform,
    count: won.filter((l) => l.platform === platform).length,
  })).filter((row) => row.count > 0)

  const revenueByPlatform = PLATFORMS.map((platform) => ({
    platform,
    revenue: platformRevenue(leads, platform),
  })).filter((row) => row.revenue > 0)

  const monthMap = new Map<string, { won: number; lost: number }>()
  for (const lead of leads) {
    if (lead.status !== 'won' && lead.status !== 'lost') continue
    const key = lead.updatedAt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const entry = monthMap.get(key) ?? { won: 0, lost: 0 }
    if (lead.status === 'won') entry.won += 1
    else entry.lost += 1
    monthMap.set(key, entry)
  }

  const monthlyConversion = [...monthMap.entries()]
    .map(([month, { won: w, lost: l }]) => ({
      month,
      won: w,
      lost: l,
      rate: w + l > 0 ? Math.round((w / (w + l)) * 1000) / 10 : 0,
    }))
    .slice(-6)

  const productMap = new Map<string, { count: number; revenue: number }>()
  for (const lead of won.filter((l) => ['whatsapp', 'instagram'].includes(l.platform))) {
    const key = lead.productName
    const entry = productMap.get(key) ?? { count: 0, revenue: 0 }
    entry.count += 1
    entry.revenue += leadRevenue(lead)
    productMap.set(key, entry)
  }

  const topProducts = [...productMap.entries()]
    .map(([productName, stats]) => ({ productName, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    leadsByPlatform,
    salesByPlatform,
    revenueByPlatform,
    monthlyConversion,
    topProducts,
  }
}
