import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DashTableSkeleton from '~/components/ui/DashTableSkeleton.vue'

describe('DashTableSkeleton', () => {
  it('renders the real column headers that will appear after load', () => {
    const wrapper = mount(DashTableSkeleton, {
      props: {
        columns: [
          { label: 'Customer', lines: 2 },
          { label: 'Product' },
          { label: 'Status', class: 'dashboard-table__col-status', bone: '4rem' },
        ],
        rows: 3,
        leading: 'none',
        flush: true,
        ariaLabel: 'Loading leads',
      },
    })

    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).toEqual(['Customer', 'Product', 'Status'])
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.attributes('aria-busy')).toBe('true')

    wrapper.unmount()
  })

  it('uses an avatar mark on the first column when leading is avatar', () => {
    const wrapper = mount(DashTableSkeleton, {
      props: {
        columns: [{ label: 'User' }, { label: 'When', bone: '4rem' }],
        rows: 1,
        leading: 'avatar',
        leadingMeta: false,
        flush: true,
      },
    })

    expect(wrapper.find('.dash-skeleton--avatar').exists()).toBe(true)
    expect(wrapper.find('.dash-skeleton--thumb').exists()).toBe(false)

    wrapper.unmount()
  })
})
