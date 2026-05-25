import { describe, it, expect } from 'vitest'
import { detectContactChannel, isValidContact } from '~/utils/contact-detect'

describe('contact-detect', () => {
 it('detects email', () => {
 expect(detectContactChannel('ada@shop.com')).toBe('email')
 })

 it('detects phone', () => {
 expect(detectContactChannel('08031234567')).toBe('phone')
 })

 it('rejects invalid', () => {
 expect(isValidContact('not-a-contact')).toBe(false)
 })
})
