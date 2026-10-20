import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import MkFeatureMenu from '~/components/marketing/MkFeatureMenu.vue'

const route = reactive({ fullPath: '/' })
vi.stubGlobal('useRoute', () => route)

function mountMenu() {
  return mount(MkFeatureMenu, {
    attachTo: document.body,
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        Transition: { template: '<slot />' },
      },
    },
  })
}

describe('MkFeatureMenu', () => {
  it('opens from the button and links each feature to its tab on the features page', async () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('button')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.mkm__panel').exists()).toBe(false)

    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.mkm__panel').attributes('id')).toBe(trigger.attributes('aria-controls'))
    const links = wrapper.findAll('.mkm__item').map((a) => a.attributes('href'))
    expect(links).toHaveLength(6)
    for (const href of links) expect(href).toMatch(/^\/features\?area=[a-z]+#explore$/)
    wrapper.unmount()
  })

  it('closes on Escape, on a click outside and when the route changes', async () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('button')

    await trigger.trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('.mkm__panel').exists()).toBe(false)

    await trigger.trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.mkm__panel').exists()).toBe(false)

    await trigger.trigger('click')
    route.fullPath = '/pricing'
    await nextTick()
    expect(wrapper.find('.mkm__panel').exists()).toBe(false)
    wrapper.unmount()
  })
})
