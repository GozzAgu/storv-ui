import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MkTour from '~/components/marketing/MkTour.vue'

function mountTour() {
  return mount(MkTour, {
    attachTo: document.body,
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        SButton: { template: '<a><slot /><slot name="trailing" /></a>' },
        MkFrame: {
          props: ['src', 'alt', 'url'],
          template: '<img class="shot" :src="src" :alt="alt" />',
        },
      },
    },
  })
}

const selected = (wrapper: ReturnType<typeof mountTour>) =>
  wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-selected'))

describe('MkTour', () => {
  it('starts on inventory and links the panel to the active tab', () => {
    const wrapper = mountTour()
    expect(selected(wrapper)).toEqual(['true', 'false', 'false'])
    expect(wrapper.find('[role="tabpanel"]').attributes('aria-labelledby')).toBe(
      'mk-tour-tab-inventory'
    )
    expect(wrapper.find('.shot').attributes('src')).toBe('/marketing/app/inventory.webp')
    wrapper.unmount()
  })

  it('swaps the photo, screenshot and points when a tab is clicked', async () => {
    const wrapper = mountTour()
    await wrapper.find('#mk-tour-tab-sales').trigger('click')
    expect(selected(wrapper)).toEqual(['false', 'true', 'false'])
    expect(wrapper.find('.mk-tour__photo').attributes('src')).toBe('/marketing/tour-counter.webp')
    expect(wrapper.find('.shot').attributes('src')).toBe('/marketing/app/sales.webp')
    expect(wrapper.find('.mk-tour__points').text()).toContain('WhatsApp receipts')
    wrapper.unmount()
  })

  it('moves between tabs with arrow keys, Home and End, and keeps roving focus', async () => {
    const wrapper = mountTour()
    const tablist = wrapper.find('[role="tablist"]')

    await tablist.trigger('keydown', { key: 'ArrowDown' })
    expect(selected(wrapper)).toEqual(['false', 'true', 'false'])
    expect(document.activeElement?.id).toBe('mk-tour-tab-sales')

    await tablist.trigger('keydown', { key: 'End' })
    expect(selected(wrapper)).toEqual(['false', 'false', 'true'])

    await tablist.trigger('keydown', { key: 'ArrowRight' })
    expect(selected(wrapper)).toEqual(['true', 'false', 'false'])

    await tablist.trigger('keydown', { key: 'ArrowUp' })
    expect(selected(wrapper)).toEqual(['false', 'false', 'true'])

    await tablist.trigger('keydown', { key: 'Home' })
    expect(selected(wrapper)).toEqual(['true', 'false', 'false'])
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
    ])
    wrapper.unmount()
  })
})
