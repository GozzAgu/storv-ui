import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MkIntro from '~/components/marketing/MkIntro.vue'

function mountIntro() {
  return mount(MkIntro, {
    global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } },
  })
}

describe('MkIntro', () => {
  it('opens gadget stores first and expands the hovered or focused trade', async () => {
    const wrapper = mountIntro()
    const trades = wrapper.findAll('.mk-trade')
    expect(trades[1]!.classes()).toContain('mk-trade--active')

    await trades[3]!.trigger('mouseenter')
    expect(trades[3]!.classes()).toContain('mk-trade--active')
    expect(trades[1]!.classes()).not.toContain('mk-trade--active')

    await trades[0]!.trigger('focus')
    expect(trades[0]!.classes()).toContain('mk-trade--active')
  })

  it('keeps the photo row revealed while the active trade changes', async () => {
    const wrapper = mountIntro()
    const row = wrapper.find('.mk-trades')
    row.element.setAttribute('data-revealed', '')

    await wrapper.findAll('.mk-trade')[4]!.trigger('mouseenter')
    expect(row.attributes()).toHaveProperty('data-revealed')
    expect(wrapper.findAll('.mk-trade.mk-reveal')).toHaveLength(0)
  })
})
