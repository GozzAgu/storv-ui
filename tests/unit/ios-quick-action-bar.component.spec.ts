import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import IosQuickActionBar, {
  type IosQuickActionOption,
} from '~/components/ios/IosQuickActionBar.vue'

vi.mock('~/composables/useIosHaptics', () => ({
  useIosHaptics: () => ({
    impact: vi.fn(),
    selection: vi.fn(),
    notify: vi.fn(),
  }),
}))

function labelsFor(options: IosQuickActionOption[]) {
  const wrapper = mount(IosQuickActionBar, {
    props: { options, ariaLabel: 'Actions', modelValue: 'all' },
  })
  const tabLabels = wrapper
    .findAll('.ios-quick-actions__label')
    .map((node) => node.text())
  const actionLabels = wrapper
    .findAll('.ios-quick-actions__action-label')
    .map((node) => node.text())
  wrapper.unmount()
  return [...tabLabels, ...actionLabels]
}

describe('IosQuickActionBar trailing actions', () => {
  it('puts the create action last and the overflow menu just before it', () => {
    expect(
      labelsFor([
        { value: 'new', label: 'New', trailing: 'add' },
        { value: 'more', label: 'More', trailing: 'more' },
        { value: 'all', label: 'All' },
        { value: 'low', label: 'Low stock' },
      ])
    ).toEqual(['All', 'Low stock', 'More', 'New'])
  })

  it('leaves untagged options in the order the page declared them', () => {
    expect(
      labelsFor([
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ])
    ).toEqual(['All', 'Active', 'Inactive'])
  })

  it('keeps the create action last when a screen has no overflow menu', () => {
    expect(
      labelsFor([
        { value: 'add', label: 'Add', trailing: 'add' },
        { value: 'list', label: 'Leads' },
      ])
    ).toEqual(['Leads', 'Add'])
  })

  it('keeps action-only buttons outside the tab underline track', () => {
    const wrapper = mount(IosQuickActionBar, {
      props: {
        ariaLabel: 'Sales',
        modelValue: 'receipts',
        options: [
          { value: 'receipts', label: 'Sales' },
          { value: 'customers', label: 'Customers' },
          { value: 'quick', label: 'Quick', action: () => undefined },
          { value: 'new', label: 'New sale', trailing: 'add', action: () => undefined },
        ],
      },
    })
    expect(wrapper.findAll('.ios-quick-actions__scroll .ios-quick-actions__label').map((n) => n.text())).toEqual([
      'Sales',
      'Customers',
    ])
    expect(wrapper.findAll('.ios-quick-actions__action-label').map((n) => n.text())).toEqual([
      'Quick',
      'New sale',
    ])
    wrapper.unmount()
  })
})
