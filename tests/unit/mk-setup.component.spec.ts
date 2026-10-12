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
        Transition: { template: '<slot />' },
      },
    },
  })
}

const current = (wrapper: ReturnType<typeof mountSetup>) =>
  wrapper.findAll('.mks__step').map((step) => step.attributes('aria-current'))

const finishStep = (wrapper: ReturnType<typeof mountSetup>) =>
  wrapper.find('.mks__fill').trigger('animationend')

describe('MkSetup', () => {
  it('starts on step one with the store details', () => {
    const wrapper = mountSetup()
    expect(current(wrapper)).toEqual(['step', undefined, undefined])
    expect(wrapper.find('.mks__title').text()).toBe('Create your store')
    expect(wrapper.find('.mks__main').text()).toContain("Ada's Gadgets")
  })

  it('advances when the progress bar finishes, marks earlier steps done and loops', async () => {
    const wrapper = mountSetup()

    await finishStep(wrapper)
    expect(current(wrapper)).toEqual([undefined, 'step', undefined])
    expect(wrapper.find('.mks__title').text()).toBe('Add your stock')
    expect(wrapper.find('.mks__main').text()).toContain('AirPods Pro')
    expect(wrapper.findAll('.mks__step')[0]!.classes()).toContain('is-done')

    await finishStep(wrapper)
    expect(wrapper.find('.mks__main').text()).toContain('Receipt sent')

    await finishStep(wrapper)
    expect(current(wrapper)).toEqual(['step', undefined, undefined])
  })

  it('jumps to a step when its tab is clicked', async () => {
    const wrapper = mountSetup()

    await wrapper.findAll('.mks__step')[2]!.trigger('click')
    expect(current(wrapper)).toEqual([undefined, undefined, 'step'])
    expect(wrapper.find('.mks__title').text()).toBe('Start selling')
    expect(wrapper.findAll('.mks__fill')).toHaveLength(1)
  })

  it('pauses on hover and keeps the reveal marker while the steps change', async () => {
    const wrapper = mountSetup()
    const reveal = wrapper.find('.mks__window')
    reveal.element.setAttribute('data-revealed', '')

    await reveal.trigger('mouseenter')
    expect(wrapper.find('.mks__fill').classes()).toContain('is-paused')
    await finishStep(wrapper)
    await reveal.trigger('mouseleave')
    expect(reveal.attributes()).toHaveProperty('data-revealed')
  })
})
