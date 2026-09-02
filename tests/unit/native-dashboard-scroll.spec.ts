import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  getDashboardNativeMainScroller,
  scrollDashboardToElement,
} from '~/utils/native-dashboard-scroll'

describe('native-dashboard-scroll', () => {
  let main: HTMLElement
  let target: HTMLElement

  beforeEach(() => {
    main = document.createElement('main')
    main.className = 'dashboard-native-main'
    main.style.height = '200px'
    main.style.overflow = 'auto'

    const wrapper = document.createElement('div')
    wrapper.style.height = '800px'
    target = document.createElement('div')
    target.id = 'settings-subscription'
    target.style.height = '40px'
    target.style.marginTop = '400px'

    wrapper.appendChild(target)
    main.appendChild(wrapper)
    document.body.appendChild(main)

    Object.defineProperty(main, 'scrollTo', {
      value: (opts: { top: number }) => {
        main.scrollTop = opts.top
      },
      configurable: true,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('finds native main scroller', () => {
    expect(getDashboardNativeMainScroller()).toBe(main)
  })

  it('scrolls within native main when target is nested', () => {
    vi.spyOn(main, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      right: 0,
      bottom: 200,
      width: 0,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 420,
      left: 0,
      right: 0,
      bottom: 460,
      width: 0,
      height: 40,
      x: 0,
      y: 420,
      toJSON: () => ({}),
    })

    scrollDashboardToElement('#settings-subscription', { offset: 10 })
    expect(main.scrollTop).toBe(410)
  })
})
