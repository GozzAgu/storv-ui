import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MkFeatureCarousel from '~/components/marketing/MkFeatureCarousel.vue'

describe('MkFeatureCarousel', () => {
  it('shows each area with a described screenshot and a link to its tab', () => {
    const wrapper = mount(MkFeatureCarousel, {
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
    })
    const cards = wrapper.findAll('.mkc__card')
    expect(cards).toHaveLength(6)
    for (const card of cards) {
      expect(card.find('img').attributes('alt')).toBeTruthy()
      expect(card.find('a').attributes('href')).toMatch(/^\/features\?area=[a-z]+#explore$/)
      expect(card.find('a').text()).toContain(`about ${card.find('h3').text().toLowerCase()}`)
    }
  })

  it('starts with the previous button disabled', () => {
    const wrapper = mount(MkFeatureCarousel, {
      global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } },
    })
    expect(wrapper.find('[aria-label="Previous features"]').attributes()).toHaveProperty('disabled')
  })
})
