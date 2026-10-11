import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MkIntro from '~/components/marketing/MkIntro.vue'

function mountIntro() {
  return mount(MkIntro, {
    attachTo: document.body,
    global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } },
  })
}

describe('MkIntro', () => {
  it('opens gadget stores first and switches the photo when a trade is chosen', async () => {
    const wrapper = mountIntro()
    const tabs = wrapper.findAll('[role="tab"]')
    const imgs = wrapper.findAll('.mk-show__img')
    expect(tabs[1]!.attributes('aria-selected')).toBe('true')
    expect(imgs[1]!.classes()).toContain('mk-show__img--active')

    await tabs[3]!.trigger('click')
    expect(tabs[3]!.attributes('aria-selected')).toBe('true')
    expect(tabs[1]!.attributes('aria-selected')).toBe('false')
    expect(imgs[3]!.classes()).toContain('mk-show__img--active')
    expect(wrapper.find('.mk-show__hud-title').text()).toBe('Supermarkets')
    wrapper.unmount()
  })

  it('advances to the next trade when the progress line fills, wrapping at the end', async () => {
    const wrapper = mountIntro()
    await wrapper.find('.mk-show__fill').trigger('animationend')
    expect(wrapper.findAll('[role="tab"]')[2]!.attributes('aria-selected')).toBe('true')

    await wrapper.findAll('[role="tab"]')[4]!.trigger('click')
    await wrapper.find('.mk-show__fill').trigger('animationend')
    expect(wrapper.findAll('[role="tab"]')[0]!.attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('moves between trades with the arrow keys', async () => {
    const wrapper = mountIntro()
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]!.trigger('keydown', { key: 'ArrowDown' })
    expect(tabs[2]!.attributes('aria-selected')).toBe('true')
    await tabs[2]!.trigger('keydown', { key: 'ArrowUp' })
    await tabs[1]!.trigger('keydown', { key: 'ArrowUp' })
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('keeps only the active photo exposed to screen readers', () => {
    const wrapper = mountIntro()
    const visible = wrapper.findAll('.mk-show__img').filter((img) => img.attributes('alt'))
    expect(visible).toHaveLength(1)
    expect(visible[0]!.attributes('alt')).toContain('gadget store')
    wrapper.unmount()
  })
})
