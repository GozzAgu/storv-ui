import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SSlideToConfirm from '~/components/s/SSlideToConfirm.vue'

function mountSlide(props: Record<string, unknown> = {}) {
  return mount(SSlideToConfirm, { props: { label: 'Slide to charge ₦12,000', ...props } })
}

describe('SSlideToConfirm', () => {
  it('ignores a plain tap — the knob has to be slid', async () => {
    const wrapper = mountSlide()
    await wrapper.get('button').trigger('click', { detail: 1 })
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirms from the keyboard or VoiceOver activation', async () => {
    const wrapper = mountSlide()
    const knob = wrapper.get('button')
    expect(knob.attributes('aria-label')).toBe('Slide to charge ₦12,000')
    await knob.trigger('click', { detail: 0 })
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('stays inert while disabled or processing', async () => {
    const disabled = mountSlide({ disabled: true })
    await disabled.get('button').trigger('click', { detail: 0 })
    expect(disabled.emitted('confirm')).toBeUndefined()

    const loading = mountSlide({ loading: true, loadingLabel: 'Creating sale…' })
    expect(loading.get('button').attributes('aria-label')).toBe('Creating sale…')
    expect(loading.get('button').attributes('disabled')).toBeDefined()
  })
})
