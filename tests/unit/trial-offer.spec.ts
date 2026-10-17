import { describe, expect, it } from 'vitest'
import { getTrialOffer } from '~/utils/trial-offer'

describe('getTrialOffer', () => {
  it('follows the trial switch', () => {
    expect(getTrialOffer()?.headline).toBe('Enterprise free for 3 months')
    expect(getTrialOffer(0)).toBeNull()
  })

  it('reads well for other lengths', () => {
    expect(getTrialOffer(30)?.length).toBe('1 month')
    expect(getTrialOffer(45)?.length).toBe('45 days')
  })

  it('keeps to the site copy rules', () => {
    const offer = getTrialOffer()!
    const copy = `${offer.headline}. ${offer.detail}`
    expect(copy).not.toMatch(/[!\u2013\u2014-]/)
  })
})
