import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import MkProductMenu from '~/components/marketing/MkProductMenu.vue'

vi.stubGlobal('useRoute', () => reactive({ fullPath: '/' }))

describe('MkProductMenu', () => {
  it('links each business to its use-case tab and each problem to the feature that solves it', async () => {
    const wrapper = mount(MkProductMenu, {
      attachTo: document.body,
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          Transition: { template: '<slot />' },
        },
      },
    })
    const trigger = wrapper.find('button')
    expect(trigger.text()).toBe('Product')
    await trigger.trigger('click')

    const businesses = wrapper.findAll('.mkm__item').map((a) => a.attributes('href'))
    expect(businesses.slice(0, 5)).toEqual([
      '/?trade=gadgets#use-cases',
      '/?trade=electronics#use-cases',
      '/?trade=supermarkets#use-cases',
      '/?trade=dealers#use-cases',
      '/?trade=procurement#use-cases',
    ])

    const problems = wrapper.findAll('.mkm__list-link')
    expect(problems).toHaveLength(6)
    for (const link of problems) {
      expect(link.attributes('href')).toMatch(/^\/features\?area=[a-z]+#explore$/)
    }
    wrapper.unmount()
  })
})
