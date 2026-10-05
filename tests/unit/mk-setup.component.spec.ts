import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import MkSetup from '~/components/marketing/MkSetup.vue'

vi.mock('~/composables/useMarketingSite', () => ({
  useMarketingAppUrl: () => computed(() => 'https://app.storvv.com'),
}))

function mountSetup() {
  return mount(MkSetup, {
    global: {
      stubs: {
        SButton: { template: '<a><slot /><slot name="trailing" /></a>' },
        SAvatar: { props: ['name'], template: '<span>{{ name }}</span>' },
        Transition: { template: '<slot />' },
      },
    },
  })
}

const current = (wrapper: ReturnType<typeof mountSetup>) =>
  wrapper.findAll('.mk-setup__step').map((step) => step.attributes('aria-current'))

describe('MkSetup', () => {
  it('starts on step one with the store form', () => {
    const wrapper = mountSetup()
    expect(current(wrapper)).toEqual(['step', undefined, undefined])
    expect(wrapper.find('.mk-setup__card').text()).toContain("Ada's Gadgets")
  })

  it('advances when the progress bar finishes, marks earlier steps done and loops', async () => {
    const wrapper = mountSetup()
    const fills = wrapper.findAll('.mk-setup__fill')

    await fills[0]!.trigger('animationend')
    expect(current(wrapper)).toEqual([undefined, 'step', undefined])
    expect(wrapper.find('.mk-setup__card').text()).toContain('AirPods Pro')
    expect(wrapper.findAll('.mk-setup__step')[0]!.classes()).toContain('mk-setup__step--done')

    await fills[1]!.trigger('animationend')
    expect(wrapper.find('.mk-setup__card').text()).toContain('Receipt sent')

    await fills[2]!.trigger('animationend')
    expect(current(wrapper)).toEqual(['step', undefined, undefined])
  })

  it('does nothing when a step is clicked', async () => {
    const wrapper = mountSetup()
    const reveal = wrapper.find('.mk-setup')
    reveal.element.setAttribute('data-revealed', '')

    await wrapper.findAll('.mk-setup__step')[2]!.trigger('click')
    expect(current(wrapper)).toEqual(['step', undefined, undefined])
    expect(reveal.attributes()).toHaveProperty('data-revealed')
  })

  it('keeps the reveal marker while the steps change', async () => {
    const wrapper = mountSetup()
    const reveal = wrapper.find('.mk-setup')
    reveal.element.setAttribute('data-revealed', '')

    await reveal.trigger('mouseenter')
    await wrapper.findAll('.mk-setup__fill')[0]!.trigger('animationend')
    await reveal.trigger('mouseleave')
    expect(reveal.attributes()).toHaveProperty('data-revealed')
  })
})
