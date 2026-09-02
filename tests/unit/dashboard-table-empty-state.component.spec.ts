import { describe, expect, it } from 'vitest'
import { defineComponent, markRaw } from 'vue'
import { mount } from '@vue/test-utils'
import DashboardTableEmptyState from '~/components/dashboard/DashboardTableEmptyState.vue'

const StubIcon = markRaw(
  defineComponent({
    name: 'StubIcon',
    template: '<svg data-testid="empty-icon" />',
  })
)

describe('DashboardTableEmptyState', () => {
  it('renders a mark, title, description, tips, and action slot', () => {
    const wrapper = mount(DashboardTableEmptyState, {
      props: {
        icon: StubIcon,
        title: 'No categories yet',
        description: 'Create a category to group products.',
        tips: ['Open a category to add products', 'Use departments to control access'],
        eyebrow: 'Inventory',
      },
      slots: {
        default: '<button type="button">New category</button>',
      },
    })

    expect(wrapper.classes()).toContain('dash-empty-state')
    expect(wrapper.find('.dash-empty-state__mark').exists()).toBe(true)
    expect(wrapper.find('[data-testid="empty-icon"]').exists()).toBe(true)
    expect(wrapper.find('.dash-empty-state__eyebrow').text()).toBe('Inventory')
    expect(wrapper.find('.dash-empty-state__title').text()).toBe('No categories yet')
    expect(wrapper.find('.dash-empty-state__desc').text()).toContain('Create a category')
    expect(wrapper.findAll('.dash-empty-state__tip')).toHaveLength(2)
    expect(wrapper.find('.dash-empty-state__actions').text()).toBe('New category')

    wrapper.unmount()
  })
})
