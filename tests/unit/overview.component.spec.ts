import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import OverviewAttention from '~/components/overview/OverviewAttention.vue'
import SStat from '~/components/s/SStat.vue'
import type { DashboardAlert } from '~/composables/useDashboardInsights'

const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () => h('a', { href: String(props.to) }, slots.default?.())
  },
})

const global = { components: { NuxtLink: NuxtLinkStub } }

describe('OverviewAttention', () => {
  it('lists each alert as a link with its level and call to action', () => {
    const items: DashboardAlert[] = [
      {
        id: 'low-stock',
        level: 'warning',
        title: 'Low stock',
        description: '3 lines need restocking.',
        href: '/dashboard/inventory',
        cta: 'View inventory',
      },
      {
        id: 'failed',
        level: 'critical',
        title: 'Failed payment links',
        description: '1 link failed to collect.',
        href: '/dashboard/payment-links',
        cta: 'Review links',
      },
    ]
    const wrapper = mount(OverviewAttention, { props: { items }, global })

    const links = wrapper.findAll('a')
    expect(links).toHaveLength(2)
    expect(links[0]!.attributes('href')).toBe('/dashboard/inventory')
    expect(links[0]!.text()).toContain('3 lines need restocking.')
    expect(links[0]!.text()).toContain('View inventory')
    expect(links[1]!.find('.s-overview-attention__mark--critical').exists()).toBe(true)
  })

  it('shows an all-clear message when nothing needs attention', () => {
    const wrapper = mount(OverviewAttention, { props: { items: [] }, global })

    expect(wrapper.findAll('a')).toHaveLength(0)
    expect(wrapper.text()).toContain('All clear')
  })
})

describe('SStat', () => {
  it('links when given a destination and colours the hint by tone', () => {
    const wrapper = mount(SStat, {
      props: { label: 'Low stock', value: 4, hint: 'Review restocking', tone: 'warning', to: '/x' },
      global,
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.find('.s-stat__hint--warning').text()).toBe('Review restocking')
  })

  it('announces the direction of a negative delta', () => {
    const wrapper = mount(SStat, { props: { label: 'Revenue', value: '₦10', delta: -12.4 }, global })

    expect(wrapper.find('.s-stat__delta--down').text()).toContain('Down')
    expect(wrapper.find('.s-stat__delta--down').text()).toContain('-12%')
  })
})
