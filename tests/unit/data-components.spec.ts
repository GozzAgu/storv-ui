import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SSearch from '~/components/s/SSearch.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSortHeader from '~/components/s/SSortHeader.vue'
import { getReceiptStatusTone } from '~/utils/receipt-status'

describe('SSearch', () => {
  it('sizes the field wrapper and forwards other attributes to the input', () => {
    const wrapper = mount(SSearch, {
      props: { modelValue: '' },
      attrs: { class: 's-toolbar__search', name: 'q' },
    })
    expect(wrapper.classes()).toContain('s-toolbar__search')
    expect(wrapper.get('input').classes()).not.toContain('s-toolbar__search')
    expect(wrapper.get('input').attributes('name')).toBe('q')
  })

  it('shows a clear button only when there is a query', async () => {
    const wrapper = mount(SSearch, { props: { modelValue: 'rice' } })
    await wrapper.get('button[aria-label="Clear search"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })
})

describe('SPagination', () => {
  it('summarises the range and moves between pages', async () => {
    const wrapper = mount(SPagination, { props: { currentPage: 2, total: 250, pageSize: 100 } })
    expect(wrapper.text()).toContain('101–200 of 250')
    expect(wrapper.text()).toContain('Page 2 of 3')
    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    expect(wrapper.emitted('page-change')?.[0]).toEqual([3])
  })

  it('hides itself when everything fits on one page', () => {
    const wrapper = mount(SPagination, { props: { currentPage: 1, total: 12, pageSize: 100 } })
    expect(wrapper.find('nav').exists()).toBe(false)
  })
})

describe('SSortHeader', () => {
  it('marks the active column and emits sort', async () => {
    const wrapper = mount(SSortHeader, { props: { label: 'Total', direction: 'desc' } })
    expect(wrapper.classes()).toContain('s-sort--active')
    await wrapper.trigger('click')
    expect(wrapper.emitted('sort')).toHaveLength(1)
  })
})

describe('getReceiptStatusTone', () => {
  it('maps receipt statuses to badge tones', () => {
    expect(getReceiptStatusTone('completed')).toBe('success')
    expect(getReceiptStatusTone('balance_due')).toBe('warning')
    expect(getReceiptStatusTone('refunded')).toBe('error')
    expect(getReceiptStatusTone('cancelled')).toBe('neutral')
  })
})
