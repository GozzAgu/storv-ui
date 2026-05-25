import { describe, it, expect } from 'vitest'
import { isCapacitorMarketingRoot } from '~/utils/capacitor-root-path'

describe('capacitor-root-path', () => {
 it('treats / and /index.html as marketing root', () => {
 expect(isCapacitorMarketingRoot('/')).toBe(true)
 expect(isCapacitorMarketingRoot('/index.html')).toBe(true)
 })

 it('does not treat sign-in as marketing root', () => {
 expect(isCapacitorMarketingRoot('/signin')).toBe(false)
 expect(isCapacitorMarketingRoot('/dashboard')).toBe(false)
 })
})
