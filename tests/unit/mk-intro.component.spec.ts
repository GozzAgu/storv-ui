import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MkIntro from '~/components/marketing/MkIntro.vue'

function mountIntro() {
  return mount(MkIntro, {
    attachTo: document.body,
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        Transition: { template: '<slot />' },
      },
    },
  })
}

const selected = (wrapper: ReturnType<typeof mountIntro>) =>
  wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-selected'))

const only = (index: number) => [0, 1, 2, 3, 4].map((i) => String(i === index))

describe('MkIntro', () => {
  it('opens on gadget stores and links the panel to the active tab', () => {
    const wrapper = mountIntro()
    expect(selected(wrapper)).toEqual(only(0))
    expect(wrapper.find('[role="tabpanel"]').attributes('aria-labelledby')).toBe('mku-tab-gadgets')
    expect(wrapper.find('.mku__title').text()).toBe('Every phone, by IMEI')
    wrapper.unmount()
  })

  it('swaps the copy and photo when a tab is clicked', async () => {
    const wrapper = mountIntro()
    await wrapper.find('#mku-tab-supermarkets').trigger('click')
    expect(selected(wrapper)).toEqual(only(2))
    expect(wrapper.find('.mku__title').text()).toBe('Fast checkout, full shelves')
    expect(wrapper.find('.mku__photo').attributes('src')).toBe('/marketing/people/supermarket.webp')
    wrapper.unmount()
  })

  it('moves between tabs with arrow keys, Home and End, and keeps roving focus', async () => {
    const wrapper = mountIntro()
    const tablist = wrapper.find('[role="tablist"]')

    await tablist.trigger('keydown', { key: 'ArrowRight' })
    expect(selected(wrapper)).toEqual(only(1))
    expect(document.activeElement?.id).toBe('mku-tab-electronics')

    await tablist.trigger('keydown', { key: 'End' })
    expect(selected(wrapper)).toEqual(only(4))

    await tablist.trigger('keydown', { key: 'ArrowRight' })
    expect(selected(wrapper)).toEqual(only(0))

    await tablist.trigger('keydown', { key: 'ArrowLeft' })
    expect(selected(wrapper)).toEqual(only(4))

    await tablist.trigger('keydown', { key: 'Home' })
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
      '-1',
      '-1',
    ])
    wrapper.unmount()
  })
})
