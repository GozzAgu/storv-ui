import { describe, it, expect } from 'vitest'
import { tableMoneyClass, tableMoneyOwedClass } from '~/utils/table-money-styles'

describe('table-money-styles', () => {
  it('uses green classes for credit/currency amounts', () => {
    expect(tableMoneyClass()).toContain('text-emerald-700')
    expect(tableMoneyClass()).toContain('dashboard-table__money')
  })

  it('uses amber classes for owed amounts', () => {
    expect(tableMoneyOwedClass()).toContain('text-amber-800')
    expect(tableMoneyOwedClass()).toContain('dashboard-table__money-owed')
  })
})
