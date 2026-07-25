import { describe, it, expect } from 'vitest'
import { isCapacitorOrigin } from '~/utils/capacitor-cors-origins'

describe('capacitor cors origins', () => {
  it('allows Capacitor WebView origins', () => {
    expect(isCapacitorOrigin('capacitor://localhost')).toBe(true)
    expect(isCapacitorOrigin('ionic://localhost')).toBe(true)
    expect(isCapacitorOrigin('http://localhost')).toBe(true)
    expect(isCapacitorOrigin('https://localhost:8080')).toBe(true)
  })

  it('rejects arbitrary web origins', () => {
    expect(isCapacitorOrigin('https://evil.example')).toBe(false)
    expect(isCapacitorOrigin('https://app.storvv.com')).toBe(false)
  })
})
