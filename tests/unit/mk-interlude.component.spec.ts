import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MkInterlude from '~/components/marketing/MkInterlude.vue'
import { useMarketingMotion } from '~/composables/useMarketingMotion'

describe('MkInterlude', () => {
  it('describes each drawing once for screen readers and hides the moving parts', () => {
    for (const variant of ['journey', 'notes', 'branches'] as const) {
      const wrapper = mount(MkInterlude, { props: { variant } })
      const root = wrapper.find('.mkl')
      expect(root.attributes('role')).toBe('img')
      expect(root.attributes('aria-label')).toMatch(/^Illustration: /)
      for (const part of wrapper.findAll('svg.mkl__svg, .mkl__row')) {
        expect(part.attributes('aria-hidden')).toBe('true')
      }
      wrapper.unmount()
    }
  })

  it('walks a sale from stock to the report', () => {
    const wrapper = mount(MkInterlude, { props: { variant: 'journey' } })
    expect(wrapper.findAll('.mkl__label').map((l) => l.text())).toEqual([
      'Stock in',
      'Scanned',
      'Sold',
      'Receipt sent',
      'Paid',
      'In the report',
    ])
    expect(wrapper.findAll('animateMotion')).toHaveLength(6)
  })

  it('loops the notes with a duplicate of each lane', () => {
    const wrapper = mount(MkInterlude, { props: { variant: 'notes' } })
    expect(wrapper.findAll('.mkl__lane')).toHaveLength(2)
    expect(wrapper.findAll('.mkl__row')).toHaveLength(4)
  })

  it('stops moving when the visitor pauses', async () => {
    const motion = useMarketingMotion()
    motion.paused.value = false
    const wrapper = mount(MkInterlude, { props: { variant: 'notes' } })
    expect(wrapper.find('.mkl').classes()).not.toContain('is-still')
    motion.toggle()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.mkl').classes()).toContain('is-still')
    motion.paused.value = false
  })
})
