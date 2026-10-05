import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MkAssistant from '~/components/marketing/MkAssistant.vue'

let observerCallback: IntersectionObserverCallback | null = null

function setReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  )
}

function enterView() {
  observerCallback?.(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver
  )
}

function mountAssistant() {
  return mount(MkAssistant, { global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } } })
}

const typedText = (wrapper: ReturnType<typeof mountAssistant>) =>
  wrapper.find('.mk-chat__typed').exists() ? wrapper.find('.mk-chat__typed').text() : ''

describe('MkAssistant typewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    observerCallback = null
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((callback: IntersectionObserverCallback) => {
        observerCallback = callback
        return { observe: vi.fn(), disconnect: vi.fn() }
      })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows a typing indicator, then types the answer out in full', async () => {
    setReducedMotion(false)
    const wrapper = mountAssistant()

    enterView()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.mk-typing').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(760)
    const partial = typedText(wrapper)
    expect(partial.length).toBeGreaterThan(0)
    expect(wrapper.find('.mk-caret').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(3000)
    expect(typedText(wrapper)).toContain('Micro is free forever for one store')
    expect(wrapper.find('.mk-caret').exists()).toBe(false)
    expect(wrapper.find('[aria-live]').text()).toContain('Micro is free forever')
  })

  it('types the chosen prompt when a chip is clicked and stops autoplay', async () => {
    setReducedMotion(false)
    const wrapper = mountAssistant()
    enterView()

    await wrapper.findAll('.mk-chip')[1]!.trigger('click')
    expect(wrapper.findAll('.mk-chip')[1]!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('.mk-chat__msg--user').text()).toContain('sales leads')

    await vi.advanceTimersByTimeAsync(5000)
    expect(typedText(wrapper)).toContain('the lead is marked Won')

    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.findAll('.mk-chip')[1]!.attributes('aria-pressed')).toBe('true')
  })

  it('moves on to the next prompt on its own while in view', async () => {
    setReducedMotion(false)
    const wrapper = mountAssistant()
    enterView()

    await vi.advanceTimersByTimeAsync(4000 + 4600)
    expect(wrapper.findAll('.mk-chip')[1]!.attributes('aria-pressed')).toBe('true')
  })

  it('shows answers instantly when reduced motion is preferred', async () => {
    setReducedMotion(true)
    const wrapper = mountAssistant()

    await wrapper.findAll('.mk-chip')[3]!.trigger('click')
    expect(wrapper.find('.mk-typing').exists()).toBe(false)
    expect(typedText(wrapper)).toContain('Copy from branch')
  })
})
