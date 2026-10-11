import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SubscriptionPlanPanel from '~/components/settings/SubscriptionPlanPanel.vue'
import { webBillingUrl } from '~/utils/web-billing'

vi.stubGlobal('usePreferences', () => ({ formatCurrency: (n: number) => `₦${n}` }))

const baseProps = {
  currentSubscriptionLabel: 'Enterprise',
  billingCycleLabel: 'Monthly',
  currentPriceLabel: '₦25,000',
  statusLabel: 'Active',
  subscriptionRenewalLabel: null,
  selectedBillingCycle: 'monthly' as const,
  selectedUpgradePlan: 'storvv_medium' as const,
  changePlanOptions: [
    { id: 'storvv_medium' as const, name: 'Medium', direction: 'downgrade' as const },
  ],
  upgradePricePreview: null,
  pricingLoading: false,
  canCancel: true,
  disabled: false,
  isUpgrading: false,
  isCanceling: false,
  billingHistory: [],
  addOnsAvailable: true,
  addOns: [{ id: 'ao1', label: 'Extra store', detail: '₦5,000 / month', canCancel: true }],
  addOnStoreOptions: [{ value: 's1', label: 'Main' }],
}

function mountPanel(manageOnWeb: boolean) {
  return mount(SubscriptionPlanPanel, {
    props: { ...baseProps, manageOnWeb },
    global: {
      stubs: {
        SCard: { template: '<section><slot /><slot name="footer" /></section>' },
        SBadge: { template: '<span><slot /></span>' },
        SSelect: { props: ['label'], template: '<label>{{ label }}</label>' },
        SButton: { template: '<button><slot /></button>' },
        GrowthSupportLink: { template: '<a />' },
      },
    },
  })
}

const buttons = (wrapper: ReturnType<typeof mountPanel>) =>
  wrapper.findAll('button').map((b) => b.text())

describe('SubscriptionPlanPanel', () => {
  it('lets owners on the web switch plan and buy add-ons', () => {
    const wrapper = mountPanel(false)
    expect(buttons(wrapper)).toEqual(
      expect.arrayContaining(['Downgrade', 'Add a store', 'Add seat', 'Remove'])
    )
    expect(buttons(wrapper)).not.toContain('Open Storvv website')
  })

  it('in the iOS app, sends plan changes and add-on purchases to the website', async () => {
    const wrapper = mountPanel(true)
    const labels = buttons(wrapper)
    expect(labels).toContain('Open Storvv website')
    expect(labels).not.toContain('Downgrade')
    expect(labels).not.toContain('Add a store')
    expect(labels).not.toContain('Add seat')
    expect(labels).toEqual(expect.arrayContaining(['Remove', 'Cancel auto-renew']))

    const open = wrapper.findAll('button').find((b) => b.text() === 'Open Storvv website')!
    await open.trigger('click')
    expect(wrapper.emitted('manage-on-web')).toHaveLength(1)
  })
})

describe('webBillingUrl', () => {
  it('points at Plan & billing on the configured https origin', () => {
    expect(webBillingUrl('https://app.storvv.com/')).toBe(
      'https://app.storvv.com/dashboard/settings?tab=account#settings-subscription'
    )
  })

  it('falls back to app.storvv.com for a missing or non-https origin', () => {
    for (const origin of [undefined, '', 'http://evil.test', 'capacitor://localhost']) {
      expect(webBillingUrl(origin)).toBe(
        'https://app.storvv.com/dashboard/settings?tab=account#settings-subscription'
      )
    }
  })
})
