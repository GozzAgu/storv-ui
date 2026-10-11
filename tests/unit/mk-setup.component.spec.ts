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
  it('starts on step one with the store form', () => {
    const wrapper = mountSetup()
    expect(current(wrapper)).toEqual(['step', undefined, undefined])
    expect(wrapper.find('.mks__main').text()).toContain("Ada's Gadgets")
    expect(wrapper.find('.mks__toast').text()).toContain('Your store is live')
  })

  it('advances when the progress bar finishes, marks earlier steps done and loops', async () => {
    const wrapper = mountSetup()

    await finishStep(wrapper)
    expect(current(wrapper)).toEqual([undefined, 'step', undefined])
    expect(wrapper.find('.mks__main').text()).toContain('AirPods Pro')
    expect(wrapper.find('.mks__url').text()).toContain('inventory')
    expect(wrapper.findAll('.mks__step')[0]!.classes()).toContain('is-done')

    await finishStep(wrapper)
    expect(wrapper.find('.mks__main').text()).toContain('Receipt sent')

    await finishStep(wrapper)
    expect(current(wrapper)).toEqual(['step', undefined, undefined])
  })

  it('jumps to a step when it is clicked', async () => {
    const wrapper = mountSetup()

    await wrapper.findAll('.mks__step')[2]!.trigger('click')
    expect(current(wrapper)).toEqual([undefined, undefined, 'step'])
    expect(wrapper.find('.mks__main').text()).toContain('Receipt sent')
    expect(wrapper.findAll('.mks__fill')).toHaveLength(1)
  })

  it('keeps the reveal marker while the steps change', async () => {
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
