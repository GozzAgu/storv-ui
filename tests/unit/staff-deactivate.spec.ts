import { describe, expect, it } from 'vitest'

function isActiveStaffStatus(status: string | undefined): boolean {
  return (status || 'active') === 'active'
}

function isRemovedStaffStatus(status: string | undefined): boolean {
  return status === 'inactive'
}

describe('staff deactivation listing', () => {
  it('treats missing status as active', () => {
    expect(isActiveStaffStatus(undefined)).toBe(true)
  })

  it('excludes inactive staff from active lists', () => {
    expect(isActiveStaffStatus('inactive')).toBe(false)
    expect(isActiveStaffStatus('on_leave')).toBe(false)
    expect(isActiveStaffStatus('active')).toBe(true)
  })

  it('identifies removed staff for reactivation list', () => {
    expect(isRemovedStaffStatus('inactive')).toBe(true)
    expect(isRemovedStaffStatus('active')).toBe(false)
    expect(isRemovedStaffStatus('on_leave')).toBe(false)
  })
})
