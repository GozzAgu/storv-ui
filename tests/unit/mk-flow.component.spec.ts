import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MkFlow from '~/components/marketing/MkFlow.vue'

describe('MkFlow', () => {
  it('walks through the five steps in order, each linked from the rail', () => {
    const wrapper = mount(MkFlow)
    const cards = wrapper.findAll('.mkf__card')
    expect(cards.map((card) => card.attributes('id'))).toEqual([
      'flow-stock',
      'flow-sell',
      'flow-update',
      'flow-move',
      'flow-report',
    ])
    expect(wrapper.findAll('.mkf__rail-link').map((link) => link.attributes('href'))).toEqual(
      cards.map((card) => `#${card.attributes('id')}`)
    )
  })

  it('makes the first two steps wide and gives every step a described screenshot', () => {
    const wrapper = mount(MkFlow)
    const cards = wrapper.findAll('.mkf__card')
    expect(cards.map((card) => card.classes().includes('mkf__card--wide'))).toEqual([
      true,
      true,
      false,
      false,
      false,
    ])
    for (const card of cards) expect(card.find('img').attributes('alt')).toBeTruthy()
  })

  it('says which plan unlocks the steps that are not on every plan', () => {
    const wrapper = mount(MkFlow)
    expect(wrapper.find('#flow-update .mk-tag').text()).toBe('Balances on Medium')
    expect(wrapper.find('#flow-move .mk-tag').text()).toBe('Transfers on Enterprise')
    expect(wrapper.find('#flow-stock .mk-tag').exists()).toBe(false)
  })
})
