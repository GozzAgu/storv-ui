import { describe, it, expect } from 'vitest'
import { normalizeWhatsAppPhone, buildWhatsAppUrl } from '~/utils/whatsapp'
import { getCustomerContactKey, customerAccountDocId } from '~/utils/customer-key'
import { interpolateWhatsAppTemplate } from '~/types/whatsapp'

describe('whatsapp utils', () => {
 it('normalizes Nigerian local numbers', () => {
 expect(normalizeWhatsAppPhone('08031234567')).toBe('2348031234567')
 })

 it('builds wa.me link', () => {
 const url = buildWhatsAppUrl('08031234567', 'Hello')
 expect(url).toContain('wa.me/2348031234567')
 expect(url).toContain('text=Hello')
 })
})

describe('customer key', () => {
 it('prefers email over phone', () => {
 expect(
 getCustomerContactKey({ email: 'a@b.com', phone: '0803', name: 'X' })
 ).toBe('email:a@b.com')
 })

 it('sanitizes doc id', () => {
 expect(customerAccountDocId('email:test@x.com')).toBe('email:test@x_com')
 })
})

describe('template interpolation', () => {
 it('replaces variables', () => {
 const out = interpolateWhatsAppTemplate('Hi {{customerName}}, due {{balanceDue}}', {
 customerName: 'Ada',
 balanceDue: '₦1,000',
 })
 expect(out).toContain('Ada')
 expect(out).toContain('₦1,000')
 })
})
