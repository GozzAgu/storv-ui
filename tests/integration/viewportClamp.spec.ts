import { describe, it, expect } from 'vitest'
import { clampFabPosition, FAB_VIEWPORT_PAD } from '~/utils/viewportClamp'

describe('clampFabPosition', () => {
  const vw = 400
  const vh = 800
  const w = 100
  const h = 50
  const pad = FAB_VIEWPORT_PAD

  it('keeps top-left within padded viewport', () => {
    expect(clampFabPosition(0, 0, w, h, vw, vh)).toEqual({ left: pad, top: pad })
  })

  it('clamps when position is too far right or bottom', () => {
    const maxL = Math.max(pad, vw - w - pad)
    const maxT = Math.max(pad, vh - h - pad)
    expect(clampFabPosition(9999, 9999, w, h, vw, vh)).toEqual({ left: maxL, top: maxT })
  })

  it('allows centered positions', () => {
    const left = 150
    const top = 400
    expect(clampFabPosition(left, top, w, h, vw, vh)).toEqual({ left, top })
  })

  it('handles element larger than viewport on both axes (snaps to pad)', () => {
    const w = vw + 100
    const h = vh + 100
    const result = clampFabPosition(100, 100, w, h, vw, vh)
    expect(result.left).toBe(pad)
    expect(result.top).toBe(pad)
  })

  it('respects custom pad', () => {
    const customPad = 16
    expect(clampFabPosition(0, 0, w, h, vw, vh, customPad).left).toBe(customPad)
  })
})
