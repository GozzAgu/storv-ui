import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import MkHero from '~/components/marketing/MkHero.vue'

vi.mock('~/composables/useMarketingSite', () => ({
  useMarketingSignupUrl: () => computed(() => 'https://app.storvv.com/signup'),
}))

const openWalkthrough = vi.hoisted(() => vi.fn())
vi.mock('~/composables/useWalkthrough', () => ({
  useWalkthrough: () => ({ open: openWalkthrough }),
}))

function mountHero() {
  return mount(MkHero, {
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
      },
    },
  })
}

describe('MkHero', () => {
  it('offers a walkthrough as a quiet secondary option', async () => {
    const wrapper = mountHero()
    const button = wrapper.find('.mkh__walk button')
    expect(button.text()).toBe('Book a walkthrough')
    await button.trigger('click')
    expect(openWalkthrough).toHaveBeenCalledWith('landing_hero')
  })

  it('has one filled call to action, marked for the header to step down', () => {
    const wrapper = mountHero()
    const primary = wrapper.findAll('[data-mk-primary]')
    expect(primary).toHaveLength(1)
    expect(primary[0]!.text()).toBe('Create your free store')
    expect(primary[0]!.attributes('href')).toBe('https://app.storvv.com/signup')
  })

  it('lists every sector Storvv supports, as a labelled list', () => {
    const wrapper = mountHero()
    const list = wrapper.find('.mkh__trades')
    expect(list.attributes('aria-labelledby')).toBe('mkh-proof-label')
    const names = list.findAll('.mkh__trade-name').map((name) => name.text())
    expect(names).toHaveLength(12)
    expect(names).toContain('Phones & gadgets')
    expect(names).toContain('Pharmacy & health')
    expect(names).toContain('Wholesale & procurement')
    expect(list.findAll('.mkh__trade-line').every((line) => line.text().length > 0)).toBe(true)
  })

  it('keeps the decorative hub away from screen readers but describes it in text', () => {
    const wrapper = mountHero()
    expect(wrapper.find('.mkh__hub-canvas').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.mkh__hub .ds-sr-only').text()).toContain('every branch')
  })

  it('places every tool tile inside the hub', () => {
    const wrapper = mountHero()
    const tiles = wrapper.findAll('.mkh__tile')
    expect(tiles.length).toBeGreaterThan(4)
    for (const tile of tiles) {
      const style = tile.attributes('style') ?? ''
      const [left, top] = [/left: ([\d.]+)%/, /top: ([\d.]+)%/].map((re) =>
        Number(style.match(re)?.[1])
      )
      expect(left).toBeGreaterThan(0)
      expect(left).toBeLessThan(100)
      expect(top).toBeGreaterThan(0)
      expect(top).toBeLessThan(100)
    }
  })

  it('pauses and resumes everything that moves', async () => {
    const { useMarketingMotion } = await import('~/composables/useMarketingMotion')
    useMarketingMotion().paused.value = false
    const wrapper = mountHero()
    const button = wrapper.find('.mkh__pause')
    expect(button.attributes('aria-pressed')).toBe('false')

    await button.trigger('click')
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(button.attributes('aria-label')).toBe('Play animations')
    expect(wrapper.find('section').classes()).toContain('is-paused')

    await button.trigger('click')
    expect(wrapper.find('section').classes()).not.toContain('is-paused')
  })
})
