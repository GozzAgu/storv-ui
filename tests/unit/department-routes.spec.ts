import { describe, it, expect } from 'vitest'
import {
 departmentDetailPath,
 resolveStoreDepartmentsPath,
 storeDepartmentsPath,
} from '~/utils/department-routes'

describe('department-routes', () => {
 it('builds store departments path', () => {
 expect(storeDepartmentsPath('store-1')).toBe('/dashboard/stores/store-1/departments')
 })

 it('builds department detail path', () => {
 expect(departmentDetailPath('dept-1')).toBe('/dashboard/departments/dept-1')
 })

 it('resolves store path with fallbacks', () => {
 expect(resolveStoreDepartmentsPath(null, 'b', 'c')).toBe('/dashboard/stores/b/departments')
 expect(resolveStoreDepartmentsPath(null)).toBeNull()
 })
})
