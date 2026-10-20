import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import LoyaltyTopCustomersList from '~/components/loyalty/LoyaltyTopCustomersList.vue'

vi.stubGlobal('usePreferences', () => ({ formatCurrency: (n: number) => `₦${n}` }))

const member = (key: string, name: string, tier: string, points: number) => ({
  key,
  name,
  phone: null,
  email: null,
  points,
  spend12m: 1000,
  tier: { id: tier, name: tier[0]!.toUpperCase() + tier.slice(1), multiplier: 1 },
})

describe('LoyaltyTopCustomersList', () => {
  it('shows rank, a labelled tier icon, tier and spend, and points for each customer', () => {
    const w = mount(LoyaltyTopCustomersList, {
      props: {
        members: [member('a', 'Lara', 'gold', 1800), member('b', 'Kunle', 'bronze', 9)] as never,
      },
    })
    const items = w.findAll('li')
    expect(items).toHaveLength(2)
    expect(items[0]!.find('.s-loyalty-top__rank').text()).toBe('1')
    expect(items[0]!.find('.s-tier-badge').attributes('aria-label')).toBe('Gold tier')
    expect(items[0]!.find('.s-loyalty-top__meta').text()).toBe('Gold · ₦1000')
    expect(items[0]!.find('.s-loyalty-top__points').text()).toBe('1,800pts')
    expect(items[1]!.find('.s-tier-badge').attributes('aria-label')).toBe('Bronze tier')
  })

  it('shows only the top 5, each with the icon for its tier', () => {
    const tiers = ['diamond', 'platinum', 'gold', 'silver', 'bronze', 'bronze']
    const w = mount(LoyaltyTopCustomersList, {
      props: { members: tiers.map((t, i) => member(String(i), `C${i}`, t, 10 - i)) as never },
    })
    const badges = w.findAll('li .s-tier-badge')
    expect(badges).toHaveLength(5)
    expect(badges.map((b) => b.attributes('aria-label'))).toEqual([
      'Diamond tier',
      'Platinum tier',
      'Gold tier',
      'Silver tier',
      'Bronze tier',
    ])
    // A line icon in the tier's colour, not an emoji.
    expect(badges.every((b) => b.find('svg').exists() && b.text() === '')).toBe(true)
    expect(badges.map((b) => b.attributes('style'))).toEqual(
      ['diamond', 'platinum', 'gold', 'silver', 'bronze'].map((t) =>
        expect.stringContaining(`--tier: var(--s-tier-${t})`)
      )
    )
    expect(badges[0]!.attributes('style')).toContain('width: 22px')
  })
})
