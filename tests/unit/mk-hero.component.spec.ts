import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import MkHero from '~/components/marketing/MkHero.vue'

vi.mock('~/composables/useMarketingSite', () => ({
  useMarketingSignupUrl: () => computed(() => 'https://app.storvv.com/signup'),
}))

function mountHero() {
  return mount(MkHero, {
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        MkFrame: { template: '<img />' },
        Transition: { template: '<slot />' },
      },
    },
  })
}

describe('MkHero', () => {
  it('has one filled call to action, marked for the header to step down', () => {
    const wrapper = mountHero()
    const primary = wrapper.findAll('[data-mk-primary]')
    expect(primary).toHaveLength(1)
    expect(primary[0]!.text()).toBe('Create your free store')
    expect(primary[0]!.attributes('href')).toBe('https://app.storvv.com/signup')
  })

  it('hides the duplicate marquee rows from screen readers', () => {
    const wrapper = mountHero()
    const rows = wrapper.findAll('.mkh__row')
    expect(rows.map((row) => row.attributes('aria-hidden'))).toEqual([
      'false',
      'true',
      'false',
      'true',
    ])
  })

  it('pauses and resumes everything that moves', async () => {
    const wrapper = mountHero()
    const button = wrapper.find('.mkh__pause')
    expect(button.attributes('aria-pressed')).toBe('false')

    await button.trigger('click')
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(button.attributes('aria-label')).toBe('Play the moving examples')
    expect(wrapper.find('section').classes()).toContain('is-paused')

    await button.trigger('click')
    expect(wrapper.find('section').classes()).not.toContain('is-paused')
  })
})
