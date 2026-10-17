import { describe, expect, it } from 'vitest'
import { canStaffAccessCategory, splitCategoriesByAccess } from '~/utils/category-access'

const amaka = { departmentId: 'sales', authUid: 'uid-amaka' }
const tunde = { departmentId: 'warehouse', authUid: 'uid-tunde' }
const noDept = { departmentId: null, authUid: 'uid-new' }

describe('canStaffAccessCategory', () => {
  it('keeps a category open to everyone until departments are picked', () => {
    expect(canStaffAccessCategory({}, noDept)).toBe(true)
    expect(canStaffAccessCategory({ allowedDepartments: [] }, tunde)).toBe(true)
  })

  it('lets in staff from the chosen departments only', () => {
    const phones = { allowedDepartments: ['sales'] }
    expect(canStaffAccessCategory(phones, amaka)).toBe(true)
    expect(canStaffAccessCategory(phones, tunde)).toBe(false)
    expect(canStaffAccessCategory(phones, noDept)).toBe(false)
  })

  it('also lets in people the owner named, even from another department', () => {
    const phones = { allowedDepartments: ['sales'], allowedStaff: ['uid-tunde'] }
    expect(canStaffAccessCategory(phones, tunde)).toBe(true)
    expect(canStaffAccessCategory(phones, noDept)).toBe(false)
  })

  it('does not restrict a category that only lists people', () => {
    expect(canStaffAccessCategory({ allowedStaff: ['uid-tunde'] }, amaka)).toBe(true)
  })

  it('never matches a missing auth uid against the people list', () => {
    const phones = { allowedDepartments: ['sales'], allowedStaff: [''] }
    expect(canStaffAccessCategory(phones, { departmentId: 'warehouse', authUid: '' })).toBe(false)
  })
})

describe('splitCategoriesByAccess', () => {
  it('keeps order within each group', () => {
    const folders = [
      { id: 'a' },
      { id: 'b', allowedDepartments: ['sales'] },
      { id: 'c', allowedDepartments: ['warehouse'] },
      { id: 'd' },
    ]
    const { accessible, locked } = splitCategoriesByAccess(folders, amaka)
    expect(accessible.map((f) => f.id)).toEqual(['a', 'b', 'd'])
    expect(locked.map((f) => f.id)).toEqual(['c'])
  })
})
