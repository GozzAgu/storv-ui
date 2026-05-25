import { describe, it, expect, vi } from 'vitest'
import { initializePaystackSubscription } from '~/utils/paystack-upgrade'

describe('initializePaystackSubscription', () => {
 it('returns ok with authorization URL when API succeeds', async () => {
 const fetcher = vi.fn().mockResolvedValue({
 success: true,
 authorization_url: 'https://pay.example/checkout',
 })
 const result = await initializePaystackSubscription(
 {
 planId: 'storvv_medium',
 email: 'a@b.com',
 userId: 'u1',
 },
 fetcher
 )
 expect(result.ok).toBe(true)
 if (result.ok) {
 expect(result.authorizationUrl).toBe('https://pay.example/checkout')
 }
 expect(fetcher).toHaveBeenCalledWith(
 '/api/paystack/initialize',
 expect.objectContaining({
 method: 'POST',
 body: expect.objectContaining({ planId: 'storvv_medium', userId: 'u1' }),
 })
 )
 })

 it('returns error message when API returns failure without URL', async () => {
 const fetcher = vi.fn().mockResolvedValue({
 success: false,
 message: 'Plan invalid',
 })
 const result = await initializePaystackSubscription(
 { planId: 'storvv_medium', email: 'a@b.com', userId: 'u1' },
 fetcher
 )
 expect(result.ok).toBe(false)
 if (!result.ok) {
 expect(result.message).toBe('Plan invalid')
 }
 })

 it('maps fetch errors to a message', async () => {
 const fetcher = vi.fn().mockRejectedValue({ data: { message: 'Network down' } })
 const result = await initializePaystackSubscription(
 { planId: 'storvv_medium', email: 'a@b.com', userId: 'u1' },
 fetcher
 )
 expect(result.ok).toBe(false)
 if (!result.ok) {
 expect(result.message).toBe('Network down')
 }
 })
})
