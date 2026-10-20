import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MkFlow from '~/components/marketing/MkFlow.vue'

function mountFlow() {
  return mount(MkFlow, {
    global: {
      stubs: {
        MkFrame: {
          props: ['src', 'alt', 'url'],
          template: '<img class="shot" :src="src" :alt="alt" />',
        },
      },
    },
  })
}

describe('MkFlow', () => {
  it('walks through the six steps in order, each linked from the rail', () => {
    const wrapper = mountFlow()
    const steps = wrapper.findAll('.mkf__step')
    expect(steps.map((step) => step.attributes('id'))).toEqual([
      'flow-receive',
      'flow-organise',
      'flow-sell',
      'flow-update',
      'flow-move',
      'flow-report',
    ])
    expect(wrapper.findAll('.mkf__rail-link').map((link) => link.attributes('href'))).toEqual(
      steps.map((step) => `#${step.attributes('id')}`)
    )
  })

  it('alternates sides and shows a screenshot or a drawn preview for every step', () => {
    const wrapper = mountFlow()
    const steps = wrapper.findAll('.mkf__step')
    expect(steps.map((step) => step.classes().includes('mkf__step--reverse'))).toEqual([
      false,
      true,
      false,
      true,
      false,
      true,
    ])
    for (const step of steps) {
      expect(step.find('.shot, .mkf-ui').exists()).toBe(true)
    }
    expect(wrapper.findAll('.shot').map((img) => img.attributes('alt'))).not.toContain('')
  })

  it('says which plan unlocks the features that are not on every plan', () => {
    const wrapper = mountFlow()
    const tags = wrapper.findAll('#flow-move .mk-tag').map((tag) => tag.text())
    expect(tags).toEqual(['Enterprise', 'Enterprise'])
  })
})
