import { describe, expect, it } from 'vitest'
import {
  canShowDevPlanSwitcher,
  getChangeablePaidPlans,
} from '~/utils/subscription-plan-switcher'

describe('subscription-plan-switcher', () => {
  it('lists Medium as a downgrade from Enterprise', () => {
    const options = getChangeablePaidPlans('storvv_enterprise')
    expect(options).toEqual([
      { id: 'storvv_medium', name: 'Storvv Medium', direction: 'downgrade' },
    ])
  })

  it('lists Enterprise as an upgrade from Medium', () => {
    const options = getChangeablePaidPlans('storvv_medium')
    expect(options).toEqual([
      { id: 'storvv_enterprise', name: 'Storvv Enterprise', direction: 'upgrade' },
    ])
  })

  it('lists both paid plans from Micro', () => {
    const options = getChangeablePaidPlans('storvv_micro')
    expect(options.map((o) => o.id)).toEqual(['storvv_medium', 'storvv_enterprise'])
    expect(options.every((o) => o.direction === 'upgrade')).toBe(true)
  })

  it('shows QA switcher in demo only', () => {
    expect(canShowDevPlanSwitcher({ isDemo: true })).toBe(true)
    expect(canShowDevPlanSwitcher({ isDemo: false, isDev: true })).toBe(false)
    expect(canShowDevPlanSwitcher({ isDemo: false, allowPublicFlag: true })).toBe(false)
    expect(canShowDevPlanSwitcher({ isDemo: false, isDev: false, allowPublicFlag: false })).toBe(
      false
    )
  })
})
