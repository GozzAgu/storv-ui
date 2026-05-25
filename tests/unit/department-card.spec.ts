import { describe, expect, it } from 'vitest'
import {
 departmentManagerLabel,
 departmentStaffRingPercent,
 departmentStatusPill,
 formatDepartmentTypeLabel,
} from '~/utils/department-card'

describe('department-card', () => {
 it('formats department type labels', () => {
 expect(formatDepartmentTypeLabel('customer_service')).toBe('Customer Service')
 })

 it('builds status pill for active vs inactive', () => {
 expect(departmentStatusPill(false).label).toBe('Active')
 expect(departmentStatusPill(true).label).toBe('Inactive')
 })

 it('computes staff ring percent and manager label', () => {
 expect(departmentStaffRingPercent(false, 0)).toBe(20)
 expect(departmentStaffRingPercent(false, 4)).toBe(100)
 expect(departmentStaffRingPercent(true, 4)).toBe(0)
 expect(departmentManagerLabel('')).toBe('No manager assigned')
 expect(departmentManagerLabel('Jane Doe')).toBe('Jane Doe')
 })
})
