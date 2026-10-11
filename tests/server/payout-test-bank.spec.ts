// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PAYSTACK_TEST_BANK,
  resolveAccountName,
  withPaystackTestBank,
  type PaystackCall,
} from '~/server/utils/payments/payout'

const BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'OPay Digital Services Limited (OPay)', code: '999992' },
]

const failingWith = (message: string): PaystackCall =>
  (async () => {
    throw new Error(message)
  }) as PaystackCall

describe('Paystack test bank in the connect dropdown', () => {
  it('adds the test bank first with a test key', () => {
    expect(withPaystackTestBank(BANKS, 'sk_test_abc')).toEqual([PAYSTACK_TEST_BANK, ...BANKS])
  })

  it('never offers it with a live key', () => {
    expect(withPaystackTestBank(BANKS, 'sk_live_abc')).toEqual(BANKS)
  })

  it('does not duplicate it when Paystack already lists code 001', () => {
    const listed = [{ name: 'Test Bank', code: '001' }, ...BANKS]
    expect(withPaystackTestBank(listed, 'sk_test_abc')).toEqual(listed)
  })
})

describe('account check limit message', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  it('points to the test bank when Paystack reports the test-mode daily limit', async () => {
    const err = await resolveAccountName(
      failingWith(
        'Paystack: Test mode daily limit of 3 live bank resolves exceeded. Use test bank codes 001 or upgrade to live mode.'
      ),
      '999992',
      '9018723404'
    ).catch((e: unknown) => e)
    expect(err).toMatchObject({ code: 'ACCOUNT_NOT_RESOLVED', statusCode: 429 })
    expect((err as Error).message).toContain(PAYSTACK_TEST_BANK.name)
    expect((err as Error).message).not.toMatch(/live keys/i)
  })

  it('does not blame test mode for other limits', async () => {
    const err = await resolveAccountName(
      failingWith('Paystack: Rate limit exceeded'),
      '044',
      '0123456789'
    ).catch((e: unknown) => e)
    expect(err).toMatchObject({ statusCode: 429 })
    expect((err as Error).message).not.toMatch(/test mode|live keys/i)
  })
})
