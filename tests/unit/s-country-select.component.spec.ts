import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import SCountrySelect from '~/components/s/SCountrySelect.vue'

vi.stubGlobal('useRoute', () => ({ fullPath: '/dashboard/onboarding' }))

const countries = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GB', name: 'United Kingdom' },
]

function mountSelect(modelValue = '') {
  return mount(SCountrySelect, {
    props: {
      id: 'country',
      label: 'Country',
      placeholder: 'Choose your country',
      countries,
      modelValue,
    },
    attachTo: document.body,
  })
}

describe('SCountrySelect', () => {
  it('shows the placeholder until a country is chosen', () => {
    const wrapper = mountSelect()
    const trigger = wrapper.get('#country')
    expect(trigger.text()).toBe('Choose your country')
    expect(trigger.find('.s-flag').exists()).toBe(false)
    wrapper.unmount()
  })

  it('lists every country with a flag and selects one on click', async () => {
    const wrapper = mountSelect()
    await wrapper.get('#country').trigger('click')
    const options = wrapper.findAll('[role="option"]')
    expect(options.map((o) => o.text())).toEqual(['Nigeria', 'United Kingdom'])
    expect(options.every((o) => o.find('.s-flag').exists())).toBe(true)

    await options[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['GB'])
    await nextTick()
    expect(wrapper.find('[role="option"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows the selected country with its flag in the field', async () => {
    const wrapper = mountSelect('NG')
    const trigger = wrapper.get('#country')
    expect(trigger.text()).toBe('Nigeria')
    expect(trigger.find('.s-flag').exists()).toBe(true)
    await trigger.trigger('click')
    expect(wrapper.get('[aria-selected="true"]').text()).toBe('Nigeria')
    wrapper.unmount()
  })
})
